/**
 * JOST Quality Suite — Failure Register & Operator Logging Module
 * Handles Operator Incident Capture, Plant-Wise Scoping, Quality Review Table, Filtering, and 8D Linkage.
 */

(function (window) {
  'use strict';

  const FailureRegisterManager = {
    activeTab: 'all',
    searchQuery: '',
    selectedPlantFilter: 'all',

    init() {
      this.populatePlantDropdown();
      this.populateCategoryDropdown();
      this.populateObservedLocations();
      this.render();
    },

    populatePlantDropdown() {
      const select = document.getElementById('log-plant-select');
      if (!select) return;

      const user = QualityStorageSync.getCurrentUser();
      const authorizedPlants = QualityStorageSync.getUserAuthorizedPlants(user);

      select.innerHTML = '';
      authorizedPlants.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.code})`;
        if (idx === 0) opt.selected = true;
        select.appendChild(opt);
      });

      // If user has only 1 plant, lock the dropdown
      if (authorizedPlants.length === 1 && !QualityStorageSync.isAdmin()) {
        select.disabled = true;
        select.title = `Locked to assigned plant: ${authorizedPlants[0].name}`;
      } else {
        select.disabled = false;
      }
    },

    populateCategoryDropdown() {
      const select = document.getElementById('category_id');
      if (!select) return;
      const categories = QualityStorageSync.getCategories();
      select.innerHTML = '<option value="">-- Select Defect Category --</option>';
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.code})`;
        select.appendChild(opt);
      });
    },

    populateObservedLocations() {
      const listContainer = document.getElementById('observed-list');
      if (!listContainer) return;
      const places = QualityStorageSync.getObservedPlaces();
      listContainer.innerHTML = '';
      places.forEach(p => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.innerHTML = `
          <span>${p.name}</span>
          <span class="type-badge">${p.type}</span>
        `;
        div.onclick = (e) => {
          e.stopPropagation();
          document.getElementById('observed-selected').innerText = p.name;
          document.getElementById('observed_where').value = p.name;
          document.getElementById('observed-menu').style.display = 'none';
        };
        listContainer.appendChild(div);
      });
    },

    setTab(tab) {
      this.activeTab = tab;
      document.querySelectorAll('#review-view .tab').forEach(t => t.classList.remove('active'));
      const activeEl = document.getElementById(`tab-reg-${tab}`);
      if (activeEl) activeEl.classList.add('active');
      this.render();
    },

    setPlantFilter(plantId) {
      this.selectedPlantFilter = plantId;
      this.render();
    },

    setSearch(query) {
      this.searchQuery = (query || '').toLowerCase().trim();
      this.render();
    },

    render() {
      const tbody = document.getElementById('records-body');
      if (!tbody) return;

      const user = QualityStorageSync.getCurrentUser();
      const records = QualityStorageSync.getState().failureRecords || [];
      const isQualityOrAdmin = QualityStorageSync.canReviewFailureLog(null, user);

      // Render Plant Filter Dropdown in Review Toolbar if present
      const plantFilterContainer = document.getElementById('reg-plant-filter-container');
      if (plantFilterContainer) {
        const authPlants = QualityStorageSync.getUserAuthorizedPlants(user);
        plantFilterContainer.innerHTML = `
          <div style="display:flex; align-items:center; gap:6px; font-size:0.78rem;">
            <span style="color:var(--qs-text-muted); font-weight:600;">🏢 Plant Filter:</span>
            <select onchange="FailureRegisterManager.setPlantFilter(this.value)" style="padding:4px 8px; font-size:0.75rem; background:var(--qs-bg-input); color:var(--qs-text-main); border:1px solid var(--qs-border-main); border-radius:6px; cursor:pointer;">
              <option value="all">All Authorized Plants (${authPlants.length})</option>
              ${authPlants.map(p => `<option value="${p.id}" ${this.selectedPlantFilter === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>
        `;
      }

      tbody.innerHTML = '';

      // Filter records based on:
      // 1. User authorized plants
      // 2. Selected plant filter
      // 3. Search query & tabs
      const filtered = records.filter(r => {
        // Plant scope check
        if (!QualityStorageSync.hasPlantAccess(r.plant_id, user)) {
          return false;
        }
        if (this.selectedPlantFilter !== 'all' && r.plant_id !== this.selectedPlantFilter) {
          return false;
        }

        const searchStr = `${r.id} ${r.plant_name || ''} ${r.project_code || ''} ${r.part_number || ''} ${r.part_name || ''} ${r.category_name || ''} ${r.observed_where || ''} ${r.failure_description || ''}`.toLowerCase();
        const matchesSearch = !this.searchQuery || searchStr.includes(this.searchQuery);

        let matchesTab = true;
        if (this.activeTab === 'pending') matchesTab = !r.eight_d_report_id && r.status === 'Review Pending';
        else if (this.activeTab === 'verified') matchesTab = Boolean(r.eight_d_report_id);
        else if (this.activeTab === 'minor') matchesTab = !r.eight_d_required && r.status !== 'Review Pending';

        return matchesSearch && matchesTab;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--qs-text-muted); font-size:0.85rem;"><span style="font-size:1.5rem; margin-bottom:8px; display:block;">📥</span>No failure logs matching current criteria for your authorized plants.</td></tr>`;
        return;
      }

      filtered.forEach(r => {
        const tr = document.createElement('tr');
        const dateStr = new Date(r.created_at).toLocaleDateString();
        const canReviewThisRecord = QualityStorageSync.canReviewFailureLog(r, user);

        tr.innerHTML = `
          <td style="color:var(--qs-text-muted); font-size:0.75rem; white-space:nowrap;">
            <strong style="color:var(--qs-text-main);">${escapeHtml(r.id)}</strong><br><small>${dateStr}</small>
          </td>
          <td>
            <div style="font-weight:700; color:var(--qs-primary); font-size:0.82rem;">${escapeHtml(r.plant_name ? r.plant_name.split('—')[1]?.trim() || r.plant_name : 'Plant 1')}</div>
            <small style="font-size:0.7rem; color:var(--qs-text-muted);">By: ${escapeHtml(r.logged_by || 'Plant User')}</small>
          </td>
          <td>
            <strong style="color:var(--qs-primary); font-size:0.82rem;">${escapeHtml(r.project_code || 'N/A')}</strong><br>
            <span style="font-size:0.75rem; color:var(--qs-text-main); font-weight:600;">${escapeHtml(r.part_number)}</span>
            <small style="font-size:0.7rem; color:var(--qs-text-muted); display:block;">${escapeHtml(r.part_name || 'Part')}</small>
          </td>
          <td>
            <span class="badge badge-warning" style="font-size:0.7rem; font-weight:600;">${escapeHtml(r.category_name || 'General')}</span>
          </td>
          <td style="font-weight:700; text-align:center; font-size:0.85rem;">${escapeHtml(String(r.qty_rejected || 1))}</td>
          <td style="font-size:0.78rem; line-height:1.4;">
            <div style="font-weight:700; color:var(--qs-text-main); margin-bottom:2px;">📍 ${escapeHtml(r.observed_where || 'Shop Floor')}</div>
            <div style="color:var(--qs-text-sub); word-break:break-word;">${escapeHtml(r.failure_description || '')}</div>
          </td>
          <td>
            ${canReviewThisRecord ? `
              <select onchange="window.handle8DToggle('${r.id}', this.value)" style="padding:5px 8px; font-size:0.75rem; font-weight:600; background:var(--qs-bg-input); color:var(--qs-text-main); border-radius:6px; border:1px solid var(--qs-border-main); cursor:pointer; width:100%;">
                <option value="false" ${!r.eight_d_required ? 'selected' : ''}>No (Minor)</option>
                <option value="true" ${r.eight_d_required ? 'selected' : ''}>Yes (Initiate 8D)</option>
              </select>
            ` : `
              <span style="font-size:0.72rem; font-weight:600; color:var(--qs-text-muted); padding:3px 8px; border-radius:4px; background:var(--qs-tag-bg); display:inline-block;">
                ${r.eight_d_required ? '🟡 8D Required' : '⚪ Logged (Read-Only)'}
              </span>
            `}
          </td>
          <td style="text-align:center;">
            ${r.eight_d_number 
              ? `<a href="#" onclick="window.open8DReport('${escapeHtml(r.eight_d_report_id)}')" class="qs-link-badge" style="font-size:0.75rem; font-weight:700; color:var(--qs-primary); text-decoration:none; padding:4px 8px; border-radius:6px; background:rgba(37,99,235,0.1); border:1px solid rgba(37,99,235,0.25); display:inline-flex; align-items:center; gap:4px;">📑 ${escapeHtml(r.eight_d_number)}</a>`
              : `<span style="color:var(--qs-text-muted); opacity:0.5; font-size:0.75rem;">None</span>`
            }
          </td>
        `;
        tbody.appendChild(tr);
      });
    },

    async handleFormSubmit(e) {
      e.preventDefault();
      const categories = QualityStorageSync.getCategories();
      const catId = document.getElementById('category_id').value;
      const selectedCat = categories.find(c => c.id === catId);

      const plantSelect = document.getElementById('log-plant-select');
      const plantId = plantSelect ? plantSelect.value : null;

      const payload = {
        plant_id: plantId,
        project_code: document.getElementById('project_code').value.trim(),
        part_number: document.getElementById('part_number').value.trim(),
        part_name: document.getElementById('part_name').value.trim(),
        category_id: catId,
        category_name: selectedCat ? selectedCat.name : 'General Defect',
        qty_rejected: parseInt(document.getElementById('qty_rejected').value) || 1,
        observed_where: document.getElementById('observed_where').value,
        failure_description: document.getElementById('failure_description').value.trim()
      };

      try {
        const newRecord = await QualityStorageSync.addFailureLog(payload);
        document.getElementById('entry-form-container').style.display = 'none';
        document.getElementById('success-screen').style.display = 'block';
        document.getElementById('logged-id-badge').innerText = `Registered as Incident ID: ${newRecord.id} (${newRecord.plant_name})`;
        if (window.showCustomToast) {
          window.showCustomToast(`Failure log ${newRecord.id} registered successfully for ${newRecord.plant_name}`, 'success');
        }
      } catch (err) {
        if (window.showCustomAlert) {
          await window.showCustomAlert('Error Saving Failure Log', err.message, 'error');
        } else {
          alert('Error saving failure log: ' + err.message);
        }
      }
    },

    resetEntryForm() {
      document.getElementById('failure-form').reset();
      this.populatePlantDropdown();
      document.getElementById('entry-form-container').style.display = 'block';
      document.getElementById('success-screen').style.display = 'none';
    }
  };

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.FailureRegisterManager = FailureRegisterManager;
})(typeof window !== 'undefined' ? window : this);
