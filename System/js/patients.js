/* patients.js — localStorage-driven patient list with 10-entry pagination & Inventory style layout */

document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('patientsTable');
  const searchInput = document.getElementById('patientSearch');
  const strandFilter = document.getElementById('strandFilter');
  const archivesBtn = document.getElementById('archivesBtn');
  const archivesBtnText = document.getElementById('archivesBtnText');
  const entryCountEl = document.getElementById('patientEntryCount');
  const paginationEl = document.getElementById('patientPagination');
  const infoModal = document.getElementById('patientModal');

  const itemsPerPage = 10;
  let currentPage = 1;
  let archiveMode = false;

  // Render Table & Pagination
  function renderPatients() {
    if (!table) return;

    const patients = archiveMode ? STI.getPatientArchives() : STI.getPatients();
    const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const strandValue = (strandFilter ? strandFilter.value : '').trim();

    const filtered = patients.filter((patient) => {
      const name = (patient.name || '').toLowerCase();
      const strand = String(patient.strand || '');
      const studentNum = String(patient.studentNumber || '').toLowerCase();
      const matchesSearch = name.includes(searchValue) || studentNum.includes(searchValue);
      const matchesStrand = !strandValue || strand === strandValue;
      return matchesSearch && matchesStrand;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

    table.innerHTML = '';

    if (!filtered.length) {
      table.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No patients found.</td></tr>';
      if (entryCountEl) entryCountEl.textContent = 'Showing 0 to 0 of 0 entries';
      renderPagination(0);
      return;
    }

    pageItems.forEach((patient, index) => {
      const row = document.createElement('tr');
      const displayIndex = startIndex + index + 1;

      const actionsHtml = archiveMode ? `
        <button class="restore-btn" data-id="${patient.id}" type="button">Restore</button>
        <button class="permanent-delete-btn" data-id="${patient.id}" type="button">Delete</button>
      ` : `
        <button class="view-btn" data-id="${patient.id}" type="button" aria-label="View patient"><i class="fa-solid fa-eye"></i></button>
        <button class="edit-btn" data-id="${patient.id}" type="button" aria-label="Edit patient"><i class="fa-solid fa-pencil"></i></button>
        <button class="delete-btn" data-id="${patient.id}" type="button" aria-label="Archive patient"><i class="fa-solid fa-trash-can"></i></button>
      `;

      row.innerHTML = `
        <td>${displayIndex}</td>
        <td><strong>${escapeHtml(patient.name || '')}</strong></td>
        <td>${escapeHtml(patient.studentNumber || '')}</td>
        <td>${escapeHtml(patient.strand || '')}</td>
        <td>${escapeHtml(patient.section || '')}</td>
        <td class="actions">${actionsHtml}</td>
      `;

      if (archiveMode) {
        const restoreBtn = row.querySelector('.restore-btn');
        const deleteBtn = row.querySelector('.permanent-delete-btn');
        if (restoreBtn) restoreBtn.addEventListener('click', () => restorePatient(patient.id));
        if (deleteBtn) deleteBtn.addEventListener('click', () => permanentlyDeletePatient(patient.id));
      } else {
        const viewBtn = row.querySelector('.view-btn');
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        if (viewBtn) viewBtn.addEventListener('click', () => viewPatient(patient.id));
        if (editBtn) editBtn.addEventListener('click', () => editPatient(patient.id));
        if (deleteBtn) deleteBtn.addEventListener('click', () => archivePatient(patient.id));
      }

      table.appendChild(row);
    });

    // Update entry count text
    if (entryCountEl) {
      const showingFrom = startIndex + 1;
      const showingTo = Math.min(startIndex + pageItems.length, filtered.length);
      entryCountEl.textContent = `Showing ${showingFrom} to ${showingTo} of ${filtered.length} entries`;
    }

    renderPagination(filtered.length);
  }

  // Pagination Builder
  function renderPagination(totalItems) {
    if (!paginationEl) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    paginationEl.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = '‹';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderPatients();
      }
    });
    paginationEl.appendChild(prevBtn);

    for (let page = 1; page <= totalPages; page += 1) {
      const pageBtn = document.createElement('button');
      pageBtn.type = 'button';
      pageBtn.textContent = String(page);
      if (page === currentPage) pageBtn.className = 'current';
      pageBtn.addEventListener('click', () => {
        currentPage = page;
        renderPatients();
      });
      paginationEl.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = '›';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderPatients();
      }
    });
    paginationEl.appendChild(nextBtn);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function resetEditPatientForm() {
    setFieldValue('editPatientId', '');
    setFieldValue('editSurname', '');
    setFieldValue('editFirstName', '');
    setFieldValue('editMiddleName', '');
    setFieldValue('editSuffix', '');
    setFieldValue('editStudentNumber', '');
    setFieldValue('editSex', 'Male');
    setFieldValue('editStrand', '');
    setFieldValue('editGradeSection', '');
    setFieldValue('editBloodType', '');
    setFieldValue('editAllergies', '');
    setFieldValue('editCondition', '');
    setFieldValue('editEmergency1', '');
    setFieldValue('editEmergency2', '');
  }

  // Action Functions
  window.viewPatient = function (id) {
    const patients = archiveMode ? STI.getPatientArchives() : STI.getPatients();
    const patient = patients.find((item) => String(item.id) === String(id));
    if (!patient) return;
    renderPatientInfoModal(patient);
  };

  window.editPatient = function (id) {
    const patients = STI.getPatients();
    const patient = patients.find((item) => String(item.id) === String(id));
    if (!patient) return;

    setFieldValue('editPatientId', patient.id);
    setFieldValue('editSurname', patient.surname || '');
    setFieldValue('editFirstName', patient.firstName || patient.name || '');
    setFieldValue('editMiddleName', patient.middleName || '');
    setFieldValue('editSuffix', patient.suffix || '');
    setFieldValue('editStudentNumber', patient.studentNumber || '');
    setFieldValue('editSex', patient.sex || 'Male');
    setFieldValue('editStrand', patient.strand || '');
    setFieldValue('editGradeSection', patient.section || '');
    setFieldValue('editBloodType', patient.bloodType || '');
    setFieldValue('editAllergies', patient.allergies || '');
    setFieldValue('editCondition', patient.condition || '');
    setFieldValue('editEmergency1', patient.emergencyNumber || '');
    setFieldValue('editEmergency2', patient.emergencyNumber2 || '');

    const title = document.getElementById('editPatientModalTitle');
    if (title) title.textContent = 'Edit Patient Information';

    const editModal = document.getElementById('editPatientModal');
    if (editModal) editModal.style.display = 'flex';
  };

  window.openAddPatientModal = function () {
    resetEditPatientForm();
    const title = document.getElementById('editPatientModalTitle');
    if (title) title.textContent = 'Add New Patient';

    const editModal = document.getElementById('editPatientModal');
    if (editModal) editModal.style.display = 'flex';
  };

  window.closeEditPatientModal = function () {
    const editModal = document.getElementById('editPatientModal');
    if (editModal) editModal.style.display = 'none';
    resetEditPatientForm();
  };

  window.savePatientEdit = function (event) {
    if (event) event.preventDefault();

    const targetId = getFieldValue('editPatientId');
    let patients = STI.getPatients();

    const surname = getFieldValue('editSurname');
    const firstName = getFieldValue('editFirstName');
    const middleName = getFieldValue('editMiddleName');
    const suffix = getFieldValue('editSuffix');
    const fullName = [firstName, middleName, surname, suffix].filter(Boolean).join(' ');

    if (targetId) {
      // Edit existing patient
      patients = patients.map((patient) => {
        if (String(patient.id) === String(targetId)) {
          return {
            ...patient,
            surname,
            firstName,
            middleName,
            suffix,
            name: fullName || patient.name,
            studentNumber: getFieldValue('editStudentNumber') || patient.studentNumber,
            sex: getFieldValue('editSex') || patient.sex,
            strand: getFieldValue('editStrand') || patient.strand,
            section: getFieldValue('editGradeSection') || patient.section,
            bloodType: getFieldValue('editBloodType') || patient.bloodType,
            allergies: getFieldValue('editAllergies') || patient.allergies,
            condition: getFieldValue('editCondition') || patient.condition,
            emergencyNumber: getFieldValue('editEmergency1') || patient.emergencyNumber,
            emergencyNumber2: getFieldValue('editEmergency2') || patient.emergencyNumber2
          };
        }
        return patient;
      });
    } else {
      // Add new patient
      const newPatient = {
        id: STI.nextId(patients),
        surname,
        firstName,
        middleName,
        suffix,
        name: fullName || 'New Patient',
        studentNumber: getFieldValue('editStudentNumber') || 'N/A',
        sex: getFieldValue('editSex') || 'Male',
        strand: getFieldValue('editStrand') || 'N/A',
        section: getFieldValue('editGradeSection') || 'N/A',
        bloodType: getFieldValue('editBloodType') || 'N/A',
        allergies: getFieldValue('editAllergies') || 'None',
        condition: getFieldValue('editCondition') || 'None',
        emergencyNumber: getFieldValue('editEmergency1') || '',
        emergencyNumber2: getFieldValue('editEmergency2') || ''
      };
      patients.unshift(newPatient);
    }

    STI.savePatients(patients);
    currentPage = 1;
    renderPatients();
    closeEditPatientModal();
    if (window.animateAction) window.animateAction(document.querySelector('.patients-table') || document.body);
  };

  window.deletePatient = function (id) {
    return archivePatient(id);
  };

  async function archivePatient(id) {
    try {
      const ok = window.showConfirm ? await window.showConfirm('Move this patient to Archived Patients?') : confirm('Move this patient to Archived Patients?');
      if (!ok) return;

      const patients = STI.getPatients();
      const patient = patients.find((item) => String(item.id) === String(id));
      if (!patient) return;

      const archives = STI.getPatientArchives();
      archives.unshift({ ...patient, archivedAt: new Date().toISOString() });
      STI.savePatientArchives(archives);

      const remaining = patients.filter((item) => String(item.id) !== String(id));
      STI.savePatients(remaining);

      renderPatients();
      if (window.animateAction) window.animateAction(document.querySelector('.patients-table') || document.body);
    } catch (e) {
      console.error('archive patient', e);
    }
  }

  async function restorePatient(id) {
    const archives = STI.getPatientArchives();
    const patient = archives.find((item) => String(item.id) === String(id));
    if (!patient) return;

    STI.savePatients([{ ...patient, archivedAt: undefined }, ...STI.getPatients()]);
    STI.savePatientArchives(archives.filter((item) => String(item.id) !== String(id)));
    renderPatients();
  }

  async function permanentlyDeletePatient(id) {
    const ok = window.showConfirm ? await window.showConfirm('Permanently delete this archived patient?') : confirm('Permanently delete this archived patient?');
    if (!ok) return;

    STI.savePatientArchives(STI.getPatientArchives().filter((item) => String(item.id) !== String(id)));
    renderPatients();
  }

  // Patient Info View Modal
  function renderPatientInfoModal(patient) {
    if (!infoModal) return;

    const isMale = String(patient.sex || '').toLowerCase() === 'male';
    const avatarEl = infoModal.querySelector('.patient-avatar');
    if (avatarEl) {
      avatarEl.textContent = isMale ? '👨' : '👩';
    }

    const surnameWithSuffix = [patient.surname, patient.suffix].filter(Boolean).join(' ');
    setDisplayValue('infoSurname', surnameWithSuffix || patient.surname || patient.name?.split(' ').pop() || '');
    setDisplayValue('infoFirstName', patient.firstName || patient.name?.split(' ')[0] || '');
    setDisplayValue('infoMiddleName', patient.middleName || '');
    setDisplayValue('infoStudentNo', patient.studentNumber || 'N/A');
    setDisplayValue('infoSex', patient.sex || 'N/A');
    setDisplayValue('infoStrand', patient.strand || 'N/A');
    setDisplayValue('infoSection', patient.section || 'N/A');
    setDisplayValue('infoBlood', patient.bloodType || 'N/A');
    setDisplayValue('infoAllergies', patient.allergies || 'None');
    setDisplayValue('infoCondition', patient.condition || 'None');
    
    const emergencyText = [patient.emergencyName, patient.emergencyNumber].filter(Boolean).join('\n') || patient.emergencyNumber || 'N/A';
    setDisplayValue('infoEmergency', emergencyText);

    infoModal.style.display = 'flex';
  }

  window.openPatientModal = function (patient) {
    renderPatientInfoModal(patient);
  };

  window.closePatientModal = function () {
    if (infoModal) infoModal.style.display = 'none';
  };

  function setDisplayValue(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = escapeHtml(value || '—').replace(/\n/g, '<br>');
  }

  function setFieldValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // Event Listeners
  if (searchInput) searchInput.addEventListener('keyup', () => { currentPage = 1; renderPatients(); });
  if (strandFilter) strandFilter.addEventListener('change', () => { currentPage = 1; renderPatients(); });

  if (archivesBtn) {
    archivesBtn.addEventListener('click', () => {
      archiveMode = !archiveMode;
      currentPage = 1;
      if (archiveMode) {
        if (archivesBtnText) archivesBtnText.textContent = 'Active Patients';
        archivesBtn.classList.add('active-archive');
      } else {
        if (archivesBtnText) archivesBtnText.textContent = 'Archives';
        archivesBtn.classList.remove('active-archive');
      }
      renderPatients();
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'sti_patients' || event.key === 'sti_patient_archives') renderPatients();
  });

  window.addEventListener('pageshow', renderPatients);

  // Initial render
  renderPatients();
});