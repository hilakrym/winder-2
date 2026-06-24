const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db");

const app = express();
const port = 3000;

const publicPath = path.join(__dirname, "../public");
const htmlPath = path.join(publicPath, "html");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));

// -------------------- Routes של עמודים --------------------
app.get("/", (req, res) => res.sendFile(path.join(htmlPath, "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(htmlPath, "login.html")));
app.get("/arena", (req, res) => res.sendFile(path.join(htmlPath, "arena.html")));
app.get("/cellar", (req, res) => res.sendFile(path.join(htmlPath, "cellar.html")));
app.get("/edit-profile", (req, res) => res.sendFile(path.join(htmlPath, "edit-profile.html")));

// -------------------- Routes של מסד נתונים --------------------
app.post("/signup", (req, res) => {
  const { firstName, lastName, email, password, winePreferences } = req.body;
  if (!firstName || !lastName || !email || !password) return res.status(400).json({ message: "Please fill all required fields." });
  
  const preferencesText = Array.isArray(winePreferences) ? winePreferences.join(",") : "";
  const sql = `INSERT INTO users (email, password, firstName, lastName, wine_preferences, points, level, streak, daily_swipes_count, last_active_date) VALUES (?, ?, ?, ?, ?, 0, 'Casual Sipper', 0, 0, NULL)`;

  db.query(sql, [email, password, firstName, lastName, preferencesText], (err, result) => {
    if (err) return res.status(500).json({ message: err.code === "ER_DUP_ENTRY" ? "Email already exists." : "Error creating user." });
    res.json({ message: "User created successfully", user: { id: result.insertId, firstName, lastName, email, winePreferences: preferencesText, points: 0, level: "Casual Sipper", streak: 0, dailySwipesCount: 0 } });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ message: "Invalid email or password." });
    const user = results[0];
    res.json({ message: "Login successful", user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, winePreferences: user.wine_preferences || "", points: user.points, level: user.level, streak: user.streak, dailySwipesCount: user.daily_swipes_count, lastActiveDate: user.last_active_date } });
  });
});

app.get("/wines", (req, res) => {
  db.query("SELECT * FROM wines", (err, results) => {
    if (err) return res.status(500).json({ message: "Error getting wines." });
    res.json(results);
  });
});

// שליפת יינות לארנה (מסנן החוצה יינות שכבר קיימים במרתף של המשתמש)
app.get("/arena-wines", (req, res) => {
  const userEmail = req.query.email;
  
  if (!userEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  // השאילתה מושכת רק יינות שה-ID שלהם לא מופיע בטבלת המרתף תחת האימייל של המשתמש
  const sql = `
    SELECT * FROM wines 
    WHERE id NOT IN (
      SELECT wine_id FROM user_cellar WHERE user_email = ?
    )
  `;

  db.query(sql, [userEmail], (err, results) => {
    if (err) {
      console.log("Error fetching arena wines:", err);
      res.status(500).json({ message: "Error fetching wines" });
      return;
    }
    res.json(results);
  });
});

app.get("/cellar/:email", (req, res) => {
  const userEmail = req.params.email;
  const sql = `
    SELECT wines.id AS id, wines.name, wines.winery, wines.type, wines.year, wines.image, 'regular' AS source
    FROM user_cellar JOIN wines ON user_cellar.wine_id = wines.id WHERE user_cellar.user_email = ?
    UNION ALL
    SELECT custom_wines.id AS id, custom_wines.name, custom_wines.winery, custom_wines.type, custom_wines.year, custom_wines.image, 'custom' AS source
    FROM custom_wines WHERE custom_wines.user_email = ?
  `;
  db.query(sql, [userEmail, userEmail], (err, results) => {
    if (err) return res.status(500).json({ message: "Error getting cellar." });
    res.json(results);
  });
});

app.post("/cellar", (req, res) => {
  const { userEmail, wineId } = req.body;
  db.query(`INSERT INTO user_cellar (user_email, wine_id) VALUES (?, ?)`, [userEmail, wineId], (err) => {
    if (err) return res.status(500).json({ message: "Error adding wine." });
    res.json({ message: "Wine added to cellar successfully." });
  });
});

app.delete("/cellar", (req, res) => {
  const { userEmail, wineId } = req.body;
  db.query(`DELETE FROM user_cellar WHERE user_email = ? AND wine_id = ?`, [userEmail, wineId], (err) => {
    if (err) return res.status(500).json({ message: "Error removing wine." });
    res.json({ message: "Wine removed." });
  });
});

app.delete("/custom-wine", (req, res) => {
  const { userEmail, wineId } = req.body;
  db.query(`DELETE FROM custom_wines WHERE user_email = ? AND id = ?`, [userEmail, wineId], (err) => {
    if (err) return res.status(500).json({ message: "Error removing custom wine." });
    res.json({ message: "Custom wine removed." });
  });
});

// בונוס 50 נקודות על הוספת יין אישי
app.post("/custom-wine", (req, res) => {
  const { userEmail, name, winery, type, year, image } = req.body;
  const sql = `INSERT INTO custom_wines (user_email, name, winery, type, year, image) VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [userEmail, name, winery, type, year, image || "../images/wine_images/default-wine.png"], (err, result) => {
      if (err) return res.status(500).json({ message: "Error adding custom wine." });

      // עדכון הניקוד בבסיס הנתונים וחישוב דרגה מחדש
      db.query(`SELECT points FROM users WHERE email = ?`, [userEmail], (err, results) => {
          if (!err && results.length > 0) {
              let newPoints = results[0].points + 50;
              let newLevel = 'Casual Sipper';
              if (newPoints >= 8000) newLevel = 'Master of Wine';
              else if (newPoints >= 3500) newLevel = 'Vintage Expert';
              else if (newPoints >= 1200) newLevel = 'Wine Lover';
              else if (newPoints >= 400) newLevel = 'Curious Taster';

              db.query(`UPDATE users SET points = ?, level = ? WHERE email = ?`, [newPoints, newLevel, userEmail]);
          }
      });

      res.json({ message: "Custom wine added.", wine: { id: result.insertId, name, winery, type, year, source: "custom" } });
  });
});

// -------------------- לוגיקת המשחוק המרכזית (Gamification) --------------------
app.post("/swipe", (req, res) => {
  const { userEmail } = req.body;

  db.query(`SELECT points, level, streak, daily_swipes_count, last_active_date FROM users WHERE email = ?`, [userEmail], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: "Error fetching user data." });

    let { points, streak, daily_swipes_count, last_active_date } = results[0];
    const todayObj = new Date();
    const formattedToday = todayObj.toISOString().split('T')[0];

    let diffDays = 0;
    if (last_active_date) {
        const lastDateObj = new Date(last_active_date);
        const utcToday = Date.UTC(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
        const utcLast = Date.UTC(lastDateObj.getFullYear(), lastDateObj.getMonth(), lastDateObj.getDate());
        diffDays = Math.floor((utcToday - utcLast) / (1000 * 60 * 60 * 24));
    } else {
        diffDays = 999; 
    }

    // ניהול רצף ואיפוס: אם עבר יותר מיום אחד, או שאתמול לא הושלמו 5 החלקות - מאפסים
    if (diffDays >= 1) {
        if (diffDays > 1 || daily_swipes_count < 5) {
            streak = 0; 
        }
        daily_swipes_count = 0;
    }

    points += 2; // 2 נקודות על כל החלקה
    daily_swipes_count += 1;

    // בונוס יומי ושבועי
    if (daily_swipes_count === 5) {
        points += 50; 
        streak += 1;
        
        if (streak > 0 && streak % 7 === 0) {
            const weeks = streak / 7;
            points += (250 * weeks);
        }
    }

    // עדכון דרגות
    let newLevel = 'Casual Sipper';
    if (points >= 8000) newLevel = 'Master of Wine';
    else if (points >= 3500) newLevel = 'Vintage Expert';
    else if (points >= 1200) newLevel = 'Wine Lover';
    else if (points >= 400) newLevel = 'Curious Taster';

    db.query(`UPDATE users SET points = ?, level = ?, streak = ?, daily_swipes_count = ?, last_active_date = ? WHERE email = ?`, 
      [points, newLevel, streak, daily_swipes_count, formattedToday, userEmail], (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Error updating gamification stats." });
        res.json({ points, level: newLevel, streak, dailySwipesCount: daily_swipes_count });
    });
  });
});

app.get("/profile/:email", (req, res) => {
  db.query(`SELECT * FROM users WHERE email = ?`, [req.params.email], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "User not found." });
    res.json(results[0]);
  });
});

app.put("/profile", (req, res) => {
  const { currentEmail, firstName, lastName, password, winePreferences } = req.body;
  const prefs = Array.isArray(winePreferences) ? winePreferences.join(",") : "";
  db.query(`UPDATE users SET firstName = ?, lastName = ?, password = ?, wine_preferences = ? WHERE email = ?`, 
    [firstName, lastName || "", password, prefs, currentEmail], (err) => {
      if (err) return res.status(500).json({ message: "Error updating profile." });
      res.json({ message: "Profile updated" });
  });
});

app.use((req, res) => res.status(404).send("Page not found"));

app.listen(port, () => console.log(`Server is running on port ${port}`));