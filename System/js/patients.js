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
});