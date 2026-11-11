# employee-crud-app-server

Backend REST API for the Employee Directory CRUD Application built with Node.js, Express, and MySQL.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/employees` | Fetch all employees (supports `?search=term`) |
| `GET` | `/employees/:id` | Fetch employee by ID |
| `POST` | `/employees` | Add new employee |
| `PUT` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Delete employee |

## Database Setup

1. Make sure MySQL is running.
2. The server connects to database `crudapp` and table `employee`.
3. You can run `schema.sql` in MySQL Workbench or let `server.js` auto-create the table.

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file from `.env.example`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=crudapp
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

Server will run on [http://localhost:5000](http://localhost:5000).
