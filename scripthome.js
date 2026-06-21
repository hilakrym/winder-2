// מוודא שכל העמוד סיים להיטען לפני שהקוד מתחיל לרוץ, כדי למנוע שגיאות בזיהוי אלמנטים.
document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. קוד חדש: ניהול אזור משתמש (תצוגת פרופיל מחובר / כפתור התחברות) ===
    const userArea = document.getElementById('userArea');
    const firstName = localStorage.getItem('firstName');

    if (userArea) {
        if (firstName) {
            // אם המשתמש מחובר - נציג את השם שלו, אייקון הגדרות לעריכה וכפתור התנתקות
            userArea.innerHTML = `
                <span class="me-3 fw-bold" style="color: #B76E79;">Hi, ${firstName}</span>
                <a href="edit-profile.html" class="text-secondary me-3" title="Edit Profile">
                    <i class="fas fa-cog fa-lg"></i>
                </a>
                <button class="btn btn-outline-danger btn-sm" onclick="logout()">Logout</button>
            `;
        } else {
            // אם המשתמש לא מחובר - נציג כפתור התחברות
            userArea.innerHTML = `
                <a href="login.html" class="btn btn-rose btn-sm shadow-sm">Login / Sign Up</a>
            `;
        }
    }


    // === 2. קוד קיים: טיפול בטופס ההרשמה המהיר מה-Hero ===
    const emailForm = document.getElementById('hero-email-form');
    const emailInput = document.getElementById('hero-email');
    const feedback = document.getElementById('email-feedback');

    // בדיקה אם הטופס קיים בדף הנוכחי (למניעת שגיאות הרצה בדפים אחרים)
    if (emailForm) {
        // האזנה לאירוע שליחת הטופס
        emailForm.addEventListener('submit', (e) => {
            e.preventDefault(); // מונע שליחה אוטומטית של הטופס

            const emailValue = emailInput.value;
            
            // בדיקת ולידציה לאימייל שהוזן
            if (validateEmail(emailValue)) {
                // אם האימייל תקין הסתרת הודעת השגיאה
                feedback.classList.add('d-none');
                // העברה לדף ההרשמה עם האימייל כפרמטר
                window.location.href = `login.html?email=${encodeURIComponent(emailValue)}`;
            } else {
                // אם האימייל לא תקין הצגת הודעת השגיאה וסימון השדה באדום
                feedback.classList.remove('d-none');
                emailInput.classList.add('is-invalid');
            }
        });

        // ניקוי סימני השגיאה בזמן שהמשתמש מקליד מחדש (הועבר אל תוך ה-if להגנה מפני שגיאות)
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                emailInput.classList.remove('is-invalid');
                feedback.classList.add('d-none');
            });
        }
    }

    // פונקציית עזר לבדיקת פורמט אימייל
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});