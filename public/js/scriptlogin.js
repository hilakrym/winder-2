console.log("Wineder Script Loaded");




// -------------------- פונקציות גלובליות --------------------


// התנתקות
window.logout = function () {
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('points');
    localStorage.removeItem('level');
    localStorage.removeItem('streak');
    localStorage.removeItem('winePreferences');


    window.location.href = '/';
};




// הצגת הודעת הצלחה בחלון קופץ
window.showSuccessModal = function (title, message) {
    const modal = document.getElementById('successModal');
    const titleLabel = document.getElementById('successTitle');
    const msgLabel = document.getElementById('successMessage');


    if (modal) {
        if (titleLabel) titleLabel.innerText = title;
        if (msgLabel) msgLabel.innerText = message;
        modal.style.display = 'flex';
    }
};




// מעבר ל-Arena אחרי התחברות / הרשמה
window.redirectToindex = function () {
    window.location.href = '/arena';
};




// סגירת חלון התחברות
window.closeModal = function () {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
};




// בדיקת גישה לעמודים מוגנים
window.checkAccess = function (event, page) {
    event.preventDefault();


    if (!localStorage.getItem('firstName')) {
        const modal = document.getElementById('loginModal');


        if (modal) {
            modal.style.display = 'flex';
        } else {
            window.location.href = '/login';
        }
    } else {
        window.location.href = page;
    }
};




// -------------------- פעולות בטעינת עמוד --------------------


document.addEventListener('DOMContentLoaded', () => {


    // עדכון התפריט לפי מצב התחברות
    const updateHeader = () => {
        const userArea = document.getElementById('userArea');
        const getStartedBtn = document.getElementById('getStartedBtn');


        if (!userArea) return;


        const firstName = localStorage.getItem('firstName');


        if (firstName) {
            userArea.innerHTML = `
                <span class="me-3 fw-bold" style="color: #B76E79;">Hi, ${firstName}</span>
                <a href="/edit-profile" class="text-secondary me-3" title="Edit Profile">
                    <i class="fas fa-cog fa-lg"></i>
                </a>
                <button class="btn btn-outline-danger btn-sm" onclick="logout()">Logout</button>
            `;


            if (getStartedBtn) {
                getStartedBtn.style.display = 'none';
            }


            updateTasteProfileSection();


        } else {
            userArea.innerHTML = `
                <a href="/login" class="btn btn-rose btn-sm shadow-sm">Login / Sign Up</a>
            `;


            if (getStartedBtn) {
                getStartedBtn.style.display = 'inline-block';
                getStartedBtn.href = '/login';
            }
        }
    };




    // עדכון אזור Taste Profile בעמוד הבית
    const updateTasteProfileSection = async () => {
        const tasteProfileSection = document.getElementById('taste-profile-section');


        if (!tasteProfileSection) return;


        const firstName = localStorage.getItem('firstName');
        const currentUser = localStorage.getItem('currentUser');


        const heroTitle = document.querySelector('.hero-text h1');
        const heroSubtitle = document.querySelector('.hero-text p.lead');


        if (heroTitle) heroTitle.textContent = `Welcome back, ${firstName}!`;
        if (heroSubtitle) {
            heroSubtitle.textContent = "Your personalized wine journey continues here. Check out your current taste profile below:";
        }


        tasteProfileSection.classList.remove('d-none');


        try {
            const response = await fetch(`/cellar/${encodeURIComponent(currentUser)}`);
            const myCellar = await response.json();


            if (!response.ok) {
                console.log("Could not load taste profile cellar.");
                return;
            }


            const totalWinesEl = document.getElementById('tp-total-wines');
            const vibeEl = document.getElementById('tp-vibe');
            const latestMatchEl = document.getElementById('tp-latest-match');


            if (totalWinesEl) totalWinesEl.textContent = myCellar.length;


            if (myCellar.length > 0) {
                const typeCounts = myCellar.reduce((acc, wine) => {
                    const type = (wine.type || "unknown").toLowerCase().replace('é', 'e');
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {});


                const dominantType = Object.keys(typeCounts).reduce((a, b) =>
                    typeCounts[a] > typeCounts[b] ? a : b
                );


                const percent = Math.round((typeCounts[dominantType] / myCellar.length) * 100);
                const formattedType = dominantType.charAt(0).toUpperCase() + dominantType.slice(1);


                if (vibeEl) vibeEl.textContent = `${percent}% ${formattedType}`;


                const lastWine = myCellar[myCellar.length - 1];
                if (latestMatchEl) latestMatchEl.textContent = lastWine.name || "Unknown Wine";


            } else {
                if (totalWinesEl) totalWinesEl.textContent = "0";
                if (vibeEl) vibeEl.textContent = "No data yet";
                if (latestMatchEl) latestMatchEl.textContent = "Swipe to match!";
            }


        } catch (error) {
            console.log("Error loading taste profile:", error);
        }
    };




    // טאבים של Login / Sign Up
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');


    if (tabLogin && tabSignup && loginForm && signupForm) {
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




    // הרשמה מול MySQL דרך Express
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();


            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const ageCheck = document.getElementById('age-check').checked;


            const winePreferences = [];


            document.querySelectorAll('input[name="wine-color"]:checked').forEach(input => {
                winePreferences.push(input.value);
            });


            document.querySelectorAll('input[name="sweetness"]:checked').forEach(input => {
                winePreferences.push(input.value);
            });


            if (!firstName || !lastName || !email || !password || !ageCheck) {
                alert("Please fill all fields and confirm your age (18+).");
                return;
            }


            try {
                const response = await fetch("/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password,
                        winePreferences
                    })
                });


                const data = await response.json();


                if (!response.ok) {
                    alert(data.message || "Signup failed.");
                    return;
                }


                localStorage.setItem('firstName', data.user.firstName);
                localStorage.setItem('lastName', data.user.lastName || '');
                localStorage.setItem('currentUser', data.user.email);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('points', data.user.points);
                localStorage.setItem('level', data.user.level);
                localStorage.setItem('streak', data.user.streak);
                localStorage.setItem('winePreferences', data.user.winePreferences || '');


                window.showSuccessModal(
                    "Cheers! Account Created",
                    "Welcome to Wineder! Let's find your perfect vintage."
                );


                signupForm.reset();


            } catch (error) {
                console.log("Signup error:", error);
                alert("Something went wrong. Please try again.");
            }
        });
    }




    // התחברות מול MySQL דרך Express
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();


            const emailInput = document.getElementById('login-email').value.trim();
            const passwordInput = document.getElementById('login-password').value;


            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: emailInput,
                        password: passwordInput
                    })
                });


                const data = await response.json();


                if (!response.ok) {
                    alert(data.message || "Invalid email or password.");
                    return;
                }


                localStorage.setItem('firstName', data.user.firstName);
                localStorage.setItem('lastName', data.user.lastName || '');
                localStorage.setItem('currentUser', data.user.email);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('points', data.user.points);
                localStorage.setItem('level', data.user.level);
                localStorage.setItem('streak', data.user.streak);
                localStorage.setItem('winePreferences', data.user.winePreferences || '');


                window.showSuccessModal(
                    `Welcome back, ${data.user.firstName}!`,
                    "Discover your next favorite vintage with a single swipe."
                );


            } catch (error) {
                console.log("Login error:", error);
                alert("Something went wrong. Please try again.");
            }
        });
    }




    // אימות טופס אימייל מהיר מתוך ה-Hero
    const emailForm = document.getElementById('hero-email-form');
    const emailInput = document.getElementById('hero-email');
    const feedback = document.getElementById('email-feedback');


    if (emailForm && emailInput && feedback) {
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




    updateHeader();
});




