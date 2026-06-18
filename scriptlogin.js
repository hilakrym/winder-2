
console.log("Wineder Script Loaded");


//פונקציות גלובליות 

// בעת ההתנתקות מנקה את המשתמש מהזיכרון ומחזיר לדף הבית
window.logout = function() {
    localStorage.removeItem('firstName');
    window.location.href = 'index.html'; 
};

// הצגת הודעת הצלחה בחלון קופץ
window.showSuccessModal = function(title, message) {
    // מוצאים בדף את האלמנטים שמרכיבים את חלון ההודעה
    const modal = document.getElementById('successModal');
    const titleLabel = document.getElementById('successTitle');
    const msgLabel = document.getElementById('successMessage');

    // בודקים שהחלון קיים בדף לפני שמבצעים שינויים
    if (modal) {
        // מעדכנים את הכותרת, את תוכן ההודעה בטקסט הרצוי ומציגים את החלון
        if (titleLabel) titleLabel.innerText = title;
        if (msgLabel) msgLabel.innerText = message;
        modal.style.display = 'flex';
    }
};

// מעביר לזירת ההחלקות
    window.redirectToindex = function() {
    window.location.href = 'arena.html'; 
};

// העלמת מסך ההתחברות מהמסך
window.closeModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
};

// נבדוק אם המשתמש מחובר. אם לא, נפתח חלון התחברות במקום לעבור דף
window.checkAccess = function(event, page) {
    event.preventDefault();
    if (!localStorage.getItem('firstName')) {
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'flex';
    } else {
        window.location.href = page;
    }
};

//פעולות בזמן טעינת העמוד 

document.addEventListener('DOMContentLoaded', () => {

    // נעכדן את שורת התפריט- נציג שם משתמש אם מחובר, או כפתור כניסה אם לא
    const updateHeader = () => {
        // מחפשים את האזור בראש הדף שבו אמור להופיע השם או כפתור ההתחברות
        const userArea = document.getElementById('userArea');
        if (!userArea) return;// אם האזור הזה לא קיים בדף הנוכחי, יוצאים ולא עושים כלום

        // בודקים בזיכרון של הדפדפן האם המשתמש מחובר על ידי בדיקת השם
        const firstName = localStorage.getItem('firstName');

        //אם המשתמש מחובר נציג הודעת וכפתור להתנתקות מהמערכת
        if (firstName) {
            userArea.innerHTML = `
                <span class="me-3 fw-bold" style="color: #B76E79;">Hello, ${firstName}!</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="logout()" style="border-radius: 20px;">
                    Logout <i class="fas fa-sign-out-alt"></i>
                </button>`;
        // אם לא, נציג כפתור התחברות שמוביל לדף התחברות
        } else {
            userArea.innerHTML = `<a class="btn btn-outline-gold" href="login.html" style="color: #C68E58; border: 1px solid #C68E58; border-radius: 20px; padding: 5px 15px; text-decoration: none;">Login</a>`;
        }
    };

    // פונקציה שמושכת את רשימת המשתמשים מהזיכרון של הדפדפן
    const getUsers = () => JSON.parse(localStorage.getItem('winederUsers')) || [];

    // פונקציה שמוסיפה משתמש חדש לרשימה ושומרת אותה מחדש בזיכרון
    const saveUser = (user) => {
        const users = getUsers(); // מביאים את הרשימה הקיימת
        users.push(user);// מוסיפים את המשתמש החדש לסוף הרשימה
        localStorage.setItem('winederUsers', JSON.stringify(users)); // הופכים את הרשימה לטקסט ושומרים אותה בזיכרון של הדפדפן
    };

    // ניגשים לאלמנטים  של הטפסים והלשוניות בדף ההתחברות כדי לטפל באירועים שלהם
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // בודקים שהאלמנטים קיימים בדף כדי שלא תהיה שגיאה
    if (tabLogin && tabSignup) {

        //  כשלוחצים על לשונית התחברות יקרה:
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active'); // מדגיש את כפתור ההתחברות
            tabSignup.classList.remove('active'); // מבטל את ההדגשה מהרשמה
            loginForm.classList.add('active'); // מציג את טופס ההתחברות
            signupForm.classList.remove('active');// מסתיר את טופס ההרשמה
        });

        // כשלוחצים על לשונית התחברות יקרה:
        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active'); // מדגיש את כפתור ההרשמה
            tabLogin.classList.remove('active');// מבטל את ההדגשה מהתחברות
            signupForm.classList.add('active');// מציג את טופס ההרשמה
            loginForm.classList.remove('active');// מסתיר את טופס ההתחברות
        });
    }

    // נטפל בטופס הרשמה - נבדוק תקינות ונשמור משתמש חדש
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const ageCheck = document.getElementById('age-check').checked;

            // מוודא שהמשתמש מילא את כל השדות ואישר שהוא מעל גיל 18
            if (!firstName || !lastName || !email || !password || !ageCheck) {
                alert("Please fill all fields and confirm your age (18+).");
                return;
            }

            // בדיקה מול "מסד הנתונים" כדי לוודא שאין כבר משתמש עם אותו אימייל
            const users = getUsers();
            if (users.find(u => u.email === email)) {
                alert("Email already exists.");
                return;
            }

            // שומר את המשתמש החדש במערכת
            saveUser({ firstName, lastName, email, password });
            
            // מציג הודעת הצלחה למשתמש, מאפס את הטופס ומעביר אותו אוטומטית ללשונית ההתחברות
            window.showSuccessModal("Cheers! Account Created", "Welcome to the Wineder family. You can now login to find your perfect vintage.");
            signupForm.reset();
            
            if (tabLogin) tabLogin.click();
        });
    }

    //נטפל בטופס ההתחברות - נאמת פרטים מול המשתמשים השמורים
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email').value.trim();
            const passwordInput = document.getElementById('login-password').value;

            // נחפש במאגר המשתמשים שלנו אם יש מישהו עם אימייל וסיסמא בדיוק כמו שהוזנו בטופס
            const users = getUsers();
            const foundUser = users.find(u => u.email === emailInput && u.password === passwordInput);

            if (foundUser) {
                // אם נמצאה התאמה נשמור את שם המשתמש בזיכרון הדפדפן (כדי שישאר מחובר) ונציג הודעת הצלחה
                localStorage.setItem('firstName', foundUser.firstName);
                // הקפצת חלון הצלחה עם שם המשתמש
                window.showSuccessModal(`Welcome back, ${foundUser.firstName}!`, "Discover your next favorite vintage with a single swipe.");
            } else {
                // אם אין התאמה מקפיץ הודעת שגיאה
                alert("Invalid email or password.");
            }
        });
    }

    updateHeader();
});
