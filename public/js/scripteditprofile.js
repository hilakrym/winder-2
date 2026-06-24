document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = localStorage.getItem('currentUser');


    if (!currentUser) {
        window.location.href = '/login';
        return;
    }


    const editForm = document.getElementById('editProfileForm');
    const emailInput = document.getElementById('editEmail');
    const firstNameInput = document.getElementById('editFirstName');
    const lastNameInput = document.getElementById('editLastName');
    const passwordInput = document.getElementById('editPassword');
    const saveBtn = document.getElementById('saveBtn');
    const successModal = document.getElementById('editSuccessModal');
    const prefCheckboxes = document.querySelectorAll('.wine-pref');


    let initialState = {};


    const loadProfileFromServer = async () => {
        try {
            const response = await fetch(`/profile/${encodeURIComponent(currentUser)}`);
            const user = await response.json();


            if (!response.ok) {
                alert(user.message || "Could not load profile.");
                window.location.href = '/';
                return;
            }


            emailInput.value = user.email;
            firstNameInput.value = user.firstName || '';
            lastNameInput.value = user.lastName || '';
            passwordInput.value = user.password || '';


            const savedPrefs = user.wine_preferences
                ? user.wine_preferences.split(",")
                : [];


            prefCheckboxes.forEach(checkbox => {
                checkbox.checked = savedPrefs.includes(checkbox.value);
            });


            initialState = getFormState();


        } catch (error) {
            console.log("Error loading profile:", error);
            alert("Something went wrong while loading profile.");
        }
    };


    function getFormState() {
        const prefs = [];


        prefCheckboxes.forEach(cb => {
            if (cb.checked) {
                prefs.push(cb.value);
            }
        });


        return {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            winePreferences: prefs.sort()
        };
    }


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


        editForm.addEventListener('submit', async (e) => {
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


            if (!isValid) return;


            const formState = getFormState();


            try {
                const response = await fetch('/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        currentEmail: currentUser,
                        firstName: formState.firstName,
                        lastName: formState.lastName,
                        password: formState.password,
                        winePreferences: formState.winePreferences
                    })
                });


                const data = await response.json();


                if (!response.ok) {
                    alert(data.message || "Could not update profile.");
                    return;
                }


                localStorage.setItem('firstName', data.user.firstName);
                localStorage.setItem('lastName', data.user.lastName || '');
                localStorage.setItem('winePreferences', data.user.winePreferences || '');


                initialState = getFormState();
                saveBtn.classList.add('d-none');


                if (successModal) {
                    successModal.style.display = 'flex';
                }


            } catch (error) {
                console.log("Error updating profile:", error);
                alert("Something went wrong while updating profile.");
            }
        });
    }


    const inputs = [firstNameInput, lastNameInput, emailInput, passwordInput];


    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => input.classList.remove('is-invalid'));
        }
    });


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


    await loadProfileFromServer();
});




