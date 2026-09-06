/* inventory.js — inventory driven by localStorage and shared across pages */

document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('inventoryTable');
  const inventorySearch = document.getElementById('inventorySearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const itemsPerPage = 7;
  let currentPage = 1;

  function getStatusLabel(stock) {
   if (stock <= 3) return 'Low';
   if (stock <= 6) return 'Low';
   return 'High';
  }

  function getStatusClass(stock) {
   if (stock <= 3) return 'low';
   if (stock <= 6) return 'low';
   return 'high';
  }

  function renderPagination(totalItems) {
   const pagination = document.querySelector('.inventory-bottom .pagination');
   if (!pagination) return;

   const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
   if (currentPage > totalPages) currentPage = totalPages;

   pagination.innerHTML = '';

   const prevBtn = document.createElement('button');
   prevBtn.type = 'button';
   prevBtn.textContent = '‹';
   prevBtn.disabled = currentPage <= 1;
   prevBtn.addEventListener('click', () => {
     if (currentPage > 1) {
       currentPage -= 1;
       renderInventory();
     }
   });
   pagination.appendChild(prevBtn);

   for (let page = 1; page <= totalPages; page += 1) {
     const pageBtn = document.createElement('button');
     pageBtn.type = 'button';
     pageBtn.textContent = String(page);
     pageBtn.className = page === currentPage ? 'current' : '';
     pageBtn.addEventListener('click', () => {
       currentPage = page;
       renderInventory();
     });
     pagination.appendChild(pageBtn);
   }

   const nextBtn = document.createElement('button');
   nextBtn.type = 'button';
   nextBtn.textContent = '›';
   nextBtn.disabled = currentPage >= totalPages;
   nextBtn.addEventListener('click', () => {
     if (currentPage < totalPages) {
       currentPage += 1;
       renderInventory();
     }
   });
   pagination.appendChild(nextBtn);
  }

  function renderInventory() {
   if (!table) return;

   const items = STI.getInventory();
   const searchValue = (inventorySearch ? inventorySearch.value : '').trim().toLowerCase();
   const selectedCategory = categoryFilter ? categoryFilter.value : '';
   const selectedStatus = statusFilter ? statusFilter.value : '';

   const filtered = items.filter((item) => {
     const name = (item.name || '').toLowerCase();
     const category = item.category || '';
     const status = getStatusLabel(item.stock || 0);
     const matchesSearch = name.includes(searchValue);
     const matchesCategory = !selectedCategory || category === selectedCategory;
     const matchesStatus = !selectedStatus || status === selectedStatus;
     return matchesSearch && matchesCategory && matchesStatus;
   });

   const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
   if (currentPage > totalPages) currentPage = totalPages;

   const startIndex = (currentPage - 1) * itemsPerPage;
   const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

   table.innerHTML = '';

   if (!filtered.length) {
     table.innerHTML = '<tr><td colspan="8">No inventory items found.</td></tr>';
     renderPagination(0);
     const countEl = document.querySelector('.inventory-bottom span');
     if (countEl) countEl.textContent = 'Showing 0 to 0 of 0 entries';
     return;
   }

   pageItems.forEach((item, index) => {
     const row = document.createElement('tr');
     row.dataset.id = item.id;
     const displayIndex = startIndex + index + 1;

     row.innerHTML = `
       <td>${displayIndex}</td>
       <td>${escapeHtml(item.name || '')}</td>
       <td>${escapeHtml(item.category || '')}</td>
       <td>${escapeHtml(item.unit || '')}</td>
       <td>${escapeHtml(item.expiry || '')}</td>
       <td>
         <div class="stock-control">
           <button type="button" data-direction="-1" data-id="${item.id}">−</button>
           <span>${Number(item.stock || 0)}</span>
           <button type="button" data-direction="1" data-id="${item.id}">+</button>
         </div>
       </td>
       <td>
         <span class="status ${getStatusClass(item.stock || 0)}">${getStatusLabel(item.stock || 0)}</span>
       </td>
       <td class="inventory-actions">
         <button class="inventory-edit" type="button" data-id="${item.id}"><i class="fa-solid fa-pencil"></i></button>
         <button class="inventory-delete" type="button" data-id="${item.id}"><i class="fa-regular fa-trash-can"></i></button>
       </td>
     `;

     row.querySelectorAll('button[data-direction]').forEach((button) => {
       button.addEventListener('click', () => {
         const amount = Number(button.dataset.direction || 0);
         window.changeStock(button, amount);
       });
     });

     const editButton = row.querySelector('.inventory-edit');
     if (editButton) {
       editButton.addEventListener('click', () => {
         openInventoryModal();
         const modal = document.getElementById('inventoryModal');
         if (!modal) return;

         const title = modal.querySelector('.inventory-modal-header h2');
         if (title) title.textContent = 'Edit Inventory Item';

         const saveButton = modal.querySelector('.inventory-save');
         if (saveButton) saveButton.dataset.editId = String(item.id);

         document.getElementById('inventoryName').value = item.name || '';
         document.getElementById('inventoryUnit').value = item.unit || 'Bottle';
         document.getElementById('inventoryCategory').value = item.category || 'Medicine';
         document.getElementById('inventoryStock').value = item.stock || 0;
         document.getElementById('inventorySupplier').value = item.supplier || '';
         document.getElementById('inventoryExpiry').value = item.expiry || '';
         document.getElementById('inventoryNotes').value = item.notes || '';
       });
     }

     const deleteBtn = row.querySelector('.inventory-delete');
     if (deleteBtn) {
       deleteBtn.addEventListener('click', async (ev) => {
         ev.stopPropagation();
         try {
           const ok = window.showConfirm ? await window.showConfirm('Move this item to archives?') : confirm('Move this item to archives?');
           if (!ok) return;

           const inventoryArr = STI.getInventory();
           const remaining = inventoryArr.filter((entry) => String(entry.id) !== String(item.id));
           STI.saveInventory(remaining);

           const archives = STI.getArchives();
           const archiveEntry = {
             id: STI.nextId(archives),
             name: item.name || '',
             category: item.category || '',
             reason: 'Deleted',
             lastStock: Number(item.stock || 0),
             deletedAt: new Date().toISOString()
           };
           archives.unshift(archiveEntry);
           STI.saveArchives(archives);

           renderInventory();
           if (window.animateAction) window.animateAction(document.querySelector('.inventory-table') || document.body);
           alert(`${item.name} moved to archives.`);
         } catch (e) {
           console.error('archive item', e);
         }
       });
     }

     table.appendChild(row);
   });

   const countEl = document.querySelector('.inventory-bottom span');
   if (countEl) {
     const showingFrom = filtered.length === 0 ? 0 : startIndex + 1;
     const showingTo = Math.min(startIndex + pageItems.length, filtered.length);
     countEl.textContent = `Showing ${showingFrom} to ${showingTo} of ${filtered.length} entries`;
   }

   renderPagination(filtered.length);
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

  window.changeStock = function (button, amount) {
   const id = button.dataset.id;
   const inventory = STI.getInventory();
   const item = inventory.find((entry) => String(entry.id) === String(id));
   if (!item) return;

   item.stock = Math.max(0, Number(item.stock || 0) + Number(amount || 0));
   STI.saveInventory(inventory);
   renderInventory();
   try { if (window.animateAction) window.animateAction(document.querySelector('.inventory-table') || document.body); } catch(e){}
  };

  window.openInventoryModal = function () {
   const modal = document.getElementById('inventoryModal');
   if (modal) modal.style.display = 'flex';
  };

  window.closeInventoryModal = function () {
   const modal = document.getElementById('inventoryModal');
   if (modal) modal.style.display = 'none';
   const form = document.getElementById('inventoryName');
   if (form) form.focus();
  };

  window.saveInventoryItem = function () {
   const name = document.getElementById('inventoryName').value.trim();
   const unit = document.getElementById('inventoryUnit').value;
   const category = document.getElementById('inventoryCategory').value;
   const stock = Math.max(0, Number(document.getElementById('inventoryStock').value || 0));
   const supplier = document.getElementById('inventorySupplier').value.trim();
   const expiry = document.getElementById('inventoryExpiry').value;
   const notes = document.getElementById('inventoryNotes').value.trim();

   if (!name) {
     alert('Please enter an item name.');
     return;
   }

   const inventory = STI.getInventory();
   const editId = document.querySelector('.inventory-save')?.dataset?.editId;

   if (editId) {
     const target = inventory.find((entry) => String(entry.id) === String(editId));
     if (target) {
       Object.assign(target, {
         name,
         category,
         unit,
         expiry: expiry || target.expiry || '2027-01-01',
         stock,
         supplier: supplier || '',
         notes: notes || '',
         updatedAt: new Date().toISOString()
       });
       STI.saveInventory(inventory);
       renderInventory();
       closeInventoryModal();
       if (window.animateAction) window.animateAction(document.querySelector('.inventory-table') || document.body);
       resetInventoryForm();
       return;
     }
   }

   inventory.unshift({
     id: STI.nextId(inventory),
     name,
     category,
     unit,
     expiry: expiry || '2027-01-01',
     stock,
     supplier: supplier || '',
     notes: notes || '',
     createdAt: new Date().toISOString()
   });

   STI.saveInventory(inventory);
   renderInventory();
   closeInventoryModal();
   try { if (window.animateAction) window.animateAction(document.querySelector('.inventory-table') || document.body); } catch(e){}
   resetInventoryForm();
  };

  function resetInventoryForm() {
   const modal = document.getElementById('inventoryModal');
   if (modal) {
     const title = modal.querySelector('.inventory-modal-header h2');
     if (title) title.textContent = 'Add New Inventory Item';
     const saveButton = modal.querySelector('.inventory-save');
     if (saveButton) delete saveButton.dataset.editId;
   }
   document.getElementById('inventoryName').value = '';
   document.getElementById('inventoryUnit').value = 'Bottle';
   document.getElementById('inventoryCategory').value = 'Medicine';
   document.getElementById('inventorySupplier').value = '';
   document.getElementById('inventoryStock').value = '0';
   document.getElementById('inventoryNotes').value = '';
   document.getElementById('inventoryExpiry').value = '';
  }


  window.addInventoryItem = function () {
   openInventoryModal();
  };

  window.filterInventory = function () {
   renderInventory();
  };

  if (inventorySearch) inventorySearch.addEventListener('keyup', () => { currentPage = 1; renderInventory(); });
  if (categoryFilter) categoryFilter.addEventListener('change', () => { currentPage = 1; renderInventory(); });
  if (statusFilter) statusFilter.addEventListener('change', () => { currentPage = 1; renderInventory(); });

  if (window.location.hash === '#add') {
    setTimeout(() => {
      if (typeof window.openInventoryModal === 'function') {
        window.openInventoryModal();
      }
    }, 150);
  }

  renderInventory();
});