const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// PostgreSQL connection setup
const client = new Client({
  user: 'sweatha', // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'login',  // Replace with your database name
  password: '1234',  // Replace with your password
  port: 5432,
});

// Connect to the PostgreSQL database
client.connect()
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Connection error', err.stack));

// Register route (hashes password before saving)
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  // Check if the user already exists
  const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
  
  if (result.rows.length > 0) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

  // Insert the new user with the hashed password into the database
  client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword])
    .then(() => {
      res.status(201).json({ message: 'User registered successfully' });
    })
    .catch((err) => {
      console.error('Error executing query', err.stack);
      res.status(500).json({ message: 'Server error' });
    });
});

// Login route (compares hashed password)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists
  const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

  if (result.rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Compare the provided password with the hashed password in the database
  const isMatch = await bcrypt.compare(password, result.rows[0].password);

  if (isMatch) {
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
