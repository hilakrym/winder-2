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

// -------------------- הגדרות קבועות של הניקוד והדרגות --------------------
const DAILY_GOAL = 5;
const SWIPE_POINTS = 2;
const DAILY_GOAL_BONUS = 50;
const CUSTOM_WINE_POINTS = 50;

// כל שינוי בדרגות צריך להתבצע כאן, כדי שהשרת יחשב את הדרגה באותה דרך בכל פעולה.
function calculateLevel(points) {
  if (points >= 500) return "Master of Wine";
  if (points >= 300) return "Vintage Expert";
  if (points >= 170) return "Wine Lover";
  if (points >= 100) return "Curious Taster";
  return "Casual Sipper";
}


// -------------------- נתיבי עמודים --------------------
app.get("/", (req, res) => res.sendFile(path.join(htmlPath, "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(htmlPath, "login.html")));
app.get("/arena", (req, res) => res.sendFile(path.join(htmlPath, "arena.html")));
app.get("/cellar", (req, res) => res.sendFile(path.join(htmlPath, "cellar.html")));
app.get("/edit-profile", (req, res) => res.sendFile(path.join(htmlPath, "edit-profile.html")));

// -------------------- נתיבים שעובדים מול מסד הנתונים --------------------
// יצירת משתמש חדש עם ניקוד התחלתי ודרגה התחלתית.
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

// התחברות משתמש קיים והחזרת הנתונים שצריך לשמור בדפדפן.
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

// שליפת כל היינות של משתמש מסוים: גם יינות רגילים וגם יינות שהמשתמש הוסיף בעצמו.
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

// הוספת יין אישי למרתף ועדכון הניקוד בהתאם
app.post("/custom-wine", (req, res) => {
  const { userEmail, name, winery, type, year, image } = req.body;
  const sql = `INSERT INTO custom_wines (user_email, name, winery, type, year, image) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [userEmail, name, winery, type, year, image || "../images/wine_images/default-wine.png"], (err, result) => {
    if (err) return res.status(500).json({ message: "Error adding custom wine." });

    // אחרי שהיין נשמר, שולפים את הניקוד הקיים כדי להוסיף את הבונוס.
    db.query(`SELECT points, level FROM users WHERE email = ?`, [userEmail], (selectErr, users) => {
      if (selectErr || users.length === 0) {
        return res.status(500).json({ message: "Wine was added, but gamification stats could not be loaded." });
      }

      // שומרים גם את הדרגה הישנה כדי לדעת אם צריך להציג הודעת עליית דרגה.
      const oldPoints = Number(users[0].points) || 0;
      const oldLevel = users[0].level || calculateLevel(oldPoints);
      const newPoints = oldPoints + CUSTOM_WINE_POINTS;
      const newLevel = calculateLevel(newPoints);

      db.query(
        `UPDATE users SET points = ?, level = ? WHERE email = ?`,
        [newPoints, newLevel, userEmail],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: "Wine was added, but points could not be updated." });
          }

          res.json({
            message: "Custom wine added.",
            wine: {
              id: result.insertId,
              name,
              winery,
              type,
              year,
              image: image || "../images/wine_images/default-wine.png",
              source: "custom"
            },
            stats: {
              points: newPoints,
              level: newLevel,
              pointsDelta: CUSTOM_WINE_POINTS,
              levelUp: oldLevel !== newLevel,
              oldLevel
            }
          });
        }
      );
    });
  });
});

// -------------------- לוגיקת הניקוד המרכזית --------------------
app.post("/swipe", (req, res) => {
  const { userEmail } = req.body;

  db.query(
    `SELECT points, level, streak, daily_swipes_count, last_active_date FROM users WHERE email = ?`,
    [userEmail],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: "Error fetching user data." });
      }

      // הנתונים האלו קובעים כמה נקודות להוסיף ואם הושלם יעד יומי.
      let { points, level, streak, daily_swipes_count, last_active_date } = results[0];

      points = Number(points) || 0;
      streak = Number(streak) || 0;
      daily_swipes_count = Number(daily_swipes_count) || 0;

      const oldLevel = level || calculateLevel(points);
      const todayObj = new Date();
      const formattedToday = todayObj.toISOString().split("T")[0];

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
        if (diffDays > 1 || daily_swipes_count < DAILY_GOAL) {
          streak = 0;
        }
        daily_swipes_count = 0;
      }

      points += SWIPE_POINTS;
      daily_swipes_count += 1;

      let bonusPoints = 0;
      let dailyGoalCompleted = false;

      // כאשר מגיעים בדיוק לחמש החלקות, מוסיפים את הבונוס היומי ומעדכנים רצף.
      if (daily_swipes_count === DAILY_GOAL) {
        dailyGoalCompleted = true;
        bonusPoints += DAILY_GOAL_BONUS;
        points += DAILY_GOAL_BONUS;
        streak += 1;

        if (streak > 0 && streak % 7 === 0) {
          const weeks = streak / 7;
          const weeklyBonus = 250 * weeks;
          bonusPoints += weeklyBonus;
          points += weeklyBonus;
        }
      }

      const newLevel = calculateLevel(points);

      db.query(
        `UPDATE users SET points = ?, level = ?, streak = ?, daily_swipes_count = ?, last_active_date = ? WHERE email = ?`,
        [points, newLevel, streak, daily_swipes_count, formattedToday, userEmail],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: "Error updating gamification stats." });
          }

          res.json({
            points,
            level: newLevel,
            streak,
            dailySwipesCount: daily_swipes_count,
            pointsDelta: SWIPE_POINTS,
            bonusPoints,
            dailyGoalCompleted,
            levelUp: oldLevel !== newLevel,
            oldLevel
          });
        }
      );
    }
  );
});

// שליפת פרטי פרופיל למסך עריכת המשתמש.
app.get("/profile/:email", (req, res) => {
  db.query(`SELECT * FROM users WHERE email = ?`, [req.params.email], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "User not found." });
    res.json(results[0]);
  });
});

// שמירת השינויים שהמשתמש ביצע בפרופיל ובהעדפות היין.
app.put("/profile", (req, res) => {
  const { currentEmail, firstName, lastName, password, winePreferences } = req.body;

  if (!currentEmail || !firstName || !password) {
    return res.status(400).json({ message: "Missing required profile details." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const prefs = Array.isArray(winePreferences) ? winePreferences.join(",") : "";

  const sql = `
    UPDATE users
    SET firstName = ?, lastName = ?, password = ?, wine_preferences = ?
    WHERE email = ?
  `;

  db.query(
    sql,
    [firstName, lastName || "", password, prefs, currentEmail],
    (err, result) => {
      if (err) {
        console.log("Profile update error:", err);
        return res.status(500).json({ message: "Error updating profile." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      res.json({
        message: "Profile updated successfully.",
        user: {
          firstName,
          lastName: lastName || "",
          email: currentEmail,
          winePreferences: prefs
        }
      });
    }
  );
});

app.use((req, res) => res.status(404).send("Page not found"));

app.listen(port, () => console.log(`Server is running on port ${port}`));