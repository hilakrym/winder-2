document.addEventListener('DOMContentLoaded', () => {
    // בדיקה שמשתמש אכן מחובר למערכת
    const currentUser = localStorage.getItem('currentUser');
    const currentFirstName = localStorage.getItem('firstName');

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // תפיסת אלמנטים מהטופס
    const editForm = document.getElementById('editProfileForm');
    const emailInput = document.getElementById('editEmail');
    const firstNameInput = document.getElementById('editFirstName');
    const passwordInput = document.getElementById('editPassword');
    const saveBtn = document.getElementById('saveBtn');
    const successModal = document.getElementById('editSuccessModal');
    const prefCheckboxes = document.querySelectorAll('.wine-pref');

    // משתנה שישמור את המצב ההתחלתי של הטופס לצורך השוואה
    let initialState = {};

    // טעינת הנתונים הקיימים מה-localStorage לתוך השדות
    if (emailInput) emailInput.value = currentUser;
    if (firstNameInput) firstNameInput.value = currentFirstName || '';
    if (passwordInput) passwordInput.value = localStorage.getItem('currentPassword') || '123456'; // סיסמת ברירת מחדל לטעינה אם לא נשמרה

    // טעינת העדפות היין השמורות (אם קיימות בזיכרון)
    const savedPrefs = JSON.parse(localStorage.getItem(`prefs_${currentUser}`)) || [];
    prefCheckboxes.forEach(checkbox => {
        if (savedPrefs.includes(checkbox.value)) {
            checkbox.checked = true;
        }
    });

    // פונקציה שמקבלת את המצב הנוכחי המלא של כל השדות בטופס
    function getFormState() {
        const prefs = [];
        prefCheckboxes.forEach(cb => {
            if (cb.checked) prefs.push(cb.value);
        });

        return {
            firstName: firstNameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            preferences: prefs.sort().join(',') // מיון כדי שהסדר לא ישפיע על ההשוואה
        };
    }

    // שמירת המצב ההתחלתי מיד לאחר מילוי השדות
    initialState = getFormState();

    // פונקציה שבודקת האם חל שינוי כלשהו בטופס ומציגה/מחביאה את כפתור השמירה
    function checkChanges() {
        const currentState = getFormState();
        
        const hasChanged = 
            currentState.firstName !== initialState.firstName ||
            currentState.email !== initialState.email ||
            currentState.password !== initialState.password ||
            currentState.preferences !== initialState.preferences;

        if (hasChanged) {
            saveBtn.classList.remove('d-none'); // הצגת כפתור השמירה
        } else {
            saveBtn.classList.add('d-none'); // הסתרת כפתור השמירה
        }
    }

    // האזנה לכל שינוי או הקלדה בטופס כדי לבדוק אם להציג את כפתור השמירה
    if (editForm) {
        editForm.addEventListener('input', checkChanges);
        editForm.addEventListener('change', checkChanges);
    }

    // טיפול באירוע שליחת הטופס ושמירת הנתונים המעודכנים
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;

            // ולידציה לשם פרטי
            if (firstNameInput.value.trim() === '') {
                firstNameInput.classList.add('is-invalid');
                isValid = false;
            } else {
                firstNameInput.classList.remove('is-invalid');
            }

            // ולידציה לאימייל
            const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailReg.test(emailInput.value.trim())) {
                emailInput.classList.add('is-invalid');
                isValid = false;
            } else {
                emailInput.classList.remove('is-invalid');
            }

            // ולידציה לסיסמה
            if (passwordInput.value.length < 6) {
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else {
                passwordInput.classList.remove('is-invalid');
            }

            // אם כל השדות תקינים, מבצעים את השמירה ב-localStorage
            if (isValid) {
                const newEmail = emailInput.value.trim();
                const oldEmail = currentUser;

                // עדכון פרטי המשתמש הכלליים
                localStorage.setItem('firstName', firstNameInput.value.trim());
                localStorage.setItem('currentUser', newEmail);
                localStorage.setItem('currentPassword', passwordInput.value);

                // שמירת העדפות היין החדשות
                const currentPrefs = [];
                prefCheckboxes.forEach(cb => {
                    if (cb.checked) currentPrefs.push(cb.value);
                });
                localStorage.setItem(`prefs_${newEmail}`, JSON.stringify(currentPrefs));

                // הגנה על מרתף היינות: במידה והאימייל שונה, מעבירים את תוכן המרתף למפתח החדש
                if (oldEmail !== newEmail) {
                    const oldCellarData = localStorage.getItem(`cellar_${oldEmail}`);
                    if (oldCellarData) {
                        localStorage.setItem(`cellar_${newEmail}`, oldCellarData);
                        localStorage.removeItem(`cellar_${oldEmail}`); // מחיקת המרתף הישן למניעת כפילויות
                    }
                    // מחיקת העדפות היין תחת האימייל הישן
                    localStorage.removeItem(`prefs_${oldEmail}`);
                }

                // עדכון המצב ההתחלתי למצב החדש והסתרת כפתור השמירה
                initialState = getFormState();
                saveBtn.classList.add('d-none');

                // הצגת חלון ההצלחה הקופץ
                if (successModal) {
                    successModal.style.display = 'flex';
                }
            }
        });
    }

    // ניקוי סימוני השגיאה האדומים בזמן שהמשתמש מתקן ומקליד
    const inputs = [firstNameInput, emailInput, passwordInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                input.classList.remove('is-invalid');
            });
        }
    });
    // תפיסת כפתור העין ושדה הסיסמה מהטופס
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInputEl = document.getElementById('editPassword');

    // מוודא שהאלמנטים אכן קיימים בעמוד לפני שמפעילים עליהם פעולות
    if (togglePasswordBtn && passwordInputEl) {
        // האזנה ללחיצה על כפתור העין
        togglePasswordBtn.addEventListener('click', () => {
            // בדיקה האם סוג השדה הנוכחי הוא סיסמה (נסתר) או טקסט (גלוי)
            const type = passwordInputEl.getAttribute('type') === 'password' ? 'text' : 'password';
            
            // שינוי סוג השדה בהתאם למצב שגילינו
            passwordInputEl.setAttribute('type', type);
            
            // מציאת האייקון בתוך הכפתור
            const icon = togglePasswordBtn.querySelector('i');
            
            // החלפת האייקון מעין פתוחה לעין סגורה עם קו עליה, ולהפך
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
});