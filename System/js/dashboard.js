/* dashboard.js — dynamic dashboard data from the system store */

document.addEventListener('DOMContentLoaded', () => {
  function todayISO() {
   const d = new Date();
   const yyyy = d.getFullYear();
   const mm = String(d.getMonth() + 1).padStart(2, '0');
   const dd = String(d.getDate()).padStart(2, '0');
   return `${yyyy}-${mm}-${dd}`;
  }

  function toLocalDateISO(value) {
   const d = new Date(value);
   const yyyy = d.getFullYear();
   const mm = String(d.getMonth() + 1).padStart(2, '0');
   const dd = String(d.getDate()).padStart(2, '0');
   return `${yyyy}-${mm}-${dd}`;
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

  function getTodayConsultations() {
   const today = todayISO();
   return STI.getConsultations().filter((item) => (item.date || '').toString() === today);
  }

  function renderStats() {
   const patients = STI.getPatients();
   const inventory = STI.getInventory();
   const todayPatients = getTodayConsultations().length;
   const lowStockItems = inventory.filter((item) => Number(item.stock || 0) <= 5);

   const patientValue = document.querySelectorAll('.stat-card strong')[0];
   const lowStockCard = document.querySelectorAll('.stat-card strong')[1];

   if (patientValue) patientValue.textContent = String(todayPatients);
   if (lowStockCard) lowStockCard.textContent = String(lowStockItems.length);

   const patientName = document.getElementById('headerNurseName');
   if (patientName) patientName.textContent = 'Nurse Name';
  }

  function renderRecentVisits() {
   const recentBox = document.querySelector('.recent-visits');
   if (!recentBox) return;

   const recentHeader = recentBox.querySelector('.recent-header');
   const consultations = [...STI.getConsultations()].sort((a, b) => {
     const aDate = (a.date || '').toString();
     const bDate = (b.date || '').toString();
     if (aDate !== bDate) return bDate.localeCompare(aDate);
     return (b.time || '').toString().localeCompare(a.time || '');
   });

   recentBox.querySelectorAll('.recent-row').forEach((row) => row.remove());

   const preview = consultations.slice(0, 4);
   preview.forEach((consult) => {
     const row = document.createElement('div');
     row.className = 'recent-row';
     row.innerHTML = `
       <span>${escapeHtml(consult.patientName || 'Patient')}</span>
       <span>${escapeHtml(consult.chiefComplaint || '')}</span>
       <span>${escapeHtml(consult.time || '')}</span>
       <span>${escapeHtml(consult.date || '')}</span>
     `;
     recentBox.insertBefore(row, recentHeader.nextSibling);
   });
  }

  function renderLowStock() {
   const lowStockBox = document.querySelector('.low-stock-box');
   if (!lowStockBox) return;

   const inventory = STI.getInventory();
   const lowItems = inventory.filter((item) => Number(item.stock || 0) <= 6).slice(0, 5);
   lowStockBox.querySelectorAll('.stock-row').forEach((row) => row.remove());

   if (!lowItems.length) {
     const empty = document.createElement('div');
     empty.className = 'stock-row';
     empty.innerHTML = '<span>All stocked</span><span>—</span><span class="stock-status yellow">Good</span>';
     lowStockBox.appendChild(empty);
     return;
   }

   lowItems.forEach((item) => {
     const row = document.createElement('div');
     row.className = 'stock-row';
     const stock = Number(item.stock || 0);
     const statusClass = stock === 0 ? 'critical' : 'yellow';
     const statusText = stock === 0 ? 'Critical' : 'Low';
     row.innerHTML = `
       <span>${escapeHtml(item.name || '')}</span>
       <span>${stock} left</span>
       <span class="stock-status ${statusClass}">${statusText}</span>
     `;
     lowStockBox.appendChild(row);
   });
  }

  function renderActivity() {
   const activityBox = document.querySelectorAll('.small-dashboard-box')[1];
   if (!activityBox) return;

   const consultations = getTodayConsultations();
   const inventory = STI.getInventory();
   const lowStockItems = inventory.filter((item) => Number(item.stock || 0) <= 5);

   const items = [
     '🟢 8:00 AM &nbsp; Clinic Opened',
     `🟢 ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} &nbsp; ${consultations.length} patient(s) recorded today`,
     `🟢 ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} &nbsp; Inventory reviewed`,
     `🟡 ${lowStockItems.length} item(s) need restocking`
   ];

   activityBox.innerHTML = `
     <h3><i class="fa-regular fa-calendar-check"></i>Today's Activity</h3>
     ${items.map((item) => `<p>${item}</p>`).join('')}
   `;
  }

  function renderCalendar() {
   const datePicker = document.getElementById('dashboardDatePicker');
   const details = document.getElementById('calendarDetails');
   if (!datePicker) return;

   const defaultDate = todayISO();
   datePicker.value = defaultDate;
   datePicker.addEventListener('change', (event) => {
     renderCalendarDetails(event.target.value, details);
   });

   renderCalendarDetails(defaultDate, details);
  }

  function renderCalendarDetails(date, container) {
   if (!container) return;
   const consultations = STI.getConsultations().filter((item) => (item.date || '').toString() === date);
   const inventory = STI.getInventory().filter((item) => {
     if (!item.createdAt) return false;
     return toLocalDateISO(item.createdAt) === date;
   });

   let html = `<strong>${date}</strong>`;

   if (consultations.length) {
     html += '<div><strong>Consultation Log</strong><ul>' + consultations.map((item) => `<li>${escapeHtml(item.patientName || 'Patient')} — ${escapeHtml(item.chiefComplaint || '')}</li>`).join('') + '</ul></div>';
   }

   if (inventory.length) {
     html += '<div><strong>Inventory Added</strong><ul>' + inventory.map((item) => `<li>${escapeHtml(item.name || 'Item')} — ${Number(item.stock || 0)} stock</li>`).join('') + '</ul></div>';
   }

   if (!consultations.length && !inventory.length) {
     html += '<div class="empty-state">No records for this date.</div>';
   }

   container.innerHTML = html;
  }

  function renderNotifications() {
   const notificationBox = document.querySelector('.notification-box');
   if (!notificationBox) return;

   const inventory = STI.getInventory();
   const lowStock = inventory.filter((item) => Number(item.stock || 0) <= 5);
   const consultationsToday = getTodayConsultations().length;

   const messageList = [];

   if (lowStock.length) {
     const firstItem = lowStock[0];
     messageList.push({ type: 'error', text: `${firstItem.name || 'Item'} is running low.`, time: 'now' });
   } else {
     messageList.push({ type: 'success', text: 'Inventory is in good condition.', time: 'now' });
   }

   if (lowStock.length > 1) {
     const second = lowStock[1];
     messageList.push({ type: 'warning', text: `${second.name || 'Another item'} needs restocking.`, time: 'recently' });
   }

   messageList.push({ type: 'info', text: `${consultationsToday} patient${consultationsToday === 1 ? '' : 's'} visited today.`, time: 'recently' });

   notificationBox.innerHTML = `
     <h3><i class="fa-solid fa-bell"></i> Notification</h3>
     ${messageList.map((note) => `
       <p>${note.type === 'error' ? '🔴' : note.type === 'warning' ? '🟡' : note.type === 'success' ? '🟢' : '🔵'} ${escapeHtml(note.text)} <small>${escapeHtml(note.time)}</small></p>
     `).join('')}
   `;
  }

  function bindActions() {
   const viewAllVisits = document.querySelector('[data-action="view-all-visits"]');
   if (viewAllVisits) {
     viewAllVisits.addEventListener('click', () => {
       window.location.href = 'consultation.html';
     });
   }

   const inventoryButton = document.querySelector('[data-action="view-inventory"]');
   if (inventoryButton) {
     inventoryButton.addEventListener('click', () => {
       window.location.href = 'inventory.html';
     });
   }

   const addPatientButton = document.querySelector('[data-action="add-patient"]');
   if (addPatientButton) {
     addPatientButton.addEventListener('click', () => {
       if (typeof window.openConsultationModal === 'function') {
         window.openConsultationModal();
       }
     });
   }

   const addMedicineButton = document.querySelector('[data-action="add-medicine"]');
   if (addMedicineButton) {
     addMedicineButton.addEventListener('click', () => {
       if (typeof window.openInventoryModal === 'function') {
         window.openInventoryModal();
       }
     });
   }
  }

  renderStats();
  renderRecentVisits();
  renderLowStock();
  renderActivity();
  renderCalendar();
  renderNotifications();
  bindActions();
});