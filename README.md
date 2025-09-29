# Financial Transaction Management App

A full-stack application for recording financial transactions (income and expenses) with automatic capital tracking. Features a clean, wireframe-matching UI with real-time updates.

## 🚀 Features

- **Transaction Management**: Add, edit, delete income and expense transactions
- **Real-time Capital Tracking**: Automatic calculation and display of current capital
- **Modern UI**: Clean, responsive interface matching the provided wireframe
- **Multiple Database Options**: PostgreSQL with automatic fallback to in-memory storage
- **English Interface**: Fully translated user interface

## 🛠 Tech Stack

- **Backend**: Express.js + TypeScript with PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL (with in-memory fallback)
- **Styling**: Inline CSS with modern design
- **API**: RESTful endpoints with CORS enabled

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional, for PostgreSQL)
- Git

## 🚀 Quick Start

### Option 1: Fastest (In-Memory Storage)

```bash
# Clone the repository
git clone https://github.com/Justraymond99/techincal-assessment.git
cd techincal-assessment

# Start backend (in-memory storage)
cd backend
npm install
npm run dev:cloud

# In a new terminal, start frontend
cd frontend
npm install
npm run dev
```

### Option 2: With PostgreSQL (Docker)

```bash
# Clone and start database
git clone https://github.com/Justraymond99/techincal-assessment.git
cd techincal-assessment
docker compose up -d

# Start backend
cd backend
npm install
npm run dev:postgres

# In a new terminal, start frontend
cd frontend
npm install
npm run dev
```

### Option 3: With Local PostgreSQL

```bash
# Install PostgreSQL locally, then:
git clone https://github.com/Justraymond99/techincal-assessment.git
cd techincal-assessment

# Create database
createdb finances

# Start backend
cd backend
npm install
npm run dev:postgres

# Start frontend
cd frontend
npm install
npm run dev
```

## 🌐 Access the App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database Admin** (if using Docker): http://localhost:8081 (pgAdmin)

## 📊 Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Capital Table
```sql
CREATE TABLE capital (
  id SERIAL PRIMARY KEY,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transactions` | List all transactions |
| `POST` | `/transactions` | Create new transaction |
| `PATCH` | `/transactions/:id` | Update transaction |
| `DELETE` | `/transactions/:id` | Delete transaction |
| `GET` | `/capital` | Get current capital |

### Example API Usage

```bash
# Get current capital
curl http://localhost:3000/capital

# Create a transaction
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"type":"income","amount":1000,"description":"Salary"}'

# List all transactions
curl http://localhost:3000/transactions
```

## ⚙️ Configuration

### Environment Variables

Create `backend/.env`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finances
DB_USER=postgres
DB_PASSWORD=postgres
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

## 📝 Available Scripts

### Backend
- `npm run dev` - Start NestJS server (requires MongoDB)
- `npm run dev:postgres` - Start with PostgreSQL
- `npm run dev:cloud` - Start with PostgreSQL + fallback to in-memory
- `npm run build` - Build for production
- `npm start` - Run production build

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🐳 Docker Setup

The app includes Docker Compose configuration for easy PostgreSQL setup:

```yaml
services:
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: finances
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
  pgadmin:
    image: dpage/pgadmin4:latest
    ports: ["8081:80"]
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change backend port
   PORT=3001 npm run dev:cloud
   
   # Change frontend port
   npm run dev -- --port 5174
   ```

2. **Database connection failed**
   - The app automatically falls back to in-memory storage
   - Check Docker is running: `docker compose ps`
   - Verify PostgreSQL credentials in `.env`

3. **CORS errors**
   - Backend has CORS enabled by default
   - Restart backend if you change origins

### Database Reset

```bash
# With Docker
docker compose down -v
docker compose up -d

# With local PostgreSQL
dropdb finances && createdb finances
```

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── cloud-postgres-server.ts  # Main server with fallback
│   │   ├── database.ts               # PostgreSQL connection
│   │   └── modules/                  # NestJS modules (original)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── ui/
│   │   │   ├── App.tsx              # Main React component
│   │   │   └── styles.css           # Global styles
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Configure `DATABASE_URL` for your PostgreSQL instance
3. Run `npm run build && npm start`

### Frontend Deployment
1. Set `VITE_API_BASE_URL` to your backend URL
2. Run `npm run build`
3. Serve the `dist` folder with any static host

## 📄 License

This project is part of a technical assessment.

## 🔗 Repository

**GitHub**: https://github.com/Justraymond99/techincal-assessment

---

**Note**: The app automatically handles database connectivity issues by falling back to in-memory storage, ensuring it always works regardless of your local setup.