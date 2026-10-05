/**
 * JOST Quality Suite — Enterprise User & Plant Rights Management UI
 * Unified Corporate User Library for FMEA Workbench & Quality Suite.
 * Features:
 * 1. High-Density List / Table View of all Corporate Users.
 * 2. Role Master & Module Rights Management: Create custom roles & assign module permissions.
 * 3. Plant-wise scoping & multi-plant authorization.
 * 4. Granular FMEA Permissions + Quality Rights Extension.
 * 5. Full CRUD: Create, Edit, Delete, and Live Persona Simulation.
 * 6. Location Master (Plants & R&D Centers) administration.
 */

(function (window) {
  'use strict';

  function ensureRightsStyles() {
    if (document.getElementById('qs-rights-admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'qs-rights-admin-styles';
    style.textContent = `
      .qs-user-table-wrap {
        width: 100%;
        overflow-x: auto;
        border: 1px solid #334155;
        border-radius: 10px;
        background: #0f172a;
        margin-top: 10px;
        max-height: 520px;
        overflow-y: auto;
      }
      .qs-user-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        text-align: left;
        color: #f8fafc;
      }
      .qs-user-table th {
        background: #1e293b;
        color: #94a3b8;
        font-weight: 700;
        font-size: 11.5px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 10px 14px;
        border-bottom: 2px solid #334155;
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .qs-user-table td {
        padding: 10px 14px;
        border-bottom: 1px solid #1e293b;
        vertical-align: middle;
      }
      .qs-user-table tr:hover td {
        background: #19253b;
      }
      .qs-user-table tr.active-user-tr td {
        background: rgba(37, 99, 235, 0.12);
        border-left: 3px solid #3b82f6;
      }
      .qs-role-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 12px;
        color: #ffffff;
        display: inline-block;
        white-space: nowrap;
      }
      .qs-role-admin { background: #8b5cf6; }
      .qs-role-quality { background: #2563eb; }
      .qs-role-plant { background: #10b981; }
      .qs-role-engineer { background: #0284c7; }
      .qs-role-viewer { background: #64748b; }
      
      .qs-plant-tag {
        font-size: 11px;
        padding: 2px 7px;
        border-radius: 4px;
        background: rgba(96, 165, 250, 0.15);
        color: #93c5fd;
        border: 1px solid rgba(96, 165, 250, 0.3);
        display: inline-flex;
        align-items: center;
        margin: 2px 2px 2px 0;
        white-space: nowrap;
      }
      .qs-rights-tag {
        font-size: 10.5px;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin: 1px 2px 1px 0;
      }
      .qs-rights-tag.active {
        background: rgba(16, 185, 129, 0.15);
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      .qs-role-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
        transition: all 0.15s ease;
      }
      .qs-role-card:hover {
        border-color: #3b82f6;
        background: #24344d;
      }
    `;
    document.head.appendChild(style);
  }

  const RightsManagement = {
    searchQuery: '',
    roleFilter: 'all',
    plantFilter: 'all',

    init() {
      ensureRightsStyles();
      this.renderUserBadge();
      this.applyNavigationGating();
      this.bindUserEvents();
    },

    bindUserEvents() {
      window.addEventListener('jost-user-changed', () => {
        this.renderUserBadge();
        this.applyNavigationGating();
        if (typeof window.switchView === 'function') {
          const u = QualityStorageSync.getCurrentUser();
          if (u.role === 'Plant User') {
            window.switchView('log');
          } else {
            window.switchView('8d');
          }
        }
      });
    },

    renderUserBadge() {
      const container = document.getElementById('user-info-badge');
      if (!container) return;

      const user = QualityStorageSync.getCurrentUser();
      const plants = QualityStorageSync.getUserAuthorizedPlants(user);
      const plantLabel = user.assignedPlants?.includes('*') || user.role === 'Admin'
        ? 'All Global Plants'
        : (plants.length > 1 ? `${plants.length} Plants Assigned` : (plants[0]?.name.split('—')[1]?.trim() || plants[0]?.city || '1 Plant'));

      let roleBadgeColor = 'var(--qs-primary)';
      let roleIcon = '🔬';
      if (user.role === 'Admin') {
        roleBadgeColor = '#8b5cf6';
        roleIcon = '👑';
      } else if (user.role === 'Plant User') {
        roleBadgeColor = '#10b981';
        roleIcon = '👤';
      }

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:4px; width:100%; cursor:pointer;" onclick="RightsManagement.openUserManagementModal()" title="Click to Manage Users, Roles & Plant Rights">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-weight:700; color:var(--qs-text-main); font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${roleIcon} ${user.name.split('(')[0].trim()}
            </span>
            <span style="font-size:0.65rem; background:${roleBadgeColor}; color:#ffffff; padding:1px 6px; border-radius:10px; font-weight:bold;">
              ${user.role}
            </span>
          </div>
          <div style="font-size:0.68rem; color:var(--qs-text-muted); display:flex; align-items:center; justify-content:space-between;">
            <span>🏢 ${plantLabel}</span>
            <span style="color:#60a5fa; font-size:10px;">⚙️ Manage</span>
          </div>
        </div>
      `;
    },

    applyNavigationGating() {
      const user = QualityStorageSync.getCurrentUser();
      const isPlantUser = user.role === 'Plant User';

      const navReview = document.getElementById('nav-review');
      const nav8D = document.getElementById('nav-8d');

      if (isPlantUser) {
        if (navReview) navReview.style.display = 'none';
        if (nav8D) {
          nav8D.style.display = 'flex';
          const label = nav8D.querySelector('span:last-child');
          if (label) label.innerText = 'Plant 8D Problem Solving';
        }
      } else {
        if (navReview) navReview.style.display = 'flex';
        if (nav8D) {
          nav8D.style.display = 'flex';
          const label = nav8D.querySelector('span:last-child');
          if (label) label.innerText = '8D Problem Solving';
        }
      }
    },

    // ── Unified Corporate User Management Portal ──
    openUserManagementModal() {
      if (typeof window.openUserModal === 'function') {
        window.openUserModal('users');
        return;
      }
      // If within Quality Suite standalone pages (FailureRegister.html or LessonsLearned.html):
      if (typeof window.safeNavigateTo === 'function') {
        window.safeNavigateTo('index.html?openAdmin=users');
        return;
      }
      window.location.href = 'index.html?openAdmin=users';
    },

    renderUserTableModal() {
      const modal = document.getElementById('modal-user-management');
      if (!modal) return;

      const users = QualityStorageSync.getSystemUsers();
      const currentUser = QualityStorageSync.getCurrentUser();
      const canManage = QualityStorageSync.isAdmin() || QualityStorageSync.isQualityUser();
      const allPlants = QualityStorageSync.getPlants();
      const allRoles = QualityStorageSync.getRolesMaster();

      // Filter users
      const filtered = users.filter(u => {
        const q = this.searchQuery.toLowerCase();
        const matchesQuery = !q || 
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q));

        const matchesRole = this.roleFilter === 'all' || (u.role && u.role.toLowerCase() === this.roleFilter.toLowerCase());
        
        let matchesPlant = true;
        if (this.plantFilter !== 'all') {
          const assigned = u.assignedPlants || [];
          matchesPlant = assigned.includes('*') || assigned.includes(this.plantFilter);
        }

        return matchesQuery && matchesRole && matchesPlant;
      });

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 1100px; max-height: 88vh; display: flex; flex-direction: column; width: 95%;">
          <!-- Header -->
          <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--qs-border-light); padding-bottom:12px;">
            <div>
              <h3 style="margin:0; color:#ffffff; font-size:1.25rem; display:flex; align-items:center; gap:8px;">
                <span>👥</span> Unified User Accounts &amp; Plant Rights Management
              </h3>
              <p style="font-size:0.78rem; color:var(--qs-text-muted); margin:3px 0 0 0;">
                Single corporate user library shared across FMEA Workbench &amp; Quality Suite with plant-wise authorization.
              </p>
            </div>
            <span onclick="document.getElementById('modal-user-management').style.display='none'" style="cursor:pointer; font-size:1.3rem; opacity:0.6;" title="Close">✕</span>
          </header>

          <!-- Top Toolbar -->
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:300px;">
              <input type="text" id="usr-search-input" class="search-box-input" placeholder="🔍 Search users by name, username, email, or role..." value="${escapeHtml(this.searchQuery)}" oninput="RightsManagement.setSearch(this.value)" style="flex:1; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 12px; border-radius:8px; font-size:13px;" />
              
              <select onchange="RightsManagement.setRoleFilter(this.value)" style="background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:8px; font-size:12.5px;">
                <option value="all" ${this.roleFilter === 'all' ? 'selected' : ''}>All Roles</option>
                ${allRoles.map(r => `<option value="${escapeHtml(r.code)}" ${this.roleFilter.toLowerCase() === r.code.toLowerCase() ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}
              </select>

              <select onchange="RightsManagement.setPlantFilter(this.value)" style="background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:8px; font-size:12.5px;">
                <option value="all" ${this.plantFilter === 'all' ? 'selected' : ''}>All Plants</option>
                ${allPlants.map(p => `<option value="${p.id}" ${this.plantFilter === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
              </select>
            </div>

            <div style="display:flex; gap:8px;">
              ${canManage ? `
                <button class="btn btn-ghost" onclick="RightsManagement.openRoleMasterModal();" style="font-size:0.8rem; padding:8px 14px; color:#c084fc;">
                  👑 Role Master &amp; Rights
                </button>
              ` : ''}
              <button class="btn btn-ghost" onclick="RightsManagement.openLocationMasterModal();" style="font-size:0.8rem; padding:8px 14px;">
                🏢 Location Master
              </button>
              ${canManage ? `
                <button class="btn btn-primary" onclick="RightsManagement.openEditUserModal(null)" style="font-size:0.8rem; padding:8px 14px;">
                  ➕ Create New User
                </button>
              ` : ''}
            </div>
          </div>

          <!-- User Table / List View -->
          <div class="qs-user-table-wrap">
            <table class="qs-user-table">
              <thead>
                <tr>
                  <th style="width:26%;">User Persona</th>
                  <th style="width:14%;">System Role</th>
                  <th style="width:22%;">Assigned Plant Scopes</th>
                  <th style="width:22%;">Quality &amp; FMEA Capabilities</th>
                  <th style="width:16%; text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">
                      No users match the search criteria.
                    </td>
                  </tr>
                ` : filtered.map(u => {
                  const isActive = u.id === currentUser.id || u.username === currentUser.username;
                  const isGlobal = u.assignedPlants?.includes('*') || u.role === 'Admin';
                  const plants = QualityStorageSync.getUserAuthorizedPlants(u);
                  const roleDef = QualityStorageSync.getRoleByCode(u.role);
                  const badgeColor = roleDef?.color || '#64748b';

                  let roleIcon = '👤';
                  if (u.role === 'Admin' || u.role === 'SuperAdmin') roleIcon = '👑';
                  else if (u.role === 'Quality User') roleIcon = '🔬';
                  else if (u.role === 'Lead Engineer' || u.role === 'Engineer') roleIcon = '⚙️';
                  else if (u.role === 'Viewer') roleIcon = '👁️';

                  return `
                    <tr class="${isActive ? 'active-user-tr' : ''}">
                      <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                          <div style="font-size:20px; line-height:1;">${roleIcon}</div>
                          <div>
                            <div style="font-weight:700; color:#f8fafc; font-size:13.5px; display:flex; align-items:center; gap:6px;">
                              <span>${escapeHtml(u.name)}</span>
                              ${isActive ? '<span style="font-size:10px; padding:1px 6px; border-radius:10px; background:#3b82f6; color:#ffffff; font-weight:800;">ACTIVE</span>' : ''}
                            </div>
                            <div style="font-size:11.5px; color:#64748b;">@${escapeHtml(u.username)} &bull; ${escapeHtml(u.email || 'No email')}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span class="qs-role-badge" style="background:${badgeColor};">${escapeHtml(u.role || 'User')}</span>
                      </td>

                      <td>
                        <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:240px;">
                          ${isGlobal 
                            ? `<span class="qs-plant-tag" style="background:rgba(139,92,246,0.15); color:#c4b5fd; border-color:rgba(139,92,246,0.3);">🌐 Global (* All Plants)</span>`
                            : (plants.length > 0 
                                ? plants.map(p => `<span class="qs-plant-tag">🏢 ${escapeHtml(p.code || p.city || p.name)}</span>`).join('')
                                : `<span style="color:#64748b; font-size:11px;">No plant bound</span>`
                              )
                          }
                        </div>
                      </td>

                      <td>
                        <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:260px;">
                          ${u.role === 'Admin' 
                            ? `<span class="qs-rights-tag active">⚡ Full Master Admin</span>` 
                            : ''
                          }
                          ${u.role === 'Quality User'
                            ? `<span class="qs-rights-tag active">✓ Triage Logs</span><span class="qs-rights-tag active">✓ 8D Lead</span><span class="qs-rights-tag active">✓ Freeze 8D</span>`
                            : ''
                          }
                          ${u.role === 'Plant User'
                            ? `<span class="qs-rights-tag active">✓ Create Logs</span><span class="qs-rights-tag">8D Team Member</span>`
                            : ''
                          }
                          ${u.permissions?.canEditFMEA ? `<span class="qs-rights-tag">FMEA Edit</span>` : ''}
                        </div>
                      </td>

                      <td style="text-align:right;">
                        <div style="display:flex; justify-content:flex-end; gap:6px;">
                          <button class="btn btn-ghost" onclick="RightsManagement.selectUser('${u.id || u.username}')" style="font-size:11.5px; padding:4px 8px; ${isActive ? 'color:#60a5fa;' : ''}" title="Switch Active Persona">
                            ${isActive ? 'Active' : '⚡ Switch'}
                          </button>
                          ${canManage ? `
                            <button class="btn btn-ghost" onclick="RightsManagement.openEditUserModal('${u.id || u.username}')" style="font-size:11.5px; padding:4px 8px;" title="Edit Rights">
                              ✏️
                            </button>
                            ${!isActive && u.username !== 'admin' ? `
                              <button class="btn btn-ghost" onclick="RightsManagement.deleteUser('${u.id || u.username}')" style="font-size:11.5px; padding:4px 8px; color:#f87171;" title="Delete User">
                                🗑️
                              </button>
                            ` : ''}
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; border-top:1px solid var(--qs-border-light); padding-top:10px;">
            <div style="font-size:12px; color:#64748b;">
              Showing <strong>${filtered.length}</strong> of <strong>${users.length}</strong> corporate user accounts
            </div>
            <button class="btn btn-primary" onclick="document.getElementById('modal-user-management').style.display='none'">Done</button>
          </div>
        </div>
      `;
    },

    setSearch(q) {
      this.searchQuery = q || '';
      this.renderUserTableModal();
    },

    setRoleFilter(r) {
      this.roleFilter = r || 'all';
      this.renderUserTableModal();
    },

    setPlantFilter(p) {
      this.plantFilter = p || 'all';
      this.renderUserTableModal();
    },

    // ── Role Master & Module Rights Management Modal ──
    openRoleMasterModal() {
      let modal = document.getElementById('modal-role-master');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-role-master';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
      }

      const roles = QualityStorageSync.getRolesMaster();

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 920px; max-height: 88vh; display: flex; flex-direction: column;">
          <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--qs-border-light); padding-bottom:10px;">
            <div>
              <h3 style="margin:0; color:#ffffff; font-size:1.2rem; display:flex; align-items:center; gap:8px;">
                <span>👑</span> Corporate Role Master &amp; Module Permissions
              </h3>
              <p style="font-size:0.75rem; color:var(--qs-text-muted); margin:3px 0 0 0;">
                Define custom roles and configure default access rights across FMEA Workbench and Quality Suite modules.
              </p>
            </div>
            <span onclick="document.getElementById('modal-role-master').style.display='none'" style="cursor:pointer; font-size:1.2rem; opacity:0.6;">✕</span>
          </header>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="font-size:0.8rem; color:#94a3b8; font-weight:600;">
              Total Roles: <span style="color:#60a5fa;">${roles.length}</span>
            </div>
            <button class="btn btn-primary" onclick="RightsManagement.openEditRoleModal(null)" style="font-size:0.78rem; padding:6px 12px;">
              ➕ Create Custom Role
            </button>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap:12px; max-height:480px; overflow-y:auto; padding:4px;">
            ${roles.map(r => {
              const qR = r.qualityRights || {};
              const pR = r.permissions || {};

              return `
                <div class="qs-role-card">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                      <div>
                        <div style="font-weight:700; color:#ffffff; font-size:0.95rem;">${escapeHtml(r.name)}</div>
                        <div style="font-size:0.72rem; color:#64748b;">Code: <code>${escapeHtml(r.code)}</code></div>
                      </div>
                      <span class="qs-role-badge" style="background:${r.color || '#3b82f6'};">${escapeHtml(r.code)}</span>
                    </div>

                    <div style="font-size:0.75rem; color:#94a3b8; line-height:1.4; margin-bottom:8px;">
                      ${escapeHtml(r.description || 'No description.')}
                    </div>

                    <div style="font-size:11px; color:#60a5fa; font-weight:700; margin-bottom:4px;">Module Capabilities:</div>
                    <div style="display:flex; flex-wrap:wrap; gap:3px;">
                      ${pR.canEditFMEA ? `<span class="qs-rights-tag active">✓ FMEA Edit</span>` : ''}
                      ${pR.canFreezeRevision ? `<span class="qs-rights-tag active">✓ Freeze Rev</span>` : ''}
                      ${qR.canCreateDefectLog ? `<span class="qs-rights-tag active">✓ Create Logs</span>` : ''}
                      ${qR.canReviewTriageLog ? `<span class="qs-rights-tag active">✓ Triage</span>` : ''}
                      ${qR.canAssign8DLead ? `<span class="qs-rights-tag active">✓ 8D Lead</span>` : ''}
                      ${qR.canFreeze8D ? `<span class="qs-rights-tag active">✓ Freeze 8D</span>` : ''}
                      ${qR.canManageLessonsLearned ? `<span class="qs-rights-tag active">✓ Lessons Admin</span>` : ''}
                    </div>
                  </div>

                  <div style="display:flex; justify-content:flex-end; gap:6px; border-top:1px solid #334155; padding-top:8px; margin-top:6px;">
                    <button class="btn btn-ghost" onclick="RightsManagement.openEditRoleModal('${r.id}')" style="font-size:0.72rem; padding:4px 8px;">
                      ✏️ Edit Rights
                    </button>
                    ${!r.isSystem ? `
                      <button class="btn btn-ghost" onclick="RightsManagement.deleteRole('${r.id}')" style="font-size:0.72rem; padding:4px 8px; color:#f87171;">
                        🗑️
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:12px; border-top:1px solid var(--qs-border-light); padding-top:10px;">
            <button class="btn btn-primary" onclick="document.getElementById('modal-role-master').style.display='none'">Done</button>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    },

    openEditRoleModal(roleId = null) {
      let modal = document.getElementById('modal-edit-role');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-edit-role';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
      }

      const role = roleId ? QualityStorageSync.getRoleByCode(roleId) : null;
      const isNew = !role;
      const qR = role?.qualityRights || {};
      const pR = role?.permissions || {};

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 640px; max-height: 88vh; overflow-y:auto;">
          <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--qs-border-light); padding-bottom:8px;">
            <h3 style="margin:0; color:var(--qs-primary);">
              ${isNew ? '➕ Create Custom Role & Rights' : `✏️ Edit Role: ${escapeHtml(role.name)}`}
            </h3>
            <span onclick="document.getElementById('modal-edit-role').style.display='none'" style="cursor:pointer; font-size:1.2rem; opacity:0.6;">✕</span>
          </header>

          <form id="form-role-edit" onsubmit="event.preventDefault(); RightsManagement.saveRoleForm('${roleId || ''}');" style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:block; margin-bottom:4px;">Role Code / Identifier *</label>
                <input type="text" id="role-edit-code" value="${role ? escapeHtml(role.code) : ''}" ${!isNew && role.isSystem ? 'readonly' : 'required'} placeholder="e.g. SQA Engineer" style="width:100%; box-sizing:border-box; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:6px;" />
              </div>
              <div>
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:block; margin-bottom:4px;">Role Full Name *</label>
                <input type="text" id="role-edit-name" value="${role ? escapeHtml(role.name) : ''}" required placeholder="e.g. Supplier Quality Lead" style="width:100%; box-sizing:border-box; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:6px;" />
              </div>
            </div>

            <div>
              <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:block; margin-bottom:4px;">Description</label>
              <textarea id="role-edit-desc" rows="2" placeholder="Brief scope and responsibilities..." style="width:100%; box-sizing:border-box; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:6px; font-family:inherit;">${role ? escapeHtml(role.description || '') : ''}</textarea>
            </div>

            <!-- FMEA Workbench Rights -->
            <div style="background:#0b1120; border:1px solid #334155; border-radius:6px; padding:10px;">
              <label style="font-size:0.75rem; color:#38bdf8; font-weight:700; display:block; margin-bottom:6px;">
                🧭 FMEA Workbench Module Rights
              </label>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:12px; color:#cbd5e1;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-fmea-edit" ${pR.canEditFMEA ? 'checked' : ''} />
                  <span>Edit FMEA Tree &amp; Matrix</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-fmea-rev" ${pR.canCreateRevision ? 'checked' : ''} />
                  <span>Create Revisions</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-fmea-freeze" ${pR.canFreezeRevision ? 'checked' : ''} />
                  <span>Freeze &amp; Sign-off Revision</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-fmea-pfmea" ${pR.canManagePFMEA ? 'checked' : ''} />
                  <span>Manage Process FMEA</span>
                </label>
              </div>
            </div>

            <!-- Quality Suite Rights -->
            <div style="background:#0b1120; border:1px solid #334155; border-radius:6px; padding:10px;">
              <label style="font-size:0.75rem; color:#60a5fa; font-weight:700; display:block; margin-bottom:6px;">
                🛡️ Quality Suite Module Rights
              </label>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:12px; color:#cbd5e1;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-q-create-log" ${qR.canCreateDefectLog !== false ? 'checked' : ''} />
                  <span>Create Defect Logs</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-q-review-log" ${qR.canReviewTriageLog ? 'checked' : ''} />
                  <span>Triage &amp; Review Logs</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-q-assign-8d" ${qR.canAssign8DLead ? 'checked' : ''} />
                  <span>Assign 8D Task Leads</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-q-freeze-8d" ${qR.canFreeze8D ? 'checked' : ''} />
                  <span>Freeze / Close 8D</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-q-lessons" ${qR.canManageLessonsLearned ? 'checked' : ''} />
                  <span>Manage Lessons Learned</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-r-q-taxonomy" ${qR.canManageTaxonomy ? 'checked' : ''} />
                  <span>Manage Product Taxonomy</span>
                </label>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px; border-top:1px solid var(--qs-border-light); padding-top:10px;">
              <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-edit-role').style.display='none'">Cancel</button>
              <button type="submit" class="btn btn-primary">💾 Save Role &amp; Permissions</button>
            </div>
          </form>
        </div>
      `;
      modal.style.display = 'flex';
    },

    async saveRoleForm(roleId) {
      const code = document.getElementById('role-edit-code')?.value.trim();
      const name = document.getElementById('role-edit-name')?.value.trim();
      const desc = document.getElementById('role-edit-desc')?.value.trim();

      const canEditFMEA = document.getElementById('chk-r-fmea-edit')?.checked;
      const canCreateRevision = document.getElementById('chk-r-fmea-rev')?.checked;
      const canFreezeRevision = document.getElementById('chk-r-fmea-freeze')?.checked;
      const canManagePFMEA = document.getElementById('chk-r-fmea-pfmea')?.checked;

      const canCreateDefectLog = document.getElementById('chk-r-q-create-log')?.checked;
      const canReviewTriageLog = document.getElementById('chk-r-q-review-log')?.checked;
      const canAssign8DLead = document.getElementById('chk-r-q-assign-8d')?.checked;
      const canFreeze8D = document.getElementById('chk-r-q-freeze-8d')?.checked;
      const canManageLessonsLearned = document.getElementById('chk-r-q-lessons')?.checked;
      const canManageTaxonomy = document.getElementById('chk-r-q-taxonomy')?.checked;

      if (!code || !name) {
        if (window.showCustomAlert) window.showCustomAlert('Missing Info', 'Role Code and Full Name are required.', 'warning');
        return;
      }

      const permissions = {
        canEditFMEA: !!canEditFMEA,
        canCreateRevision: !!canCreateRevision,
        canFreezeRevision: !!canFreezeRevision,
        canManagePFMEA: !!canManagePFMEA,
        canManageVariants: !!canFreezeRevision,
        canExport: true,
        canManageFileRights: roleId === 'role-admin',
        canManageUsers: roleId === 'role-admin'
      };

      const qualityRights = {
        canCreateDefectLog: !!canCreateDefectLog,
        canReviewTriageLog: !!canReviewTriageLog,
        canAssign8DLead: !!canAssign8DLead,
        canEditDesignated8D: true,
        canFreeze8D: !!canFreeze8D,
        canManageLessonsLearned: !!canManageLessonsLearned,
        canManageLocationMaster: roleId === 'role-admin',
        canManageTaxonomy: !!canManageTaxonomy
      };

      const roles = QualityStorageSync.getRolesMaster();
      if (roleId) {
        const r = roles.find(x => x.id === roleId || x.code === roleId);
        if (r) {
          r.name = name;
          r.description = desc;
          r.permissions = permissions;
          r.qualityRights = qualityRights;
        }
      } else {
        const newId = `role-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const newRole = {
          id: newId,
          code,
          name,
          description: desc,
          color: '#3b82f6',
          isSystem: false,
          permissions,
          qualityRights
        };
        roles.push(newRole);
      }

      await QualityStorageSync.saveRolesMaster(roles);
      const editModal = document.getElementById('modal-edit-role');
      if (editModal) editModal.style.display = 'none';

      this.openRoleMasterModal();
      this.renderUserTableModal();
      if (window.showCustomToast) {
        window.showCustomToast(`Role "${name}" saved successfully!`, 'success');
      }
    },

    async deleteRole(roleId) {
      let roles = QualityStorageSync.getRolesMaster();
      const r = roles.find(x => x.id === roleId);
      if (r && r.isSystem) {
        if (window.showCustomAlert) window.showCustomAlert('Cannot Delete', 'System default roles cannot be deleted.', 'warning');
        return;
      }

      let confirmed = true;
      if (window.showCustomConfirm) {
        confirmed = await window.showCustomConfirm(
          'Delete Role',
          `Are you sure you want to permanently delete custom role <strong>"${r ? escapeHtml(r.name) : roleId}"</strong>?`,
          'Delete',
          'Cancel',
          true
        );
      } else {
        confirmed = confirm(`Delete role ${r ? r.name : roleId}?`);
      }
      if (!confirmed) return;

      roles = roles.filter(x => x.id !== roleId);
      await QualityStorageSync.saveRolesMaster(roles);
      this.openRoleMasterModal();
      this.renderUserTableModal();
      if (window.showCustomToast) {
        window.showCustomToast(`Role deleted.`, 'info');
      }
    },

    // ── Create or Edit User Modal with FMEA & Quality Rights ──
    openEditUserModal(userId = null) {
      let modal = document.getElementById('modal-edit-user-rights');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-edit-user-rights';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
      }

      const allPlants = QualityStorageSync.getPlants();
      const allRoles = QualityStorageSync.getRolesMaster();
      const existingUser = userId ? QualityStorageSync.getUserById(userId) : null;
      const isNew = !existingUser;

      const userRole = existingUser ? existingUser.role : (allRoles[2]?.code || 'Plant User');
      const userAssigned = existingUser ? (existingUser.assignedPlants || []) : [];
      const hasAllPlants = userAssigned.includes('*') || userRole === 'Admin';
      const perms = existingUser?.permissions || {};
      const qRights = existingUser?.qualityRights || {};

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 680px; max-height: 88vh; overflow-y:auto;">
          <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--qs-border-light); padding-bottom:8px;">
            <h3 style="margin:0; color:var(--qs-primary);">
              ${isNew ? '➕ Create User & Assign Capabilities' : `✏️ Edit User: ${escapeHtml(existingUser.name)}`}
            </h3>
            <span onclick="document.getElementById('modal-edit-user-rights').style.display='none'" style="cursor:pointer; font-size:1.2rem; opacity:0.6;">✕</span>
          </header>

          <form id="form-user-edit" onsubmit="event.preventDefault(); RightsManagement.saveUserForm('${userId || ''}');" style="display:flex; flex-direction:column; gap:12px;">
            <!-- Basic Profile -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:block; margin-bottom:4px;">Username *</label>
                <input type="text" id="usr-edit-username" value="${existingUser ? escapeHtml(existingUser.username) : ''}" ${!isNew ? 'readonly' : 'required'} placeholder="e.g. rahul.sharma" style="width:100%; box-sizing:border-box; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:6px;" />
              </div>
              <div>
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:block; margin-bottom:4px;">Full Name *</label>
                <input type="text" id="usr-edit-fullname" value="${existingUser ? escapeHtml(existingUser.name) : ''}" required placeholder="e.g. Rahul Sharma" style="width:100%; box-sizing:border-box; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:6px;" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div>
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:block; margin-bottom:4px;">Role Profile *</label>
                <select id="usr-edit-role" style="width:100%; box-sizing:border-box; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:6px;" onchange="RightsManagement.handleRoleChange(this.value)">
                  ${allRoles.map(r => `
                    <option value="${escapeHtml(r.code)}" ${userRole.toLowerCase() === r.code.toLowerCase() ? 'selected' : ''}>
                      ${escapeHtml(r.name)} (${escapeHtml(r.code)})
                    </option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:block; margin-bottom:4px;">Password</label>
                <input type="password" id="usr-edit-password" placeholder="${isNew ? 'Enter password' : 'Leave blank to keep current'}" style="width:100%; box-sizing:border-box; background:#1e293b; color:#ffffff; border:1px solid #334155; padding:8px 10px; border-radius:6px;" />
              </div>
            </div>

            <!-- Plant Scoping Assignment -->
            <div>
              <label style="font-size:0.75rem; color:#94a3b8; font-weight:600; display:flex; justify-content:space-between; margin-bottom:6px;">
                <span>🏢 Authorized Manufacturing Plants</span>
                <span style="color:#60a5fa; font-size:11px; cursor:pointer;" onclick="RightsManagement.toggleSelectAllPlants()">Toggle All</span>
              </label>
              <div id="usr-plant-checklist" style="max-height:120px; overflow-y:auto; background:#0b1120; border:1px solid #334155; border-radius:6px; padding:8px; display:flex; flex-direction:column; gap:6px;">
                <label style="display:flex; align-items:center; gap:8px; font-size:0.78rem; color:#cbd5e1; cursor:pointer;">
                  <input type="checkbox" id="chk-plant-all" value="*" ${hasAllPlants ? 'checked' : ''} onchange="RightsManagement.handleAllPlantsCheckbox(this.checked)" />
                  <strong style="color:#60a5fa;">* Global Access (All Plants)</strong>
                </label>
                <div style="border-top:1px dashed #334155; margin:2px 0;"></div>
                ${allPlants.map(p => {
                  const isChecked = hasAllPlants || userAssigned.includes(p.id) || userAssigned.includes(p.code);
                  return `
                    <label style="display:flex; align-items:center; gap:8px; font-size:0.75rem; color:#cbd5e1; cursor:pointer;">
                      <input type="checkbox" class="chk-single-plant" value="${p.id}" ${isChecked ? 'checked' : ''} />
                      <span>${escapeHtml(p.name)} <span style="color:#64748b;">(${p.code})</span></span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Quality Rights Extension -->
            <div style="background:#0b1120; border:1px solid #334155; border-radius:6px; padding:10px;">
              <label style="font-size:0.75rem; color:#60a5fa; font-weight:700; display:block; margin-bottom:6px;">
                🛡️ Quality Suite Document &amp; Workflow Rights
              </label>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:12px; color:#cbd5e1;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-q-create-log" ${qRights.canCreateDefectLog !== false ? 'checked' : ''} />
                  <span>Can Create Failure Logs</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-q-review-log" ${qRights.canReviewTriageLog || userRole === 'Quality User' || userRole === 'Admin' ? 'checked' : ''} />
                  <span>Can Triage &amp; Review Logs</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-q-assign-8d" ${qRights.canAssign8DLead || userRole === 'Quality User' || userRole === 'Admin' ? 'checked' : ''} />
                  <span>Can Assign 8D Task Lead</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk-q-freeze-8d" ${qRights.canFreeze8D || userRole === 'Quality User' || userRole === 'Admin' ? 'checked' : ''} />
                  <span>Can Freeze / Close 8D</span>
                </label>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px; border-top:1px solid var(--qs-border-light); padding-top:10px;">
              <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-edit-user-rights').style.display='none'">Cancel</button>
              <button type="submit" class="btn btn-primary">💾 Save User &amp; Rights</button>
            </div>
          </form>
        </div>
      `;
      modal.style.display = 'flex';
    },

    handleRoleChange(roleCode) {
      const role = QualityStorageSync.getRoleByCode(roleCode);
      const allChk = document.getElementById('chk-plant-all');
      if (roleCode === 'Admin' && allChk) {
        allChk.checked = true;
        this.handleAllPlantsCheckbox(true);
      }

      if (role && role.qualityRights) {
        const createChk = document.getElementById('chk-q-create-log');
        const reviewChk = document.getElementById('chk-q-review-log');
        const assignChk = document.getElementById('chk-q-assign-8d');
        const freezeChk = document.getElementById('chk-q-freeze-8d');

        if (createChk) createChk.checked = !!role.qualityRights.canCreateDefectLog;
        if (reviewChk) reviewChk.checked = !!role.qualityRights.canReviewTriageLog;
        if (assignChk) assignChk.checked = !!role.qualityRights.canAssign8DLead;
        if (freezeChk) freezeChk.checked = !!role.qualityRights.canFreeze8D;
      }
    },

    handleAllPlantsCheckbox(checked) {
      const singleBoxes = document.querySelectorAll('.chk-single-plant');
      singleBoxes.forEach(cb => {
        cb.checked = checked;
        cb.disabled = checked;
      });
    },

    toggleSelectAllPlants() {
      const allChk = document.getElementById('chk-plant-all');
      if (allChk) {
        allChk.checked = !allChk.checked;
        this.handleAllPlantsCheckbox(allChk.checked);
      }
    },

    async saveUserForm(userId) {
      const username = document.getElementById('usr-edit-username')?.value.trim();
      const name = document.getElementById('usr-edit-fullname')?.value.trim();
      const role = document.getElementById('usr-edit-role')?.value;
      const pwd = document.getElementById('usr-edit-password')?.value;
      const allPlantsChk = document.getElementById('chk-plant-all')?.checked;

      const canCreateDefectLog = document.getElementById('chk-q-create-log')?.checked;
      const canReviewTriageLog = document.getElementById('chk-q-review-log')?.checked;
      const canAssign8DLead = document.getElementById('chk-q-assign-8d')?.checked;
      const canFreeze8D = document.getElementById('chk-q-freeze-8d')?.checked;

      if (!username || !name) {
        if (window.showCustomAlert) window.showCustomAlert('Missing Info', 'Username and Full Name are required.', 'warning');
        return;
      }

      let assignedPlants = [];
      if (allPlantsChk || role === 'Admin') {
        assignedPlants = ['*'];
      } else {
        const singleBoxes = document.querySelectorAll('.chk-single-plant:checked');
        singleBoxes.forEach(cb => assignedPlants.push(cb.value));
        if (assignedPlants.length === 0) {
          assignedPlants = ['PLANT-PUNE-HQ'];
        }
      }

      const roleDef = QualityStorageSync.getRoleByCode(role);
      const qualityRights = {
        canCreateDefectLog: !!canCreateDefectLog,
        canReviewTriageLog: !!canReviewTriageLog,
        canAssign8DLead: !!canAssign8DLead,
        canEditDesignated8D: true,
        canFreeze8D: !!canFreeze8D,
        canManageLessonsLearned: roleDef?.qualityRights?.canManageLessonsLearned || role === 'Admin',
        canManageLocationMaster: roleDef?.qualityRights?.canManageLocationMaster || role === 'Admin',
        canManageTaxonomy: roleDef?.qualityRights?.canManageTaxonomy || role === 'Admin'
      };

      const permissions = Object.assign({}, roleDef?.permissions || {}, {
        canEditFMEA: role !== 'Viewer' && role !== 'Plant User',
        canManageUsers: role === 'Admin'
      });

      const users = QualityStorageSync.getSystemUsers();
      if (userId) {
        const u = users.find(x => x.id === userId || x.username === userId);
        if (u) {
          u.name = name;
          u.role = role;
          u.assignedPlants = assignedPlants;
          u.qualityRights = qualityRights;
          u.permissions = permissions;
          if (pwd && pwd.trim()) u.password = pwd.trim();
        }
      } else {
        if (users.some(x => x.username.toLowerCase() === username.toLowerCase())) {
          if (window.showCustomAlert) window.showCustomAlert('Duplicate User', `Username "${username}" already exists.`, 'error');
          return;
        }
        const newUser = {
          id: `usr-${Date.now().toString().slice(-4)}`,
          username,
          name,
          role,
          email: `${username}@jostworld.com`,
          password: pwd || '123456',
          assignedPlants,
          qualityRights,
          permissions
        };
        users.push(newUser);
      }

      await QualityStorageSync.saveSystemUsers(users);
      try { localStorage.setItem('jost_system_users', JSON.stringify(users)); } catch (e) { }

      const editModal = document.getElementById('modal-edit-user-rights');
      if (editModal) editModal.style.display = 'none';

      this.renderUserTableModal();
      this.renderUserBadge();
      if (window.showCustomToast) {
        window.showCustomToast(`User "${name}" saved successfully!`, 'success');
      }
    },

    async deleteUser(userId) {
      const u = QualityStorageSync.getUserById(userId);
      let confirmed = true;
      if (window.showCustomConfirm) {
        confirmed = await window.showCustomConfirm(
          'Delete User Account',
          `Are you sure you want to permanently delete user account "<strong>${u ? escapeHtml(u.name) : userId}</strong>"?`,
          'Delete',
          'Cancel',
          true
        );
      } else {
        confirmed = confirm(`Delete user ${u ? u.name : userId}?`);
      }
      if (!confirmed) return;

      let users = QualityStorageSync.getSystemUsers();
      users = users.filter(x => x.id !== userId && x.username !== userId);
      await QualityStorageSync.saveSystemUsers(users);
      try { localStorage.setItem('jost_system_users', JSON.stringify(users)); } catch (e) { }

      this.renderUserTableModal();
      if (window.showCustomToast) {
        window.showCustomToast(`User deleted.`, 'info');
      }
    },

    selectUser(userId) {
      QualityStorageSync.setCurrentUser(userId);
      const modal = document.getElementById('modal-user-management');
      if (modal) modal.style.display = 'none';
      if (typeof window.render8DList === 'function') window.render8DList();
      if (typeof window.FailureRegisterManager?.render === 'function') window.FailureRegisterManager.render();
      if (typeof window.LessonsLearnedManager?.render === 'function') window.LessonsLearnedManager.render();
    },

    // ── Location Master Modal ──
    openLocationMasterModal() {
      let modal = document.getElementById('modal-location-master');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-location-master';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
      }

      const plants = QualityStorageSync.getPlants();
      const rdCenters = QualityStorageSync.getRdCenters();

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
          <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--qs-border-light); padding-bottom:8px;">
            <h3 style="margin:0; color:var(--qs-primary); display:flex; align-items:center; gap:8px;">
              <span>🏢</span> Centralized Plant &amp; R&amp;D Location Master
            </h3>
            <span onclick="document.getElementById('modal-location-master').style.display='none'" style="cursor:pointer; font-size:1.2rem; opacity:0.6;">✕</span>
          </header>
          <p style="font-size:0.8rem; color:var(--qs-text-muted); margin-bottom:14px;">
            Single Source of Truth referenced in FMEA Workbench header dialogs, Failure Register logs, 8D Problem Solving, and User Rights.
          </p>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 style="margin:0; font-size:0.85rem; color:var(--qs-primary);">🏭 Manufacturing Plants (${plants.length})</h4>
                <button class="btn btn-ghost" style="padding:2px 8px; font-size:0.72rem;" onclick="RightsManagement.promptAddPlant()">+ Add Plant</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; max-height:260px; overflow-y:auto;">
                ${plants.map(p => `
                  <div style="padding:8px 10px; border-radius:6px; background:var(--qs-bg-card-alt); border:1px solid var(--qs-border-main); font-size:0.78rem; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div style="font-weight:700; color:var(--qs-text-main);">${escapeHtml(p.name)}</div>
                      <div style="font-size:0.7rem; color:var(--qs-text-muted);">Code: ${p.code} | City: ${escapeHtml(p.city || 'N/A')}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 style="margin:0; font-size:0.85rem; color:var(--qs-warning);">🔬 R&amp;D / Engineering Centers (${rdCenters.length})</h4>
                <button class="btn btn-ghost" style="padding:2px 8px; font-size:0.72rem;" onclick="RightsManagement.promptAddRdCenter()">+ Add R&amp;D</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; max-height:260px; overflow-y:auto;">
                ${rdCenters.map(r => `
                  <div style="padding:8px 10px; border-radius:6px; background:var(--qs-bg-card-alt); border:1px solid var(--qs-border-main); font-size:0.78rem; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div style="font-weight:700; color:var(--qs-text-main);">${escapeHtml(r.name)}</div>
                      <div style="font-size:0.7rem; color:var(--qs-text-muted);">Code: ${r.code} | City: ${escapeHtml(r.city || 'N/A')}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px; border-top:1px solid var(--qs-border-light); padding-top:12px;">
            <button class="btn btn-primary" onclick="document.getElementById('modal-location-master').style.display='none'">Done</button>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    },

    async promptAddPlant() {
      let name = '';
      let code = '';
      let city = '';

      if (window.showCustomPrompt) {
        name = await window.showCustomPrompt('Add Manufacturing Plant', 'Enter New Manufacturing Plant Name:', '', 'e.g. JOST Plant 5 — Bangalore');
        if (!name) return;
        code = await window.showCustomPrompt('Plant Code', 'Enter Plant Code Identifier:', `PLANT-${Date.now().toString().slice(-4)}`, 'e.g. BLR-05');
        city = await window.showCustomPrompt('Plant City', 'Enter City & Country:', '', 'e.g. Bangalore, India') || '';
      } else {
        name = prompt('Enter New Manufacturing Plant Name (e.g. JOST Plant 5 — Bangalore):');
        if (!name) return;
        code = prompt('Enter Plant Code (e.g. BLR-05):') || `PLANT-${Date.now()}`;
        city = prompt('Enter Plant City (e.g. Bangalore):') || '';
      }

      const locs = QualityStorageSync.getLocationLibrary();
      locs.plants.push({
        id: `PLANT-${(code || 'NEW').toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
        code: code || 'PLANT-NEW',
        name,
        city: city || 'Pune',
        country: 'India'
      });
      await QualityStorageSync.saveLocationLibrary(locs);
      this.openLocationMasterModal();
      if (window.showCustomToast) {
        window.showCustomToast(`Plant "${name}" added to master library.`, 'success');
      }
    },

    async promptAddRdCenter() {
      let name = '';
      let code = '';
      let city = '';

      if (window.showCustomPrompt) {
        name = await window.showCustomPrompt('Add R&D Tech Center', 'Enter New R&D / Engineering Center Name:', '', 'e.g. JOST Tech Center — Bangalore');
        if (!name) return;
        code = await window.showCustomPrompt('R&D Code', 'Enter R&D Code Identifier:', `RD-${Date.now().toString().slice(-4)}`, 'e.g. RD-BLR');
        city = await window.showCustomPrompt('R&D City', 'Enter City & Country:', '', 'e.g. Bangalore, India') || '';
      } else {
        name = prompt('Enter New R&D / Engineering Center Name (e.g. JOST Tech Center — Bangalore):');
        if (!name) return;
        code = prompt('Enter R&D Code (e.g. RD-BLR):') || `RD-${Date.now()}`;
        city = prompt('Enter City (e.g. Bangalore):') || '';
      }

      const locs = QualityStorageSync.getLocationLibrary();
      locs.rdCenters.push({
        id: `RD-${(code || 'NEW').toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
        code: code || 'RD-NEW',
        name,
        city: city || 'Pune',
        country: 'India'
      });
      await QualityStorageSync.saveLocationLibrary(locs);
      this.openLocationMasterModal();
      if (window.showCustomToast) {
        window.showCustomToast(`R&D Center "${name}" added to master library.`, 'success');
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

  window.RightsManagement = RightsManagement;
  window.openUserManagementModal = () => RightsManagement.openUserManagementModal();
  window.openUserSwitcherModal = () => RightsManagement.openUserManagementModal();
  window.openRoleMasterModal = () => RightsManagement.openRoleMasterModal();
})(typeof window !== 'undefined' ? window : this);
