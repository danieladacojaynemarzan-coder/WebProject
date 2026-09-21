(function () {
    const users = [
        {
            username: "admin123@email.com",
            password: "password1"
        },
        {
            username: "someone@email.com",
            password: "password12"
        },
        {
            username: "JugemuJugemuGokō-noSurikireKaijarisuigyo-noSuigyōmatsuUnraimatsuFūraimatsuKūnerutokoro-niSumutokoroYaburakōji-noBurakōjiPaipopaipoPaipo-noShūringanShūringan-noGūrindaiGūrindai-noPonpokopī-noPonpokonā-noChōkyūmei-noChōsuke@email.com",
            password: "JugemuJugemuGokō-noSurikireKaijarisuigyo-noSuigyōmatsuUnraimatsuFūraimatsuKūnerutokoro-niSumutokoroYaburakōji-noBurakōjiPaipopaipoPaipo-noShūringanShūringan-noGūrindaiGūrindai-noPonpokopī-noPonpokonā-noChōkyūmei-noChōsuke123"
        }
    ];

    const loginForm = document.querySelector('#login-form');
    const signupForm = document.querySelector('#signup-form');
    const forgotPassword = document.querySelector('#forgot-password');

    function showMessage(element, message, isError) {
        element.textContent = message;
        element.classList.toggle('error', isError);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const username = loginForm.elements.username.value.trim();
            const password = loginForm.elements.password.value;
            const message = document.querySelector('#login-message');

            if (!username || !password) {
                showMessage(message, 'Please enter your username and password.', true);
                return;
            }

            if (
                username === users[0].username &&
                password === users[0].password
            ) {
                window.location.href = 'dashboard.html';
            }if (
                username === users[1].username &&
                password === users[1].password
            ) {
                window.location.href = 'dashboard.html';
            }if (
                username === users[2].username &&
                password === users[2].password
            ) {
                window.location.href = 'dashboard.html';
            } else {
                showMessage(message, 'Incorrect username or password.', true);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const username = signupForm.elements.username.value.trim();
            const email = signupForm.elements.email.value.trim();
            const password = signupForm.elements.password.value;
            const confirmPassword = signupForm.elements.confirmPassword.value;
            const message = document.querySelector('#signup-message');

            if (!username || !email || !password || !confirmPassword) {
                showMessage(message, 'Please complete all fields.', true);
                return;
            }

            if (password !== confirmPassword) {
                showMessage(message, 'Passwords do not match.', true);
                return;
            }

            showMessage(message, 'Your account details are ready to be submitted.', false);
        });
    }

    if (forgotPassword) {
        forgotPassword.addEventListener('click', function () {
            const username = window.prompt('Enter your username to reset your password:');

            if (username && username.trim()) {
                window.alert('Password reset instructions will be sent for this account.');
            }
        });
    }
}());

