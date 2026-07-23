# Vidora Docker Deployment

Vidora runs as one Web application at `http://localhost:10588`. The container serves the browser UI, API, and Socket.IO endpoints together.

## Start

```powershell
git clone <repository-url>
cd Vidora
Copy-Item .env.example .env
# Set VIDORA_ADMIN_PASSWORD in .env before the first start.
docker compose up -d --build
```

If `.env` is not created, Vidora starts on port `10588` and generates an administrator password for a new database. Read it once from `docker compose logs vidora` and set an explicit password for future clean deployments.

## Operations

```powershell
# Rebuild after updating the checkout.
git pull
docker compose up -d --build

# Inspect service state and logs.
docker compose ps
docker compose logs -f vidora

# Stop without deleting persistent data.
docker compose down
```

The named `vidora-data` volume stores SQLite, uploaded and generated assets, skills, model prompts, and provider configuration. Back up the volume before maintenance. `docker compose down -v` permanently removes this data.

## Provider Configuration

After signing in, configure each AI provider in the Web settings with its API key, base URL, and model identifiers. Provider credentials are stored in the persistent application data and must not be committed to Git. Vidora does not provide a hosted API relay.

## Windows and WSL2

The PowerShell commands above also work in a WSL2 shell as `docker compose ...`. For faster Docker builds on Windows, keep the checkout in the WSL2 Linux filesystem or enable Docker Desktop WSL integration.
