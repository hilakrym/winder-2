// קובץ החיבור למסד הנתונים.
// כל קובץ שרוצה לבצע שאילתות משתמש בחיבור שמוגדר כאן.

const mysql = require("mysql2");

// פרטי ההתחברות למסד הנתונים המקומי.
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Hila1204!",
  database: "wineder_db"
});

// פתיחת החיבור והצגת הודעה במסוף אם יש בעיה.
connection.connect((err) => {
  if (err) {
    console.log("Error connecting to MySQL:", err);
    return;
  }

  console.log("Connected to MySQL database");
});

// ייצוא החיבור כדי ששאר קבצי השרת יוכלו להריץ שאילתות.
module.exports = connection;

