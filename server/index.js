const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db");


const app = express();
const port = 3000;


// נתיבים קבועים לתיקיות
const publicPath = path.join(__dirname, "../public");
const htmlPath = path.join(publicPath, "html");


// מאפשר לשרת לקרוא נתונים מטפסים ו-JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// מאפשר לשרת להשתמש בקבצים מתוך תיקיית public
app.use(express.static(publicPath));




// -------------------- Routes של עמודים --------------------


// עמוד הבית
app.get("/", (req, res) => {
  res.sendFile(path.join(htmlPath, "index.html"));
});


// עמוד התחברות / הרשמה
app.get("/login", (req, res) => {
  res.sendFile(path.join(htmlPath, "login.html"));
});


// עמוד Arena
app.get("/arena", (req, res) => {
  res.sendFile(path.join(htmlPath, "arena.html"));
});


// עמוד My Cellar
app.get("/cellar", (req, res) => {
  res.sendFile(path.join(htmlPath, "cellar.html"));
});


// עמוד עריכת פרופיל
app.get("/edit-profile", (req, res) => {
  res.sendFile(path.join(htmlPath, "edit-profile.html"));
});




// -------------------- Routes של מסד נתונים --------------------


// בדיקה שהחיבור ל-MySQL עובד
app.get("/test-db", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.log("Database error:", err);
      res.status(500).send("Database error");
      return;
    }


    res.json(results);
  });
});




// הרשמה
// הרשמה
app.post("/signup", (req, res) => {
  const { firstName, lastName, email, password, winePreferences } = req.body;


  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ message: "Please fill all required fields." });
    return;
  }


  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters." });
    return;
  }


  const preferencesText = Array.isArray(winePreferences)
    ? winePreferences.join(",")
    : "";


  const sql = `
    INSERT INTO users
    (email, password, firstName, lastName, wine_preferences, points, level, streak, daily_swipes_count, last_active_date)
    VALUES (?, ?, ?, ?, ?, 0, 'Casual Sipper', 0, 0, NULL)
  `;


  db.query(sql, [email, password, firstName, lastName, preferencesText], (err, result) => {
    if (err) {
      console.log("Signup error:", err);


      if (err.code === "ER_DUP_ENTRY") {
        res.status(400).json({ message: "Email already exists." });
        return;
      }


      res.status(500).json({ message: "Error creating user." });
      return;
    }


    res.json({
      message: "User created successfully",
      user: {
        id: result.insertId,
        firstName,
        lastName,
        email,
        winePreferences: preferencesText,
        points: 0,
        level: "Casual Sipper",
        streak: 0,
        dailySwipesCount: 0
      }
    });
  });
});



// התחברות
app.post("/login", (req, res) => {
  const { email, password } = req.body;


  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }


  const sql = `
    SELECT id, email, firstName, lastName, wine_preferences, points, level, streak, daily_swipes_count, last_active_date
    FROM users
    WHERE email = ? AND password = ?
  `;


  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.log("Login error:", err);
      res.status(500).json({ message: "Error logging in." });
      return;
    }


    if (results.length === 0) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }


    const user = results[0];


    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        winePreferences: user.wine_preferences || "",
        points: user.points,
        level: user.level,
        streak: user.streak,
        dailySwipesCount: user.daily_swipes_count,
        lastActiveDate: user.last_active_date
      }
    });
  });
});





// שליפת כל היינות מהמסד עבור Arena
app.get("/wines", (req, res) => {
  const sql = "SELECT * FROM wines";


  db.query(sql, (err, results) => {
    if (err) {
      console.log("Error getting wines:", err);
      res.status(500).json({ message: "Error getting wines." });
      return;
    }


    res.json(results);
  });
});




// שליפת המרתף של משתמש מסוים
// שליפת המרתף של משתמש מסוים: יינות רגילים + יינות אישיים
app.get("/cellar/:email", (req, res) => {
  const userEmail = req.params.email;


  const sql = `
    SELECT 
      wines.id AS id,
      wines.name,
      wines.winery,
      wines.type,
      wines.year,
      wines.image,
      'regular' AS source
    FROM user_cellar
    JOIN wines ON user_cellar.wine_id = wines.id
    WHERE user_cellar.user_email = ?


    UNION ALL


    SELECT
      custom_wines.id AS id,
      custom_wines.name,
      custom_wines.winery,
      custom_wines.type,
      custom_wines.year,
      custom_wines.image,
      'custom' AS source
    FROM custom_wines
    WHERE custom_wines.user_email = ?
  `;


  db.query(sql, [userEmail, userEmail], (err, results) => {
    if (err) {
      console.log("Error getting cellar:", err);
      res.status(500).json({ message: "Error getting cellar." });
      return;
    }


    res.json(results);
  });
});



// הוספת יין למרתף של המשתמש
app.post("/cellar", (req, res) => {
  const { userEmail, wineId } = req.body;


  if (!userEmail || !wineId) {
    res.status(400).json({ message: "Missing user email or wine id." });
    return;
  }


  const sql = `
    INSERT INTO user_cellar (user_email, wine_id)
    VALUES (?, ?)
  `;


  db.query(sql, [userEmail, wineId], (err, result) => {
    if (err) {
      console.log("Error adding wine to cellar:", err);


      if (err.code === "ER_DUP_ENTRY") {
        res.status(400).json({ message: "Wine already exists in cellar." });
        return;
      }


      res.status(500).json({ message: "Error adding wine to cellar." });
      return;
    }


    res.json({ message: "Wine added to cellar successfully." });
  });
});




// מחיקת יין מהמרתף
app.delete("/cellar", (req, res) => {
  const { userEmail, wineId } = req.body;


  if (!userEmail || !wineId) {
    res.status(400).json({ message: "Missing user email or wine id." });
    return;
  }


  const sql = `
    DELETE FROM user_cellar
    WHERE user_email = ? AND wine_id = ?
  `;


  db.query(sql, [userEmail, wineId], (err, result) => {
    if (err) {
      console.log("Error removing wine from cellar:", err);
      res.status(500).json({ message: "Error removing wine from cellar." });
      return;
    }


    res.json({ message: "Wine removed from cellar successfully." });
  });
});

// מחיקת יין אישי מהמרתף
app.delete("/custom-wine", (req, res) => {
  const { userEmail, wineId } = req.body;


  if (!userEmail || !wineId) {
    res.status(400).json({ message: "Missing user email or custom wine id." });
    return;
  }


  const sql = `
    DELETE FROM custom_wines
    WHERE user_email = ? AND id = ?
  `;


  db.query(sql, [userEmail, wineId], (err, result) => {
    if (err) {
      console.log("Error removing custom wine:", err);
      res.status(500).json({ message: "Error removing custom wine." });
      return;
    }


    res.json({ message: "Custom wine removed successfully." });
  });
});



// הוספת יין אישי למרתף של משתמש בלבד
app.post("/custom-wine", (req, res) => {
  const { userEmail, name, winery, type, year, image } = req.body;


  if (!userEmail || !name || !winery || !year || !type) {
    res.status(400).json({ message: "Missing required wine details." });
    return;
  }


  const sql = `
    INSERT INTO custom_wines (user_email, name, winery, type, year, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;


  db.query(
    sql,
    [userEmail, name, winery, type, year, image || "../images/wine_images/default-wine.png"],
    (err, result) => {
      if (err) {
        console.log("Error adding custom wine:", err);
        res.status(500).json({ message: "Error adding custom wine." });
        return;
      }


      res.json({
        message: "Custom wine added successfully.",
        wine: {
          id: result.insertId,
          name,
          winery,
          type,
          year,
          image: image || "../images/wine_images/default-wine.png",
          source: "custom"
        }
      });
    }
  );
});


// שליפת פרטי משתמש לעריכת פרופיל
app.get("/profile/:email", (req, res) => {
  const userEmail = req.params.email;


  const sql = `
    SELECT id, email, firstName, lastName, password, wine_preferences, points, level, streak
    FROM users
    WHERE email = ?
  `;


  db.query(sql, [userEmail], (err, results) => {
    if (err) {
      console.log("Profile fetch error:", err);
      res.status(500).json({ message: "Error loading profile." });
      return;
    }


    if (results.length === 0) {
      res.status(404).json({ message: "User not found." });
      return;
    }


    res.json(results[0]);
  });
});




// עדכון פרטי משתמש
app.put("/profile", (req, res) => {
  const { currentEmail, firstName, lastName, password, winePreferences } = req.body;


  if (!currentEmail || !firstName || !password) {
    res.status(400).json({ message: "Missing required profile details." });
    return;
  }


  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters." });
    return;
  }


  const preferencesText = Array.isArray(winePreferences)
    ? winePreferences.join(",")
    : "";


  const sql = `
    UPDATE users
    SET firstName = ?, lastName = ?, password = ?, wine_preferences = ?
    WHERE email = ?
  `;


  db.query(
    sql,
    [firstName, lastName || "", password, preferencesText, currentEmail],
    (err, result) => {
      if (err) {
        console.log("Profile update error:", err);
        res.status(500).json({ message: "Error updating profile." });
        return;
      }


      if (result.affectedRows === 0) {
        res.status(404).json({ message: "User not found." });
        return;
      }


      res.json({
        message: "Profile updated successfully.",
        user: {
          firstName,
          lastName: lastName || "",
          email: currentEmail,
          winePreferences: preferencesText
        }
      });
    }
  );
});






// אם כתובת לא קיימת
app.use((req, res) => {
  res.status(404).send("Page not found");
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




