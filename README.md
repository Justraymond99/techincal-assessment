## Financial Transaction Management App

This is a simple full‑stack application to record financial transactions (income and expenses) and keep a running capital total.

### Stack
- Backend: NestJS-style TypeScript app with Mongoose (MongoDB)
- Frontend: React + Vite + TypeScript
- Database: MongoDB (Docker Compose)

### Quick Start

1) Prerequisites
- Node.js 18+
- Docker + Docker Compose

2) Start MongoDB

```bash
docker compose up -d
```

3) Backend

```bash
cd backend
npm install
npm run dev
```

Backend will start on `http://localhost:3000` and connect to MongoDB at `mongodb://localhost:27017/finances` by default.

4) Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:5173` and talk to the backend at `http://localhost:3000`.

### Environment

- Backend env: create `backend/.env`

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finances
```

- Frontend env: create `frontend/.env`

```
VITE_API_BASE_URL=http://localhost:3000
```

### API

- `GET /transactions` list transactions
- `POST /transactions` create transaction `{ type: 'income'|'expense', amount: number, description?: string, date?: string }`
- `PATCH /transactions/:id` update transaction
- `DELETE /transactions/:id` delete transaction
- `GET /capital` get current capital `{ capital: number }`

Capital is updated automatically on create/update/delete.

### Scripts

- Backend
  - `npm run dev` start in watch mode
  - `npm run build` build production
  - `npm start` run built app

- Frontend
  - `npm run dev` start Vite dev server
  - `npm run build` build production
  - `npm run preview` preview production build

### Deployment Notes

- Configure `MONGODB_URI` for your environment.
- Serve the frontend build from any static host and set `VITE_API_BASE_URL` accordingly.

