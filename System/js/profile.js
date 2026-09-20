let profile = JSON.parse(
    localStorage.getItem("nurseProfile")
) || {
    name: "Nurse Name",
    campus: "STI College Baliuag",
    role: "Nurse",
    sex: "Female",
    email: "Nurse@sti.edu.ph",
    contact: "0998989898"
};


// =========================================
// LOAD PROFILE
// =========================================

function loadProfile() {

    document.getElementById("displayName").textContent =
        profile.name;

    const headerNameEl = document.getElementById("headerNurseName");
    if (headerNameEl) {
        headerNameEl.textContent = profile.name;
    }

    document.getElementById("displayCampus").textContent =
        profile.campus;

    document.getElementById("displayRole").textContent =
        profile.role || "Nurse";

    const displaySexEl = document.getElementById("displaySex");
    if (displaySexEl) {
        displaySexEl.textContent = profile.sex || "Female";
    }

    document.getElementById("displayEmail").textContent =
        profile.email;

    document.getElementById("displayContact").textContent =
        profile.contact;

    if (typeof window.loadHeaderProfile === 'function') {
        window.loadHeaderProfile();
    }
}


// =========================================
// OPEN EDIT
// =========================================

function openEditProfile() {

    document.getElementById("editName").value =
        profile.name;

    document.getElementById("editCampus").value =
        profile.campus;

    document.getElementById("editRole").value =
        (profile.role === "Head Nurse") ? "Head Nurse" : "Nurse";

    const editSexEl = document.getElementById("editSex");
    if (editSexEl) {
        editSexEl.value = profile.sex || "Female";
    }

    document.getElementById("editEmail").value =
        profile.email;

    document.getElementById("editContact").value =
        profile.contact;


    document
        .getElementById("editProfileModal")
        .classList.add("show");
}


// =========================================
// CLOSE EDIT
// =========================================

function closeEditProfile() {

    document
        .getElementById("editProfileModal")
        .classList.remove("show");
}


// =========================================
// SAVE
// =========================================

function saveProfile() {

    profile.name =
        document.getElementById("editName").value;

    profile.campus =
        document.getElementById("editCampus").value;

    profile.role =
        document.getElementById("editRole").value;

    const editSexEl = document.getElementById("editSex");
    if (editSexEl) {
        profile.sex = editSexEl.value;
    }

    profile.email =
        document.getElementById("editEmail").value;

    profile.contact =
        document.getElementById("editContact").value;


    localStorage.setItem(
        "nurseProfile",
        JSON.stringify(profile)
    );


    loadProfile();

    closeEditProfile();

    alert("Profile updated successfully!");
}


// =========================================
// START
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    loadProfile
);