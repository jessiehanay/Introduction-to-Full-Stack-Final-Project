const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const CryptoJS = require("crypto-js");

const db = new sqlite3.Database("data.db");
const port = 3000;
const app = express();

// Functions //

// Encrypt password with salt:
function hashPasswordSHA3(pwd, salt) {
  return CryptoJS.SHA3(pwd + salt, { outputLength: 512 }).toString();
}

//Create new salt:
function makeSalt() {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
}

// Initialize database //
// Check if tables exist, - if not, create them:
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sign_in (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    salt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datetime TEXT,
    username TEXT,
    message TEXT
  )`);
});

// User functions //

// Find user by username
function findUserByUsername(username, callback) {
  db.get(
    "SELECT username, password, salt FROM sign_in WHERE username=?",
    [username],
    callback
  );
}

// Create new user:
// - Check if user already exists - if not, create new user:
function createUser(username, password, callback) {
  findUserByUsername(username, (err, row) => {
    if (err) return callback(err);
    if (row) return callback(null, { exists: true });

    const salt = makeSalt();
    const hashedPassword = hashPasswordSHA3(password, salt);

    db.run(
      "INSERT INTO sign_in (username, password, salt) VALUES (?, ?, ?)",
      [username, hashedPassword, salt],
      (insertErr) => {
        if (insertErr) return callback(insertErr);
        return callback(null, { exists: false });
      }
    );
  });
}

// Validate user password:
function validateUserPassword(username, password, callback) {
  findUserByUsername(username, (err, row) => {
    if (err) return callback(err);
    if (!row) return callback(null, false);

    const hashedPassword = hashPasswordSHA3(password, row.salt);
    const isValid = (hashedPassword === row.password);
    return callback(null, isValid);
  });
}


// Message Functions //

// Add new message to database:
function addMessage(username, message, callback) {
  findUserByUsername(username, (err, row) => {
    if (err) return callback(err);
    if (!row) return callback(null, { userExists: false });

    const datetime = new Date().toISOString();
    db.run(
      "INSERT INTO messages (datetime, username, message) VALUES (?, ?, ?)",
      [datetime, username, message],
      (insertErr) => {
        if (insertErr) return callback(insertErr);
        return callback(null, { userExists: true });
      }
    );
  });
}

// Get messages by username:
function getMessagesByUsername(username, callback) {
  db.all(
    "SELECT datetime, username, message FROM messages WHERE username=? ORDER BY id DESC",
    [username],
    callback
  );
}

// Get last 50 messages:
function getRecentMessages(callback) {
  db.all(
    "SELECT datetime, username, message FROM messages ORDER BY datetime DESC LIMIT 50",
    [],
    callback
  );
}

// Server Setup: 
app.use(express.json());
app.use(express.static(__dirname));

// URL: /main page-/home page:
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// URL: /sign-in *check user password DB:
app.post("/sign-in", (req, res) => {
  console.log("[POST] /sign-in");
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).send("Missing username or password");

  validateUserPassword(username, password, (err, isValid) => {
    if (err) return res.status(500).send("Database error");
    if (!isValid) return res.status(400).send("Username/password not found");
    return res.status(200).send("Success!");
  });
});

// URL: /register *create new user to DB:
app.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).send("Missing username or password");

  createUser(username, password, (err, result) => {
    if (err) return res.status(500).send("Database error");
    if (result.exists) return res.status(400).send("Username already exists");
    return res.status(200).send("User created");
  });
});

// URL: /post-message *add new message to DB:
app.post("/post-message", (req, res) => {
  const { username, message } = req.body || {};
  if (!username || !message) return res.status(400).send("Missing username or message");

  addMessage(username, message, (err, result) => {
    if (err) return res.status(500).send("Database error");
    if (!result.userExists) return res.status(400).send("Username not found");
    return res.status(200).send("Message posted");
  });
});

// URL: /mypage *get messages by username:
app.get("/mypage", (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).send("No username");

  getMessagesByUsername(username, (err, rows) => {
    if (err) return res.status(500).send("Database error");
    if (!rows || rows.length === 0) return res.status(200).send("No messages for this user");

    // Format messages to: "Datetime username: message":
    const lines = rows.map((r) => `${r.datetime} ${r.username}: ${r.message}`);
    return res.status(200).send(lines.join("\n"));
  });
});


// URL: /messages/all *get last 50 messages:
app.get("/messages/all", (req, res) => {
  getRecentMessages((err, rows) => {
    if (err) return res.status(500).send("Database error");
    if (!rows || rows.length === 0) return res.status(200).send("No messages");

    // Format messages to: "Datetime username: message":
    const lines = rows.map((r) => `${r.datetime} ${r.username}: ${r.message}`);
    return res.status(200).send(lines.join("\n"));
  });
});

// Start server:
app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});
