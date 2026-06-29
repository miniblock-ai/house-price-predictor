#!/usr/bin/env python3
"""
e2e.py — Unified E2E test runner for all services.

Usage:
    python ci/e2e.py                    # Run all E2E tests
    python ci/e2e.py --app1             # Run app1 (Property Valuation) E2E only
    python ci/e2e.py --app2             # Run app2 (Market Analysis) E2E only
    python ci/e2e.py --ml-api           # Run ML API E2E only
    python ci/e2e.py --demo             # Demo mode (headed + slow-mo)
    python ci/e2e.py --app1 --demo      # App1 demo mode

Prerequisites:
    - Python 3.10+ with pip
    - JDK 21+ with JAVA_HOME set
    - Node.js 18+ with pnpm
    - Maven in PATH (mvn.cmd)
    - Chrome (for Playwright)
"""

import argparse
import json
import os
import platform
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

import httpx

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Service directories
ML_API_DIR = PROJECT_ROOT / "services/price-prediction-api"
BACKEND_DIR = PROJECT_ROOT / "services/market-analysis-api"
FRONTEND_DIR = PROJECT_ROOT / "frontend/apps/prediction-portal"

# Ports
ML_API_PORT = 8000
BACKEND_PORT = 8002
FRONTEND_PORT = 3001

# Log files
LOG_DIR = PROJECT_ROOT
ML_API_LOG = LOG_DIR / ".ml-api.log"
BACKEND_LOG = LOG_DIR / ".backend.log"
FRONTEND_LOG = LOG_DIR / ".frontend.log"
PID_FILE = LOG_DIR / ".e2e-pids.json"

# ═══════════════════════════════════════════════════════════════════════════════
# Utilities
# ═══════════════════════════════════════════════════════════════════════════════

def log(msg: str, level: str = "INFO") -> None:
    """Print colored log message."""
    colors = {"INFO": "\033[33m", "PASS": "\033[32m", "FAIL": "\033[31m", "CYAN": "\033[36m"}
    reset = "\033[0m"
    print(f"{colors.get(level, '')}[{level}]{reset} {msg}")

def run(cmd: list[str], cwd: Optional[Path] = None, check: bool = True, capture: bool = False,
        encoding: Optional[str] = None, errors: Optional[str] = None, env: Optional[dict] = None) -> subprocess.CompletedProcess:
    """Run a command."""
    return subprocess.run(
        cmd, cwd=cwd, check=check,
        capture_output=capture, text=True,
        encoding=encoding, errors=errors,
        env=env or os.environ.copy()
    )

def find_python() -> str:
    """Find Python executable with uvicorn installed."""
    # Check environment variable first
    if os.environ.get("E2E_PYTHON"):
        return os.environ["E2E_PYTHON"]

    # Try common names
    for name in ["python", "python3", "py"]:
        try:
            result = run([name, "-c", "import uvicorn"], capture=True, check=False)
            if result.returncode == 0:
                return name
        except FileNotFoundError:
            continue

    log("Python 3.10+ (with uvicorn) not found. Set E2E_PYTHON env var.", "FAIL")
    sys.exit(1)

def find_mvn() -> str:
    """Find Maven executable."""
    if platform.system() == "Windows":
        return "mvn.cmd"
    return "mvn"

def wait_for_health(url: str, timeout: int = 60, interval: float = 2.0) -> bool:
    """Wait for a service to become healthy."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = httpx.get(url, timeout=3)
            if resp.status_code == 200:
                return True
        except httpx.RequestError:
            pass
        time.sleep(interval)
    return False

def kill_port(port: int) -> None:
    """Kill any process listening on the given port."""
    if platform.system() == "Windows":
        result = run(["netstat", "-ano"], capture=True, encoding="gbk", errors="ignore")
        if result.stdout:
            for line in result.stdout.splitlines():
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.split()
                    if parts:
                        pid = parts[-1]
                        if pid.isdigit():
                            run(["taskkill", "/F", "/PID", pid], capture=True, check=False)
    else:
        run(["fuser", "-k", f"{port}/tcp"], capture=True, check=False)

def save_pids(pids: dict[str, int]) -> None:
    """Save PIDs to file."""
    PID_FILE.write_text(json.dumps(pids))

def load_pids() -> dict[str, int]:
    """Load PIDs from file."""
    if PID_FILE.exists():
        return json.loads(PID_FILE.read_text())
    return {}

def stop_process(pid: Optional[int]) -> None:
    """Stop a process by PID."""
    if pid:
        try:
            if platform.system() == "Windows":
                run(["taskkill", "/F", "/PID", str(pid)], capture=True, check=False)
            else:
                run(["kill", "-9", str(pid)], capture=True, check=False)
        except Exception:
            pass

# ═══════════════════════════════════════════════════════════════════════════════
# Service Management
# ═══════════════════════════════════════════════════════════════════════════════

def start_ml_api(python: str) -> int:
    """Start ML API service. Returns PID."""
    log("Starting ML API (port 8000)...")

    # Kill any existing process on port
    kill_port(ML_API_PORT)

    # Start service
    with open(ML_API_LOG, "w") as log_file:
        proc = subprocess.Popen(
            [python, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(ML_API_PORT)],
            cwd=ML_API_DIR,
            stdout=log_file,
            stderr=subprocess.STDOUT,
        )

    # Wait for health
    if wait_for_health(f"http://127.0.0.1:{ML_API_PORT}/health"):
        log(f"ML API ready (PID: {proc.pid})", "PASS")
        return proc.pid
    else:
        log(f"ML API failed to start — check {ML_API_LOG}", "FAIL")
        sys.exit(1)

def start_backend() -> int:
    """Start Java backend service. Returns PID."""
    log("Starting Java backend (port 8002)...")

    # Kill any existing process on port
    kill_port(BACKEND_PORT)

    mvn = find_mvn()

    with open(BACKEND_LOG, "w") as log_file:
        proc = subprocess.Popen(
            [mvn, "spring-boot:run", "-q"],
            cwd=BACKEND_DIR,
            stdout=log_file,
            stderr=subprocess.STDOUT,
        )

    # Wait for health (Java takes longer to start)
    if wait_for_health(f"http://127.0.0.1:{BACKEND_PORT}/api/v1/health", timeout=90):
        log(f"Backend ready (PID: {proc.pid})", "PASS")
        return proc.pid
    else:
        log(f"Backend failed to start — check {BACKEND_LOG}", "FAIL")
        sys.exit(1)

def start_frontend() -> int:
    """Start Next.js frontend. Returns PID."""
    log("Starting Frontend (port 3001)...")

    # Kill any existing process on port
    kill_port(FRONTEND_PORT)

    with open(FRONTEND_LOG, "w") as log_file:
        proc = subprocess.Popen(
            ["npx", "next", "dev", "-p", str(FRONTEND_PORT)],
            cwd=FRONTEND_DIR,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            shell=True if platform.system() == "Windows" else False,
        )

    # Wait for frontend
    if wait_for_health(f"http://127.0.0.1:{FRONTEND_PORT}", timeout=60):
        log(f"Frontend ready (PID: {proc.pid})", "PASS")
        return proc.pid
    else:
        log(f"Frontend failed to start — check {FRONTEND_LOG}", "FAIL")
        sys.exit(1)

def stop_all() -> None:
    """Stop all services."""
    log("Stopping all services...")

    pids = load_pids()
    for name, pid in pids.items():
        stop_process(pid)
        log(f"  Stopped {name} (PID: {pid})")

    # Fallback: kill by port
    for port in [ML_API_PORT, BACKEND_PORT, FRONTEND_PORT]:
        kill_port(port)

    # Clean up
    if PID_FILE.exists():
        PID_FILE.unlink()
    for log_file in [ML_API_LOG, BACKEND_LOG, FRONTEND_LOG]:
        if log_file.exists():
            log_file.unlink()

    log("All services stopped", "PASS")

# ═══════════════════════════════════════════════════════════════════════════════
# Test Runners
# ═══════════════════════════════════════════════════════════════════════════════

def run_ml_api_e2e() -> bool:
    """Run ML API E2E tests (pytest)."""
    log("Running ML API E2E tests...")

    python = find_python()
    result = run(
        [python, "-m", "pytest", "tests/e2e/", "-v", "--tb=short"],
        cwd=ML_API_DIR,
        check=False,
    )

    if result.returncode == 0:
        log("ML API E2E tests passed", "PASS")
        return True
    else:
        log("ML API E2E tests failed", "FAIL")
        return False

def run_playwright_e2e(suite: str, demo: bool = False) -> bool:
    """Run Playwright E2E tests."""
    log(f"Running Playwright E2E tests ({suite})...")

    # Set environment variables
    env = os.environ.copy()
    if demo:
        env["PLAYWRIGHT_SLOW_MO"] = "1000"
        log("Demo mode: headed + slow-mo 1000ms")

    # Build command
    cmd = ["npx", "playwright", "test", "--reporter=list"]

    if suite == "app1":
        cmd.extend(["--project", "app1"])
    elif suite == "app2":
        cmd.extend(["--project", "app2"])
    # else: run all projects

    # On Windows, need shell=True for npx
    result = subprocess.run(
        cmd, cwd=FRONTEND_DIR, check=False,
        shell=True if platform.system() == "Windows" else False,
        env=env,
    )

    if result.returncode == 0:
        log(f"Playwright E2E tests ({suite}) passed", "PASS")
        return True
    else:
        log(f"Playwright E2E tests ({suite}) failed", "FAIL")
        return False

# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="E2E test runner")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true", help="Run all E2E tests (default)")
    group.add_argument("--app1", action="store_true", help="Run app1 (Property Valuation) E2E only")
    group.add_argument("--app2", action="store_true", help="Run app2 (Market Analysis) E2E only")
    group.add_argument("--ml-api", action="store_true", help="Run ML API E2E only")
    parser.add_argument("--demo", action="store_true", help="Demo mode (headed + slow-mo)")
    parser.add_argument("--stop", action="store_true", help="Stop all services and exit")

    args = parser.parse_args()

    # Handle --stop
    if args.stop:
        stop_all()
        return

    # Determine what to run
    run_all = not (args.app1 or args.app2 or args.ml_api)

    print()
    print("=" * 44)
    print("  E2E Test Runner")
    print("=" * 44)
    print()

    # Find Python
    python = find_python()
    log(f"Using Python: {python}")

    # Start services
    pids = {}

    if args.ml_api:
        # ML API only
        pids["ml_api"] = start_ml_api(python)
    elif args.app1:
        # App1: ML API + Frontend (Python Backend not yet implemented)
        pids["ml_api"] = start_ml_api(python)
        pids["frontend"] = start_frontend()
    elif args.app2:
        # App2: ML API + Backend + Frontend
        pids["ml_api"] = start_ml_api(python)
        pids["backend"] = start_backend()
        pids["frontend"] = start_frontend()
    else:
        # All: everything
        pids["ml_api"] = start_ml_api(python)
        pids["backend"] = start_backend()
        pids["frontend"] = start_frontend()

    save_pids(pids)

    print()
    print("=" * 44)
    print("  Services started", "PASS")
    print("=" * 44)
    print(f"  ML API:    http://127.0.0.1:{ML_API_PORT}")
    print(f"  Backend:   http://127.0.0.1:{BACKEND_PORT}")
    print(f"  Frontend:  http://127.0.0.1:{FRONTEND_PORT}")
    print()

    # Run tests
    success = True

    try:
        if args.ml_api:
            success = run_ml_api_e2e()
        elif args.app1:
            success = run_playwright_e2e("app1", args.demo)
        elif args.app2:
            success = run_playwright_e2e("app2", args.demo)
        else:
            # Run all
            if not run_ml_api_e2e():
                success = False
            if not run_playwright_e2e("app1", args.demo):
                success = False
            if not run_playwright_e2e("app2", args.demo):
                success = False

    finally:
        stop_all()

    print()
    if success:
        print("=" * 44)
        print("  All E2E tests passed!", "PASS")
        print("=" * 44)
        sys.exit(0)
    else:
        print("=" * 44)
        print("  Some E2E tests failed", "FAIL")
        print("=" * 44)
        sys.exit(1)

if __name__ == "__main__":
    main()
