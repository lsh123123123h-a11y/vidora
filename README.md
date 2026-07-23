# Vidora

Vidora 是一个自托管的 Web 应用，用于小说处理、剧本生成、分镜制作和 AI 素材生产。它保留 Agent、SQLite、Socket.IO 和 AI 厂商适配器，不依赖桌面客户端、订阅、积分或云端账号。

## 首次部署

要求：Docker Desktop（Windows 建议启用 WSL2 后端）和 Git。

```powershell
git clone <你的仓库地址>
cd Vidora
docker compose up -d --build
```

浏览器打开 `http://localhost:10588`。未提供 `.env` 时，首次管理员用户名为 `admin`，随机密码会打印到 `docker compose logs vidora`。生产部署建议先执行 `Copy-Item .env.example .env` 并修改 `VIDORA_ADMIN_PASSWORD`，再启动 Compose。首次启动前设置的管理员密码只会用于新数据库；已有数据库不会被覆盖。

## 常用命令

```powershell
# 更新代码并重建
git pull
docker compose up -d --build

# 查看实时日志
docker compose logs -f vidora

# 停止服务（保留数据卷）
docker compose down

# 停止并删除数据卷（会删除 SQLite、素材、技能和供应商配置）
docker compose down -v
```

PowerShell 与 WSL2 使用相同的 Compose 命令。若在 WSL2 终端执行，请把仓库放在 Linux 文件系统或启用 Docker Desktop 的 WSL 集成，以获得更好的构建速度。

## 数据保存位置

Compose 创建名为 `vidora-data` 的 Docker volume，并挂载到容器 `/app/data`。其中包括 SQLite 数据库、上传素材、生成结果、技能、模型提示词、嵌入模型和 AI 厂商配置。重建镜像不会删除该卷。

## 配置 AI 厂商

启动后进入“设置”中的供应商配置，填写对应厂商的 API Key、Base URL 和模型。密钥存储在 Docker volume 的 SQLite/供应商配置中，不会写入 Git。也可以在应用内导入 OpenAI 兼容接口；Vidora 不提供或要求任何 SaaS 中转账号。

## 本地开发

```powershell
cd apps/api
yarn install
yarn dev

# 另一个终端
cd apps/web
yarn install
yarn dev
```

生产镜像会把前端构建产物复制到后端静态目录，由同一个地址提供页面、`/api` 和 Socket.IO。

## 许可证与第三方声明

Vidora 使用 Apache-2.0 许可证。第三方依赖的许可证和版权声明保存在 `apps/api/NOTICES.txt` 与 `apps/web/NOTICES.txt`，发布时请一并保留。
