/**
 * JOST Quality Suite — Lessons Learned & Corporate Knowledge Module
 * Features:
 * 1. High-Density List / Table View (Default) & Card Grid View toggle.
 * 2. Automated 8D-to-Lessons Learned transfer with Product Classification Tagging.
 * 3. Instant search & multi-taxonomy filtering across corporate preventive rules.
 * 4. Admin-only modification controls (Edit / Delete).
 */

(function (window) {
  'use strict';

  function ensureLessonsLearnedStyles() {
    if (document.getElementById('qs-ll-view-styles')) return;
    const style = document.createElement('style');
    style.id = 'qs-ll-view-styles';
    style.textContent = `
      .qs-ll-list-container {
        width: 100% !important;
        display: block !important;
      }
      .qs-ll-grid-container {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important;
        gap: 1.25rem !important;
        margin-top: 1rem !important;
      }
      .qs-ll-table-wrap {
        width: 100% !important;
        min-width: 100% !important;
        display: block !important;
        overflow-x: auto;
        border: 1px solid var(--qs-border-main);
        border-radius: 10px;
        background: var(--qs-bg-card);
        margin-top: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        box-sizing: border-box !important;
      }
      .qs-ll-table {
        width: 100% !important;
        min-width: 860px;
        border-collapse: collapse;
        font-size: 13px;
        text-align: left;
        color: var(--qs-text-main);
        table-layout: fixed !important;
      }
      .qs-ll-table th {
        background: var(--qs-bg-card-alt);
        color: var(--qs-text-muted);
        font-weight: 700;
        font-size: 11.5px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 12px 14px;
        border-bottom: 2px solid var(--qs-border-main);
        position: sticky;
        top: 0;
        z-index: 2;
        white-space: nowrap;
        box-sizing: border-box;
      }
      .qs-ll-table td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--qs-border-light);
        vertical-align: top;
        word-break: break-word;
        box-sizing: border-box;
        line-height: 1.45;
      }
      .qs-ll-table tr:hover td {
        background: rgba(255, 255, 255, 0.02);
      }
      .qs-ll-badge-id {
        font-size: 12px;
        font-weight: 700;
        color: #60a5fa;
        font-family: monospace;
      }
      .qs-ll-tag-pill {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 4px;
        background: rgba(37, 99, 235, 0.15);
        color: #93c5fd;
        border: 1px solid rgba(37, 99, 235, 0.3);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
      .qs-ll-rule-box {
        background: rgba(2, 132, 199, 0.1);
        border: 1px solid rgba(2, 132, 199, 0.3);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 12.5px;
        color: var(--qs-text-main);
        font-weight: 600;
        line-height: 1.45;
      }
      .qs-view-toggle-btn {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        background: var(--qs-bg-card-alt);
        color: var(--qs-text-muted);
        border: 1px solid var(--qs-border-main);
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .qs-view-toggle-btn.active {
        background: var(--qs-primary);
        color: #ffffff;
        border-color: var(--qs-primary);
        box-shadow: 0 2px 8px var(--qs-primary-glow);
      }
    `;
    document.head.appendChild(style);
  }

  const LessonsLearnedManager = {
    viewMode: 'list', // 'list' (Table) or 'grid' (Cards)
    activeProductTaxonomyFilter: 'all',
    searchQuery: '',

    init() {
      ensureLessonsLearnedStyles();
      this.populateProductTaxonomyDropdown();
      this.render();
    },

    populateProductTaxonomyDropdown() {
      const select = document.getElementById('ll-transfer-product-taxonomy');
      if (!select) return;
      const nodes = ProductClassificationEngine ? ProductClassificationEngine.getNodes() : [];
      select.innerHTML = '';
      nodes.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = `${n.parentId ? '↳ ' : '📦 '}${n.path || n.name}`;
        select.appendChild(opt);
      });
    },

    setViewMode(mode) {
      this.viewMode = mode;
      const listBtn = document.getElementById('btn-view-list');
      const gridBtn = document.getElementById('btn-view-grid');
      if (listBtn) listBtn.classList.toggle('active', mode === 'list');
      if (gridBtn) gridBtn.classList.toggle('active', mode === 'grid');
      this.render();
    },

    setProductTaxonomyFilter(nodeId) {
      this.activeProductTaxonomyFilter = nodeId;
      this.render();
    },

    setSearch(query) {
      this.searchQuery = (query || '').toLowerCase().trim();
      this.render();
    },

    render() {
      const container = document.getElementById('lessons-learned-container') || document.getElementById('lessons-learned-grid');
      if (!container) return;

      const isAdmin = QualityStorageSync ? QualityStorageSync.isAdmin() : false;
      const lessons = QualityStorageSync ? (QualityStorageSync.getState().lessonsLearned || []) : [];
      container.innerHTML = '';
      container.style.width = '100%';
      container.className = this.viewMode === 'list' ? 'qs-ll-list-container' : 'qs-ll-grid-container';

      const filtered = lessons.filter(l => {
        const searchStr = `${l.id} ${l.title} ${l.project_code || ''} ${l.part_number || ''} ${l.product_classification_path || ''} ${l.failure_mode || ''} ${l.problem_summary || ''} ${l.failure_cause || ''} ${l.root_cause || ''} ${l.pca_preventive_rule || ''} ${l.permanent_solution || ''} ${(l.tags || []).join(' ')}`.toLowerCase();
        const matchesSearch = !this.searchQuery || searchStr.includes(this.searchQuery);
        
        let matchesTaxonomy = true;
        if (this.activeProductTaxonomyFilter !== 'all') {
          const ids = l.product_classification_ids || [l.product_classification_id];
          matchesTaxonomy = ids.includes(this.activeProductTaxonomyFilter);
        }

        return matchesSearch && matchesTaxonomy;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="width:100%; text-align:center; padding:3.5rem 1rem; color:var(--qs-text-muted);">
            <span style="font-size:2.8rem; color:var(--qs-primary); opacity:0.6; margin-bottom:12px; display:block;">🎓</span>
            <h3 style="color:var(--qs-text-main); font-size:1.15rem; margin:0 0 6px 0;">No Lessons Learned Records Found</h3>
            <p style="font-size:0.85rem; margin:0;">Try adjusting your search keywords or product classification filters.</p>
          </div>
        `;
        return;
      }

      if (this.viewMode === 'list') {
        this.renderTableView(container, filtered, isAdmin);
      } else {
        this.renderGridView(container, filtered, isAdmin);
      }
    },

    renderTableView(container, lessons, isAdmin) {
      const tableWrap = document.createElement('div');
      tableWrap.className = 'qs-ll-table-wrap';

      tableWrap.innerHTML = `
        <table class="qs-ll-table">
          <colgroup>
            <col style="width: 14%;">
            <col style="width: 25%;">
            <col style="width: 24%;">
            <col style="width: 25%;">
            <col style="width: 6%;">
            <col style="width: 6%;">
          </colgroup>
          <thead>
            <tr>
              <th>ID &amp; Taxonomy</th>
              <th>Failure Mode &amp; Context</th>
              <th>Root Cause (5-Why)</th>
              <th>Standard Preventive Rule (FMEA Link)</th>
              <th style="text-align: center;">Source 8D</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${lessons.map(l => {
              return `
                <tr>
                  <td>
                    <div>
                      <div class="qs-ll-badge-id">#${escapeHtml(l.id)}</div>
                      <div style="margin-top: 4px;">
                        <span class="qs-ll-tag-pill">
                          🏷️ ${escapeHtml(l.product_classification_path || 'General Component')}
                        </span>
                      </div>
                      <div style="font-size: 11px; color: var(--qs-text-muted); margin-top: 4px;">
                        ${escapeHtml(l.approved_date || 'Approved')}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style="font-weight: 700; color: var(--qs-text-main); font-size: 13.5px; margin-bottom: 4px; line-height: 1.35;">
                      ${escapeHtml(l.title)}
                    </div>
                    <div style="font-size: 12px; color: var(--qs-text-sub); line-height: 1.45;">
                      ${escapeHtml(l.failure_mode || l.problem_summary || '-')}
                    </div>
                    <div style="font-size: 11px; color: var(--qs-text-muted); margin-top: 5px;">
                      <strong>Part:</strong> <span style="color:var(--qs-text-main);">${escapeHtml(l.part_number || 'N/A')}</span> &bull; <strong>Project:</strong> <span style="color:var(--qs-text-main);">${escapeHtml(l.project_code || 'N/A')}</span>
                    </div>
                  </td>

                  <td>
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--qs-danger); margin-bottom: 3px;">
                      🔍 Verified Root Cause
                    </div>
                    <div style="font-size: 12px; color: var(--qs-text-sub); line-height: 1.45;">
                      ${escapeHtml(l.failure_cause || l.root_cause || '-')}
                    </div>
                  </td>

                  <td>
                    <div class="qs-ll-rule-box">
                      <div style="font-size: 11px; font-weight: 700; color: var(--qs-primary); margin-bottom: 3px;">
                        🛡️ FMEA Design &amp; Process Baseline:
                      </div>
                      ${escapeHtml(l.pca_preventive_rule || l.preventive_rule || l.permanent_solution || '-')}
                    </div>
                  </td>

                  <td style="text-align: center;">
                    ${l.source_8d_id ? `
                      <a href="javascript:void(0)" onclick="safeNavigateTo('FailureRegister.html?view=8d-form&id=${escapeHtml(l.source_8d_id)}')" style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:700; color:var(--qs-primary); text-decoration:none; padding:4px 8px; border-radius:6px; background:rgba(37,99,235,0.1); border:1px solid rgba(37,99,235,0.25);">
                        <span>📑</span>
                        <span>${escapeHtml(l.source_8d_id)}</span>
                      </a>
                    ` : '<span style="color:var(--qs-text-muted); font-size:11px;">Manual</span>'}
                  </td>

                  <td style="text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:4px;">
                      ${isAdmin ? `
                        <button class="btn btn-ghost" onclick="LessonsLearnedManager.editLesson('${l.id}')" style="padding:4px 8px; font-size:11px;" title="Admin Edit Lesson">✏️</button>
                        <button class="btn btn-ghost" onclick="LessonsLearnedManager.deleteLesson('${l.id}')" style="padding:4px 8px; font-size:11px; color:var(--qs-danger);" title="Admin Delete Lesson">🗑️</button>
                      ` : `
                        <button class="btn btn-ghost" onclick="LessonsLearnedManager.viewDetails('${l.id}')" style="padding:4px 8px; font-size:11px;" title="View Details">👁️</button>
                      `}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.appendChild(tableWrap);
    },

    renderGridView(container, lessons, isAdmin) {
      const gridWrap = document.createElement('div');
      gridWrap.className = 'qs-ll-grid';
      gridWrap.style.width = '100%';

      lessons.forEach(l => {
        const card = document.createElement('div');
        card.className = 'card qs-ll-card';
        card.innerHTML = `
          <div class="qs-ll-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="qs-class-pill" style="background:var(--qs-primary-surface); color:var(--qs-primary); border:1px solid var(--qs-border-main); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">
                🏷️ ${escapeHtml(l.product_classification_path || 'General Product')}
              </span>
              <span style="font-size:0.75rem; color:var(--qs-text-muted); font-weight:700;">#${escapeHtml(l.id)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              ${l.source_8d_id ? `<span class="badge" style="background:var(--qs-primary-surface); color:var(--qs-primary); font-size:0.7rem;">📑 ${escapeHtml(l.source_8d_id)}</span>` : ''}
              ${isAdmin ? `
                <button class="btn btn-ghost" onclick="LessonsLearnedManager.editLesson('${l.id}')" style="padding:2px 6px; font-size:0.7rem;" title="Admin Edit Lesson">✏️</button>
                <button class="btn btn-ghost" onclick="LessonsLearnedManager.deleteLesson('${l.id}')" style="padding:2px 6px; font-size:0.7rem; color:var(--qs-danger);" title="Admin Delete Lesson">🗑️</button>
              ` : ''}
            </div>
          </div>

          <h3 class="qs-ll-title" style="margin:10px 0 6px 0; font-size:1rem; color:var(--qs-text-main); font-weight:700;">${escapeHtml(l.title)}</h3>

          <div class="qs-ll-meta" style="font-size:0.75rem; color:var(--qs-text-muted); display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
            <span><strong>Project:</strong> <span style="color:var(--qs-text-main);">${escapeHtml(l.project_code || 'N/A')}</span></span>
            <span><strong>Part:</strong> <span style="color:var(--qs-text-main);">${escapeHtml(l.part_number || 'Component')}</span></span>
          </div>

          <div class="qs-ll-section" style="margin-bottom:8px;">
            <div class="qs-ll-label" style="font-size:0.72rem; font-weight:700; color:var(--qs-warning);"><span style="margin-right:4px;">⚠️</span> Observed Failure Mode</div>
            <p class="qs-ll-text" style="font-size:0.8rem; color:var(--qs-text-sub); margin:2px 0 0 0;">${escapeHtml(l.failure_mode || l.problem_summary || '-')}</p>
          </div>

          <div class="qs-ll-section" style="margin-bottom:8px;">
            <div class="qs-ll-label" style="font-size:0.72rem; font-weight:700; color:var(--qs-danger);"><span style="margin-right:4px;">🔍</span> Verified Root Cause</div>
            <p class="qs-ll-text" style="font-size:0.8rem; color:var(--qs-text-sub); margin:2px 0 0 0;">${escapeHtml(l.failure_cause || l.root_cause || '-')}</p>
          </div>

          <div class="qs-ll-section qs-ll-preventive" style="background:rgba(2, 132, 199, 0.08); border:1px solid var(--qs-primary); border-radius:6px; padding:8px 10px; margin-top:10px;">
            <div class="qs-ll-label" style="color:var(--qs-primary); font-weight:700; font-size:0.72rem;"><span style="margin-right:4px;">🛡️</span> Standard Preventive Rule (FMEA Baseline)</div>
            <p class="qs-ll-text" style="color:var(--qs-text-main); font-weight:600; font-size:0.82rem; margin:3px 0 0 0;">${escapeHtml(l.pca_preventive_rule || l.preventive_rule || '-')}</p>
          </div>
        `;
        gridWrap.appendChild(card);
      });

      container.appendChild(gridWrap);
    },

    async viewDetails(lessonId) {
      const lessons = QualityStorageSync.getState().lessonsLearned || [];
      const l = lessons.find(x => x.id === lessonId);
      if (!l) return;
      if (window.showCustomAlert) {
        await window.showCustomAlert(
          `Lesson Learned #${l.id}: ${l.title}`,
          `<strong>Classification:</strong> ${l.product_classification_path || 'General'}<br><strong>Failure Mode:</strong> ${l.failure_mode || '-'}<br><strong>Root Cause:</strong> ${l.root_cause || '-'}<br><strong>Preventive Rule:</strong> ${l.pca_preventive_rule || '-'}`,
          'info'
        );
      }
    },

    async editLesson(lessonId) {
      if (!QualityStorageSync.canEditLessonsLearned()) {
        if (window.showCustomAlert) {
          await window.showCustomAlert('Permission Denied', 'Only System Administrators can edit Lessons Learned.', 'warning');
        }
        return;
      }
      const lessons = QualityStorageSync.getState().lessonsLearned || [];
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return;

      let newTitle = lesson.title;
      let newRule = lesson.pca_preventive_rule || lesson.preventive_rule || '';

      if (window.showCustomPrompt) {
        newTitle = await window.showCustomPrompt('Edit Lesson Title', 'Update corporate lesson title:', lesson.title);
        if (newTitle === null) return;
        newRule = await window.showCustomPrompt('Edit Preventive Rule', 'Update standard FMEA baseline preventive rule:', lesson.pca_preventive_rule || lesson.preventive_rule || '');
        if (newRule === null) return;
      }

      lesson.title = (newTitle || '').trim() || lesson.title;
      lesson.pca_preventive_rule = (newRule || '').trim() || lesson.pca_preventive_rule;
      lesson.preventive_rule = lesson.pca_preventive_rule;
      await QualityStorageSync.saveLessonsLearned();
      this.render();
      if (window.showCustomToast) {
        window.showCustomToast(`Lesson Learned #${lessonId} updated successfully.`, 'success');
      }
    },

    async deleteLesson(lessonId) {
      if (!QualityStorageSync.canEditLessonsLearned()) {
        if (window.showCustomAlert) {
          await window.showCustomAlert('Permission Denied', 'Only System Administrators can delete Lessons Learned.', 'warning');
        }
        return;
      }

      let confirmed = true;
      if (window.showCustomConfirm) {
        confirmed = await window.showCustomConfirm(
          'Delete Lesson Learned',
          `Are you sure you want to delete corporate lesson learned <strong>#${lessonId}</strong>?`,
          'Delete',
          'Cancel',
          true
        );
      } else {
        confirmed = confirm(`Delete lesson #${lessonId}?`);
      }
      if (!confirmed) return;

      const state = QualityStorageSync.getState();
      state.lessonsLearned = (state.lessonsLearned || []).filter(l => l.id !== lessonId);
      await QualityStorageSync.saveLessonsLearned();
      this.render();
      if (window.showCustomToast) {
        window.showCustomToast(`Lesson Learned #${lessonId} deleted.`, 'info');
      }
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.LessonsLearnedManager = LessonsLearnedManager;
})(typeof window !== 'undefined' ? window : this);
