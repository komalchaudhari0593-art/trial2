/**
 * JOST Quality Suite — Master Product Classification Taxonomy Manager UI (Admin Portal)
 * Enterprise-Grade Visual Taxonomy Hierarchy Builder & Inspector
 */

(function (window) {
  'use strict';

  // Inject Self-Contained High-End Styles for Taxonomy Admin Modal
  function ensureTaxonomyStyles() {
    if (document.getElementById('qs-taxonomy-admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'qs-taxonomy-admin-styles';
    style.textContent = `
      /* Master Taxonomy Admin Modal */
      .tx-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 15, 29, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      .tx-modal-overlay.active {
        opacity: 1;
      }
      .tx-modal-card {
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 16px;
        box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);
        width: 95%;
        max-width: 1040px;
        height: 86vh;
        max-height: 820px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.96) translateY(12px);
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .tx-modal-overlay.active .tx-modal-card {
        transform: scale(1) translateY(0);
      }

      /* Modal Header */
      .tx-header {
        padding: 20px 24px 16px 24px;
        border-bottom: 1px solid #1e293b;
        background: #131d35;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      .tx-header-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .tx-header-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%);
        border: 1px solid rgba(59, 130, 246, 0.35);
        color: #60a5fa;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }
      .tx-header-title {
        font-size: 18px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        letter-spacing: -0.01em;
      }
      .tx-header-desc {
        font-size: 12.5px;
        color: #94a3b8;
        margin: 3px 0 0 0;
        line-height: 1.4;
      }
      .tx-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #334155;
        color: #94a3b8;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tx-close-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: #ef4444;
        color: #f87171;
        transform: rotate(90deg);
      }

      /* Controls & Search Bar */
      .tx-toolbar {
        padding: 14px 24px;
        background: #0f172a;
        border-bottom: 1px solid #1e293b;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
      }
      .tx-search-wrap {
        position: relative;
        flex: 1;
        max-width: 420px;
      }
      .tx-search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        font-size: 14px;
        pointer-events: none;
      }
      .tx-search-input {
        width: 100%;
        padding: 9px 12px 9px 34px;
        border-radius: 8px;
        background: #1e293b;
        border: 1px solid #334155;
        color: #f8fafc;
        font-size: 13.5px;
        outline: none;
        box-sizing: border-box;
        transition: all 0.15s ease;
      }
      .tx-search-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        background: #0f172a;
      }
      .tx-btn {
        padding: 9px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        white-space: nowrap;
      }
      .tx-btn-primary {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
      }
      .tx-btn-primary:hover {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
      }
      .tx-btn-ghost {
        background: rgba(255, 255, 255, 0.05);
        color: #cbd5e1;
        border-color: #334155;
      }
      .tx-btn-ghost:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        color: #93c5fd;
      }
      .tx-btn-danger {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.3);
      }
      .tx-btn-danger:hover {
        background: #dc2626;
        color: #ffffff;
        border-color: #dc2626;
      }

      /* Split Workspace Layout */
      .tx-content-grid {
        display: grid;
        grid-template-columns: 1.35fr 1fr;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      /* Left Tree Panel */
      .tx-tree-panel {
        background: #0b1120;
        border-right: 1px solid #1e293b;
        padding: 16px 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .tx-tree-panel-header {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      /* Tree Component Items */
      .tx-tree-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tx-tree-node {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 12px;
        border-radius: 9px;
        background: #1e293b;
        border: 1px solid #334155;
        cursor: pointer;
        transition: all 0.15s ease;
        user-select: none;
      }
      .tx-tree-node:hover {
        background: #27354f;
        border-color: #475569;
        transform: translateX(2px);
      }
      .tx-tree-node.active {
        background: rgba(37, 99, 235, 0.16);
        border-color: #3b82f6;
        border-left: 4px solid #3b82f6;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.2);
      }
      .tx-node-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        overflow: hidden;
      }
      .tx-node-icon {
        font-size: 16px;
        line-height: 1;
        flex-shrink: 0;
      }
      .tx-node-name {
        font-size: 13.5px;
        font-weight: 600;
        color: #f1f5f9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tx-tree-node.active .tx-node-name {
        color: #93c5fd;
        font-weight: 700;
      }
      .tx-node-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        color: #94a3b8;
        flex-shrink: 0;
      }
      .tx-tree-node.active .tx-node-badge {
        background: rgba(59, 130, 246, 0.25);
        color: #bfdbfe;
      }

      .tx-tree-children {
        list-style: none;
        padding-left: 20px;
        margin: 6px 0 0 12px;
        border-left: 2px dashed #283548;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      /* Right Inspector Panel */
      .tx-inspector-panel {
        background: #111827;
        padding: 22px 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 20px;
      }
      .tx-inspector-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        height: 100%;
        color: #64748b;
        gap: 14px;
        padding: 40px 20px;
      }
      .tx-inspector-empty-icon {
        font-size: 42px;
        opacity: 0.5;
        background: rgba(255, 255, 255, 0.03);
        width: 80px;
        height: 80px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px dashed #334155;
      }

      /* Inspector Form Fields */
      .tx-form-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding-bottom: 14px;
        border-bottom: 1px solid #1e293b;
        margin-bottom: 16px;
      }
      .tx-type-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 3px 8px;
        border-radius: 6px;
        margin-bottom: 6px;
      }
      .tx-type-pill.root {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      .tx-type-pill.child {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
      .tx-node-title-lg {
        font-size: 18px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
      }

      .tx-form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }
      .tx-form-label {
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tx-form-input, .tx-form-textarea {
        width: 100%;
        padding: 10px 14px;
        border-radius: 8px;
        background: #1e293b;
        border: 1px solid #334155;
        color: #f8fafc;
        font-size: 13.5px;
        outline: none;
        box-sizing: border-box;
        transition: all 0.15s ease;
        font-family: inherit;
      }
      .tx-form-input:focus, .tx-form-textarea:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        background: #0f172a;
      }
      .tx-form-input[readonly] {
        background: #0b1120;
        color: #60a5fa;
        font-weight: 600;
        border-color: #1e293b;
        cursor: default;
      }
      .tx-form-textarea {
        resize: vertical;
        min-height: 80px;
        line-height: 1.5;
      }

      /* Linked Lessons Learned Card */
      .tx-lessons-box {
        background: #0b1120;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 14px;
        margin-top: 8px;
      }
      .tx-lessons-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11.5px;
        font-weight: 700;
        color: #cbd5e1;
        margin-bottom: 8px;
      }
      .tx-lessons-list {
        max-height: 130px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tx-lesson-item {
        font-size: 12px;
        padding: 6px 10px;
        background: #1e293b;
        border-radius: 6px;
        color: #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .tx-lesson-item strong {
        color: #93c5fd;
      }

      /* Inspector Bottom Action Bar */
      .tx-inspector-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid #1e293b;
        gap: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  const ClassificationTreeAdmin = {
    selectedNodeId: null,
    searchQuery: '',

    init() {
      ensureTaxonomyStyles();
    },

    async openModal() {
      ensureTaxonomyStyles();
      if (window.QualityStorageSync && typeof window.QualityStorageSync.init === 'function') {
        try { await window.QualityStorageSync.init(); } catch (e) { }
      }
      if (window.ProductClassificationEngine && typeof window.ProductClassificationEngine.init === 'function') {
        try { await window.ProductClassificationEngine.init(); } catch (e) { }
      }

      const isAdmin = window.QualityStorageSync ? QualityStorageSync.isAdmin() : true;
      if (!isAdmin) {
        if (window.showCustomAlert) {
          window.showCustomAlert('Access Denied', 'Product Classification Taxonomy Management is strictly restricted to System Administrators.', 'warning');
        } else {
          alert('Access Denied: Product Classification Taxonomy Management is strictly restricted to System Administrators.');
        }
        return;
      }

      let modalEl = document.getElementById('modal-classification-taxonomy-admin');
      if (!modalEl) {
        this.injectModalHtml();
        modalEl = document.getElementById('modal-classification-taxonomy-admin');
      }

      // Auto-select first node if available
      const nodes = window.ProductClassificationEngine ? ProductClassificationEngine.getNodes() : [];
      if ((!this.selectedNodeId || !ProductClassificationEngine.getNodeById(this.selectedNodeId)) && nodes.length > 0) {
        this.selectedNodeId = nodes[0].id;
      }

      modalEl.style.display = 'flex';
      requestAnimationFrame(() => modalEl.classList.add('active'));
      this.render();
    },

    closeModal() {
      const modalEl = document.getElementById('modal-classification-taxonomy-admin');
      if (modalEl) {
        modalEl.classList.remove('active');
        setTimeout(() => {
          modalEl.style.display = 'none';
        }, 200);
      }
    },

    injectModalHtml() {
      const div = document.createElement('div');
      div.id = 'modal-classification-taxonomy-admin';
      div.className = 'tx-modal-overlay';
      div.style.display = 'none';
      div.innerHTML = `
        <div class="tx-modal-card">
          <!-- Header -->
          <div class="tx-header">
            <div class="tx-header-left">
              <div class="tx-header-icon">🏷️</div>
              <div>
                <h2 class="tx-header-title">Master Product Classification Taxonomy</h2>
                <p class="tx-header-desc">
                  Define generic component families and child feature extensions (e.g. <em>Pipe &gt; Bend &gt; Hole</em>) for automated FMEA Lessons Learned inheritance.
                </p>
              </div>
            </div>
            <button class="tx-close-btn" onclick="ClassificationTreeAdmin.closeModal()" title="Close Window">✕</button>
          </div>

          <!-- Controls Toolbar -->
          <div class="tx-toolbar">
            <div class="tx-search-wrap">
              <span class="tx-search-icon">🔍</span>
              <input type="text" id="taxonomy-admin-search" class="tx-search-input" placeholder="Search product taxonomy or features..." oninput="ClassificationTreeAdmin.setSearch(this.value)" />
            </div>
            <button class="tx-btn tx-btn-primary" onclick="ClassificationTreeAdmin.promptAddRootNode()">
              <span>➕</span>
              <span>Add Generic Base Family</span>
            </button>
          </div>

          <!-- Split Workspace Layout -->
          <div class="tx-content-grid">
            <!-- Left Tree Pane -->
            <div class="tx-tree-panel">
              <div class="tx-tree-panel-header">
                <span>Product &amp; Feature Hierarchy Tree</span>
                <span id="tx-node-total-count" style="color: #3b82f6;"></span>
              </div>
              <div id="taxonomy-admin-tree-container"></div>
            </div>

            <!-- Right Inspector Pane -->
            <div id="taxonomy-admin-inspector" class="tx-inspector-panel">
              <!-- Dynamically Populated via renderInspector -->
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(div);
    },

    setSearch(query) {
      this.searchQuery = (query || '').toLowerCase().trim();
      this.render();
    },

    render() {
      const container = document.getElementById('taxonomy-admin-tree-container');
      if (!container) return;

      if (!window.ProductClassificationEngine) {
        container.innerHTML = '<div style="color:#94a3b8; font-size:13px; padding:20px; text-align:center;">Product Classification Engine initializing...</div>';
        return;
      }

      const allNodes = ProductClassificationEngine.getNodes();
      const roots = ProductClassificationEngine.getTreeHierarchy();

      const countEl = document.getElementById('tx-node-total-count');
      if (countEl) countEl.textContent = `${allNodes.length} Total Nodes`;

      container.innerHTML = '';

      if (roots.length === 0) {
        container.innerHTML = `
          <div style="color:#94a3b8; font-size:13px; text-align:center; padding:30px 10px;">
            <div style="font-size:28px; margin-bottom:8px; opacity:0.6;">📦</div>
            <div>No classification nodes configured.</div>
            <div style="font-size:11.5px; color:#64748b; margin-top:4px;">Click "Add Generic Base Family" above to get started.</div>
          </div>
        `;
        this.renderInspector(null);
        return;
      }

      const ul = document.createElement('ul');
      ul.className = 'tx-tree-list';

      roots.forEach(root => {
        const el = this.createTreeNodeElement(root);
        if (el) ul.appendChild(el);
      });

      container.appendChild(ul);

      // If no valid selection, auto-select first node
      if (!this.selectedNodeId && roots[0]) {
        this.selectedNodeId = roots[0].id;
      }

      this.renderInspector(this.selectedNodeId);
    },

    createTreeNodeElement(node) {
      // Filter search
      const matchesSearch = !this.searchQuery || 
        (node.name && node.name.toLowerCase().includes(this.searchQuery)) ||
        (node.path && node.path.toLowerCase().includes(this.searchQuery));

      const hasChildren = node.children && node.children.length > 0;
      let hasMatchingChild = false;

      let childUl = null;
      if (hasChildren) {
        childUl = document.createElement('ul');
        childUl.className = 'tx-tree-children';
        node.children.forEach(child => {
          const childLi = this.createTreeNodeElement(child);
          if (childLi) {
            hasMatchingChild = true;
            childUl.appendChild(childLi);
          }
        });
      }

      if (this.searchQuery && !matchesSearch && !hasMatchingChild) {
        return null;
      }

      const li = document.createElement('li');
      li.style.margin = '2px 0';

      const isSelected = this.selectedNodeId === node.id;
      const isRoot = !node.parentId;

      const nodeRow = document.createElement('div');
      nodeRow.className = `tx-tree-node ${isSelected ? 'active' : ''}`;
      
      nodeRow.onclick = (e) => {
        e.stopPropagation();
        this.selectedNodeId = node.id;
        this.render();
      };

      const icon = isRoot ? '📦' : '↳ 🌿';
      const childCount = node.children ? node.children.length : 0;

      nodeRow.innerHTML = `
        <div class="tx-node-left">
          <span class="tx-node-icon">${icon}</span>
          <span class="tx-node-name" title="${escapeHtml(node.path || node.name)}">${escapeHtml(node.name)}</span>
        </div>
        ${childCount > 0 ? `<span class="tx-node-badge">${childCount} sub</span>` : ''}
      `;

      li.appendChild(nodeRow);

      if (hasChildren && childUl && childUl.children.length > 0) {
        li.appendChild(childUl);
      }

      return li;
    },

    renderInspector(nodeId) {
      const inspector = document.getElementById('taxonomy-admin-inspector');
      if (!inspector) return;

      if (!nodeId) {
        inspector.innerHTML = `
          <div class="tx-inspector-empty">
            <div class="tx-inspector-empty-icon">👆</div>
            <div style="font-size:15px; font-weight:600; color:#cbd5e1;">No Node Selected</div>
            <div style="font-size:12.5px; max-width:280px; line-height:1.4;">
              Select any component family or feature node on the left tree to inspect attributes, add child features, or view linked Lessons Learned.
            </div>
          </div>
        `;
        return;
      }

      const node = ProductClassificationEngine.getNodeById(nodeId);
      if (!node) {
        inspector.innerHTML = `
          <div class="tx-inspector-empty">
            <div class="tx-inspector-empty-icon">🔍</div>
            <div style="font-size:15px; font-weight:600; color:#cbd5e1;">Node Not Found</div>
          </div>
        `;
        return;
      }

      const isRoot = !node.parentId;
      const allLessons = QualityStorageSync ? (QualityStorageSync.getState().lessonsLearned || []) : [];
      const linkedLessons = allLessons.filter(l => 
        (l.product_classification_ids && l.product_classification_ids.includes(node.id)) || 
        l.product_classification_id === node.id
      );

      inspector.innerHTML = `
        <div>
          <!-- Node Header -->
          <div class="tx-form-header">
            <div>
              <div class="tx-type-pill ${isRoot ? 'root' : 'child'}">
                <span>${isRoot ? '📦 Generic Base Component' : '🌿 Feature Extension'}</span>
              </div>
              <h3 class="tx-node-title-lg">${escapeHtml(node.name)}</h3>
            </div>
            <button class="tx-btn tx-btn-danger" onclick="ClassificationTreeAdmin.promptDeleteNode('${node.id}')" title="Delete Classification Node" style="padding:6px 10px; font-size:12px;">
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>

          <!-- Hierarchy Path -->
          <div class="tx-form-group">
            <label class="tx-form-label">
              <span>📍</span>
              <span>Breadcrumb Hierarchy Lineage Path</span>
            </label>
            <input type="text" class="tx-form-input" value="${escapeHtml(node.path || node.name)}" readonly />
          </div>

          <!-- Name -->
          <div class="tx-form-group">
            <label class="tx-form-label">
              <span>🏷️</span>
              <span>Classification Node Name</span>
            </label>
            <input type="text" class="tx-form-input" id="insp-node-name" value="${escapeHtml(node.name)}" placeholder="e.g. Bend, Pierced Hole, Top Plate..." />
          </div>

          <!-- Description -->
          <div class="tx-form-group">
            <label class="tx-form-label">
              <span>📝</span>
              <span>Engineering Guidelines &amp; Scope Description</span>
            </label>
            <textarea class="tx-form-textarea" id="insp-node-desc" rows="3" placeholder="Define applicable manufacturing operations, design constraints, standard tolerances...">${escapeHtml(node.description || '')}</textarea>
          </div>

          <!-- Linked Lessons Learned Card -->
          <div class="tx-lessons-box">
            <div class="tx-lessons-header">
              <span>🎓 LINKED LESSONS LEARNED</span>
              <span class="tx-node-badge" style="background:rgba(245,158,11,0.2); color:#fbbf24;">
                ${linkedLessons.length} Attached
              </span>
            </div>
            ${linkedLessons.length === 0 
              ? `<div style="font-size:12px; color:#64748b; font-style:italic;">No 8D lessons learned explicitly linked to this node yet.</div>`
              : `<div class="tx-lessons-list">
                  ${linkedLessons.map(l => `
                    <div class="tx-lesson-item">
                      <span><strong>${escapeHtml(l.id)}</strong> &bull; ${escapeHtml(l.title || l.problem_summary)}</span>
                    </div>
                  `).join('')}
                 </div>`
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="tx-inspector-actions">
          <button class="tx-btn tx-btn-ghost" onclick="ClassificationTreeAdmin.promptAddChildNode('${node.id}')">
            <span>➕</span>
            <span>Add Child Feature</span>
          </button>
          <button class="tx-btn tx-btn-primary" onclick="ClassificationTreeAdmin.saveNodeChanges('${node.id}')">
            <span>💾</span>
            <span>Save Changes</span>
          </button>
        </div>
      `;
    },

    async promptAddRootNode() {
      let name = '';
      let desc = '';
      if (window.showCustomPrompt) {
        name = await window.showCustomPrompt('Add Component Family', 'Enter Name for New Generic Base Component Family:', '', 'e.g. Casting Housing, Pneumatic Valve, Axle Beam');
        if (!name || !name.trim()) return;
        desc = await window.showCustomPrompt('Description', 'Enter optional engineering guidelines / scope:', '', 'e.g. Forged and machined ductile iron assemblies') || '';
      } else {
        name = prompt('Enter Name for New Generic Base Component Family (e.g. Casting Housing, Pneumatic Valve):');
        if (!name || !name.trim()) return;
        desc = prompt('Enter optional engineering description / scope:') || '';
      }

      try {
        const newNode = await ProductClassificationEngine.addNode({ name: name.trim(), parentId: null, description: desc });
        this.selectedNodeId = newNode.id;
        this.render();
        if (window.showCustomToast) {
          window.showCustomToast(`Component family "${newNode.name}" created successfully.`, 'success');
        }
      } catch (e) {
        if (window.showCustomAlert) {
          window.showCustomAlert('Error Adding Root Node', e.message, 'error');
        } else {
          alert('Error adding root node: ' + e.message);
        }
      }
    },

    async promptAddChildNode(parentId) {
      const parent = ProductClassificationEngine.getNodeById(parentId);
      let name = '';
      let desc = '';
      const promptTitle = `Add Child Feature under "${parent ? parent.name : 'Component'}"`;
      if (window.showCustomPrompt) {
        name = await window.showCustomPrompt(promptTitle, 'Enter Child Feature Name:', '', 'e.g. Bend, Pierced Hole, Flanged End, Keyway');
        if (!name || !name.trim()) return;
        desc = await window.showCustomPrompt('Description', 'Enter optional feature description:', '') || '';
      } else {
        name = prompt(`Add Child Feature under "${parent ? parent.name : 'Component'}" (e.g. Bend, Pierced Hole, Flanged End):`);
        if (!name || !name.trim()) return;
        desc = prompt('Enter optional feature description:') || '';
      }

      try {
        const newNode = await ProductClassificationEngine.addNode({ name: name.trim(), parentId, description: desc });
        this.selectedNodeId = newNode.id;
        this.render();
        if (window.showCustomToast) {
          window.showCustomToast(`Child feature "${newNode.name}" added successfully.`, 'success');
        }
      } catch (e) {
        if (window.showCustomAlert) {
          window.showCustomAlert('Error Adding Child Feature', e.message, 'error');
        } else {
          alert('Error adding child feature: ' + e.message);
        }
      }
    },

    async saveNodeChanges(nodeId) {
      const name = document.getElementById('insp-node-name')?.value;
      const desc = document.getElementById('insp-node-desc')?.value;
      try {
        await ProductClassificationEngine.editNode(nodeId, { name, description: desc });
        if (window.showCustomToast) {
          window.showCustomToast('Classification node saved successfully!', 'success');
        }
        this.render();
      } catch (e) {
        if (window.showCustomAlert) {
          window.showCustomAlert('Error Saving Changes', e.message, 'error');
        } else {
          alert('Error saving changes: ' + e.message);
        }
      }
    },

    async promptDeleteNode(nodeId) {
      const node = ProductClassificationEngine.getNodeById(nodeId);
      let confirmed = true;
      if (window.showCustomConfirm) {
        confirmed = await window.showCustomConfirm(
          'Delete Classification Node',
          `Are you sure you want to permanently delete classification node "<strong>${node ? escapeHtml(node.name) : nodeId}</strong>"?`,
          'Delete Node',
          'Cancel',
          true
        );
      } else {
        confirmed = confirm(`Are you sure you want to delete classification node "${node ? node.name : nodeId}"?`);
      }
      if (!confirmed) return;

      try {
        await ProductClassificationEngine.deleteNode(nodeId);
        this.selectedNodeId = null;
        this.render();
        if (window.showCustomToast) {
          window.showCustomToast(`Node "${node ? node.name : nodeId}" deleted.`, 'info');
        }
      } catch (e) {
        if (window.showCustomAlert) {
          window.showCustomAlert('Cannot Delete Node', e.message, 'error');
        } else {
          alert('Cannot delete node: ' + e.message);
        }
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

  window.ClassificationTreeAdmin = ClassificationTreeAdmin;
  window.openClassificationTaxonomyModal = async () => {
    if (window.ClassificationTreeAdmin) {
      await ClassificationTreeAdmin.openModal();
    }
  };
})(typeof window !== 'undefined' ? window : this);
