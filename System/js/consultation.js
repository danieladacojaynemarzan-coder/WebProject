/* consultation.js — localStorage implementation for consultation records and patient lookup */

(function () {
  const PATIENTS_KEY = 'sti_patients';
  const CONSULT_KEY = 'sti_consultations';
  const SEEDED_KEY = 'sti_seeded_v1';

  function readJSON(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('readJSON', e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function nextId(items) {
    if (!items || items.length === 0) return 1;
    return items.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
  }

  function seedPatientsIfNeeded() {
    if (localStorage.getItem(SEEDED_KEY)) return;
    const existing = readJSON(PATIENTS_KEY, []);
    if (existing.length === 0) {
      const sample = [
        { id: 1, name: 'Chadler Esparteto', firstName: 'Chadler', surname: 'Esparteto', studentNumber: '2021-001', strand: 'HS', section: '12-A' },
        { id: 2, name: 'Mary Josephine Lajom', firstName: 'Mary', middleName: 'Josephine', surname: 'Lajom', studentNumber: '2021-002', strand: 'HS', section: '12-B' },
        { id: 3, name: 'Daniela Marzan', firstName: 'Daniela', surname: 'Marzan', studentNumber: '2021-003', strand: 'HS', section: '12-C' }
      ];
      writeJSON(PATIENTS_KEY, sample);
    }
    localStorage.setItem(SEEDED_KEY, '1');
  }

  function listPatients() {
    return readJSON(PATIENTS_KEY, []);
  }

  function searchPatients(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return listPatients().filter((p) => {
      const name = (p.name || '').toLowerCase();
      const number = (p.studentNumber || '').toLowerCase();
      return name.includes(q) || number.includes(q);
    });
  }

  function parseNameParts(fullName) {
    const raw = String(fullName || '').trim();
    if (!raw) return { firstName: '', middleName: '', surname: '', suffix: '', name: '' };

    const suffixRegex = /\s+(Jr\.?|Sr\.?|III|IV|II|V)$/i;
    let suffix = '';
    let cleanName = raw;
    const suffixMatch = raw.match(suffixRegex);
    if (suffixMatch) {
      suffix = suffixMatch[1];
      cleanName = raw.replace(suffixRegex, '').trim();
    }

    const parts = cleanName.split(/\s+/).filter(Boolean);
    let firstName = '';
    let middleName = '';
    let surname = '';

    if (parts.length === 1) {
      firstName = parts[0];
    } else if (parts.length === 2) {
      firstName = parts[0];
      surname = parts[1];
    } else if (parts.length === 3) {
      firstName = parts[0];
      middleName = parts[1];
      surname = parts[2];
    } else if (parts.length > 3) {
      firstName = parts[0];
      middleName = parts.slice(1, -1).join(' ');
      surname = parts[parts.length - 1];
    }

    const formattedName = [firstName, middleName, surname, suffix].filter(Boolean).join(' ');
    return { firstName, middleName, surname, suffix, name: formattedName || raw };
  }

  function createPatient(obj) {
    const all = listPatients();

    const firstName = String(obj.firstName || '').trim();
    const middleName = String(obj.middleName || '').trim();
    const surname = String(obj.surname || '').trim();
    const suffix = String(obj.suffix || '').trim();

    let nameData;
    if (firstName || surname) {
      const formatted = [firstName, middleName, surname, suffix].filter(Boolean).join(' ');
      nameData = { firstName, middleName, surname, suffix, name: formatted };
    } else {
      nameData = parseNameParts(obj.name || '');
    }

    const normalizedName = nameData.name.toLowerCase();
    const normalizedNumber = String(obj.studentNumber || '').trim().toLowerCase();

    const existing = all.find((patient) => {
      const sameNumber = normalizedNumber && String(patient.studentNumber || '').trim().toLowerCase() === normalizedNumber;
      const sameName = normalizedName && String(patient.name || '').trim().toLowerCase() === normalizedName;
      return sameNumber || sameName;
    });

    if (existing) {
      Object.assign(existing, {
        firstName: nameData.firstName || existing.firstName,
        middleName: nameData.middleName || existing.middleName,
        surname: nameData.surname || existing.surname,
        suffix: nameData.suffix || existing.suffix,
        name: nameData.name || existing.name,
        studentNumber: obj.studentNumber || existing.studentNumber,
        strand: obj.strand || existing.strand,
        section: obj.section || existing.section
      });
      writeJSON(PATIENTS_KEY, all);
      notifyStorageChange();
      return existing;
    }

    const newPatient = {
      id: nextId(all),
      firstName: nameData.firstName,
      middleName: nameData.middleName,
      surname: nameData.surname,
      suffix: nameData.suffix,
      name: nameData.name,
      studentNumber: obj.studentNumber || 'N/A',
      strand: obj.strand || 'N/A',
      section: obj.section || 'N/A',
      sex: obj.sex || 'Male',
      bloodType: obj.bloodType || 'N/A',
      allergies: obj.allergies || 'None',
      condition: obj.condition || 'None',
      emergencyNumber: obj.emergencyNumber || '',
      createdAt: new Date().toISOString()
    };

    all.unshift(newPatient);
    writeJSON(PATIENTS_KEY, all);
    notifyStorageChange();
    return newPatient;
  }

  function notifyStorageChange() {
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  }

  function getPatientById(id) {
    return listPatients().find((p) => String(p.id) === String(id)) || null;
  }

  function listConsultations() {
    return readJSON(CONSULT_KEY, []);
  }

  function createConsultation(obj) {
    const all = listConsultations();
    const item = Object.assign({ id: nextId(all), createdAt: new Date().toISOString() }, obj);
    all.unshift(item);
    writeJSON(CONSULT_KEY, all);
    return item;
  }

  function deleteConsultationById(id) {
    const all = listConsultations().filter((c) => String(c.id) !== String(id));
    writeJSON(CONSULT_KEY, all);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    seedPatientsIfNeeded();

    // inject confirm modal & animation helper if not present
    (function () {
      try {
        if (!window.showConfirm) {
          const html = `
            <div id="pageConfirmModal" class="confirm-modal" aria-hidden="true">
              <div class="confirm-modal-box">
                <div class="confirm-modal-body"><p id="pageConfirmMessage">Are you sure?</p></div>
                <div class="confirm-modal-actions">
                  <button id="pageConfirmCancel" class="btn-cancel" type="button">Cancel</button>
                  <button id="pageConfirmOk" class="btn-ok" type="button">Confirm</button>
                </div>
              </div>
            </div>
          `;
          document.body.insertAdjacentHTML('beforeend', html);
          const modal = document.getElementById('pageConfirmModal');
          const msg = document.getElementById('pageConfirmMessage');
          const ok = document.getElementById('pageConfirmOk');
          const cancel = document.getElementById('pageConfirmCancel');
          let _resolver = null;
          window.showConfirm = function (message) {
            return new Promise((resolve) => {
              _resolver = resolve;
              if (msg) msg.textContent = message || 'Are you sure?';
              modal.classList.add('open');
              modal.setAttribute('aria-hidden', 'false');
              if (cancel) cancel.focus();
            });
          };
          modal.addEventListener('click', function (e) {
            if (e.target === modal) {
              modal.classList.remove('open');
              modal.setAttribute('aria-hidden', 'true');
              if (_resolver) { _resolver(false); _resolver = null; }
            }
          });
          ok.addEventListener('click', function () { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); if (_resolver) { _resolver(true); _resolver = null; } });
          cancel.addEventListener('click', function () { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); if (_resolver) { _resolver(false); _resolver = null; } });
        }
      } catch (e) { console.error('confirm inject', e); }

      if (!window.animateAction) {
        window.animateAction = function (el, opts) {
          try {
            opts = opts || {};
            const target = el || document.body;
            if (!target) return;
            target.classList.add('action-animate');
            setTimeout(() => { try { target.classList.remove('action-animate'); } catch (e) {} }, opts.duration || 420);
          } catch (e) { console.error('animateAction', e); }
        };
      }
    })();

    const searchInput = document.getElementById('searchStudent');
    const suggestionsBox = document.getElementById('searchSuggestions');
    const registerCheckbox = document.getElementById('registerStudent');
    const patientIdInput = document.getElementById('patientId');
    const studentNameHidden = document.getElementById('studentName');

    const firstNameInput = document.getElementById('studentFirstName');
    const middleNameInput = document.getElementById('studentMiddleName');
    const surnameInput = document.getElementById('studentSurname');
    const suffixInput = document.getElementById('studentSuffix');

    const studentNumberInput = document.getElementById('studentNumber');
    const strandInput = document.getElementById('studentStrand');
    const sectionInput = document.getElementById('studentSection');

    const timeInput = document.getElementById('consultationTime');
    const dateInput = document.getElementById('consultationDate');
    const complaintInput = document.getElementById('chiefComplaint');
    const dispositionInput = document.getElementById('disposition');
    const diagnosisInput = document.getElementById('diagnosis');
    const treatmentInput = document.getElementById('treatment');
    const nurseInput = document.getElementById('nurseName');
    const editIdInput = document.getElementById('consultationEditId');
    const listContainer = document.querySelector('.consultation-list');
    const dateFilter = document.getElementById('fromDate');
    const clearDateFilter = document.getElementById('clearDateFilter');

    function resetPatientFormInputs() {
      if (patientIdInput) patientIdInput.value = '';
      if (studentNameHidden) studentNameHidden.value = '';
      if (firstNameInput) firstNameInput.value = '';
      if (middleNameInput) middleNameInput.value = '';
      if (surnameInput) surnameInput.value = '';
      if (suffixInput) suffixInput.value = '';
      if (studentNumberInput) studentNumberInput.value = '';
      if (strandInput) strandInput.value = '';
      if (sectionInput) sectionInput.value = '';
      const confirmCheck = document.getElementById('confirmConsultationSave');
      const confirmWarning = document.getElementById('confirmWarningText');
      if (confirmCheck) confirmCheck.checked = false;
      if (confirmWarning) confirmWarning.style.display = 'none';
      hidePatientDetails();
    }

    function populatePatientInputs(patient) {
      if (!patient) return;
      if (patientIdInput) patientIdInput.value = patient.id || '';
      if (studentNameHidden) studentNameHidden.value = patient.name || '';

      const nameParts = parseNameParts(patient.name || '');
      if (firstNameInput) firstNameInput.value = patient.firstName || nameParts.firstName || '';
      if (middleNameInput) middleNameInput.value = patient.middleName || nameParts.middleName || '';
      if (surnameInput) surnameInput.value = patient.surname || nameParts.surname || '';
      if (suffixInput) suffixInput.value = patient.suffix || nameParts.suffix || '';

      if (studentNumberInput) studentNumberInput.value = patient.studentNumber || '';
      if (strandInput) strandInput.value = patient.strand || '';
      if (sectionInput) sectionInput.value = patient.section || '';
      showPatientDetails(patient);
    }

    function hideSuggestions() {
      if (!suggestionsBox) return;
      suggestionsBox.style.display = 'none';
      suggestionsBox.innerHTML = '';
    }

    function showSuggestions(items) {
      if (!suggestionsBox) return;
      suggestionsBox.innerHTML = '';
      if (!items || items.length === 0) {
        hideSuggestions();
        return;
      }

      items.slice(0, 10).forEach((patient) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = `${patient.name}${patient.studentNumber ? ' — ' + patient.studentNumber : ''}`;
        item.addEventListener('click', () => {
          populatePatientInputs(patient);
          hideSuggestions();
        });
        suggestionsBox.appendChild(item);
      });
      suggestionsBox.style.display = 'block';
    }

    function renderConsultationList() {
      if (!listContainer) return;
      const query = (document.getElementById('consultationSearch')?.value || '').trim().toLowerCase();
      const selectedDate = dateFilter?.value || '';
      const items = listConsultations().filter((record) => {
        const patient = getPatientById(record.patientId) || {};
        const name = String(patient.name || record.patientName || '').toLowerCase();
        const matchesSearch = !query || name.includes(query);
        const matchesDate = !selectedDate || record.date === selectedDate;
        return matchesSearch && matchesDate;
      });
      listContainer.innerHTML = '';
      if (!items.length) {
        listContainer.innerHTML = '<p>No consultations yet.</p>';
        return;
      }

      items.forEach((record) => {
        const patient = getPatientById(record.patientId) || {};
        const card = document.createElement('div');
        card.className = 'consultation-card';
        card.innerHTML = `
          <div>
            <h3>Patient Name</h3>
            <p>${escapeHtml(patient.name || record.patientName || '')}</p>
          </div>
          <div>
            <h3>Time</h3>
            <p>${escapeHtml(record.time || '')}</p>
          </div>
          <div>
            <h3>Date</h3>
            <p>${escapeHtml(record.date || '')}</p>
          </div>
          <div>
            <h3>Reason</h3>
            <p>${escapeHtml(record.chiefComplaint || '')}</p>
          </div>
          <div class="consultation-actions">
            <button class="edit-btn" type="button"><i class="fa-solid fa-pencil"></i></button>
            <button class="delete-btn" type="button"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <div class="consultation-extra">
            <div class="extra-row"><span class="extra-label">Disposition</span><span>${escapeHtml(record.disposition || '—')}</span></div>
            <div class="extra-row"><span class="extra-label">Diagnosis</span><span>${escapeHtml(record.diagnosis || '—')}</span></div>
            <div class="extra-row"><span class="extra-label">Treatment</span><span>${escapeHtml(record.treatment || '—')}</span></div>
            <div class="extra-row"><span class="extra-label">Nurse</span><span>${escapeHtml(record.nurse || '—')}</span></div>
          </div>
        `;

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async (event) => {
          event.stopPropagation();
          try {
            const ok = window.showConfirm ? await window.showConfirm('Delete this consultation?') : confirm('Delete this consultation?');
            if (!ok) return;
            deleteConsultationById(record.id);
            renderConsultationList();
            if (window.animateAction) window.animateAction(listContainer || document.body);
          } catch (e) {
            console.error('delete consult', e);
          }
        });

        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            try {
              if (!editIdInput) return;
              editIdInput.value = record.id;

              if (record.patientId) {
                const p = getPatientById(record.patientId);
                if (p) populatePatientInputs(p);
              } else {
                resetPatientFormInputs();
                if (firstNameInput) firstNameInput.value = record.patientName || '';
              }

              function toTimeInputFormat(t) {
                if (!t) return '';
                const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                if (!m) return t;
                let hh = parseInt(m[1], 10);
                const mm = m[2];
                const ampm = (m[3] || '').toUpperCase();
                if (ampm === 'PM' && hh < 12) hh += 12;
                if (ampm === 'AM' && hh === 12) hh = 0;
                return (hh < 10 ? '0' + hh : '' + hh) + ':' + mm;
              }

              timeInput.value = toTimeInputFormat(record.time || '');
              dateInput.value = record.date || '';
              complaintInput.value = record.chiefComplaint || '';
              dispositionInput.value = record.disposition || '';
              diagnosisInput.value = record.diagnosis || '';
              treatmentInput.value = record.treatment || '';
              nurseInput.value = record.nurse || '';

              window.openConsultationModal();
            } catch (e) {
              console.error('prefill edit', e);
            }
          });
        }

        card.addEventListener('click', (event) => {
          if (event.target.closest('button')) return;
          card.classList.toggle('expanded');
        });

        card.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            card.classList.toggle('expanded');
          }
        });
        card.tabIndex = 0;

        listContainer.appendChild(card);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        if (!query) {
          hideSuggestions();
          hidePatientDetails();
          return;
        }

        const matches = searchPatients(query);
        showSuggestions(matches);
      });

      document.addEventListener('click', (event) => {
        if (!suggestionsBox) return;
        if (!suggestionsBox.contains(event.target) && event.target !== searchInput) {
          hideSuggestions();
        }
      });
    }

    if (registerCheckbox) {
      registerCheckbox.addEventListener('change', () => {
        if (registerCheckbox.checked) {
          resetPatientFormInputs();
        }
      });
    }

    window.openConsultationModal = function () {
      const modal = document.getElementById('consultationModal');
      try {
        if (!editIdInput || !editIdInput.value) {
          resetPatientFormInputs();
          if (timeInput) timeInput.value = '';
          if (dateInput) dateInput.value = '';
          if (complaintInput) complaintInput.value = '';
          if (dispositionInput) dispositionInput.value = '';
          if (diagnosisInput) diagnosisInput.value = '';
          if (treatmentInput) treatmentInput.value = '';
          if (nurseInput) nurseInput.value = 'Nurse Name';
          if (editIdInput) editIdInput.value = '';
        }
      } catch(e) {
        console.error('reset modal', e);
      }
      if (modal) modal.style.display = 'flex';
    };

    window.closeConsultationModal = function () {
      const modal = document.getElementById('consultationModal');
      if (modal) modal.style.display = 'none';
      resetPatientFormInputs();
      try { if (editIdInput) editIdInput.value = ''; } catch(e){}
    };

    window.showPatientDetails = function (patient) {
      try {
        const details = document.getElementById('patientDetails');
        if (!details) return;
        const html = `
          <div class="row"><div class="label">Name</div><div class="value">${escapeHtml(patient.name || '')}</div></div>
          <div class="row"><div class="label">Student No.</div><div class="value">${escapeHtml(patient.studentNumber || '—')}</div></div>
          <div class="row"><div class="label">Strand</div><div class="value">${escapeHtml(patient.strand || '—')}</div></div>
          <div class="row"><div class="label">Section</div><div class="value">${escapeHtml(patient.section || '—')}</div></div>
          <div class="actions"><button type="button" class="view-btn">View Profile</button><button type="button" class="clear-btn" onclick="(function(){window.resetPatientFormInputs();})()">Clear</button></div>
        `;
        details.innerHTML = html;
        details.style.display = 'block';
        details.classList.remove('hidden');
      } catch (e) {
        console.error('showPatientDetails', e);
      }
    };

    window.resetPatientFormInputs = resetPatientFormInputs;

    window.hidePatientDetails = function () {
      const details = document.getElementById('patientDetails');
      if (!details) return;
      details.classList.add('hidden');
      setTimeout(() => {
        details.style.display = 'none';
        details.innerHTML = '';
      }, 220);
    };

    window.saveConsultation = function () {

      const register = !!(registerCheckbox && registerCheckbox.checked);

      const firstName = (firstNameInput && firstNameInput.value.trim()) || '';
      const middleName = (middleNameInput && middleNameInput.value.trim()) || '';
      const surname = (surnameInput && surnameInput.value.trim()) || '';
      const suffix = (suffixInput && suffixInput.value.trim()) || '';
      const typedSearchName = (searchInput && searchInput.value.trim()) || '';

      const constructedName = [firstName, middleName, surname, suffix].filter(Boolean).join(' ');
      const finalStudentName = constructedName || typedSearchName;

      if (!finalStudentName) {
        alert('Please enter student name details before saving.');
        return;
      }

      if (!timeInput.value || !dateInput.value || !complaintInput.value.trim()) {
        alert('Please fill in date, time, and chief complaint.');
        return;
      }

      let finalPatientId = patientIdInput.value || null;

      // Register or ensure patient is saved to Patients list
      if (!finalPatientId || register) {
        const created = createPatient({
          firstName,
          middleName,
          surname,
          suffix,
          name: finalStudentName,
          studentNumber: studentNumberInput ? studentNumberInput.value.trim() : '',
          strand: strandInput ? strandInput.value.trim() : '',
          section: sectionInput ? sectionInput.value.trim() : ''
        });
        finalPatientId = created.id;
      }

      const editingId = editIdInput && editIdInput.value ? String(editIdInput.value) : null;
      if (editingId) {
        try {
          const all = listConsultations();
          const idx = all.findIndex((c) => String(c.id) === editingId);
          if (idx !== -1) {
            all[idx] = Object.assign({}, all[idx], {
              patientId: finalPatientId,
              patientName: finalStudentName,
              time: timeInput.value,
              date: dateInput.value,
              chiefComplaint: complaintInput.value.trim(),
              disposition: dispositionInput.value,
              diagnosis: diagnosisInput.value.trim(),
              treatment: treatmentInput.value,
              nurse: nurseInput.value,
              updatedAt: new Date().toISOString()
            });
            writeJSON(CONSULT_KEY, all);
            renderConsultationList();
            if (window.animateAction) window.animateAction(document.querySelector('.consultation-list') || document.body);
            alert('Consultation updated');
            if (window.updateDashboardStats) window.updateDashboardStats();
            editIdInput.value = '';
            window.closeConsultationModal();
            return;
          }
        } catch (e) {
          console.error('update consult', e);
        }
      }

      createConsultation({
        patientId: finalPatientId,
        patientName: finalStudentName,
        time: timeInput.value,
        date: dateInput.value,
        chiefComplaint: complaintInput.value.trim(),
        disposition: dispositionInput.value,
        diagnosis: diagnosisInput.value.trim(),
        treatment: treatmentInput.value,
        nurse: nurseInput.value
      });

      renderConsultationList();
      if (window.animateAction) window.animateAction(document.querySelector('.consultation-list') || document.body);
      alert('Consultation saved');
      if (window.updateDashboardStats) window.updateDashboardStats();
      window.closeConsultationModal();
    };

    renderConsultationList();

    const consultationSearch = document.getElementById('consultationSearch');
    if (consultationSearch) consultationSearch.addEventListener('input', renderConsultationList);
    if (dateFilter) dateFilter.addEventListener('change', renderConsultationList);
    if (clearDateFilter) clearDateFilter.addEventListener('click', () => {
      if (dateFilter) dateFilter.value = '';
      renderConsultationList();
    });

    if (window.location.hash === '#add') {
      setTimeout(() => {
        if (typeof window.openConsultationModal === 'function') {
          window.openConsultationModal();
        }
      }, 150);
    }
  });
})();