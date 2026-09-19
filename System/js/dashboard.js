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

  let calendarCurrentDate = new Date();

  function renderCalendar() {
   const monthYearEl = document.getElementById('calendarMonthYear');
   const datesContainer = document.getElementById('calendarDates');
   if (!datesContainer) return;

   const year = calendarCurrentDate.getFullYear();
   const month = calendarCurrentDate.getMonth();

   if (monthYearEl) {
     const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
     monthYearEl.textContent = `${monthNames[month]} ${year}`;
   }

   const firstDay = new Date(year, month, 1);
   const lastDay = new Date(year, month + 1, 0);
   const startDate = new Date(firstDay);
   startDate.setDate(startDate.getDate() - firstDay.getDay());

   datesContainer.innerHTML = '';

   for (let i = 0; i < 42; i++) {
     const date = new Date(startDate);
     date.setDate(date.getDate() + i);
     const dateISO = toLocalDateISO(date);
     const isCurrentMonth = date.getMonth() === month;
     const isToday = dateISO === todayISO();

     const consultations = STI.getConsultations().filter((item) => (item.date || '').toString() === dateISO);
     const inventory = STI.getInventory().filter((item) => {
       if (!item.createdAt) return false;
       return toLocalDateISO(item.createdAt) === dateISO;
     });
     const hasEvents = consultations.length > 0 || inventory.length > 0;

     const cell = document.createElement('div');
     cell.className = 'calendar-date-cell';
     if (!isCurrentMonth) cell.classList.add('other-month');
     if (isToday) cell.classList.add('today');
     if (hasEvents) cell.classList.add('has-events');

     cell.textContent = date.getDate();
     cell.style.cursor = isCurrentMonth ? 'pointer' : 'default';

     if (isCurrentMonth) {
       cell.addEventListener('click', () => {
         showCalendarDateModal(dateISO);
       });
     }

     datesContainer.appendChild(cell);
   }
  }

  function showCalendarDateModal(dateISO) {
   const modal = document.getElementById('calendarDateModal');
   const titleEl = document.getElementById('calendarModalTitle');
   const contentEl = document.getElementById('calendarModalContent');

   if (!modal) return;

   const consultations = STI.getConsultations().filter((item) => (item.date || '').toString() === dateISO);
   const inventory = STI.getInventory().filter((item) => {
     if (!item.createdAt) return false;
     return toLocalDateISO(item.createdAt) === dateISO;
   });

   const dateObj = new Date(dateISO);
   const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

   if (titleEl) {
     titleEl.textContent = formattedDate;
   }

   let html = '';

   if (consultations.length) {
     html += '<strong>Consultation Log</strong><ul>';
     consultations.forEach((item) => {
       html += `<li><strong>${escapeHtml(item.patientName || 'Patient')}</strong><br/><small>Complaint: ${escapeHtml(item.chiefComplaint || '—')}</small><br/><small>Time: ${escapeHtml(item.time || '—')}</small></li>`;
     });
     html += '</ul>';
   }

   if (inventory.length) {
     html += '<strong>Inventory Added</strong><ul>';
     inventory.forEach((item) => {
       html += `<li><strong>${escapeHtml(item.name || 'Item')}</strong><br/><small>Stock: ${Number(item.stock || 0)}</small></li>`;
     });
     html += '</ul>';
   }

   if (!consultations.length && !inventory.length) {
     html = '<p>No records for this date.</p>';
   }

   if (contentEl) {
     contentEl.innerHTML = html;
   }

   modal.style.display = 'flex';
  }

  window.closeDashboardCalendarModal = function() {
   const modal = document.getElementById('calendarDateModal');
   if (modal) {
     modal.style.display = 'none';
   }
  };

  window.updateDashboardStats = function() {
   renderStats();
   renderRecentVisits();
   renderLowStock();
   renderActivity();
   renderNotifications();
  };

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

   const prevMonthBtn = document.getElementById('calendarPrevMonth');
   if (prevMonthBtn) {
     prevMonthBtn.addEventListener('click', () => {
       calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
       renderCalendar();
     });
   }

   const nextMonthBtn = document.getElementById('calendarNextMonth');
   if (nextMonthBtn) {
     nextMonthBtn.addEventListener('click', () => {
       calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
       renderCalendar();
     });
   }

   const calendarModal = document.getElementById('calendarDateModal');
   if (calendarModal) {
     calendarModal.addEventListener('click', (e) => {
       if (e.target === calendarModal || e.target.classList.contains('calendar-modal-overlay')) {
         window.closeDashboardCalendarModal();
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