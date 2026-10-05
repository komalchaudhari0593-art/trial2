/**
 * JOST Quality Suite — 8D Problem Solving Lifecycle Engine
 * Handles D0-D8 Stepper Navigation, Stage State Rendering, Dynamic Validation, 
 * User Assignment from User Library, and Freeze/Lock Security.
 * Fully compatible with Bright, Black Ice, and Night Sky Themes.
 */

(function (window) {
  'use strict';

  const STAGES = [
    { id: 'd0', num: 'D0', title: 'Emergency Response', icon: '⚠️', color: '#38bdf8' },
    { id: 'd1', num: 'D1', title: '8D Team & Lead', icon: '👥', color: '#34d399' },
    { id: 'd2', num: 'D2', title: 'Problem Framing', icon: '📝', color: '#60a5fa' },
    { id: 'd3', num: 'D3', title: 'Containment (ICA)', icon: '🛡️', color: '#fbbf24' },
    { id: 'd4', num: 'D4', title: 'Root Cause (RCA)', icon: '🔍', color: '#f472b6' },
    { id: 'd5', num: 'D5', title: 'PCAs Plan', icon: '💡', color: '#10b981' },
    { id: 'd6', num: 'D6', title: 'Validate PCAs', icon: '📋', color: '#14b8a6' },
    { id: 'd7', num: 'D7', title: 'Prevent Recurrence', icon: '🔄', color: '#a855f7' },
    { id: 'd8', num: 'D8', title: 'Closure & Sign-Off', icon: '🏆', color: '#f43f5e' }
  ];

  class EightDEngine {
    constructor(containerId) {
      this.containerId = containerId;
      this.currentReport = null;
      this.activeStage = 'all';
      this.adminUnlockOverride = false;
    }

    setReport(report) {
      this.currentReport = report;
      this.adminUnlockOverride = false;
      if (!this.currentReport.d4_data_5why) this.currentReport.d4_data_5why = { chains: [] };
      if (!this.currentReport.d4_data_fishbone) this.currentReport.d4_data_fishbone = {};
      if (!this.currentReport.d2_data_5w2h) this.currentReport.d2_data_5w2h = {};
      this.render();
    }

    toggleAdminUnlock() {
      if (!QualityStorageSync.isAdmin()) return;
      this.adminUnlockOverride = !this.adminUnlockOverride;
      this.render();
    }

    filterStage(stageId) {
      this.activeStage = stageId;
      document.querySelectorAll('.fr-stage-btn').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(`fr-nav-${stageId}`);
      if (btn) btn.classList.add('active');

      const boxes = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];
      boxes.forEach(b => {
        const el = document.getElementById(`fr-card-${b}`);
        if (!el) return;
        if (stageId === 'all' || stageId === b) {
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      });
    }

    computeProgress(r) {
      const stageChecks = [
        Boolean(r.d0_symptoms),
        Boolean(r.assigned_lead_user_id || r.d1_champion),
        Boolean(r.d2_problem_description),
        Boolean(r.d3_containment_actions),
        Boolean(r.d4_root_cause || r.d4_occurrence_root_cause),
        Boolean(r.d5_corrective_actions || r.d5_pca_plans),
        Boolean(r.d6_implementation_details || r.d6_validation_results),
        Boolean(r.d7_preventive_actions || r.d7_system_updates),
        Boolean(r.d8_recognition || r.lesson_learned_status === 'Captured' || r.is_frozen)
      ];
      const completed = stageChecks.filter(Boolean).length;
      return {
        completed,
        total: stageChecks.length,
        percent: Math.round((completed / stageChecks.length) * 100)
      };
    }

    render() {
      const r = this.currentReport;
      const container = document.getElementById(this.containerId);
      if (!container || !r) return;

      const user = QualityStorageSync.getCurrentUser();
      const isAdmin = QualityStorageSync.isAdmin();
      const canEditBasic = QualityStorageSync.canEdit8D(r, user);

      // Determine locking:
      // If frozen and admin has activated unlock override, allow edit; otherwise obey freezing rules
      const isFrozen = Boolean(r.is_frozen) || r.status === 'Closed';
      const isLocked = isFrozen ? !(isAdmin && this.adminUnlockOverride) : !canEditBasic;

      const progress = this.computeProgress(r);
      const systemUsers = QualityStorageSync.getSystemUsers();
      const allPlants = QualityStorageSync.getPlants();

      let html = `
        <!-- Status & Authorization Alert Banner -->
        ${isFrozen ? `
          <div style="background:${this.adminUnlockOverride ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${this.adminUnlockOverride ? 'var(--qs-success)' : 'var(--qs-danger)'}; padding: 10px 16px; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.82rem; color: var(--qs-text-main); display: flex; align-items: center; gap: 8px;">
              <span>${this.adminUnlockOverride ? '🔓' : '🔒'}</span>
              <span>
                <strong>${this.adminUnlockOverride ? 'Admin Override Active:' : '8D Report is Frozen & Closed:'}</strong>
                ${this.adminUnlockOverride ? 'You have administrative override access to edit this frozen report.' : 'Modifications are locked for all users except System Administrators.'}
              </span>
            </div>
            ${isAdmin ? `
              <button class="btn btn-ghost" onclick="window.eightDEngine.toggleAdminUnlock()" style="font-size: 0.75rem; padding: 4px 10px; border: 1px solid var(--qs-border-main);">
                ${this.adminUnlockOverride ? '🔒 Exit Admin Edit' : '🔓 Admin Edit Override'}
              </button>
            ` : ''}
          </div>
        ` : (!canEditBasic ? `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid var(--qs-warning); padding: 10px 16px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.82rem; color: var(--qs-text-main); display: flex; align-items: center; gap: 8px;">
            <span>👁️</span>
            <span><strong>Read-Only Mode:</strong> This 8D is assigned to <em>${r.assigned_lead_name || r.d1_champion || 'Quality Lead'}</em>. Only the assigned owner, plant quality team, or administrators may edit.</span>
          </div>
        ` : '')}

        <!-- Top Meta Information Card -->
        <div class="card qs-meta-card" style="margin-bottom: 1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--qs-border-light);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="badge badge-primary" style="font-size:0.82rem; padding: 4px 10px;">
                📑 ${r.report_number || '8D Draft'}
              </span>
              <span style="font-size:0.85rem; font-weight:700; color:var(--qs-text-main);">
                ${r.part_name || 'Component'} <span style="font-weight:400; color:var(--qs-text-muted);">(${r.part_number || 'P/N'})</span>
              </span>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="font-size:0.75rem; color:var(--qs-text-muted);">
                <strong>Progress:</strong> <span style="color:var(--qs-primary); font-weight:700;">${progress.percent}% (${progress.completed}/9 Stages)</span>
              </div>
              <div>
                ${isFrozen 
                  ? `<span class="badge badge-success" style="padding:4px 8px;">🔒 Frozen & Closed</span>` 
                  : `<span class="badge badge-warning" style="padding:4px 8px;">🟡 In Progress</span>`
                }
              </div>
            </div>
          </div>

          <!-- Visual Progress Bar -->
          <div style="width:100%; height:6px; background:var(--qs-bg-stepper); border-radius:3px; overflow:hidden; margin-bottom:14px;">
            <div style="width:${progress.percent}%; height:100%; background:linear-gradient(90deg, var(--qs-primary) 0%, var(--qs-success) 100%); transition:width 0.3s ease;"></div>
          </div>

          <div class="form-grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div class="input-group">
              <label>📑 Report Number</label>
              <input type="text" id="eightd-num" value="${r.report_number || ''}" ${isLocked ? 'readonly' : ''} style="font-weight:700; color:var(--qs-primary);">
            </div>
            <div class="input-group">
              <label>🏢 Manufacturing Plant (Location Master)</label>
              <select id="eightd-plant" ${isLocked ? 'disabled' : ''} style="font-weight:600;">
                ${allPlants.map(p => `<option value="${p.id}" ${r.plant_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label>📅 Report Date</label>
              <input type="date" id="eightd-date" value="${r.report_date ? r.report_date.split('T')[0] : ''}" ${isLocked ? 'readonly' : ''}>
            </div>
            <div class="input-group">
              <label>🏷️ 8D Status</label>
              <select id="eightd-status" ${isLocked ? 'disabled' : ''}>
                <option value="Open" ${r.status === 'Open' ? 'selected' : ''}>🟡 Open</option>
                <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>🔵 In Progress</option>
                <option value="Closed" ${r.status === 'Closed' ? 'selected' : ''}>🟢 Closed</option>
              </select>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid var(--qs-border-light); font-size:0.75rem; color:var(--qs-text-muted);">
            <div><strong>Project:</strong> <span style="color:var(--qs-text-main);">${r.project_code || 'N/A'}</span></div>
            ${r.origin_failure_log_id ? `<div><strong>Source Failure Log:</strong> <span class="badge" style="background:var(--qs-primary-surface); color:var(--qs-primary);">${r.origin_failure_log_id}</span></div>` : ''}
            <div><strong>Assigned Lead:</strong> <span style="color:var(--qs-primary); font-weight:700;">${r.assigned_lead_name || r.d1_champion || 'Quality Lead'}</span></div>
          </div>
        </div>

        <!-- 8D Stage Stepper Navigation Bar -->
        <div class="qs-stepper-bar">
          <button class="fr-stage-btn active" id="fr-nav-all" onclick="window.eightDEngine.filterStage('all')">
            <span>🔲</span> All Stages
          </button>
          ${STAGES.map(s => `
            <button class="fr-stage-btn" id="fr-nav-${s.id}" onclick="window.eightDEngine.filterStage('${s.id}')">
              <span>${s.icon}</span> ${s.num}: ${s.title}
            </button>
          `).join('')}
        </div>

        <!-- STAGE D0 -->
        <div class="card qs-stage-card" id="fr-card-d0">
          <header class="qs-stage-header" style="border-left: 4px solid #38bdf8;">
            <div>
              <h3 style="color:#38bdf8;">⚠️ D0: Symptom & Emergency Containment</h3>
              <p class="qs-stage-subtitle">Document initial symptom discovery and immediate containment steps taken within 24h.</p>
            </div>
          </header>
          <div class="input-group" style="margin-top:10px;">
            <label>Emergency Action Details & Immediate Quarantine</label>
            <textarea id="eightd-d0" rows="3" placeholder="Describe emergency actions taken upon failure notification..." ${isLocked ? 'readonly' : ''}>${r.d0_symptoms || ''}</textarea>
          </div>
        </div>

        <!-- STAGE D1 -->
        <div class="card qs-stage-card" id="fr-card-d1">
          <header class="qs-stage-header" style="border-left: 4px solid #34d399;">
            <div>
              <h3 style="color:#34d399;">👥 D1: Cross-Functional 8D Team & Assigned Lead</h3>
              <p class="qs-stage-subtitle">Assign 8D task lead from the corporate user library and add cross-functional team members.</p>
            </div>
          </header>
          <div class="form-grid" style="grid-template-columns: 1fr 2fr; margin-top:10px;">
            <div class="input-group">
              <label>🎯 Assigned 8D Task Lead (User Library) <span style="color:var(--qs-danger)">*</span></label>
              <select id="eightd-assigned-lead" ${isLocked ? 'disabled' : ''} style="font-weight:700; color:var(--qs-primary);">
                ${systemUsers.map(u => `
                  <option value="${u.id}" ${r.assigned_lead_user_id === u.id || r.d1_champion === u.name ? 'selected' : ''}>
                    ${u.name} (${u.role})
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="input-group">
              <label>Cross-Functional Team Members (Operations, Tooling, R&D)</label>
              <input type="text" id="eightd-d1-members" value="${r.d1_team_members || ''}" placeholder="Team members (e.g. Suresh Patil, Anil Kumar)..." ${isLocked ? 'readonly' : ''}>
            </div>
          </div>
        </div>

        <!-- STAGE D2 -->
        <div class="card qs-stage-card" id="fr-card-d2">
          <header class="qs-stage-header" style="border-left: 4px solid #60a5fa;">
            <div>
              <h3 style="color:#60a5fa;">📝 D2: Problem Description Statement</h3>
              <p class="qs-stage-subtitle">Define the exact problem using quantified boundary facts.</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-ghost" onclick="window.open5W2HModal()" ${isLocked ? 'disabled' : ''}>❓ 5W2H Tool</button>
              <button type="button" class="btn btn-ghost" onclick="window.openIsIsNotModal()" ${isLocked ? 'disabled' : ''}>📊 IS / IS NOT</button>
            </div>
          </header>
          <div class="input-group" style="margin-top:10px;">
            <label>Comprehensive Problem Description Statement</label>
            <textarea id="eightd-d2" rows="4" placeholder="Detail the defect, deviation, observed extent, and operating context..." ${isLocked ? 'readonly' : ''}>${r.d2_problem_description || ''}</textarea>
          </div>
        </div>

        <!-- STAGE D3 -->
        <div class="card qs-stage-card" id="fr-card-d3">
          <header class="qs-stage-header" style="border-left: 4px solid #fbbf24;">
            <div>
              <h3 style="color:#fbbf24;">🛡️ D3: Interim Containment Actions (ICA)</h3>
              <p class="qs-stage-subtitle">Protect customer with sorting, clean points, quarantine, and certified stock.</p>
            </div>
          </header>
          <div class="input-group" style="margin-top:10px;">
            <label>Containment Verification & Implementation Evidence</label>
            <textarea id="eightd-d3" rows="3" placeholder="Detail quarantine batch numbers, sorting criteria, clean points established..." ${isLocked ? 'readonly' : ''}>${r.d3_containment_actions || ''}</textarea>
          </div>
        </div>

        <!-- STAGE D4 -->
        <div class="card qs-stage-card" id="fr-card-d4">
          <header class="qs-stage-header" style="border-left: 4px solid #f472b6;">
            <div>
              <h3 style="color:#f472b6;">🔍 D4: Root Cause Analysis (Dual-Chain 5-Why & Ishikawa)</h3>
              <p class="qs-stage-subtitle">Drill down both Occurrence (Why made?) and Escape (Why shipped?) root causes.</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-ghost" onclick="window.open5WhyModal()" ${isLocked ? 'disabled' : ''}>➕ Add 5-Why Chain</button>
              <button type="button" class="btn btn-ghost" onclick="window.openFishboneModal()" ${isLocked ? 'disabled' : ''}>🐟 Ishikawa 6M</button>
            </div>
          </header>

          <div style="margin:14px 0;">
            <label style="font-weight:700; font-size:0.75rem; color:var(--qs-text-muted); text-transform:uppercase; margin-bottom:8px; display:block;">Evaluated 5-Why Cause Chains:</label>
            <div id="qs-5why-chains-container">
              ${this.render5WhyChains(r.d4_data_5why?.chains || [], isLocked)}
            </div>
          </div>

          <div class="input-group" style="margin-top:10px;">
            <label>Confirmed & Verified Root Cause Statement</label>
            <textarea id="eightd-d4" rows="4" placeholder="Aggregated verified root causes..." ${isLocked ? 'readonly' : ''}>${r.d4_root_cause || r.d4_occurrence_root_cause || ''}</textarea>
          </div>
        </div>

        <!-- STAGE D5 -->
        <div class="card qs-stage-card" id="fr-card-d5">
          <header class="qs-stage-header" style="border-left: 4px solid #10b981;">
            <div>
              <h3 style="color:#10b981;">💡 D5: Permanent Corrective Actions (PCAs)</h3>
              <p class="qs-stage-subtitle">Select and engineer permanent technical solutions addressing root causes.</p>
            </div>
          </header>
          <div class="input-group" style="margin-top:10px;">
            <label>Selected Permanent Corrective Action Plan & Design Changes</label>
            <textarea id="eightd-d5" rows="3" placeholder="Poka-Yoke error proofing, tooling modifications, recipe locks..." ${isLocked ? 'readonly' : ''}>${r.d5_corrective_actions || r.d5_pca_plans || ''}</textarea>
          </div>
        </div>

        <!-- STAGE D6 -->
        <div class="card qs-stage-card" id="fr-card-d6">
          <header class="qs-stage-header" style="border-left: 4px solid #14b8a6;">
            <div>
              <h3 style="color:#14b8a6;">📋 D6: Implement & Validate PCAs</h3>
              <p class="qs-stage-subtitle">Perform trial runs, process capability studies (Cpk), and validate 0 recurrence.</p>
            </div>
          </header>
          <div class="input-group" style="margin-top:10px;">
            <label>Validation Study Results & Production Trial Data</label>
            <textarea id="eightd-d6" rows="3" placeholder="Validation run findings, Cpk capability, inspection results..." ${isLocked ? 'readonly' : ''}>${r.d6_implementation_details || r.d6_validation_results || ''}</textarea>
          </div>
        </div>

        <!-- STAGE D7 -->
        <div class="card qs-stage-card" id="fr-card-d7">
          <header class="qs-stage-header" style="border-left: 4px solid #a855f7;">
            <div>
              <h3 style="color:#a855f7;">🔄 D7: Systemic Preventive Actions</h3>
              <p class="qs-stage-subtitle">Update PFMEA, Control Plan, Work Instructions, and Standard Baseline.</p>
            </div>
          </header>
          <div class="input-group" style="margin-top:10px;">
            <label>Systemic Standard Updates (FMEA / Control Plan / SOP Revisions)</label>
            <textarea id="eightd-d7" rows="3" placeholder="Updated PFMEA line items, Control Plan frequency changes, SOP document numbers..." ${isLocked ? 'readonly' : ''}>${r.d7_preventive_actions || r.d7_system_updates || ''}</textarea>
          </div>
        </div>

        <!-- STAGE D8 -->
        <div class="card qs-stage-card" id="fr-card-d8">
          <header class="qs-stage-header" style="border-left: 4px solid #f43f5e; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h3 style="color:#f43f5e;">🏆 D8: Closure, Recognition & Lessons Learned</h3>
              <p class="qs-stage-subtitle">Acknowledge team effort, finalize sign-off, and capture into corporate Lessons Learned.</p>
            </div>
            <div style="display:flex; gap:8px;">
              ${!isFrozen && (QualityStorageSync.isQualityUser() || isAdmin) ? `
                <button type="button" class="btn btn-ghost" onclick="window.eightDEngine.finalizeAndFreezeReport()" style="font-size:0.8rem; padding:6px 12px; border:1px solid var(--qs-danger); color:var(--qs-danger);">
                  🔒 Finalize &amp; Freeze 8D
                </button>
              ` : ''}
              ${r.lesson_learned_status === 'Captured'
                ? `<span class="badge badge-success" style="font-size:0.8rem; padding:6px 14px;">🎓 Lesson Learned Captured</span>`
                : (QualityStorageSync.isQualityUser() || isAdmin ? `
                  <button type="button" class="btn btn-primary" onclick="window.triggerLessonLearnedTransfer('${r.id}')" style="font-size:0.8rem; padding:6px 14px;">
                    🎓 Transfer to Lessons Learned
                  </button>
                ` : '')
              }
            </div>
          </header>
          <div class="input-group" style="margin-top:10px;">
            <label>Team Recognition Remarks & Management Closure Sign-off</label>
            <textarea id="eightd-d8" rows="3" placeholder="Formal sign-off remarks and acknowledgment of team contributions..." ${isLocked ? 'readonly' : ''}>${r.d8_recognition || ''}</textarea>
          </div>
        </div>
      `;

      container.innerHTML = html;
      this.filterStage(this.activeStage);
    }

    async finalizeAndFreezeReport() {
      let confirmed = true;
      if (window.showCustomConfirm) {
        confirmed = await window.showCustomConfirm(
          'Freeze & Finalize 8D Report',
          'Are you sure you want to finalize and freeze this 8D Report? Once frozen, only System Administrators can edit or modify this record.',
          '🔒 Freeze & Finalize',
          'Cancel',
          true
        );
      } else {
        confirmed = confirm('Are you sure you want to finalize and freeze this 8D Report? Once frozen, only System Administrators can edit this record.');
      }
      if (!confirmed) return;

      const data = this.collectFormData();
      data.is_frozen = true;
      data.status = 'Closed';
      await QualityStorageSync.save8DReport(data);
      this.currentReport = data;
      this.render();
      if (window.showCustomToast) {
        window.showCustomToast('8D Report is now officially Closed and Frozen!', 'success', 4000);
      } else if (window.showCustomAlert) {
        await window.showCustomAlert('8D Report Frozen', '8D Report is now officially Closed and Frozen!', 'success');
      }
    }

    render5WhyChains(chains, isLocked = false) {
      if (!chains || chains.length === 0) {
        return `<div class="qs-empty-box">No 5-Why analysis chains created yet. Click "+ Add 5-Why Chain" to evaluate root causes.</div>`;
      }
      return chains.map((c, idx) => {
        const isReal = Boolean(c.is_real_root_cause);
        return `
          <div class="qs-5why-card ${isReal ? 'qs-5why-verified' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="font-weight:700; color:var(--qs-text-main); font-size:0.85rem; display:flex; align-items:center; gap:8px;">
                <span>${c.type === 'esc' ? '🛡️' : '⚙️'}</span>
                ${c.title || ('Chain #' + (idx + 1))}
                ${isReal ? '<span class="badge badge-success" style="font-size:0.65rem;">✓ VERIFIED ROOT CAUSE</span>' : '<span class="badge" style="background:var(--qs-tag-bg); color:var(--qs-text-muted); font-size:0.65rem;">CANDIDATE</span>'}
              </div>
              ${!isLocked ? `
                <div style="display:flex; gap:6px;">
                  <button type="button" class="btn btn-ghost" onclick="window.toggle5WhyRealCause('${c.id}')" style="font-size:0.7rem; padding:3px 8px; color:${isReal ? 'var(--qs-success)' : 'var(--qs-text-main)'};">
                    ${isReal ? '☑️ Confirmed' : '☐ Mark Real Cause'}
                  </button>
                  <button type="button" class="btn btn-ghost" onclick="window.delete5WhyChain('${c.id}')" style="font-size:0.7rem; padding:3px 8px; color:var(--qs-danger);">🗑️</button>
                </div>
              ` : ''}
            </div>
            <div style="font-size:0.8rem; color:var(--qs-text-muted); line-height:1.5;">
              <div><strong>1.</strong> ${c.why1 || '-'}</div>
              <div><strong>2.</strong> ${c.why2 || '-'}</div>
              <div><strong>3.</strong> ${c.why3 || '-'}</div>
              <div><strong>4.</strong> ${c.why4 || '-'}</div>
              <div style="color:${isReal ? 'var(--qs-success)' : 'var(--qs-primary)'}; font-weight:bold; margin-top:4px;">
                <strong>5. ROOT CAUSE:</strong> ${c.why5 || '-'}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    collectFormData() {
      const r = this.currentReport;
      if (!r) return null;

      const leadSelect = document.getElementById('eightd-assigned-lead');
      let leadId = r.assigned_lead_user_id;
      let leadName = r.assigned_lead_name || r.d1_champion;
      let leadUsername = r.assigned_lead_username;

      if (leadSelect) {
        leadId = leadSelect.value;
        const matchedUser = QualityStorageSync.getUserById(leadId);
        if (matchedUser) {
          leadName = matchedUser.name;
          leadUsername = matchedUser.username;
        }
      }

      const plantSelect = document.getElementById('eightd-plant');
      let plantId = r.plant_id;
      let plantName = r.plant_name;
      if (plantSelect) {
        plantId = plantSelect.value;
        const matchedPlant = QualityStorageSync.getPlantById(plantId);
        if (matchedPlant) plantName = matchedPlant.name;
      }

      return {
        ...r,
        report_number: document.getElementById('eightd-num')?.value || r.report_number,
        plant_id: plantId,
        plant_name: plantName,
        assigned_lead_user_id: leadId,
        assigned_lead_name: leadName,
        assigned_lead_username: leadUsername,
        report_date: document.getElementById('eightd-date')?.value || r.report_date,
        status: document.getElementById('eightd-status')?.value || r.status,
        d0_symptoms: document.getElementById('eightd-d0')?.value || '',
        d1_champion: leadName || '',
        d1_team_members: document.getElementById('eightd-d1-members')?.value || '',
        d2_problem_description: document.getElementById('eightd-d2')?.value || '',
        d3_containment_actions: document.getElementById('eightd-d3')?.value || '',
        d4_occurrence_root_cause: document.getElementById('eightd-d4')?.value || '',
        d4_root_cause: document.getElementById('eightd-d4')?.value || '',
        d5_corrective_actions: document.getElementById('eightd-d5')?.value || '',
        d6_implementation_details: document.getElementById('eightd-d6')?.value || '',
        d7_preventive_actions: document.getElementById('eightd-d7')?.value || '',
        d8_recognition: document.getElementById('eightd-d8')?.value || ''
      };
    }
  }

  window.EightDEngine = EightDEngine;
})(typeof window !== 'undefined' ? window : this);
