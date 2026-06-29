# Property Market Analysis — Java Spring Boot Backend

> Service path: `services/property-market-analysis/backend/`
> Port: 8002

## 环境要求

| 组件 | 版本 | 确认命令 |
|------|------|----------|
| JDK | 21+ | `java -version` |
| Maven | 3.8+ | `mvn --version` (Windows: `mvn.cmd --version`) |

## 启动服务

### Windows (Git Bash MINGW)

Maven 在 Git Bash (MINGW) 下有 MSYS2 路径转换问题，需要使用项目提供的 Maven 包装脚本：

**注意：** 不要直接用 `mvn`，要用 `bash bin/mvnw.sh` 代替。

```bash
# 从 backend 目录执行：

# 启动服务（默认端口 8002）
bash bin/mvnw.sh spring-boot:run

# 指定 ML API 地址（默认 http://localhost:8000）
ML_API_URL=http://localhost:8000 bash bin/mvnw.sh spring-boot:run
```

### Linux / macOS

```bash
# 可以直接用 mvn
./bin/mvnw.sh spring-boot:run
# 或用系统 mvn
mvn spring-boot:run
```

## 运行测试

### 单元测试 (UT)

```bash
# 运行所有单元测试（文件名不含 CT）
bash bin/mvnw.sh test

# 运行单个测试类
bash bin/mvnw.sh test -Dtest=StatisticsServiceTest

# 运行单个测试方法
bash bin/mvnw.sh test -Dtest=StatisticsServiceTest#testAverage
```

### 组件测试 (CT)

组件测试使用 `*CT.java` 后缀，通过 Maven 的 `ct` profile 运行：

```bash
# 运行所有 CT（含 WireMock）
bash bin/mvnw.sh test -Pct

# 运行单个 CT
bash bin/mvnw.sh test -Pct -Dtest=MarketApiCT
```

### UT + CT 一起跑（分两步）

```bash
# 先 UT 再 CT
bash bin/mvnw.sh test && bash bin/mvnw.sh test -Pct
```

## 项目结构

```
services/property-market-analysis/backend/
├── bin/
│   └── mvnw.sh              # Maven wrapper (修复 MINGW 路径转换)
├── pom.xml                    # Maven 配置 (Spring Boot 3.4.4, Java 21)
├── src/
│   ├── main/
│   │   ├── java/com/market/
│   │   │   ├── MarketApplication.java    # 启动类
│   │   │   ├── controller/
│   │   │   │   ├── MarketController.java  # REST 控制器
│   │   │   │   └── MarketApiCT.java       # 组件测试 (CT)
│   │   │   ├── service/
│   │   │   │   └── StatisticsService.java # 统计计算服务
│   │   │   ├── model/
│   │   │   │   └── PageDto.java           # 分页 DTO
│   │   │   └── client/
│   │   │       └── MLClient.java          # ML API 客户端
│   │   └── resources/
│   │       └── application.yml            # 应用配置
│   └── test/
│       └── java/com/market/
│           └── ...                        # UT 测试类
└── target/                                # 编译输出
```

## 测试清单

| 类型 | 文件 | 数量 | 说明 |
|------|------|:----:|------|
| UT | `*Test.java` | ~15 | 纯业务逻辑测试，不依赖外部服务 |
| CT | `*CT.java` | ~11 | `@SpringBootTest` + WireMock，模拟 ML API |

## 配置说明

`application.yml` 关键配置项：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `server.port` | 8002 | 服务端口 |
| `market.ml-api.url` | `http://localhost:8000` | ML API 地址，可通过环境变量 `ML_API_URL` 覆盖 |
| `market.ml-api.timeout-seconds` | 5 | ML API 超时时间 |
| `market.dataset.path` | `data/House Price Dataset.csv` | 数据集路径 |

## 常见问题

### Maven 编译报 "程序包不存在"

确保依赖全部下载完成：
```bash
bash bin/mvnw.sh dependency:resolve
```

### `mvn` 命令在 Git Bash 下报 classworlds JAR 找不到

这是 MSYS2 路径转换问题。不要用 `mvn`，改用：
```bash
bash bin/mvnw.sh <command>
```

### WireMock CT 测试失败

确认 ML API 地址配置正确 —— CT 测试使用 WireMock 在本地模拟 ML API，不需要真实 ML API 服务。
