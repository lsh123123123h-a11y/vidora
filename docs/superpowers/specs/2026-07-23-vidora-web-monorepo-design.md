# Vidora Web Monorepo Design

日期：2026-07-23

## 目标

将现有 Toonflow-app 后端和 Toonflow-web 前端整理为一个名为 Vidora 的单仓库 Web 应用，保留 Agent、小说处理、SQLite、模型供应商配置和现有 AI 厂商接口。最终用户只需要克隆仓库并运行：

```bash
docker compose up -d --build
```

浏览器通过一个地址访问完整系统。项目不再包含 Electron 主进程、安装包、桌面协议或桌面更新流程。

## 约束与范围

- 新仓库目录为 `apps/api` 和 `apps/web`，前后端代码边界保持清楚。
- 两个应用继续使用各自的 `package.json` 和 Yarn lockfile；第一阶段不合并为 JavaScript workspace，以减少锁文件和依赖解析风险。
- 不重写 Agent 或产品业务逻辑，只修正 Web 运行、同源地址、端口、静态资源和部署基础设施。
- AI 厂商适配器、供应商配置 UI、Socket.IO Agent 命名空间和数据库 schema 保持可用。
- 使用 Vidora 名称和用户提供的 Logo；移除原作者品牌、仓库链接、联系方式、桌面更新入口及旧 Logo。第三方依赖许可证和 NOTICE 保留。
- 原有两个 dirty worktree 不移动、不回退、不删除；通过复制工作树创建新仓库，排除嵌套 `.git`、`node_modules`、本地数据库、上传内容和生成缓存。

## 架构

采用一个生产 Node 容器：

```text
Browser :10588
    |
    v
Vidora API process
    ├── /                 Vue static files
    ├── /api/*            Express API
    ├── /socket.io/*      Socket.IO transport
    └── /api/socket/*     scriptAgent / productionAgent namespaces
            |
            v
      vidora_data volume
      (SQLite, assets, oss, skills, vendor, modelPrompt, logs)
```

Dockerfile 使用多阶段构建：先构建 Web，再构建 API，最终镜像只包含生产依赖、API bundle、Web 静态产物和默认资源。Compose 只暴露一个端口并挂载一个命名 volume。

后端静态目录与可变数据目录分离：Web 构建产物放在镜像内固定目录；后端通过 `VIDORA_DATA_DIR` 读取 volume 根目录。这样 volume 不会遮住前端文件，同时 skills/vendor 等需要编辑的资源仍然持久化。

## 地址与运行时配置

- 后端监听 `HOST` 和 `PORT`，默认 `0.0.0.0:10588`。
- 前端默认使用同源 `/api`，不写死 `localhost`。
- Socket.IO 从当前页面 origin 派生，并追加 `/api/socket/...` 命名空间。
- `VITE_*` 只用于构建期确有必要的设置；部署地址不写入构建产物。
- `.env.example` 仅包含非敏感默认值和配置说明，`.env`、数据库、上传目录、日志和模型缓存全部忽略。

## 数据初始化与持久化

首次启动时，镜像内的默认 skills、vendor 模板和 modelPrompt 复制到空 volume；已有 volume 不覆盖用户修改。SQLite、生成素材、上传文件和用户配置全部写入 volume。升级镜像时只更新镜像内的 Web 和 API，不删除 volume 数据。

## Web 化清理

删除或替换以下桌面专用路径：Electron title bar、`toonflow://` 协议、打开本地目录、桌面更新下载和安装包入口。浏览器模式保留外部链接、设置页、登录、API 请求和 Socket.IO Agent 功能。Hash Router 保持不变，避免后端额外实现 history fallback。

## 可靠性与安全

- 保留 API/Socket token 校验和 CORS 配置，但生产默认限制为同源访问。
- 增加容器可用性检查，至少验证静态首页和进程端口。
- 生产镜像使用非开发启动命令，不运行 nodemon 或 inspector。
- 不把 AI API key 写入仓库；AI key 继续由用户在 Vidora 设置页填写并保存到 volume 数据库。
- 当前默认 `admin/admin123` 和短 tokenKey 是公开部署风险。实施阶段必须决定首次管理员凭据策略；推荐首次启动生成随机管理员密码或要求通过环境变量提供，并在日志中只显示一次。

## 验证策略

1. API TypeScript 类型检查和生产 bundle 构建。
2. Web 类型检查和生产构建。
3. `docker compose config` 通过。
4. `docker compose up -d --build` 成功启动。
5. 访问 `/` 返回 Vidora 页面。
6. 登录接口返回可用 token，受保护 API 能使用该 token 访问。
7. 两个 Socket.IO 命名空间完成带 token 的基础连接。
8. 重建容器后 SQLite、skills、vendor、assets 和 oss 数据仍存在。
9. 发布前扫描仓库，不包含 `.env`、API key、私钥、本地数据库或旧作者仓库链接。

## 不在本次范围

- Agent 提示词、模型调用策略和业务行为重写。
- SaaS、订阅、积分、云端账号或远程代理服务。
- 生产 TLS、域名、反向代理集群和多租户隔离。
- 将两个 lockfile 合并为 workspace lockfile。

## 验收标准

- 新仓库只需要一个 Web 地址即可使用，不依赖桌面软件。
- `docker compose up -d --build` 能启动完整系统。
- 前端、API 和 Socket.IO 使用同源地址工作。
- API keys 和运行数据不进入 Git，volume 重建容器后数据不丢失。
- Vidora 品牌和 Logo 在页面、README、package metadata 和构建产物中一致。
- 原有两个 dirty worktree 的改动在迁移前后可逐项核对，未被回退或覆盖。
