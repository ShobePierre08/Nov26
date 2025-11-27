const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// REQUIRE a JWT SECRET (no fallback!)
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("❌ JWT_SECRET is missing in environment variables!");
}

// Simple backend validation functions
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isStrongPassword = (pass) => pass.length >= 8;

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation (ISO integrity + authenticity)
  if (!username || !email || !password)
    return res.status(400).send({ message: "All fields are required." });

  if (!isValidEmail(email))
    return res.status(400).send({ message: "Invalid email format." });

  if (!isStrongPassword(password))
    return res.status(400).send({ message: "Password must be at least 8 characters." });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send({ message: "Server error occurred." });
      }

      if (result.length > 0) {
        return res.status(400).send({ message: "Email already registered." });
      }

      // FORCE SAFE ROLE ASSIGNMENT
      const userRoleId = 3; // student only — backend controlled

      const insertQuery = `
        INSERT INTO users (username, email, password, role_id)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertQuery, [username, email, hashedPassword, userRoleId], (err) => {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).send({ message: "Registration failed." });
        }

        res.status(200).send({ message: "User registered successfully!" });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send({ message: "Server error occurred." });
  }
};



// -------------------- LOGIN ---------------------

exports.login = (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password)
    return res.status(400).send({ message: "All fields are required." });

  if (!isValidEmail(email))
    return res.status(400).send({ message: "Invalid email format." });

  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], async (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).send({ message: "Server error occurred." });
    }

    if (result.length === 0)
      return res.status(400).send({ message: "Invalid email or password." });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).send({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user.user_id, role_id: user.role_id },
      jwtSecret,
      { expiresIn: "1h" }
    );

    // Simple login log for ISO accountability
    console.log(`User ${user.email} logged in at ${new Date().toISOString()}`);

    res.status(200).send({
      message: "Login successful",
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
