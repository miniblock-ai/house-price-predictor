# Property Market Analysis — Java Spring Boot Backend

> **Service path**: `services/property-market-analysis/backend/`
> **Port**: 8002
> **Tech stack**: Java 21, Spring Boot 3.4.4, Maven, WebFlux

## 📖 Table of Contents

- [1. Prerequisites](#sec1)
- [2. Start Service](#sec2)
  - [2.1. Windows (Git Bash MINGW)](#sec2-1)
  - [2.2. Linux / macOS](#sec2-2)
- [3. Run Tests](#sec3)
  - [3.1. Unit Tests (UT)](#sec3-1)
  - [3.2. Component Tests (CT)](#sec3-2)
  - [3.3. UT + CT Combined](#sec3-3)
- [4. Project Structure](#sec4)
- [5. Test Inventory](#sec5)
- [6. Configuration](#sec6)
- [7. Troubleshooting](#sec7)
- [8. Change Log](#sec8)

<a id="sec1"></a>
## 1. Prerequisites

| Component | Version | Verification |
|:----------|:--------|:-------------|
| JDK | 21+ | `java -version` |
| Maven | 3.8+ | `mvn --version` (Windows: `mvn.cmd --version`) |

<a id="sec2"></a>
## 2. Start Service

<a id="sec2-1"></a>
### 2.1. Windows (Git Bash MINGW)

Maven has MSYS2 path translation issues in Git Bash (MINGW). Use the project's Maven wrapper script:

> **Note**: Do NOT use `mvn` directly. Use `bash bin/mvnw.sh` instead.

```bash
# Run from the backend directory:

# Start service (default port 8002)
bash bin/mvnw.sh spring-boot:run

# Override ML API URL (default http://localhost:8000)
ML_API_URL=http://localhost:8000 bash bin/mvnw.sh spring-boot:run
```

<a id="sec2-2"></a>
### 2.2. Linux / macOS

```bash
# Can use mvn directly
./bin/mvnw.sh spring-boot:run
# Or system mvn
mvn spring-boot:run
```

<a id="sec3"></a>
## 3. Run Tests

> Run all commands from `services/property-market-analysis/backend/`.

<a id="sec3-1"></a>
### 3.1. Unit Tests (UT)

```bash
# Run all unit tests (file names without CT)
bash bin/mvnw.sh test

# Single test class
bash bin/mvnw.sh test -Dtest=StatisticsServiceTest

# Single test method
bash bin/mvnw.sh test -Dtest=StatisticsServiceTest#testAverage
```

<a id="sec3-2"></a>
### 3.2. Component Tests (CT)

Component tests use the `*CT.java` suffix and run via the Maven `ct` profile:

```bash
# Run all CT (with WireMock)
bash bin/mvnw.sh test -Pct

# Single CT
bash bin/mvnw.sh test -Pct -Dtest=MarketApiCT
```

<a id="sec3-3"></a>
### 3.3. UT + CT Combined

```bash
# UT first, then CT
bash bin/mvnw.sh test && bash bin/mvnw.sh test -Pct
```

<a id="sec4"></a>
## 4. Project Structure

```
services/property-market-analysis/backend/
├── bin/
│   └── mvnw.sh              # Maven wrapper (fixes MINGW path translation)
├── pom.xml                    # Maven config (Spring Boot 3.4.4, Java 21)
├── src/
│   ├── main/
│   │   ├── java/com/market/
│   │   │   ├── MarketApplication.java    # Entry point
│   │   │   ├── controller/
│   │   │   │   ├── MarketController.java  # REST controller
│   │   │   │   └── MarketApiCT.java       # Component test (CT)
│   │   │   ├── service/
│   │   │   │   └── StatisticsService.java # Statistics service
│   │   │   ├── model/
│   │   │   │   └── PageDto.java           # Pagination DTO
│   │   │   └── client/
│   │   │       └── MLClient.java          # ML API client
│   │   └── resources/
│   │       └── application.yml            # Application config
│   └── test/
│       └── java/com/market/
│           └── ...                        # UT test classes
└── target/                                # Build output
```

<a id="sec5"></a>
## 5. Test Inventory

| Type | File pattern | Count | Description |
|:-----|:-------------|:-----:|:------------|
| UT | `*Test.java` | ~15 | Pure business logic tests, no external dependencies |
| CT | `*CT.java` | ~11 | `@SpringBootTest` + WireMock, simulates ML API |

<a id="sec6"></a>
## 6. Configuration

Key entries in `application.yml`:

| Key | Default | Description |
|:----|:--------|:------------|
| `server.port` | 8002 | Service port |
| `market.ml-api.url` | `http://localhost:8000` | ML API URL, overridable via `ML_API_URL` env var |
| `market.ml-api.timeout-seconds` | 5 | ML API timeout |
| `market.dataset.path` | `data/House Price Dataset.csv` | Dataset path |

<a id="sec7"></a>
## 7. Troubleshooting

### Maven compile error "package does not exist"

Ensure all dependencies are resolved:
```bash
bash bin/mvnw.sh dependency:resolve
```

### `mvn` command fails with classworlds JAR not found in Git Bash

This is the MSYS2 path translation issue. Do not use `mvn`, use:
```bash
bash bin/mvnw.sh <command>
```

<a id="sec8"></a>
## 8. Change Log

| Date | rev | Changes |
|:-----|:---:|:--------|
| 2026-07-07 | rev1 | English rewrite + restructured with TOC, anchors, section numbering |
