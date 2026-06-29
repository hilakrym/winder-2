console.log("Wineder Script Loaded");

// רשימת הנתונים שנשמרים בדפדפן עבור המשתמש המחובר
const WINEDER_STORAGE_KEYS = [
    'firstName',
    'lastName',
    'currentUser',
    'userId',
    'points',
    'level',
    'streak',
    'dailySwipesCount',
    'lastActiveDate',
    'winePreferences'
];

// ניקוי כל נתוני המשתמש מהדפדפן, למשל בהתנתקות או בהחלפת משתמש
window.clearWinederStorage = function () {
    WINEDER_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
};

// כמות הנקודות המינימלית הנדרשת לכל דרגה במערכת
const WINEDER_LEVEL_MILESTONES = [
    { points: 0, label: 'Casual Sipper' },
    { points: 100, label: 'Curious Taster' },
    { points: 170, label: 'Wine Lover' },
    { points: 300, label: 'Vintage Expert' },
    { points: 500, label: 'Master of Wine' }
];

// יצירת שם מחלקת CSS לפי שם הדרגה
window.getWinederLevelClass = function (level) {
    return 'level-' + String(level || 'Casual Sipper')
        .toLowerCase()
        .replaceAll(' ', '-');
};

// חישוב ההתקדמות של המשתמש בין הדרגה הנוכחית לדרגה הבאה
window.getWinederLevelProgress = function (points) {
    const currentPoints = Math.max(0, Number(points) || 0);
    const maxPoints = WINEDER_LEVEL_MILESTONES[WINEDER_LEVEL_MILESTONES.length - 1].points;

    const nextMilestone = WINEDER_LEVEL_MILESTONES.find(item => currentPoints < item.points);

    const currentMilestone = [...WINEDER_LEVEL_MILESTONES]
        .reverse()
        .find(item => currentPoints >= item.points) || WINEDER_LEVEL_MILESTONES[0];

    const segmentStart = currentMilestone.points;
    const segmentEnd = nextMilestone ? nextMilestone.points : maxPoints;
    const segmentSize = Math.max(segmentEnd - segmentStart, 1);

    const percent = nextMilestone
        ? Math.min(((currentPoints - segmentStart) / segmentSize) * 100, 100)
        : 100;

    return {
        currentPoints,
        maxPoints,
        segmentStart,
        segmentEnd,
        percent,
        currentLevel: currentMilestone.label,
        nextLevel: nextMilestone ? nextMilestone.label : 'Master of Wine',
        nextTarget: nextMilestone ? nextMilestone.points : maxPoints,
        pointsToNext: nextMilestone ? nextMilestone.points - currentPoints : 0,
        isMaxLevel: !nextMilestone
    };
};

// בניית ה-HTML של פס ההתקדמות שמוצג בתפריט העליון
window.buildWinederLevelProgressHtml = function (points) {
    const progress = window.getWinederLevelProgress(points);

    const nextText = progress.isMaxLevel
        ? 'Max level reached · 500 pts'
        : `${progress.pointsToNext} pts to ${progress.nextLevel}`;

    return `
        <div class="level-progress-card" aria-label="Level progress">
            <div class="level-progress-text">
                <span>Next level</span>
                <strong id="level-next-text">${nextText}</strong>
            </div>
            <div class="level-scale-track">
                <div id="level-scale-fill" class="level-scale-fill" style="width: ${progress.percent}%;"></div>
            </div>
            <div class="level-scale-values">
                <span id="level-scale-start">${progress.segmentStart}</span>
                <span id="level-scale-end">${progress.segmentEnd}</span>
            </div>
        </div>
    `;
};

// עדכון פס ההתקדמות לאחר שינוי בניקוד, בלי לרענן את העמוד
window.updateWinederLevelProgress = function (points) {
    const progress = window.getWinederLevelProgress(points);

    const fillEl = document.getElementById('level-scale-fill');
    const textEl = document.getElementById('level-next-text');
    const startEl = document.getElementById('level-scale-start');
    const endEl = document.getElementById('level-scale-end');

    if (fillEl) fillEl.style.width = `${progress.percent}%`;

    if (textEl) {
        textEl.textContent = progress.isMaxLevel
            ? 'Max level reached · 500 pts'
            : `${progress.pointsToNext} pts to ${progress.nextLevel}`;
    }

    if (startEl) startEl.textContent = progress.segmentStart;
    if (endEl) endEl.textContent = progress.segmentEnd;

    // עדכון צבע תיבת הגיימיפיקציה לפי הדרגה הנוכחית
    if (window.applyWinederLevelPanelStyle) {
        window.applyWinederLevelPanelStyle(progress.currentLevel);
    }
};

// החלת צבע ועיצוב על תג הדרגה לפי הדרגה הנוכחית
window.applyWinederLevelStyle = function (levelEl, level) {
    if (!levelEl) return;

    const levelClassNames = WINEDER_LEVEL_MILESTONES.map(item => window.getWinederLevelClass(item.label));

    levelEl.classList.add('level-badge');
    levelEl.classList.remove(...levelClassNames);
    levelEl.classList.add(window.getWinederLevelClass(level));
};

// יצירת שם מחלקת CSS עבור תיבת הגיימיפיקציה כולה
window.getWinederLevelPanelClass = function (level) {
    return 'level-panel-' + String(level || 'Casual Sipper')
        .toLowerCase()
        .replaceAll(' ', '-');
};

// שינוי צבע תיבת הגיימיפיקציה לפי הדרגה הנוכחית
window.applyWinederLevelPanelStyle = function (level) {
    const panel = document.querySelector('.gamification-panel');
    if (!panel) return;

    const panelClassNames = WINEDER_LEVEL_MILESTONES.map(item => window.getWinederLevelPanelClass(item.label));

    panel.classList.remove(...panelClassNames);
    panel.classList.add(window.getWinederLevelPanelClass(level));
};


//  פונקציות כלליות שמשמשות כמה עמודים 

// התנתקות: ניקוי נתוני המשתמש וחזרה לעמוד הבית
window.logout = function () {
    window.clearWinederStorage();
    window.location.href = '/';
};

// הצגת חלונית הצלחה לאחר התחברות או הרשמה
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

// מעבר לארנה לאחר סגירת הודעת הצלחה
window.redirectToindex = function () {
    window.location.href = '/arena';
};

// סגירת חלונית ההתחברות
window.closeModal = function () {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
};

// בדיקת הרשאה לעמודים שדורשים משתמש מחובר
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


//  פעולות שמופעלות כשהעמוד נטען 

document.addEventListener('DOMContentLoaded', () => {

    // עדכון אזור המשתמש בתפריט לפי מצב התחברות
    const updateHeader = () => {
        const userArea = document.getElementById('userArea');
        const getStartedBtn = document.getElementById('getStartedBtn');

        if (!userArea) return;

        const firstName = localStorage.getItem('firstName');

        if (firstName) {
            // שליפת נתוני הגיימיפיקציה שנשמרו בדפדפן
            const points = localStorage.getItem('points') || 0;
            const streak = localStorage.getItem('streak') || 0;
            const level = localStorage.getItem('level') || 'Casual Sipper';

            // בניית תפריט למשתמש מחובר
            userArea.innerHTML = `
                <div class="gamification-panel ${window.getWinederLevelPanelClass(level)} d-none d-md-flex align-items-center me-3 px-4 py-2 shadow-sm">
                    <div class="gamification-main-row">
                        <span class="me-4" title="Points">
                            <i class="fas fa-star fa-lg me-1" style="color: #C68E58;"></i> 
                            <span style="font-size: 0.85rem; color:#888; font-weight: 600; text-transform: uppercase;">Points:</span> 
                            <span id="nav-points" class="fw-bold fs-5" style="color: #333;">${points}</span>
                        </span>
                        <span class="me-4" title="Daily Streak">
                            <i class="fas fa-fire fa-lg me-1" style="color: #ff4b4b;"></i> 
                            <span style="font-size: 0.85rem; color:#888; font-weight: 600; text-transform: uppercase;">Streak:</span> 
                            <span id="nav-streak" class="fw-bold fs-5" style="color: #333;">${streak}</span>
                        </span>
                        <span class="fw-bold fs-5" style="color: #B76E79;" title="Level">
                            <i class="fas fa-award fa-lg me-1"></i> 
                            <span id="nav-level" class="level-badge level-${window.getWinederLevelClass(level).replace('level-', '')}">${level}</span>
                        </span>
                    </div>
                    ${window.buildWinederLevelProgressHtml(points)}
                </div>

                <span class="me-3 fw-bold fs-5" style="color: #B76E79;">Hi, ${firstName}</span>
                <a href="/edit-profile" class="text-secondary me-3" title="Edit Profile">
                    <i class="fas fa-cog fa-2x"></i>
                </a>
                <button class="btn btn-outline-danger" onclick="logout()">Logout</button>
            `;

            // אם המשתמש מחובר, מסתירים את כפתור ההתחלה בעמוד הבית
            if (getStartedBtn) {
                getStartedBtn.style.display = 'none';
            }

            updateTasteProfileSection();

        } else {
            // תפריט עבור משתמש לא מחובר
            userArea.innerHTML = `
                <a href="/login" class="btn btn-rose btn-sm shadow-sm">Login / Sign Up</a>
            `;

            if (getStartedBtn) {
                getStartedBtn.style.display = 'inline-block';
                getStartedBtn.href = '/login';
            }
        }
    };

    // עדכון אזור פרופיל הטעם בעמוד הבית עבור משתמש מחובר
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
            // שליפת המרתף של המשתמש כדי לחשב תקציר אישי
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
                // ספירת סוגי היין כדי לזהות את סוג היין הדומיננטי של המשתמש
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

                // הצגת היין האחרון שנוסף למרתף
                const lastWine = myCellar[myCellar.length - 1];
                if (latestMatchEl) latestMatchEl.textContent = lastWine.name || "Unknown Wine";

            } else {
                // מצב שבו המשתמש עדיין לא הוסיף יינות למרתף
                if (totalWinesEl) totalWinesEl.textContent = "0";
                if (vibeEl) vibeEl.textContent = "No data yet";
                if (latestMatchEl) latestMatchEl.textContent = "Swipe to match!";
            }

        } catch (error) {
            console.log("Error loading taste profile:", error);
        }
    };

    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // מעבר בין טופס התחברות לטופס הרשמה
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

    // טיפול בטופס הרשמה
    if (signupForm) {
        // הודעות שיוצגו אם המשתמש לא בחר העדפות יין
        const preferenceValidationMessages = {
            'wine-color': 'Please choose at least one preferred wine color.',
            sweetness: 'Please choose at least one sweetness level.'
        };

        // שליפת כל האפשרויות מתוך קבוצת העדפות מסוימת
        const getPreferenceInputs = (groupName) => {
            return Array.from(document.querySelectorAll(`input[name="${groupName}"]`));
        };

        // בדיקה שבכל קבוצת העדפות נבחרה לפחות אפשרות אחת
        const validatePreferenceGroup = (groupName, shouldReport = false) => {
            const inputs = getPreferenceInputs(groupName);
            const firstInput = inputs[0];

            if (!firstInput) return true;

            const hasSelection = inputs.some(input => input.checked);

            firstInput.setCustomValidity(hasSelection ? '' : preferenceValidationMessages[groupName]);

            if (!hasSelection && shouldReport) {
                firstInput.focus();
                firstInput.reportValidity();
            }

            return hasSelection;
        };

        // ניהול בחירת העדפות:
        // אם בוחרים All - כל שאר האפשרויות מתבטלות.
        // אם בוחרים אפשרות רגילה - All מתבטל.
        // בנוסף, מותר לבחור עד 2 אפשרויות רגילות בלבד.
        const setupPreferenceSelectionRules = (groupName) => {
            const inputs = getPreferenceInputs(groupName);
            const allInput = inputs.find(input => input.value === 'all');
            const regularInputs = inputs.filter(input => input.value !== 'all');

            inputs.forEach(input => {
                input.addEventListener('change', () => {

                    // אם המשתמש בחר All
                    if (input === allInput && input.checked) {
                        regularInputs.forEach(option => option.checked = false);
                    }

                    // אם המשתמש בחר אפשרות רגילה
                    if (input !== allInput && input.checked) {
                        if (allInput) allInput.checked = false;

                        const selectedRegular = regularInputs.filter(option => option.checked);

                        if (selectedRegular.length > 2) {
                            input.checked = false;
                            alert("You can choose up to 2 options, or choose All.");
                        }
                    }

                    validatePreferenceGroup(groupName);
                });
            });
        };

        // הפעלת חוקי הבחירה על שתי קבוצות ההעדפות
        setupPreferenceSelectionRules('wine-color');
        setupPreferenceSelectionRules('sweetness');

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // בדיקת תקינות שדות רגילים בטופס
            if (!signupForm.checkValidity()) {
                signupForm.reportValidity();
                return;
            }

            // בדיקת בחירת העדפות יין
            if (!validatePreferenceGroup('wine-color', true)) return;
            if (!validatePreferenceGroup('sweetness', true)) return;

            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;

            const winePreferences = [];

            const selectedColors = Array.from(document.querySelectorAll('input[name="wine-color"]:checked'))
                .map(input => input.value);

            const selectedSweetness = Array.from(document.querySelectorAll('input[name="sweetness"]:checked'))
                .map(input => input.value);

            selectedColors.forEach(value => winePreferences.push(value));
            selectedSweetness.forEach(value => winePreferences.push(value));

            try {
                // שליחת פרטי ההרשמה לשרת
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

                // שמירת נתוני המשתמש החדש בדפדפן
                window.clearWinederStorage();
                localStorage.setItem('firstName', data.user.firstName);
                localStorage.setItem('lastName', data.user.lastName || '');
                localStorage.setItem('currentUser', data.user.email);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('points', data.user.points);
                localStorage.setItem('level', data.user.level);
                localStorage.setItem('streak', data.user.streak);
                localStorage.setItem('dailySwipesCount', data.user.dailySwipesCount || 0);
                localStorage.setItem('lastActiveDate', data.user.lastActiveDate || '');
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

    // טיפול בטופס התחברות
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('login-email').value.trim();
            const passwordInput = document.getElementById('login-password').value;

            try {
                // שליחת פרטי ההתחברות לשרת
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

                // שמירת נתוני המשתמש המחובר בדפדפן
                window.clearWinederStorage();
                localStorage.setItem('firstName', data.user.firstName);
                localStorage.setItem('lastName', data.user.lastName || '');
                localStorage.setItem('currentUser', data.user.email);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('points', data.user.points);
                localStorage.setItem('level', data.user.level);
                localStorage.setItem('streak', data.user.streak);
                localStorage.setItem('dailySwipesCount', data.user.dailySwipesCount || 0);
                localStorage.setItem('lastActiveDate', data.user.lastActiveDate || '');
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

    const emailForm = document.getElementById('hero-email-form');
    const emailInput = document.getElementById('hero-email');
    const feedback = document.getElementById('email-feedback');

    // טיפול בטופס המייל הקטן בעמוד הבית
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

        // הסרת סימון שגיאה כשהמשתמש מתחיל להקליד מחדש
        emailInput.addEventListener('input', () => {
            emailInput.classList.remove('is-invalid');
            feedback.classList.add('d-none');
        });
    }

    // בדיקה בסיסית שהמייל נראה במבנה תקין
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // הפעלת עדכון התפריט אחרי טעינת העמוד
    updateHeader();
});