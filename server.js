import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const PORT = process.env.PORT || 5000;
const DB_NAME = process.env.DB_NAME || 'crudapp';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

// initialize database and table if not already created
async function connectDb() {
  const conn = await mysql.createConnection(dbConfig);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.end();

  const pool = mysql.createPool({ ...dbConfig, database: DB_NAME });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return pool;
}

let db;
try {
  db = await connectDb();
  console.log(`Connected to MySQL database "${DB_NAME}"`);
} catch (err) {
  console.error('MySQL connection failed:', err.message);
  console.log('Please check your database credentials in the .env file.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// validation helper
function validateEmployee(data) {
  const errors = {};
  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  }
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!data.email.includes('@')) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.role || !data.role.trim()) {
    errors.role = 'Role is required';
  }
  return errors;
}

// GET /employees - fetch all employees (with optional search)
app.get('/employees', async (req, res) => {
  const { search = '' } = req.query;

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
    res.json(rows);
  } catch (err) {
    console.error('Fetch employees error:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /employees/:id - fetch single employee
app.get('/employees/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employee WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch employee error:', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /employees - add new employee
app.post('/employees', async (req, res) => {
  const errors = validateEmployee(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const { name, email, role } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO employee (name, email, role) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), role.trim()]
    );

    const [rows] = await db.query('SELECT * FROM employee WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ errors: { email: 'Email is already registered' } });
    }
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// PUT /employees/:id - update existing employee
app.put('/employees/:id', async (req, res) => {
  const errors = validateEmployee(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const { name, email, role } = req.body;
  const id = req.params.id;

  try {
    const [result] = await db.query(
      'UPDATE employee SET name = ?, email = ?, role = ? WHERE id = ?',
      [name.trim(), email.trim().toLowerCase(), role.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const [rows] = await db.query('SELECT * FROM employee WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ errors: { email: 'Email is already registered' } });
    }
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /employees/:id - delete employee
app.delete('/employees/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM employee WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
