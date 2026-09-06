let profile = JSON.parse(
    localStorage.getItem("nurseProfile")
) || {
    name: "Nurse Name",
    campus: "STI College Baliuag",
    role: "School Nurse",
    email: "Nurse@sti.edu.ph",
    contact: "0998989898"
};


// =========================================
// LOAD PROFILE
// =========================================

function loadProfile() {

    document.getElementById("displayName").textContent =
        profile.name;

    document.getElementById("headerNurseName").textContent =
        profile.name;

    document.getElementById("displayCampus").textContent =
        profile.campus;

    document.getElementById("displayRole").textContent =
        profile.role;

    document.getElementById("displayEmail").textContent =
        profile.email;

    document.getElementById("displayContact").textContent =
        profile.contact;
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
        profile.role;

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

    profile.email =
        document.getElementById("editEmail").value;

    profile.contact =
        document.getElementById("editContact").value;


    localStorage.setItem(
        "nurseProfile",
        JSON.stringify(profile)
    );


    loadProfile();

  // notify other scripts to update header immediately if available
  try { if (typeof window.loadHeaderProfile === 'function') window.loadHeaderProfile(); } catch(e) {}

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