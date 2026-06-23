document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    const currentFirstName = localStorage.getItem('firstName');
    const currentLastName = localStorage.getItem('lastName'); // שולף שם משפחה אם קיים

    if (!currentUser) {
        window.location.href = '/login';
        return;
    }

    const editForm = document.getElementById('editProfileForm');
    const emailInput = document.getElementById('editEmail');
    const firstNameInput = document.getElementById('editFirstName');
    const lastNameInput = document.getElementById('editLastName'); // תפיסת השדה החדש
    const passwordInput = document.getElementById('editPassword');
    const saveBtn = document.getElementById('saveBtn');
    const successModal = document.getElementById('editSuccessModal');
    const prefCheckboxes = document.querySelectorAll('.wine-pref');

    let initialState = {};

    // הזרקת הנתונים הקיימים לשדות
    if (emailInput) emailInput.value = currentUser;
    if (firstNameInput) firstNameInput.value = currentFirstName || '';
    if (lastNameInput) lastNameInput.value = localStorage.getItem('lastName') || '';
    if (passwordInput) passwordInput.value = localStorage.getItem('currentPassword') || '123456';

    const savedPrefs = JSON.parse(localStorage.getItem(`prefs_${currentUser}`)) || [];
    prefCheckboxes.forEach(checkbox => {
        if (savedPrefs.includes(checkbox.value)) {
            checkbox.checked = true;
        }
    });

    function getFormState() {
        const prefs = [];
        prefCheckboxes.forEach(cb => { if (cb.checked) prefs.push(cb.value); });
        return {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput ? lastNameInput.value.trim() : '', // קריאת שם המשפחה
            email: emailInput.value.trim(),
            password: passwordInput.value,
            preferences: prefs.sort().join(',')
        };
    }

    initialState = getFormState();

    function checkChanges() {
        const currentState = getFormState();
        const hasChanged = JSON.stringify(currentState) !== JSON.stringify(initialState);
        
        if (hasChanged) {
            saveBtn.classList.remove('d-none');
        } else {
            saveBtn.classList.add('d-none');
        }
    }

    if (editForm) {
        editForm.addEventListener('input', checkChanges);
        editForm.addEventListener('change', checkChanges);
        
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            if (firstNameInput.value.trim() === '') {
                firstNameInput.classList.add('is-invalid');
                isValid = false;
            } else {
                firstNameInput.classList.remove('is-invalid');
            }

            const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailReg.test(emailInput.value.trim())) {
                emailInput.classList.add('is-invalid');
                isValid = false;
            } else {
                emailInput.classList.remove('is-invalid');
            }

            if (passwordInput.value.length < 6) {
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else {
                passwordInput.classList.remove('is-invalid');
            }

            // אם הכל תקין - שומרים!
            if (isValid) {
                const newEmail = emailInput.value.trim();
                const oldEmail = currentUser;

                // עדכון שמות וסיסמה
                localStorage.setItem('firstName', firstNameInput.value.trim());
                if (lastNameInput) localStorage.setItem('lastName', lastNameInput.value.trim());
                localStorage.setItem('currentPassword', passwordInput.value);

                // שמירת העדפות יין
                const currentPrefs = [];
                prefCheckboxes.forEach(cb => { if (cb.checked) currentPrefs.push(cb.value); });
                localStorage.setItem(`prefs_${newEmail}`, JSON.stringify(currentPrefs));

                // --- לוגיקת העברת מרתף למקרה של שינוי אימייל ---
                if (newEmail !== oldEmail) {
                    localStorage.setItem('currentUser', newEmail);
                    
                    const oldCellarData = localStorage.getItem(`cellar_${oldEmail}`);
                    if (oldCellarData) {
                        localStorage.setItem(`cellar_${newEmail}`, oldCellarData);
                        localStorage.removeItem(`cellar_${oldEmail}`);
                    }
                    localStorage.removeItem(`prefs_${oldEmail}`);
                }

                initialState = getFormState();
                saveBtn.classList.add('d-none');
                
                if (successModal) successModal.style.display = 'flex';
            }
        });
    }

    // ניקוי סימוני השגיאה בזמן הקלדה
    const inputs = [firstNameInput, lastNameInput, emailInput, passwordInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => input.classList.remove('is-invalid'));
        }
    });

    // כפתור העין לסיסמה
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = togglePasswordBtn.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
});