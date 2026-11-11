# employee-crud-app-server

Backend REST API for the Employee Directory CRUD Application built with Node.js, Express, and MySQL.

## Live Deployment (Railway)
- **Base URL:** [https://employee-crud-app-server-production.up.railway.app](https://employee-crud-app-server-production.up.railway.app)
- **API Endpoint:** [https://employee-crud-app-server-production.up.railway.app/employees](https://employee-crud-app-server-production.up.railway.app/employees)

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/employees` | Fetch all employees (supports `?search=term`) |
| `GET` | `/employees/:id` | Fetch employee by ID |
| `POST` | `/employees` | Add new employee |
| `PUT` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Delete employee |

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=crudapp
   ```

3. Run server:
   ```bash
   npm run dev
   ```
