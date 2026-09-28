# Taskflow

A full-stack task manager built with Next.js, Express, Prisma, and PostgreSQL.

## Run with Docker

```bash
cp -n .env.example .env
docker compose up --build
```

Open http://localhost:3000. The API is available at http://localhost:3001 and PostgreSQL is published at localhost:55432.

## Run for local development

Start only PostgreSQL:

```bash
docker compose up -d db
```

Copy `backend/.env.example` to `backend/.env`, then run:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Next.js server proxies `/api/*` requests to the Express API. Override `API_INTERNAL_URL` when the API is hosted elsewhere.

## Checks

```bash
cd backend && npm run typecheck && npm test && npm run build
cd frontend && npm run lint && npm run build
docker compose config
```
