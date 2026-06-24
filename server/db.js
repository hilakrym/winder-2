const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Hila1204!",
  database: "wineder_db"
});

connection.connect((err) => {
  if (err) {
    console.log("Error connecting to MySQL:", err);
    return;
  }

  console.log("Connected to MySQL database");
});

module.exports = connection;

