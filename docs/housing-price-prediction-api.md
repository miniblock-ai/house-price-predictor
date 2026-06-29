# Housing Price Prediction — ML Prediction API (EPIC-01)

> Service path: `services/housing-price-prediction/`
> Port: 8000
> Python FastAPI — scikit-learn linear regression model

## 环境要求

| 组件 | 版本 | 确认命令 |
|------|------|----------|
| Python | ≥ 3.12 | `python --version` |
| pip | latest | `pip --version` |
| Docker (可选) | latest | `docker --version` |

**Windows 注意：** 在 Git Bash 中 `python3` 是 Windows Store 桩（可能静默失败），始终使用 `python`。

## 启动服务

### 本地启动（无 Docker）

```bash
# 1. 进入服务目录
cd services/housing-price-prediction

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动（训练 + 服务）
python -m uvicorn app.main:app --reload --port 8000
```

启动时会自动执行以下流程：
1. 执行 `lifespan` 启动函数
2. 加载 `data/House Price Dataset.csv`
3. 训练 LinearRegression 模型
4. 模型缓存在 `artifacts/` 目录
5. 服务就绪，监听 8000 端口

验证：
```bash
curl http://localhost:8000/health
# 预期: {"status":"healthy","model_loaded":true,"model_type":"linear"}
```

### Docker 启动

```bash
cd services/housing-price-prediction
docker build -t housing-price-api .
docker run -p 8000:8000 housing-price-api
```

### Docker Demo（一键脚本）

```bash
cd demo

# Linux / macOS / WSL
bash demo.sh

# Windows PowerShell
.\demo.ps1
```

脚本执行：build 镜像 → 启动容器 → 测试 3 个端点 → 打开 Swagger UI。

### 配置环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MODEL_TYPE` | `linear` | 模型算法（当前仅支持 `linear`） |
| `SKIP_TRAINING` | `0` | 设为 `1` 跳过训练，使用缓存模型 |

使用方式：
```bash
MODEL_TYPE=linear python -m uvicorn app.main:app --reload --port 8000
```

## 运行测试

### 单元测试 + 集成测试（不依赖 Docker）

```bash
cd services/housing-price-prediction

# 运行所有 UT/IT（排除 E2E）
python -m pytest tests/ --ignore tests/e2e -v

# 运行特定测试文件
python -m pytest tests/test_schemas.py -v
python -m pytest tests/test_linear_model.py -v
python -m pytest tests/test_api.py -v
python -m pytest tests/test_metrics.py -v
```

### E2E 测试（依赖 Docker）

```bash
# 先构建镜像
docker build -t housing-price-api .

# 运行 E2E 测试
python -m pytest tests/e2e/ -v
```

### 完整 CI 流程

项目根目录提供一键 CI 脚本：

```bash
# 从项目根目录执行
bash ci/ci.sh
```

CI 流程：Type Check (mypy) → UT/IT → Docker Build → E2E

Windows 用户也可以双击 `ci/ci.bat` 运行。

## 测试清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `tests/test_schemas.py` | UT | Pydantic 模型验证、字段约束 |
| `tests/test_linear_model.py` | UT | 线性回归训练、预测、序列化 |
| `tests/test_metrics.py` | UT | 评估指标计算（MAE, RMSE, R²） |
| `tests/test_api.py` | IT | FastAPI TestClient API 端点测试 |
| `tests/e2e/test_docker_e2e.py` | E2E | Docker 容器级别的端到端测试 |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 + 模型状态 |
| POST | `/predict` | 房价预测（支持单条/批量） |
| GET | `/model-info` | 模型系数 + 性能指标 |

### 预测请求示例

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6
      }
    ]
  }'
```

### 批量预测

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {"square_footage": 1550, "bedrooms": 3, ...},
      {"square_footage": 2200, "bedrooms": 4, ...}
    ]
  }'
```

**注意：** `features` 始终为数组。单条预测传一个元素的数组，保持 API 类型一致。

## 项目结构

```
services/housing-price-prediction/
├── app/
│   ├── main.py              # FastAPI 入口 + lifespan（训练/加载模型）
│   ├── models/
│   │   └── schemas.py       # Pydantic 请求/响应模型
│   ├── ml/
│   │   ├── base.py          # 模型基类（BaseModel）
│   │   ├── linear_model.py  # LinearRegression 实现
│   │   ├── trainer.py       # get_or_train_model() 训练/缓存逻辑
│   │   └── data/
│   │       ├── housing.csv  # 训练数据集
│   │       └── test.csv     # 测试数据集
│   └── utils/
│       └── metrics.py       # MAE, RMSE, R² 评估函数
├── tests/
│   ├── test_schemas.py      # 模型验证测试
│   ├── test_linear_model.py # 模型训练/预测测试
│   ├── test_metrics.py      # 评估指标测试
│   ├── test_api.py          # API 端点测试
│   ├── conftest.py          # pytest fixtures
│   └── e2e/
│       └── test_docker_e2e.py # Docker E2E 测试
├── ci/ci.sh / ci.bat        # CI 自动化脚本
├── Dockerfile               # 容器化构建
├── requirements.txt         # 生产依赖
├── pyproject.toml           # 项目配置（pytest, mypy）
└── demo/
    ├── demo.sh              # Linux/WSL 一键演示
    └── demo.ps1             # PowerShell 一键演示
```

## 调试

### 查看启动日志

```bash
# 本地启动时日志输出到 stdout，搜索关键行：
# "Starting up — loading model type: linear"
# "Model loaded: LinearRegression(n_features=7)"
```

### 常见问题

| 问题 | 可能原因 | 解决 |
|------|----------|------|
| `Model not loaded` (503) | 训练失败 | 检查 `housing.csv` 是否存在、格式是否正确 |
| `features` 字段类型错误 | 请求体 `features` 传了对象而非数组 | `features` 始终使用数组，单条用 `[{}]` |
| 训练数据集找不到 | 工作目录不对 | 从 `services/housing-price-prediction/` 启动 |
| pip install 失败 | Python 版本不符 | 确认 Python ≥ 3.12 |

### 手动检查模型

```bash
# 模型信息
curl http://localhost:8000/model-info
# → {"model_type":"LinearRegression","coefficients":{"square_footage":124.5,...},"intercept":50000.0,"metrics":{"r2_score":0.997,"mse":16354595,"mae":3202},"features":["square_footage","bedrooms",...]}
```

## 相关文档

- `ci/ci.sh` — CI 自动化脚本（参考 CI 流程）
- `docs/notes/dev-records.md` — 开发记录（特征类型确定、空列表边界、极端输入处理等）
- `docs/property-market-analysis-backend.md` — 另一个Spring Boot后端启动文档
