(function () {
  const STORAGE_KEYS = {
   patients: 'sti_patients',
   consultations: 'sti_consultations',
   inventory: 'sti_inventory',
   archives: 'sti_archives',
   seeded: 'sti_system_seeded_v1'
  };

  function readJSON(key, fallback) {
   try {
     const raw = localStorage.getItem(key);
     return raw ? JSON.parse(raw) : fallback;
   } catch (error) {
     console.error('readJSON failed for', key, error);
     return fallback;
   }
  }

  function writeJSON(key, value) {
   localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeedData() {
   if (localStorage.getItem(STORAGE_KEYS.seeded)) return;

   const defaultPatients = [
     { id: 1, name: 'Chadler Esparteto', studentNumber: '2021-001', strand: 'HS', section: '12-A' },
     { id: 2, name: 'Mary Josephine Lajom', studentNumber: '2021-002', strand: 'STEM', section: '12-B' },
     { id: 3, name: 'Daniela Marzan', studentNumber: '2021-003', strand: 'ITMAWD', section: '12-C' }
   ];

   const defaultInventory = [
     { id: 1, name: 'Alcohol', category: 'Antiseptic', unit: 'Bottles', expiry: '2026-08-03', stock: 11 },
     { id: 2, name: 'Bandages', category: 'Supplies', unit: 'Boxes', expiry: '2026-12-21', stock: 5 },
     { id: 3, name: 'Betadine', category: 'Antiseptic', unit: 'Bottles', expiry: '2026-12-21', stock: 2 },
     { id: 4, name: 'Cotton', category: 'Supplies', unit: 'Packs', expiry: '2026-12-21', stock: 13 },
     { id: 5, name: 'Cough Syrup', category: 'Medicine', unit: 'Bottles', expiry: '2026-12-21', stock: 15 },
     { id: 6, name: 'Instant Heat Pack', category: 'Supplies', unit: 'Packs', expiry: '2026-12-21', stock: 15 },
     { id: 7, name: 'Paracetamol', category: 'Medicine', unit: 'Boxes', expiry: '2026-12-21', stock: 16 }
   ];

   const defaultConsultations = [
     { id: 1, patientId: 1, patientName: 'Chadler Esparteto', time: '7:00 AM', date: '2026-07-26', chiefComplaint: 'Fever' },
     { id: 2, patientId: 2, patientName: 'Mary Josephine Lajom', time: '8:50 AM', date: '2026-07-26', chiefComplaint: 'Headache' },
     { id: 3, patientId: 3, patientName: 'Daniela Marzan', time: '9:20 AM', date: '2026-07-26', chiefComplaint: 'Allergy' }
   ];

   const defaultArchives = [
     { id: 1, name: 'Alcohol', category: 'Antiseptic', reason: 'Expired', lastStock: 1 },
     { id: 2, name: 'Bandages', category: 'Supplies', reason: 'Damaged Packaging', lastStock: 2 },
     { id: 3, name: 'Betadine', category: 'Antiseptic', reason: 'Discontinued', lastStock: 0 },
     { id: 4, name: 'Cotton', category: 'Supplies', reason: 'Discontinued', lastStock: 0 },
     { id: 5, name: 'Cough Syrup', category: 'Medicine', reason: 'Expired', lastStock: 3 },
     { id: 6, name: 'Instant Heat Pack', category: 'Supplies', reason: 'Damaged', lastStock: 0 },
     { id: 7, name: 'Paracetamol', category: 'Medicine', reason: 'Expired', lastStock: 2 }
   ];

   writeJSON(STORAGE_KEYS.patients, defaultPatients);
   writeJSON(STORAGE_KEYS.inventory, defaultInventory);
   writeJSON(STORAGE_KEYS.consultations, defaultConsultations);
   writeJSON(STORAGE_KEYS.archives, defaultArchives);
   localStorage.setItem(STORAGE_KEYS.seeded, '1');
  }

  function nextId(items) {
   if (!items || items.length === 0) return 1;
   return items.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
  }

  function getPatients() {
   ensureSeedData();
   return readJSON(STORAGE_KEYS.patients, []);
  }

  function savePatients(patients) {
   writeJSON(STORAGE_KEYS.patients, patients);
  }

  function getInventory() {
   ensureSeedData();
   return readJSON(STORAGE_KEYS.inventory, []);
  }

  function saveInventory(items) {
   writeJSON(STORAGE_KEYS.inventory, items);
  }

  function getConsultations() {
   ensureSeedData();
   return readJSON(STORAGE_KEYS.consultations, []);
  }

  function saveConsultations(items) {
   writeJSON(STORAGE_KEYS.consultations, items);
  }

  function getArchives() {
   ensureSeedData();
   return readJSON(STORAGE_KEYS.archives, []);
  }

  function saveArchives(items) {
   writeJSON(STORAGE_KEYS.archives, items);
  }

  window.STI = {
   ensureSeedData,
   getPatients,
   savePatients,
   getInventory,
   saveInventory,
   getConsultations,
   saveConsultations,
   getArchives,
   saveArchives,
   nextId
  };

  document.addEventListener('DOMContentLoaded', () => {
   ensureSeedData();
   const currentPage = window.location.pathname;
   const menuItems = document.querySelectorAll('.menu-item');
   menuItems.forEach((item) => {
     const link = item.getAttribute('href');
     if (link && currentPage.includes(link)) {
       item.classList.add('active');
     }
   });

   // Load header profile across pages (name and avatar)
   try {
     function loadHeaderProfile() {
       try {
         const raw = localStorage.getItem('nurseProfile');
         const profile = raw ? JSON.parse(raw) : null;
         const name = profile && profile.name ? profile.name : 'Nurse Name';
         const headerNameEl = document.getElementById('headerNurseName');
         if (headerNameEl) headerNameEl.textContent = name;

         // initials fallback
         let initials = 'NN';
         if (profile && profile.name) {
           const parts = profile.name.trim().split(/\s+/).filter(Boolean);
           if (parts.length === 1) initials = parts[0].slice(0, 2).toUpperCase();
           else initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
         }

         document.querySelectorAll('.nurse-avatar, .header-avatar, .profile-avatar').forEach((el) => {
           if (!el) return;
           if (profile && profile.avatarUrl) {
             el.innerHTML = `<img src="${profile.avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
           } else {
             el.innerHTML = `<span class="avatar-initials">${initials}</span>`;
           }
         });
       } catch (e) { console.error('loadHeaderProfile inner', e); }
     }
     // expose for other scripts (profile page) to call after saving
     try { window.loadHeaderProfile = loadHeaderProfile; } catch (e) {}
     loadHeaderProfile();

     // react to changes made in other tabs/pages
     window.addEventListener('storage', function (ev) {
       if (ev.key === 'nurseProfile') loadHeaderProfile();
     });
   } catch (e) { console.error('loadHeaderProfile', e); }
  });
})();

function confirmDelete() {
  return confirm('Are you sure you want to delete this record?');
}

function goTo(page) {
  window.location.href = page;
}

function toggleProfileMenu() {
  const menu = document.getElementById('profileMenu');
  if (menu) menu.classList.toggle('show');
}

document.addEventListener('click', function (event) {
  const menu = document.getElementById('profileMenu');
  const profileButton = document.getElementById('profileButton');
  if (!menu || !profileButton) return;
  if (!menu.contains(event.target) && !profileButton.contains(event.target)) {
   menu.classList.remove('show');
  }
});

function openProfile() {
  window.location.href = 'profile.html';
}