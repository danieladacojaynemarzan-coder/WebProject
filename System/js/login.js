let users = [
    {
        username: "nobunaga.444593@baliuag.sti.edu.ph",
        password: "password123"
    },
];

let loginForm = document.querySelector(".LOGIN_BOX form");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    let username = document.querySelector(
        '.LOGIN_BOX input[type="email"]'
    ).value;

    let password = document.querySelector(
        '.LOGIN_BOX input[type="password"]'
    ).value;

    if (username === "" || password === "") {
        alert("Please enter your username and password.");
    }
    else if (
        username === users[0].username &&
        password === users[0].password
    ) {
        window.location.href = "dashboard.html";
    } else {
        alert("Incorrect username or password.");
    }
});