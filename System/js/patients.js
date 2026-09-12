/* patients.js — localStorage-driven patient list */

document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('patientsTable');
  const searchInput = document.getElementById('patientSearch');
  const strandFilter = document.getElementById('strandFilter');

  function renderPatients() {
   if (!table) return;

   const patients = STI.getPatients();
   const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
   const strandValue = (strandFilter ? strandFilter.value : '').trim();

   const filtered = patients.filter((patient) => {
     const name = (patient.name || '').toLowerCase();
     const strand = (patient.strand || '').toString();
     const matchesSearch = name.includes(searchValue) || (patient.studentNumber || '').toLowerCase().includes(searchValue);
     const matchesStrand = !strandValue || strand === strandValue;
     return matchesSearch && matchesStrand;
   });

   table.innerHTML = '';

   if (!filtered.length) {
     table.innerHTML = '<tr><td colspan="6">No patients found.</td></tr>';
     return;
   }

   filtered.forEach((patient, index) => {
     const row = document.createElement('tr');
     row.innerHTML = `
       <td>${index + 1}</td>
       <td>${escapeHtml(patient.name || '')}</td>
       <td>${escapeHtml(patient.studentNumber || '')}</td>
       <td>${escapeHtml(patient.strand || '')}</td>
       <td>${escapeHtml(patient.section || '')}</td>
       <td class="actions">
         <button class="view-btn" data-id="${patient.id}" type="button"><i class="fa-solid fa-eye"></i></button>
         <button class="edit-btn" data-id="${patient.id}" type="button"><i class="fa-solid fa-pencil"></i></button>
         <button class="delete-btn" data-id="${patient.id}" type="button"><i class="fa-solid fa-trash-can"></i></button>
       </td>
     `;

     row.querySelector('.view-btn').addEventListener('click', () => viewPatient(patient.id));
     row.querySelector('.edit-btn').addEventListener('click', () => editPatient(patient.id));
     row.querySelector('.delete-btn').addEventListener('click', () => deletePatient(patient.id));

     table.appendChild(row);
   });
  }

  function escapeHtml(value) {
   return String(value || '').replace(/[&<>"']/g, (char) => ({
     '&': '&amp;',
     '<': '&lt;',
     '>': '&gt;',
     '"': '&quot;',
     "'": '&#39;'
   }[char]));
  }

  function renderPatientModal(patient) {
   const modal = document.getElementById('patientModal');
   if (!modal) return;

   const fields = {
     infoSurname: patient.surname || '',
     infoMiddleName: patient.middleName || '',
     infoFirstName: patient.firstName || patient.name || '',
     infoStudentNo: patient.studentNumber || '',
     infoSex: patient.sex || 'N/A',
     infoStrand: patient.strand || 'N/A',
     infoSection: patient.section || 'N/A',
     infoBlood: patient.bloodType || 'N/A',
     infoAllergies: patient.allergies || 'None',
     infoCondition: patient.condition || 'None',
     infoEmergency: (patient.emergencyName || 'N/A') + '<br>' + (patient.emergencyNumber || 'N/A')
   };

   Object.entries(fields).forEach(([id, value]) => {
     const el = document.getElementById(id);
     if (el) {
       el.textContent = id === 'infoEmergency' ? value : value;
     }
   });

   const emergencyEl = document.getElementById('infoEmergency');
   if (emergencyEl) emergencyEl.innerHTML = fields.infoEmergency;

   modal.style.display = 'flex';
  }

  window.filterPatients = function () {
   renderPatients();
  };

  window.viewPatient = function (id) {
   const patient = STI.getPatients().find((item) => String(item.id) === String(id));
   if (!patient) return;
   renderPatientModal(patient);
  };

  window.editPatient = function (id) {
   const patient = STI.getPatients().find((item) => String(item.id) === String(id));
   if (!patient) return;
   const newName = prompt('Edit patient name:', patient.name || '');
   if (newName === null) return;
   patient.name = newName.trim() || patient.name;
   STI.savePatients(STI.getPatients());
   renderPatients();
  };

  window.deletePatient = async function (id) {
   try {
     const ok = window.showConfirm ? await window.showConfirm('Are you sure you want to delete this patient?') : confirm('Are you sure you want to delete this patient?');
     if (!ok) return;
     const patients = STI.getPatients().filter((item) => String(item.id) !== String(id));
     STI.savePatients(patients);
     renderPatients();
     if (window.animateAction) window.animateAction(document.querySelector('#patientsTable') || document.body);
   } catch (e) {
     console.error('delete patient', e);
   }
  };

  window.openPatientModal = function (patient) {
   renderPatientModal(patient);
  };

  window.closePatientModal = function () {
   const modal = document.getElementById('patientModal');
   if (modal) modal.style.display = 'none';
  };

  // Edit
  function openEditPatientModal(patientId) {
    const patients = STI.getPatients();
    const patient = patients.find(p => String(p.id) === String(patientId) || String(p.studentId) === String(patientId));

    if (!patient) {
        console.error("Patient not found with ID:", patientId);
        return;
    }

    setFieldValue("editPatientId", patient.id || patient.studentId || "");
    setFieldValue("editSurname", patient.surname || "");
    setFieldValue("editMiddleName", patient.middleName || "");
    setFieldValue("editFirstName", patient.firstName || patient.name || "");
    setFieldValue("editStudentNumber", patient.studentNumber || "");
    setFieldValue("editSex", patient.sex || "");
    setFieldValue("editStrand", patient.strand || "");
    setFieldValue("editGradeSection", patient.section || patient.gradeSection || "");
    setFieldValue("editBloodType", patient.bloodType || "");
    setFieldValue("editAllergies", patient.allergies || "");
    setFieldValue("editCondition", patient.condition || "");
    setFieldValue("editEmergency1", patient.emergencyNumber || patient.emergencyContact1 || "");
    setFieldValue("editEmergency2", patient.emergencyNumber2 || patient.emergencyContact2 || "");

    const modal = document.getElementById("editPatientModal");
    if (modal) {
        modal.classList.add("show");
        modal.style.display = "flex";
    } else {
        console.error("Modal element #editPatientModal not found in HTML.");
    }
  }

  function closeEditPatientModal() {
    const modal = document.getElementById("editPatientModal");
    if (modal) {
        modal.classList.remove("show");
        modal.style.display = "none";
    }
  }

  function savePatientEdit(event) {
    if (event) event.preventDefault();

    const targetId = getFieldValue("editPatientId");
    let patients = STI.getPatients();

    patients = patients.map(patient => {
        if (String(patient.id) === String(targetId) || String(patient.studentId) === String(targetId)) {
            const surname = getFieldValue("editSurname") || patient.surname;
            const firstName = getFieldValue("editFirstName") || patient.firstName;
            const middleName = getFieldValue("editMiddleName") || patient.middleName;

          
            const fullName = [firstName, middleName, surname].filter(Boolean).join(' ');

            return {
                ...patient,
                surname: surname,
                middleName: middleName,
                firstName: firstName,
                name: fullName,
                studentNumber: getFieldValue("editStudentNumber") || patient.studentNumber,
                sex: getFieldValue("editSex") || patient.sex,
                strand: getFieldValue("editStrand") || patient.strand,
                section: getFieldValue("editGradeSection") || patient.section,
                bloodType: getFieldValue("editBloodType") || patient.bloodType,
                allergies: getFieldValue("editAllergies") || patient.allergies,
                condition: getFieldValue("editCondition") || patient.condition,
                emergencyNumber: getFieldValue("editEmergency1") || patient.emergencyNumber,
                emergencyNumber2: getFieldValue("editEmergency2") || patient.emergencyNumber2
            };
        }
        return patient;
    });

    STI.savePatients(patients);
    renderPatients();
    closeEditPatientModal();
  }

  function setFieldValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }


  if (searchInput) searchInput.addEventListener('keyup', renderPatients);
  if (strandFilter) strandFilter.addEventListener('change', renderPatients);

  renderPatients();
});