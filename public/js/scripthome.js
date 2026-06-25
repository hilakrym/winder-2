// פונקציות גיבוי למקרה שהקובץ נטען בלי קובץ ההתחברות.
if (!window.getWinederLevelClass) {
    window.getWinederLevelClass = function (level) {
        return 'level-' + String(level || 'Casual Sipper').toLowerCase().replaceAll(' ', '-');
    };
}

if (!window.getWinederLevelPanelClass) {
    window.getWinederLevelPanelClass = function (level) {
        return 'level-panel-' + String(level || 'Casual Sipper').toLowerCase().replaceAll(' ', '-');
    };
}

if (!window.buildWinederLevelProgressHtml) {
    window.buildWinederLevelProgressHtml = function (points) {
        const currentPoints = Math.max(0, Number(points) || 0);
        const milestones = [
            { points: 0, label: 'Casual Sipper' },
            { points: 100, label: 'Curious Taster' },
            { points: 170, label: 'Wine Lover' },
            { points: 300, label: 'Vintage Expert' },
            { points: 500, label: 'Master of Wine' }
        ];
        const nextMilestone = milestones.find(item => currentPoints < item.points);
        const currentMilestone = [...milestones].reverse().find(item => currentPoints >= item.points) || milestones[0];
        const segmentStart = currentMilestone.points;
        const segmentEnd = nextMilestone ? nextMilestone.points : 500;
        const segmentSize = Math.max(segmentEnd - segmentStart, 1);
        const percent = nextMilestone ? Math.min(((currentPoints - segmentStart) / segmentSize) * 100, 100) : 100;
        const nextText = nextMilestone
            ? `${nextMilestone.points - currentPoints} pts to ${nextMilestone.label}`
            : 'Max level reached · 500 pts';

        return `
            <div class="level-progress-card" aria-label="Level progress">
                <div class="level-progress-text">
                    <span>Next level</span>
                    <strong id="level-next-text">${nextText}</strong>
                </div>
                <div class="level-scale-track">
                    <div id="level-scale-fill" class="level-scale-fill" style="width: ${percent}%;"></div>
                </div>
                <div class="level-scale-values">
                    <span id="level-scale-start">${segmentStart}</span>
                    <span id="level-scale-end">${segmentEnd}</span>
                </div>
            </div>
        `;
    };
}

// מוודא שכל העמוד סיים להיטען לפני שהקוד מתחיל לרוץ, כדי למנוע שגיאות בזיהוי אלמנטים.
document.addEventListener('DOMContentLoaded', () => {
    
    // ניהול אזור המשתמש בתפריט: פרטי משתמש מחובר או כפתור התחברות.
    const userArea = document.getElementById('userArea');
    const firstName = localStorage.getItem('firstName');

    if (userArea) {
        if (firstName) {
            // משיכת נתוני הניקוד והדרגה מהשמירה המקומית
            const points = localStorage.getItem('points') || 0;
            const streak = localStorage.getItem('streak') || 0;
            const level = localStorage.getItem('level') || 'Casual Sipper';

            // אם המשתמש מחובר, מציגים ניקוד, דרגה, שם, עריכת פרופיל ויציאה
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
                            <i class="fas fa-award fa-lg me-1"></i> <span id="nav-level" class="level-badge level-${window.getWinederLevelClass(level).replace('level-', '')}">${level}</span>
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
        } else {
            // אם אין משתמש מחובר, מציגים רק כפתור התחברות
            userArea.innerHTML = `
                <a href="/login" class="btn btn-rose btn-sm shadow-sm">Login / Sign Up</a>
            `;
        }
    }

    // טיפול בטופס המייל הקצר שמופיע בעמוד הבית.
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

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                emailInput.classList.remove('is-invalid');
                feedback.classList.add('d-none');
            });
        }
    }

    // בדיקה בסיסית שמבנה כתובת המייל תקין
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});