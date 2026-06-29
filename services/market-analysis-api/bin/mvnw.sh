#!/usr/bin/env bash
# Maven wrapper — 在 MINGW (Git Bash) 下使用 mvn.cmd 避免 MSYS2 路径转换问题
#
# 根因：Maven 的 mvn (POSIX shell) 在 MINGW 分支只做了 Unix 路径转换，
# 但 exec java 时未转回 Windows 格式，导致 Java 找不到 classworlds JAR。
# mvn.cmd 是 Windows 原生批处理，不受 MSYS2 路径转换影响。
#
# 用法：替换 mvn 调用，如  mvn test  →  bash bin/mvnw.sh test
#       mvn spring-boot:run  →  bash bin/mvnw.sh spring-boot:run

case "$(uname)" in
  MINGW*)
    # Git Bash: 用 mvn.cmd 绕过 MSYS2 路径转换
    exec mvn.cmd "$@"
    ;;
  *)
    # Linux / macOS / Cygwin: 直接用 mvn
    exec mvn "$@"
    ;;
esac
