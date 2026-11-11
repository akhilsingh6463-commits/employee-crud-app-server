import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const PORT = Number(process.env.PORT) || 5000;

// Support both Railway MySQL environment variables and standard .env
const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME || 'crudapp';
const DB_PORT = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
const DATABASE_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;

// Initial 10 employees for seeding
const DEFAULT_EMPLOYEES = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'Developer', created_at: '2026-11-11 11:23:28' },
  { id: 2, name: 'Priya Patel', email: 'priya.patel@example.com', role: 'Designer', created_at: '2026-11-11 11:23:28' },
  { id: 3, name: 'Rohan Verma', email: 'rohan.verma@example.com', role: 'Manager', created_at: '2026-11-11 11:23:28' },
  { id: 4, name: 'Sunny Raut', email: 'sunny.raut@example.com', role: 'Unity Developer', created_at: '2026-11-11 11:28:04' },
  { id: 5, name: 'Neha Singh', email: 'neha.singh@example.com', role: 'UI/UX Designer', created_at: '2026-11-11 11:28:04' },
  { id: 6, name: 'Komal Verma', email: 'komal.verma@example.com', role: 'HR Manager', created_at: '2026-11-11 11:28:04' },
  { id: 7, name: 'Akhil Singh', email: 'akhil.singh@example.com', role: 'Full Stack Developer', created_at: '2026-11-11 11:31:15' },
  { id: 8, name: 'Sakshi Mishra', email: 'sakshi.mishra@example.com', role: 'Analayst', created_at: '2026-11-11 11:31:15' },
  { id: 9, name: 'Vandana Kumari', email: 'vandana.kumari@example.com', role: 'Designer', created_at: '2026-11-11 11:31:15' },
  { id: 10, name: 'Smith Roy', email: 'smith.roy@example.com', role: 'Designer', created_at: '2026-11-11 11:31:15' },
];

let fallbackEmployees = [...DEFAULT_EMPLOYEES];
let nextFallbackId = 11;
let db = null;

async function initDb() {
  try {
    let pool;
    if (DATABASE_URL) {
      pool = mysql.createPool(DATABASE_URL);
    } else {
      // try creating database if on localhost / root permissions
      try {
        const adminConn = await mysql.createConnection({
          host: DB_HOST,
          user: DB_USER,
          password: DB_PASSWORD,
          port: DB_PORT,
        });
        await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        await adminConn.end();
      } catch (err) {
        // Ignored on managed cloud databases where database is pre-created
      }

      pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: DB_PORT,
        waitForConnections: true,
        connectionLimit: 10,
      });
    }

    // test connection
    await pool.query('SELECT 1');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // seed table if empty
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM employee');
    if (countRows[0].count === 0) {
      for (const emp of DEFAULT_EMPLOYEES) {
        await pool.query(
          'INSERT INTO employee (id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
          [emp.id, emp.name, emp.email, emp.role, emp.created_at]
        );
      }
    }

    console.log(`Connected to MySQL database "${DB_NAME}" at ${DB_HOST}:${DB_PORT}`);
    return pool;
  } catch (err) {
    console.warn('MySQL connection failed:', err.message);
    console.warn('Running with in-memory fallback store so server remains healthy and active.');
    return null;
  }
}

db = await initDb();

const app = express();
app.use(cors());
app.use(express.json());

// validation helper
function validateEmployee(data) {
  const errors = {};
  if (!data.name || !data.name.trim()) errors.name = 'Name is required';
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!data.email.includes('@')) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.role || !data.role.trim()) errors.role = 'Role is required';
  return errors;
}

// Root route for Railway healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Employee Directory REST API',
    database: db ? 'MySQL connected' : 'In-memory mode (attach MySQL to persist permanently)',
  });
});

// GET /employees
app.get('/employees', async (req, res) => {
  const { search = '' } = req.query;

  if (db) {
    try {
      let sql = 'SELECT * FROM employee';
      const params = [];
      if (search.trim()) {
        sql += ' WHERE name LIKE ? OR email LIKE ? OR role LIKE ?';
        const term = `%${search.trim()}%`;
        params.push(term, term, term);
      }
      sql += ' ORDER BY id DESC';
      const [rows] = await db.query(sql, params);
      return res.json(rows);
    } catch (err) {
      console.error('MySQL GET error:', err);
    }
  }

  // fallback store
  let result = [...fallbackEmployees];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  }
  result.sort((a, b) => (b.id || 0) - (a.id || 0));
  res.json(result);
});

// GET /employees/:id
app.get('/employees/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (db) {
    try {
      const [rows] = await db.query('SELECT * FROM employee WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
      return res.json(rows[0]);
    } catch (err) {
      console.error('MySQL GET by id error:', err);
    }
  }

  const emp = fallbackEmployees.find((e) => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

// POST /employees
app.post('/employees', async (req, res) => {
  const errors = validateEmployee(req.body);
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  const { name, email, role } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  if (db) {
    try {
      const [result] = await db.query(
        'INSERT INTO employee (name, email, role) VALUES (?, ?, ?)',
        [name.trim(), normalizedEmail, role.trim()]
      );
      const [rows] = await db.query('SELECT * FROM employee WHERE id = ?', [result.insertId]);
      return res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ errors: { email: 'Email is already registered' } });
      }
      console.error('MySQL POST error:', err);
    }
  }

  // fallback store
  if (fallbackEmployees.some((e) => e.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ errors: { email: 'Email is already registered' } });
  }

  const newEmp = {
    id: nextFallbackId++,
    name: name.trim(),
    email: normalizedEmail,
    role: role.trim(),
    created_at: new Date().toISOString(),
  };
  fallbackEmployees.unshift(newEmp);
  res.status(201).json(newEmp);
});

// PUT /employees/:id
app.put('/employees/:id', async (req, res) => {
  const id = Number(req.params.id);
  const errors = validateEmployee(req.body);
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  const { name, email, role } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  if (db) {
    try {
      const [result] = await db.query(
        'UPDATE employee SET name = ?, email = ?, role = ? WHERE id = ?',
        [name.trim(), normalizedEmail, role.trim(), id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });

      const [rows] = await db.query('SELECT * FROM employee WHERE id = ?', [id]);
      return res.json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ errors: { email: 'Email is already registered' } });
      }
      console.error('MySQL PUT error:', err);
    }
  }

  // fallback store
  const index = fallbackEmployees.findIndex((e) => e.id === id);
  if (index === -1) return res.status(404).json({ error: 'Employee not found' });

  if (fallbackEmployees.some((e) => e.id !== id && e.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ errors: { email: 'Email is already registered' } });
  }

  fallbackEmployees[index] = {
    ...fallbackEmployees[index],
    name: name.trim(),
    email: normalizedEmail,
    role: role.trim(),
  };
  res.json(fallbackEmployees[index]);
});

// DELETE /employees/:id
app.delete('/employees/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (db) {
    try {
      const [result] = await db.query('DELETE FROM employee WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
      return res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
      console.error('MySQL DELETE error:', err);
    }
  }

  // fallback store
  const exists = fallbackEmployees.some((e) => e.id === id);
  if (!exists) return res.status(404).json({ error: 'Employee not found' });
  fallbackEmployees = fallbackEmployees.filter((e) => e.id !== id);
  res.json({ message: 'Employee deleted successfully' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Bind to 0.0.0.0 for cloud hosting (Railway, Docker, Render)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
