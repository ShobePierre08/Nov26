const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Assuming you export your DB connection from config/db.js

exports.register = async (req, res) => {
  const { username, email, password, role_id } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send({ message: 'Database error', error: err });
      }

      if (result.length > 0) {
        return res.status(400).send({ message: 'Email already exists' });
      }

      const userRoleId = role_id || 3;

      const insertQuery = `
        INSERT INTO users (username, email, password, role_id)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertQuery, [username, email, hashedPassword, userRoleId], (err) => {
        if (err) {
          console.error('Insert error:', err);
          return res.status(500).send({ message: 'Insert failed', error: err });
        }

        res.status(200).send({ message: 'User Registered Successfully!' });
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send({ message: 'Server error', error });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send({ message: 'All fields are required' });

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0)
      return res.status(400).send({ message: 'User not found' });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send({ message: 'Invalid Credentials' });

    const token = jwt.sign(
      { id: user.user_id, role_id: user.role_id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    res.status(200).send({
      message: 'Login Successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
      },
    });
    
  });
};
