/* archives.js — shared localStorage archive logic */

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('archiveSearch');
  const categorySelect = document.getElementById('archiveCategory');
  const tableBody = document.getElementById('archiveTableBody');
  const paginationContainer = document.getElementById('archivePagination');
  const countEl = document.querySelector('.archive-count');

  const rowsPerPage = 7;
  let currentPage = 1;

  function getFilteredRows() {
    const search = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const category = (categorySelect ? categorySelect.value : 'all');
    const items = STI.getArchives();

    return items.filter((row) => {
      const itemName = (row.name || '').toLowerCase();
      const rowCategory = row.category || '';
      const matchesSearch = !search || itemName.includes(search);
      const matchesCategory = category === 'all' || rowCategory === category;
      return matchesSearch && matchesCategory;
    });
  }

  function renderPagination(totalPages) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'page-arrow';
    prev.textContent = '‹';
    prev.disabled = currentPage <= 1;
    prev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderArchivePage();
      }
    });
    paginationContainer.appendChild(prev);

    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement('button');
      btn.className = 'page-number' + (p === currentPage ? ' active' : '');
      btn.textContent = p;
      btn.addEventListener('click', () => {
        currentPage = p;
        renderArchivePage();
      });
      paginationContainer.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'page-arrow';
    next.textContent = '›';
    next.disabled = currentPage >= totalPages;
    next.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderArchivePage();
      }
    });
    paginationContainer.appendChild(next);
  }

  function renderArchivePage() {
    const filtered = getFilteredRows();
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    if (!tableBody) return;
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filtered.slice(start, start + rowsPerPage);

    pageItems.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${start + index + 1}</td>
        <td>${escapeHtml(item.name || '')}</td>
        <td>${escapeHtml(item.category || '')}</td>
        <td>${escapeHtml(item.reason || '')}</td>
        <td>${escapeHtml(item.lastStock || 0)}</td>
        <td class="archive-actions">
          <button type="button" class="delete-btn" data-id="${item.id}">Delete Permanently</button>
          <button type="button" class="restore-btn" data-id="${item.id}">Restore</button>
        </td>
      `;

      const deleteBtn = row.querySelector('.delete-btn');
      const restoreBtn = row.querySelector('.restore-btn');

      deleteBtn.addEventListener('click', () => deleteArchiveFromStore(item.id));
      restoreBtn.addEventListener('click', () => restoreArchiveItem(item.id));

      tableBody.appendChild(row);
    });

    if (countEl) {
      const total = filtered.length;
      const showingFrom = total === 0 ? 0 : start + 1;
      const showingTo = total === 0 ? 0 : Math.min(start + pageItems.length, total);
      countEl.textContent = `Showing ${showingFrom} to ${showingTo} of ${total} entries`;
    }

    renderPagination(totalPages);
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

  async function deleteArchiveFromStore(id) {
    try {
      const archives = STI.getArchives();
      const target = archives.find((item) => String(item.id) === String(id));
      if (!target) return;
      const ok = window.showConfirm ? await window.showConfirm('Permanently delete this archive entry? This cannot be undone.') : confirm('Permanently delete this archive entry? This cannot be undone.');
      if (!ok) return;
      const remaining = archives.filter((item) => String(item.id) !== String(id));
      STI.saveArchives(remaining);
      renderArchivePage();
      if (window.animateAction) window.animateAction(document.querySelector('.archive-table') || document.body);
    } catch (e) {
      console.error('deleteArchiveFromStore', e);
    }
  }

  async function restoreArchiveItem(id) {
    try {
      const archives = STI.getArchives();
      const target = archives.find((item) => String(item.id) === String(id));
      if (!target) return;
      const ok = window.showConfirm ? await window.showConfirm(`Restore "${target.name}" to inventory?`) : confirm(`Restore "${target.name}" to inventory?`);
      if (!ok) return;

      const inventory = STI.getInventory();
      inventory.unshift({
        id: STI.nextId(inventory),
        name: target.name,
        category: target.category,
        unit: target.unit || 'Units',
        expiry: target.expiry || '2027-01-01',
        stock: Number(target.lastStock || 0)
      });
      STI.saveInventory(inventory);
      STI.saveArchives(archives.filter((item) => String(item.id) !== String(id)));
      alert(`${target.name} has been restored to inventory.`);
      renderArchivePage();
      if (window.animateAction) window.animateAction(document.querySelector('.archive-table') || document.body);
    } catch (e) {
      console.error('restoreArchiveItem', e);
    }
  }

  window.searchArchives = function () {
    currentPage = 1;
    renderArchivePage();
  };

  window.deleteArchive = function (button) {
    const id = button.getAttribute('data-id');
    deleteArchiveFromStore(id);
  };

  window.restoreItem = function (button) {
    const id = button.getAttribute('data-id');
    restoreArchiveItem(id);
  };

  if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; renderArchivePage(); });
  if (categorySelect) categorySelect.addEventListener('change', () => { currentPage = 1; renderArchivePage(); });

  renderArchivePage();
});