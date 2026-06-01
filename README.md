# smart-water-supply-booking

Quick notes to deploy this Node.js app to Railway (Docker) or similar platforms.

Prerequisites
- Git repository connected to Railway (or another host)
- Set environment variables in the platform: `MONGO_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, any other `ENV` used in `.env`

Using Docker (Railway default)
1. This repo contains a `Dockerfile` and `.dockerignore`.
2. On Railway, create a new project and connect your GitHub repo. Railway will detect the Dockerfile and build the container.
3. Add the required environment variables in Railway's project settings.

Local build & run (optional)
```bash
docker build -t smart-water-supply .
docker run -p 5000:5000 --env MONGO_URI="mongodb://..." --env RAZORPAY_KEY_ID="rzp_..." --env RAZORPAY_KEY_SECRET="..." smart-water-supply
```

Notes
- `.env` is ignored by git; use `.env.example` as reference. Do NOT commit real secrets.
- The app listens on port `5000` by default. Configure the platform to use that port.

If you want, I can also add a GitHub Actions workflow to build and push a Docker image automatically.

## Railway: Secrets and GitHub setup

When deploying to Railway (or using the optional GitHub Actions deploy step), set these repository secrets or Railway environment variables:

- `MONGO_URI` — MongoDB connection string (production)
- `RAZORPAY_KEY_ID` — Razorpay live Key ID
- `RAZORPAY_KEY_SECRET` — Razorpay live Key Secret
- `RAZORPAY_ROUTE_ENABLED` — `true` or `false` depending on your gateway routing
- `NODE_ENV` — `production` (recommended)
- `RAILWAY_API_KEY` — (optional) Railway API key used by the GitHub Actions workflow to run `railway up`

How to create and add `RAILWAY_API_KEY` to GitHub:

1. Sign in to Railway (https://railway.app) and open your project.
2. Go to Project Settings → API Keys → Create New API Key. Copy the key value.
3. In GitHub, open your repository → Settings → Secrets and variables → Actions → New repository secret.
	- Name: `RAILWAY_API_KEY`
	- Value: the key you copied from Railway

Notes about linking the repo:
- The workflow will run `railway up --detach` if `RAILWAY_API_KEY` is present. For `railway up` to succeed automatically the repository should already be linked to a Railway project (this is normally done once via the Railway dashboard or `railway link`). If not linked, you can link locally and push the link by running:

```bash
# Install Railway CLI locally
npm install -g @railway/cli

# Login and link to a project (run once locally)
railway login --apiKey "$RAILWAY_API_KEY"
railway init   # or `railway link <PROJECT_ID>` if you already have a project

# Deploy from your machine (optional)
railway up --detach
```

After setting the `RAILWAY_API_KEY` secret and linking the repo/project, pushes to `main` will trigger the GitHub Actions workflow, build the Docker image, and attempt to deploy to Railway.
