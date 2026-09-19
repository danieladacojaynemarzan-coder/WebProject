/* patients.js — localStorage-driven patient list */

document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('patientsTable');
  const searchInput = document.getElementById('patientSearch');
  const strandFilter = document.getElementById('strandFilter');
  const modal = document.getElementById('patientModal');
  const modalActions = document.getElementById('patientModalActions');
  const saveButton = document.getElementById('patientSaveButton');
  const cancelButton = document.getElementById('patientCancelButton');
  let activePatientId = null;
  let activePatientSnapshot = null;
  let isEditing = false;

  function renderPatients() {
   if (!table) return;

   const patients = STI.getPatients();
   const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
   const strandValue = (strandFilter ? strandFilter.value : '').trim();
   const filtered = patients.filter((patient) => {
     const name = (patient.name || '').toLowerCase();
     const strand = String(patient.strand || '');
     return (name.includes(searchValue) || String(patient.studentNumber || '').toLowerCase().includes(searchValue)) &&
       (!strandValue || strand === strandValue);
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
         <button class="view-btn" data-id="${patient.id}" type="button" aria-label="View patient"><i class="fa-solid fa-eye"></i></button>
         <button class="edit-btn" data-id="${patient.id}" type="button" aria-label="Edit patient"><i class="fa-solid fa-pencil"></i></button>
         <button class="delete-btn" data-id="${patient.id}" type="button" aria-label="Delete patient"><i class="fa-solid fa-trash-can"></i></button>
       </td>`;
     row.querySelector('.view-btn').addEventListener('click', () => viewPatient(patient.id));
     row.querySelector('.edit-btn').addEventListener('click', () => editPatient(patient.id));
     row.querySelector('.delete-btn').addEventListener('click', () => deletePatient(patient.id));
     table.appendChild(row);
   });
  }

  function escapeHtml(value) {
   return String(value || '').replace(/[&<>"']/g, (char) => ({
     '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
   }[char]));
  }

  function patientFields(patient) {
   return {
     infoSurname: patient.surname || '',
     infoFirstName: patient.firstName || patient.name || '',
     infoMiddleName: patient.middleName || '',
     infoStudentNo: patient.studentNumber || '',
     infoSex: patient.sex || '',
     infoStrand: patient.strand || '',
     infoSection: patient.section || '',
     infoBlood: patient.bloodType || '',
     infoAllergies: patient.allergies || '',
     infoCondition: patient.condition || '',
     infoEmergencyName: patient.emergencyName || '',
     infoEmergencyNumber: patient.emergencyNumber || ''
   };
  }

  function setDisplayValue(id, value) {
   const element = document.getElementById(id);
   if (!element) return;
   element.innerHTML = escapeHtml(value || '—').replace(/\n/g, '<br>');
  }

  function renderPatientModal(patient, editMode) {
   if (!modal) return;
   const fields = patientFields(patient);
   const displayFields = {
     infoSurname: fields.infoSurname,
     infoFirstName: fields.infoFirstName,
     infoMiddleName: fields.infoMiddleName,
     infoStudentNo: fields.infoStudentNo,
     infoSex: fields.infoSex,
     infoStrand: fields.infoStrand,
     infoSection: fields.infoSection,
     infoBlood: fields.infoBlood,
     infoAllergies: fields.infoAllergies,
     infoCondition: fields.infoCondition,
     infoEmergency: `${fields.infoEmergencyName}\n${fields.infoEmergencyNumber}`
   };

   Object.entries(displayFields).forEach(([id, value]) => setDisplayValue(id, value));
   modal.classList.toggle('is-editing', editMode);
   modalActions.hidden = !editMode;
   isEditing = editMode;
   modal.style.display = 'flex';

   if (editMode) {
     Object.entries(fields).forEach(([id, value]) => {
       const element = document.getElementById(id);
       if (!element) return;
       if (id === 'infoSex') {
         element.innerHTML = `<select data-patient-field="sex"><option value="">Select sex</option><option value="Female">Female</option><option value="Male">Male</option><option value="Other">Other</option></select>`;
         element.firstElementChild.value = value;
       } else {
         element.innerHTML = `<input data-patient-field="${id}" type="text" value="${escapeHtml(value)}">`;
       }
     });
     document.getElementById('infoEmergency').innerHTML = `
       <span class="emergency-inputs">
         <input data-patient-field="emergencyName" type="text" value="${escapeHtml(fields.infoEmergencyName)}" placeholder="Contact name">
         <input data-patient-field="emergencyNumber" type="text" value="${escapeHtml(fields.infoEmergencyNumber)}" placeholder="Phone number">
       </span>`;
   }
  }

  function readEditValues() {
   const value = (field) => document.querySelector(`[data-patient-field="${field}"]`)?.value.trim() || '';
   return {
     surname: value('infoSurname'), firstName: value('infoFirstName'), middleName: value('infoMiddleName'),
     studentNumber: value('infoStudentNo'), sex: value('sex'), strand: value('infoStrand'), section: value('infoSection'),
     bloodType: value('infoBlood'), allergies: value('infoAllergies'), condition: value('infoCondition'),
     emergencyName: value('emergencyName'), emergencyNumber: value('emergencyNumber')
   };
  }

  function finishEdit(saveChanges) {
   if (!activePatientId) return;
   if (saveChanges) {
     const patients = STI.getPatients();
     const patient = patients.find((item) => String(item.id) === String(activePatientId));
     if (patient) {
       const changes = readEditValues();
       Object.assign(patient, changes);
       patient.name = [changes.firstName, changes.middleName, changes.surname].filter(Boolean).join(' ') || patient.name;
       STI.savePatients(patients);
       renderPatients();
       activePatientSnapshot = { ...patient };
     }
   }
   const patient = STI.getPatients().find((item) => String(item.id) === String(activePatientId));
   if (patient) renderPatientModal(patient, false);
  }

  window.filterPatients = renderPatients;

  window.viewPatient = function (id) {
   const patient = STI.getPatients().find((item) => String(item.id) === String(id));
   if (!patient) return;
   activePatientId = patient.id;
   activePatientSnapshot = { ...patient };
   renderPatientModal(patient, false);
  };

  window.editPatient = function (id) {
   const patient = STI.getPatients().find((item) => String(item.id) === String(id));
   if (!patient) return;
   activePatientId = patient.id;
   activePatientSnapshot = { ...patient };
   renderPatientModal(patient, true);
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
    if (isEditing) finishEdit(false);
    if (modal) modal.style.display = 'none';
    activePatientId = null;
    activePatientSnapshot = null;
    isEditing = false;
  };

  if (searchInput) searchInput.addEventListener('keyup', renderPatients);
  if (strandFilter) strandFilter.addEventListener('change', renderPatients);
  if (saveButton) saveButton.addEventListener('click', () => finishEdit(true));
  if (cancelButton) cancelButton.addEventListener('click', () => finishEdit(false));
  window.addEventListener('storage', (event) => {
   if (event.key === 'sti_patients') renderPatients();
  });
  window.addEventListener('pageshow', renderPatients);

  renderPatients();
const discardedPatientScript = String.raw`
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
     row.innerHTML = '
       <td>\${index + 1}</td>
       <td>\${escapeHtml(patient.name || '')}</td>
       <td>\${escapeHtml(patient.studentNumber || '')}</td>
       <td>\${escapeHtml(patient.strand || '')}</td>
       <td>\${escapeHtml(patient.section || '')}</td>
       <td class="actions">
         <button class="view-btn" data-id="\${patient.id}" type="button"><i class="fa-solid fa-eye"></i></button>
         <button class="edit-btn" data-id="\${patient.id}" type="button"><i class="fa-solid fa-pencil"></i></button>
         <button class="delete-btn" data-id="\${patient.id}" type="button"><i class="fa-solid fa-trash-can"></i></button>
       </td>
    ';

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
        console.error("Patient ID:", patientId);
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
`;
});