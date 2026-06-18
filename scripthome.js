// מוודא שכל העמוד סיים להיטען לפני שהקוד מתחיל לרוץ, כדי למנוע שגיאות בזיהוי אלמנטים.
document.addEventListener('DOMContentLoaded', () => {
    // בחירת אלמנטים מהתפריט ניווט-HTML עבור טופס ההרשמה המהיר שב
    const emailForm = document.getElementById('hero-email-form');
    const emailInput = document.getElementById('hero-email');
    const feedback = document.getElementById('email-feedback');

    // בדיקה אם הטופס קיים בדף הנוכחי (למניעת שגיאות הרצה בדפים אחרים)
    if (emailForm) {
        // האזנה לאירוע שליחת הטופס
        emailForm.addEventListener('submit', (e) => {
            e.preventDefault(); //  מונע שליחה אוטומטית של הטופס

            const emailValue = emailInput.value;
            
            //  בדיקת ולידציה לאימייל שהוזן
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
    }

    // פונקציית עזר לבדיקת פורמט אימייל
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // ניקוי סימני השגיאה בזמן שהמשתמש מקליד מחדש, כדי לשפר את חווית השימוש
    emailInput.addEventListener('input', () => {
        emailInput.classList.remove('is-invalid');
        feedback.classList.add('d-none');
    });
});