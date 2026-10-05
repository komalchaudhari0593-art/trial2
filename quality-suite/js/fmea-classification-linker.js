/**
 * JOST Quality Suite — FMEA Product Classification Linker & Ingestion Engine
 * Handles Product Classification assignment, Ancestral Ingestion into FMEA,
 * Auto-Sync on Login/Open, and non-destructive Hide/Unhide Applicability Management.
 */

(function (window) {
  'use strict';

  const FmeaClassificationLinker = {
    activeElementId: null,

    // 1. Assign Product Classifications to an FMEA Structure Element
    async assignClassificationsToElement(elementId, selectedClassificationNodeIds = [], fmeaDataRef = null) {
      const fmea = fmeaDataRef || window.fmeaData;
      if (!fmea || !elementId) return;

      // Find element in FMEA structure
      const element = this.findElementInFmea(elementId, fmea);
      if (!element) return;

      element.productClassificationIds = selectedClassificationNodeIds;

      // Resolve complete ancestral lineage
      const lineage = ProductClassificationEngine.resolveAncestralLineage(selectedClassificationNodeIds);
      element.ancestralClassificationIds = lineage.nodeIds;

      // Ingest matching Lessons Learned into FMEA structure
      await this.ingestAncestralLessonsLearned(element, lineage.nodeIds, fmea);

      return element;
    },

    // 2. Ingest all ancestral lessons learned into the element's failure modes
    async ingestAncestralLessonsLearned(element, ancestralNodeIds = [], fmea = null) {
      if (!ancestralNodeIds || ancestralNodeIds.length === 0) return;

      const allLessons = QualityStorageSync ? (QualityStorageSync.getState().lessonsLearned || []) : [];
      
      // Filter lessons matching any node in the ancestral lineage
      const matchingLessons = allLessons.filter(l => {
        const lessonNodeIds = l.product_classification_ids || [l.product_classification_id];
        return lessonNodeIds.some(id => ancestralNodeIds.includes(id));
      });

      if (!element.inheritedLessons) element.inheritedLessons = [];

      matchingLessons.forEach(lesson => {
        const existingIdx = element.inheritedLessons.findIndex(il => il.lessonLearnedId === lesson.id);
        if (existingIdx === -1) {
          // Ingest new traceable entry
          const newInheritedRow = {
            id: 'fmea-ll-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            element_id: element.id || 'elem-root',
            lessonLearnedId: lesson.id,
            source8DNumber: lesson.source_8d_id || '8D-Historical',
            productClassificationId: lesson.product_classification_id || ancestralNodeIds[0],
            productClassificationPath: lesson.product_classification_path || 'Inherited Feature',
            function_name: lesson.title || 'Standard Operational Function',
            failure_mode: lesson.failure_mode || lesson.problem_summary || 'Potential Functional Deviation',
            failure_cause: lesson.failure_cause || lesson.root_cause || 'Root cause identified via 8D analysis',
            prevention_control: lesson.pca_preventive_rule || lesson.permanent_solution || 'Standard process safeguard',
            detection_control: lesson.recommended_detection || '100% verification on setup',
            characteristic_symbol: lesson.classification_symbol || '🔷',
            characteristic_code: lesson.classification_code || 'SC',
            severity: 7,
            occurrence: 3,
            detection: 3,
            is_hidden: false, // Default: Applicable for this project
            is_customized: false,
            sync_timestamp: new Date().toISOString()
          };
          element.inheritedLessons.push(newInheritedRow);
        }
      });

      return element.inheritedLessons;
    },

    // 3. Login / File Open Background Sync Engine
    async performAutoSyncOnOpen(fmeaDataRef = null) {
      const fmea = fmeaDataRef || window.fmeaData;
      if (!fmea) return;

      const classifiedElements = this.collectAllClassifiedElements(fmea);
      if (classifiedElements.length === 0) return;

      const allLessons = QualityStorageSync ? (QualityStorageSync.getState().lessonsLearned || []) : [];
      const newIngestedItems = [];

      classifiedElements.forEach(elem => {
        const ancestralIds = elem.ancestralClassificationIds || elem.productClassificationIds || [];
        const existingIds = (elem.inheritedLessons || []).map(il => il.lessonLearnedId);

        const newLessons = allLessons.filter(l => {
          const lessonNodeIds = l.product_classification_ids || [l.product_classification_id];
          const matches = lessonNodeIds.some(id => ancestralIds.includes(id));
          return matches && !existingIds.includes(l.id);
        });

        newLessons.forEach(lesson => {
          const newRow = {
            id: 'fmea-ll-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            element_id: elem.id,
            element_name: elem.name || 'Component',
            lessonLearnedId: lesson.id,
            source8DNumber: lesson.source_8d_id || '8D-Historical',
            productClassificationPath: lesson.product_classification_path || 'Inherited Feature',
            function_name: lesson.title,
            failure_mode: lesson.failure_mode || lesson.problem_summary,
            failure_cause: lesson.failure_cause || lesson.root_cause,
            prevention_control: lesson.pca_preventive_rule || lesson.permanent_solution,
            detection_control: lesson.recommended_detection || 'Standard verification',
            characteristic_symbol: lesson.classification_symbol || '🔷',
            characteristic_code: lesson.classification_code || 'SC',
            severity: 7,
            occurrence: 3,
            detection: 3,
            is_hidden: false, // Initial default
            is_customized: false,
            sync_timestamp: new Date().toISOString()
          };
          if (!elem.inheritedLessons) elem.inheritedLessons = [];
          elem.inheritedLessons.push(newRow);
          newIngestedItems.push(newRow);
        });
      });

      if (newIngestedItems.length > 0) {
        this.showNewLessonsApplicabilityPrompt(newIngestedItems);
      }
    },

    // 4. Prompt user to mark newly ingested rows as Applicable (Unhide) or Not Applicable (Hide)
    showNewLessonsApplicabilityPrompt(newItems) {
      let modal = document.getElementById('modal-new-lessons-applicability');
      if (!modal) {
        const div = document.createElement('div');
        div.id = 'modal-new-lessons-applicability';
        div.className = 'modal-overlay';
        document.body.appendChild(div);
        modal = div;
      }

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 650px; padding: 1.5rem;">
          <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0; color:var(--primary); display:flex; align-items:center; gap:8px;">
              <i class="fas fa-bell"></i> New Corporate Lessons Learned Added
            </h3>
            <i class="fas fa-times" onclick="document.getElementById('modal-new-lessons-applicability').style.display='none'" style="cursor:pointer; opacity:0.6;"></i>
          </header>
          <p style="font-size:0.82rem; color:var(--text-muted); margin:0 0 12px 0;">
            ${newItems.length} new corporate 8D Lessons Learned matching your component classifications have been ingested into this FMEA file.
          </p>

          <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.25); border: 1px solid var(--border-main); border-radius: 8px; padding: 10px; margin-bottom: 16px;">
            ${newItems.map(item => `
              <div style="font-size:0.78rem; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.05);">
                <strong>${item.lessonLearnedId} (${item.productClassificationPath}):</strong> ${item.failure_mode}
                <div style="font-size:0.72rem; color:var(--text-muted);">Root Cause: ${item.failure_cause}</div>
              </div>
            `).join('')}
          </div>

          <div style="font-size:0.78rem; color:var(--text-main); margin-bottom:16px;">
            Set initial project applicability for these newly added failure modes:
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button class="btn btn-ghost" onclick="FmeaClassificationLinker.setNewItemsApplicability(false)">
              <i class="fas fa-eye-slash" style="color:var(--warning);"></i> Not Applicable (Hide from Table)
            </button>
            <button class="btn btn-primary" onclick="FmeaClassificationLinker.setNewItemsApplicability(true)">
              <i class="fas fa-check-circle"></i> Applicable (Keep in FMEA Table)
            </button>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
      this.pendingNewItems = newItems;
    },

    setNewItemsApplicability(isApplicable) {
      if (this.pendingNewItems) {
        this.pendingNewItems.forEach(item => {
          item.is_hidden = !isApplicable;
        });
      }
      const modal = document.getElementById('modal-new-lessons-applicability');
      if (modal) modal.style.display = 'none';
      if (window.renderFMEATable) renderFMEATable();
    },

    // 5. Open Classification & Lessons Learned Manager Drawer
    openManagerDrawer(elementId) {
      this.activeElementId = elementId;
      const fmea = window.fmeaData;
      const element = this.findElementInFmea(elementId, fmea);
      if (!element) return;

      let drawer = document.getElementById('drawer-fmea-classification-mgr');
      if (!drawer) {
        const div = document.createElement('div');
        div.id = 'drawer-fmea-classification-mgr';
        div.className = 'modal-overlay';
        document.body.appendChild(div);
        drawer = div;
      }

      drawer.style.display = 'flex';
      this.renderDrawerContent(element);
    },

    renderDrawerContent(element) {
      const drawer = document.getElementById('drawer-fmea-classification-mgr');
      if (!drawer) return;

      const allTaxonomy = ProductClassificationEngine.getNodes();
      const currentSelectedIds = element.productClassificationIds || [];
      const inheritedLessons = element.inheritedLessons || [];

      const applicableRows = inheritedLessons.filter(r => !r.is_hidden);
      const hiddenRows = inheritedLessons.filter(r => r.is_hidden);

      drawer.innerHTML = `
        <div class="modal-content" style="max-width: 900px; height: 85vh; display: flex; flex-direction: column; padding: 1.5rem;">
          <header style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-main); padding-bottom:10px; margin-bottom:12px;">
            <div>
              <h2 style="font-size:1.2rem; margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-tags" style="color:var(--primary);"></i> Product Classification & Lessons Learned Manager
              </h2>
              <p style="font-size:0.78rem; color:var(--text-muted); margin:2px 0 0 0;">
                Element: <strong style="color:var(--text-main);">${element.name || 'Component'}</strong>
              </p>
            </div>
            <i class="fas fa-times" onclick="document.getElementById('drawer-fmea-classification-mgr').style.display='none'" style="cursor:pointer; font-size:1.2rem; opacity:0.6;"></i>
          </header>

          <!-- Section 1: Classification Multi-Selector -->
          <div style="background:rgba(15,23,42,0.5); border:1px solid var(--border-main); border-radius:8px; padding:12px; margin-bottom:14px;">
            <div style="font-size:0.75rem; font-weight:700; color:var(--primary); margin-bottom:8px; display:flex; justify-content:space-between;">
              <span>ASSIGNED PRODUCT CLASSIFICATIONS (FEATURE TAXONOMY)</span>
              <button class="btn btn-ghost" onclick="window.openClassificationTaxonomyModal()" style="font-size:0.7rem; padding:2px 8px;">
                <i class="fas fa-cog"></i> Manage Taxonomy
              </button>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:100px; overflow-y:auto; padding:4px;">
              ${allTaxonomy.map(node => {
                const isChecked = currentSelectedIds.includes(node.id);
                return `
                  <label class="btn btn-ghost" style="font-size:0.75rem; padding:4px 10px; border-radius:14px; background:${isChecked ? 'var(--primary)' : 'rgba(255,255,255,0.04)'}; color:${isChecked ? '#fff' : 'var(--text-muted)'}; cursor:pointer;">
                    <input type="checkbox" value="${node.id}" ${isChecked ? 'checked' : ''} onchange="FmeaClassificationLinker.toggleClassificationSelection('${element.id}', '${node.id}', this.checked)" style="display:none;">
                    ${node.parentId ? '↳ ' : '📦 '}${node.path || node.name}
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section 2: Ingested Lessons Learned Applicability (Hide / Unhide) -->
          <div style="flex:1; display:grid; grid-template-columns: 1fr 1fr; gap:14px; min-height:0;">
            <!-- Active Applicable Rows -->
            <div style="background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:10px; display:flex; flex-direction:column;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--success); margin-bottom:8px; display:flex; justify-content:space-between;">
                <span>✓ APPLICABLE IN FMEA TABLE (${applicableRows.length})</span>
              </div>
              <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                ${applicableRows.length === 0 ? `<div style="font-size:0.75rem; color:var(--text-muted); padding:1rem; text-align:center;">No active rows.</div>` : ''}
                ${applicableRows.map(row => `
                  <div style="background:rgba(15,23,42,0.6); border:1px solid var(--border-main); border-radius:6px; padding:8px; font-size:0.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                      <strong>${row.lessonLearnedId}: ${row.failure_mode}</strong>
                      <button class="btn btn-ghost" onclick="FmeaClassificationLinker.toggleRowVisibility('${element.id}', '${row.id}', true)" style="font-size:0.65rem; color:var(--warning); padding:2px 6px;">
                        <i class="fas fa-eye-slash"></i> Hide
                      </button>
                    </div>
                    <div style="color:var(--text-muted); font-size:0.7rem; margin-top:3px;">Cause: ${row.failure_cause}</div>
                    <div style="color:var(--primary); font-size:0.7rem; margin-top:2px;">PC: ${row.prevention_control}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Hidden / Not Applicable Rows -->
            <div style="background:rgba(245,158,11,0.04); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:10px; display:flex; flex-direction:column;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--warning); margin-bottom:8px; display:flex; justify-content:space-between;">
                <span>🚫 NOT APPLICABLE FOR PROJECT (${hiddenRows.length})</span>
              </div>
              <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                ${hiddenRows.length === 0 ? `<div style="font-size:0.75rem; color:var(--text-muted); padding:1rem; text-align:center;">No hidden rows.</div>` : ''}
                ${hiddenRows.map(row => `
                  <div style="background:rgba(15,23,42,0.6); border:1px dashed var(--border-main); border-radius:6px; padding:8px; font-size:0.75rem; opacity:0.75;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                      <strong>${row.lessonLearnedId}: ${row.failure_mode}</strong>
                      <button class="btn btn-ghost" onclick="FmeaClassificationLinker.toggleRowVisibility('${element.id}', '${row.id}', false)" style="font-size:0.65rem; color:var(--success); padding:2px 6px;">
                        <i class="fas fa-eye"></i> Unhide
                      </button>
                    </div>
                    <div style="color:var(--text-muted); font-size:0.7rem; margin-top:3px;">Cause: ${row.failure_cause}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:12px; border-top:1px solid var(--border-main); padding-top:10px;">
            <button class="btn btn-primary" onclick="document.getElementById('drawer-fmea-classification-mgr').style.display='none'; if(window.renderFMEATable) renderFMEATable();">
              <i class="fas fa-check"></i> Done & Refresh FMEA
            </button>
          </div>
        </div>
      `;
    },

    async toggleClassificationSelection(elementId, nodeId, isChecked) {
      const fmea = window.fmeaData;
      const element = this.findElementInFmea(elementId, fmea);
      if (!element) return;

      if (!element.productClassificationIds) element.productClassificationIds = [];

      if (isChecked && !element.productClassificationIds.includes(nodeId)) {
        element.productClassificationIds.push(nodeId);
      } else if (!isChecked) {
        element.productClassificationIds = element.productClassificationIds.filter(id => id !== nodeId);
      }

      const lineage = ProductClassificationEngine.resolveAncestralLineage(element.productClassificationIds);
      element.ancestralClassificationIds = lineage.nodeIds;

      await this.ingestAncestralLessonsLearned(element, lineage.nodeIds, fmea);
      this.renderDrawerContent(element);
    },

    toggleRowVisibility(elementId, rowId, shouldHide) {
      const fmea = window.fmeaData;
      const element = this.findElementInFmea(elementId, fmea);
      if (!element || !element.inheritedLessons) return;

      const row = element.inheritedLessons.find(r => r.id === rowId);
      if (row) {
        row.is_hidden = shouldHide;
      }
      this.renderDrawerContent(element);
    },

    // Utilities
    findElementInFmea(elementId, fmea) {
      if (!fmea) return null;
      if (fmea.structureTree && Array.isArray(fmea.structureTree)) {
        const queue = [...fmea.structureTree];
        while (queue.length > 0) {
          const curr = queue.shift();
          if (curr.id === elementId) return curr;
          if (curr.children) queue.push(...curr.children);
        }
      }
      if (fmea.focusElement && fmea.focusElement.id === elementId) return fmea.focusElement;
      if (!fmea.focusElement) {
        fmea.focusElement = { id: elementId || 'elem-root', name: 'Focus Component', productClassificationIds: [], inheritedLessons: [] };
        return fmea.focusElement;
      }
      return fmea.focusElement;
    },

    collectAllClassifiedElements(fmea) {
      const result = [];
      if (!fmea) return result;
      if (fmea.structureTree && Array.isArray(fmea.structureTree)) {
        const queue = [...fmea.structureTree];
        while (queue.length > 0) {
          const curr = queue.shift();
          if (curr.productClassificationIds && curr.productClassificationIds.length > 0) {
            result.push(curr);
          }
          if (curr.children) queue.push(...curr.children);
        }
      }
      if (fmea.focusElement && fmea.focusElement.productClassificationIds && fmea.focusElement.productClassificationIds.length > 0) {
        result.push(fmea.focusElement);
      }
      return result;
    },

    // ── Location Master Datalists Binder ──
    populateLocationDatalists() {
      if (!window.QualityStorageSync) return;
      const plants = QualityStorageSync.getPlants();
      const rdCenters = QualityStorageSync.getRdCenters();

      // Create or update plants datalist
      let plantList = document.getElementById('jost-plants-datalist');
      if (!plantList) {
        plantList = document.createElement('datalist');
        plantList.id = 'jost-plants-datalist';
        document.body.appendChild(plantList);
      }
      plantList.innerHTML = plants.map(p => `<option value="${p.name}">${p.code} (${p.city})</option>`).join('');

      // Create or update RD datalist
      let rdList = document.getElementById('jost-rd-centers-datalist');
      if (!rdList) {
        rdList = document.createElement('datalist');
        rdList.id = 'jost-rd-centers-datalist';
        document.body.appendChild(rdList);
      }
      rdList.innerHTML = rdCenters.map(r => `<option value="${r.name}">${r.code} (${r.city})</option>`).join('');

      // Attach to inputs if present
      const pfmeaInput = document.getElementById('varPfmea_plantLoc');
      if (pfmeaInput) pfmeaInput.setAttribute('list', 'jost-plants-datalist');
      const cpInput = document.getElementById('varCp_plantLoc');
      if (cpInput) cpInput.setAttribute('list', 'jost-plants-datalist');
      const dfmeaInput = document.getElementById('varDfmea_engLoc');
      if (dfmeaInput) dfmeaInput.setAttribute('list', 'jost-rd-centers-datalist');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      FmeaClassificationLinker.populateLocationDatalists();
    }, 500);
  });

  window.FmeaClassificationLinker = FmeaClassificationLinker;
})(typeof window !== 'undefined' ? window : this);
