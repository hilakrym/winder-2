console.log("Wineder Script Loaded");

// --- פונקציות גלובליות ---

// בעת ההתנתקות מנקה את המשתמש מהזיכרון ומחזיר לדף הבית
window.logout = function() {
    localStorage.removeItem('firstName');
    localStorage.removeItem('currentUser'); // הוספנו את השורה הזו
    window.location.href = '/'; 

};

// הצגת הודעת הצלחה בחלון קופץ
window.showSuccessModal = function(title, message) {
    const modal = document.getElementById('successModal');
    const titleLabel = document.getElementById('successTitle');
    const msgLabel = document.getElementById('successMessage');

    if (modal) {
        if (titleLabel) titleLabel.innerText = title;
        if (msgLabel) msgLabel.innerText = message;
        modal.style.display = 'flex';
    }
};

// מעביר לזירת ההחלקות
window.redirectToindex = function() {
    window.location.href = '/arena'; 
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


// --- פעולות בזמן טעינת העמוד ---
document.addEventListener('DOMContentLoaded', () => {

    // נעדכן את שורת התפריט והתצוגה בדף הבית לפי מצב ההתחברות
    const updateHeader = () => {
        const userArea = document.getElementById('userArea');
        const getStartedBtn = document.getElementById('getStartedBtn'); 
        
        if (!userArea) return;

        const firstName = localStorage.getItem('firstName');

        if (firstName) {
            // -- משתמש מחובר --
            userArea.innerHTML = `
                <span class="me-3 fw-bold" style="color: #B76E79;">Hello, ${firstName}!</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="logout()" style="border-radius: 20px;">
                    Logout <i class="fas fa-sign-out-alt"></i>
                </button>`;
                
            if (getStartedBtn) {
                getStartedBtn.style.display = 'none';
            }

            // === תוספת חדשה: ניהול פרופיל הטעם (Taste Profile) בעמוד הבית ===
            const tasteProfileSection = document.getElementById('taste-profile-section');
            const heroTitle = document.querySelector('.hero-text h1');
            const heroSubtitle = document.querySelector('.hero-text p.lead');

            if (heroTitle) heroTitle.textContent = `Welcome back, ${firstName}!`;
            if (heroSubtitle) heroSubtitle.textContent = "Your personalized wine journey continues here. Check out your current taste profile below:";

            if (tasteProfileSection) {
                tasteProfileSection.classList.remove('d-none');
                
                // --- התיקון שלנו: שליפת המרתף לפי המפתח המדויק כמו ב-Arena ---
                const currentUserForCellar = localStorage.getItem('currentUser');
                const storageKey = `cellar_${currentUserForCellar}`;
                const myCellar = JSON.parse(localStorage.getItem(storageKey)) || [];

                // 1. סה"כ יינות במרתף
                document.getElementById('tp-total-wines').textContent = myCellar.length;

                if (myCellar.length > 0) {
                    // 2. חישוב ה-Vibe (איזה אחוז מהיינות הם מסוג מסוים)
                    const typeCounts = myCellar.reduce((acc, wine) => {
                        const type = (wine.type || "unknown").toLowerCase().replace('é', 'e');
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {});
                    
                    // מציאת הסוג הנפוץ ביותר
                    const dominantType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
                    
                    // חישוב האחוז
                    const percent = Math.round((typeCounts[dominantType] / myCellar.length) * 100);
                    
                    // הצגת הנתון (למשל: "60% Red")
                    const formattedType = dominantType.charAt(0).toUpperCase() + dominantType.slice(1);
                    document.getElementById('tp-vibe').textContent = `${percent}% ${formattedType}`;

                    // 3. היין האחרון שהתווסף
                    const lastWine = myCellar[myCellar.length - 1];
                    document.getElementById('tp-latest-match').textContent = lastWine.name || "Unknown Wine";

                } else {
                    document.getElementById('tp-total-wines').textContent = "0";
                    document.getElementById('tp-vibe').textContent = "No data yet";
                    document.getElementById('tp-latest-match').textContent = "Swipe to match!";
                }
            }
            // === סוף תוספת פרופיל הטעם ===

        } else {
            // -- משתמש לא מחובר --
            userArea.innerHTML = `<a class="btn btn-outline-gold" href="/login" style="color: #C68E58; border: 1px solid #C68E58; border-radius: 20px; padding: 5px 15px; text-decoration: none;">Login</a>`;
            
            if (getStartedBtn) {
                getStartedBtn.style.display = 'inline-block';
                getStartedBtn.href = '/login';
            }
        }
    };

    // פונקציות ניהול משתמשים (הרשמה והתחברות)
    const getUsers = () => JSON.parse(localStorage.getItem('winederUsers')) || [];
    const saveUser = (user) => {
        const users = getUsers();
        users.push(user);
        localStorage.setItem('winederUsers', JSON.stringify(users));
    };

    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (tabLogin && tabSignup) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active'); 
            tabSignup.classList.remove('active'); 
            loginForm.classList.add('active'); 
            signupForm.classList.remove('active');
        });

        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active'); 
            tabLogin.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const ageCheck = document.getElementById('age-check').checked;

            if (!firstName || !lastName || !email || !password || !ageCheck) {
                alert("Please fill all fields and confirm your age (18+).");
                return;
            }

            const users = getUsers();
            if (users.find(u => u.email === email)) {
                alert("Email already exists.");
                return;
            }

            saveUser({ firstName, lastName, email, password });
            // סימון המשתמש כמחובר מיד אחרי ההרשמה
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('currentUser', email);

            window.showSuccessModal(
                "Cheers! Account Created",
                "Welcome to Wineder! Let's find your perfect vintage."
            );

            signupForm.reset();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email').value.trim();
            const passwordInput = document.getElementById('login-password').value;

            const users = getUsers();
            const foundUser = users.find(u => u.email === emailInput && u.password === passwordInput);

            if (foundUser) {
                localStorage.setItem('firstName', foundUser.firstName);
                localStorage.setItem('lastName', foundUser.lastName);
                localStorage.setItem('currentUser', foundUser.email);
                window.showSuccessModal(
                    `Welcome back, ${foundUser.firstName}!`,
                    "Discover your next favorite vintage with a single swipe."
                );
            } else {
                alert("Invalid email or password.");
            }
        });
    }

    // --- אימות טופס אימייל מהיר (מתוך ה-Hero) ---
    const emailForm = document.getElementById('hero-email-form');
    const emailInput = document.getElementById('hero-email');
    const feedback = document.getElementById('email-feedback');

    if (emailForm) {
        emailForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const emailValue = emailInput.value;
            
            if (validateEmail(emailValue)) {
                feedback.classList.add('d-none');
                window.location.href = `/login?email=${encodeURIComponent(emailValue)}`;
            } else {
                feedback.classList.remove('d-none');
                emailInput.classList.add('is-invalid');
            }
        });

        emailInput.addEventListener('input', () => {
            emailInput.classList.remove('is-invalid');
            feedback.classList.add('d-none');
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    

    // קריאה לפונקציה שמעדכנת את המסך בסיום טעינת כל ההגדרות
    updateHeader();
});