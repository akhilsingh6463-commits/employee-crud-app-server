CREATE DATABASE IF NOT EXISTS crudapp;
USE crudapp;

CREATE TABLE IF NOT EXISTS employee (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employee (id, name, email, role, created_at) VALUES
  (1, 'Aarav Sharma', 'aarav.sharma@example.com', 'Developer', '2026-11-11 11:23:28'),
  (2, 'Priya Patel', 'priya.patel@example.com', 'Designer', '2026-11-11 11:23:28'),
  (3, 'Rohan Verma', 'rohan.verma@example.com', 'Manager', '2026-11-11 11:23:28'),
  (4, 'Sunny Raut', 'sunny.raut@example.com', 'Unity Developer', '2026-11-11 11:28:04'),
  (5, 'Neha Singh', 'neha.singh@example.com', 'UI/UX Designer', '2026-11-11 11:28:04'),
  (6, 'Komal Verma', 'komal.verma@example.com', 'HR Manager', '2026-11-11 11:28:04'),
  (7, 'Akhil Singh', 'akhil.singh@example.com', 'Full Stack Developer', '2026-11-11 11:31:15'),
  (8, 'Sakshi Mishra', 'sakshi.mishra@example.com', 'Analayst', '2026-11-11 11:31:15'),
  (9, 'Vandana Kumari', 'vandana.kumari@example.com', 'Designer', '2026-11-11 11:31:15'),
  (10, 'Smith Roy', 'smith.roy@example.com', 'Designer', '2026-11-11 11:31:15')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);
