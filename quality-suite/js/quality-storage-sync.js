/**
 * JOST Quality Suite — Centralized Quality & Admin Storage Synchronization Engine
 * Handles seamless encrypted reading/writing of Failure Logs, 8D Reports, Lessons Learned,
 * Classification Library, and Category Catalogs across local files and SharePoint repositories.
 */

(function (window) {
  'use strict';

  const SETTINGS_MAGIC_HEADER = 'JOST_ENC_CFG_v1:';
  const LIB_MAGIC_HEADER = 'JOST_ENC_LIB_v1:';
  const ENCRYPTION_SECRET_KEY = 'JostFMEA$AdminSecretKey2026';

  // File names for encrypted designated admin repository
  const FILE_NAMES = {
    ADMIN_CONFIG: 'fmea_admin_config.enc',
    CLASS_LIBRARY: 'fmea_class_library.enc',
    FAILURE_REGISTER: 'failure_register.enc',
    EIGHT_D_REPORTS: 'eight_d_reports.enc',
    LESSONS_LEARNED: 'lessons_learned_library.enc'
  };

  // Cryptographic utilities matching JOST FMEA Workbench
  function encryptPayload(payloadObj, magicHeader = LIB_MAGIC_HEADER) {
    try {
      const jsonStr = JSON.stringify(payloadObj);
      const utf8Bytes = (typeof TextEncoder !== 'undefined')
        ? new TextEncoder().encode(jsonStr)
        : (typeof Buffer !== 'undefined' ? Buffer.from(jsonStr, 'utf8') : new Uint8Array([]));
      const encryptedBytes = new Uint8Array(utf8Bytes.length);
      for (let i = 0; i < utf8Bytes.length; i++) {
        encryptedBytes[i] = utf8Bytes[i] ^ ENCRYPTION_SECRET_KEY.charCodeAt(i % ENCRYPTION_SECRET_KEY.length);
      }
      let binary = '';
      for (let i = 0; i < encryptedBytes.length; i++) {
        binary += String.fromCharCode(encryptedBytes[i]);
      }
      const b64 = (typeof btoa !== 'undefined') ? btoa(binary) : (typeof Buffer !== 'undefined' ? Buffer.from(binary, 'binary').toString('base64') : '');
      return magicHeader + b64;
    } catch (e) {
      console.error('[QualityStorageSync] Encryption error:', e);
      return null;
    }
  }

  function decryptPayload(encryptedStr) {
    try {
      if (!encryptedStr || typeof encryptedStr !== 'string') return null;
      let payload = encryptedStr.trim();
      if (payload.startsWith(SETTINGS_MAGIC_HEADER)) {
        payload = payload.slice(SETTINGS_MAGIC_HEADER.length);
      } else if (payload.startsWith(LIB_MAGIC_HEADER)) {
        payload = payload.slice(LIB_MAGIC_HEADER.length);
      }
      const binary = (typeof atob !== 'undefined') ? atob(payload) : (typeof Buffer !== 'undefined' ? Buffer.from(payload, 'base64').toString('binary') : '');
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i) ^ ENCRYPTION_SECRET_KEY.charCodeAt(i % ENCRYPTION_SECRET_KEY.length);
      }
      const decodedStr = (typeof TextDecoder !== 'undefined')
        ? new TextDecoder('utf-8').decode(bytes)
        : (typeof Buffer !== 'undefined' ? Buffer.from(bytes).toString('utf8') : '');
      return JSON.parse(decodedStr);
    } catch (e) {
      try {
        return JSON.parse(encryptedStr.trim());
      } catch (parseErr) {
        console.warn('[QualityStorageSync] Decryption fallback parse failed:', parseErr);
        return null;
      }
    }
  }

  // Storage location resolver
  function getAdminStoragePath() {
    try {
      const stored = localStorage.getItem('jost_admin_sharepoint_url') || localStorage.getItem('jost_user_sharepoint_url');
      if (stored && stored.trim() !== '') return stored.trim();
    } catch (e) { }
    return 'd:\\Jost';
  }

  // In-memory cache
  const state = {
    adminConfig: null,
    classLibrary: [],
    failureRecords: [],
    eightDReports: [],
    lessonsLearned: [],
    locationLibrary: {
      plants: [
        { id: 'PLANT-PUNE-HQ', code: 'PUNE-01', name: 'JOST Plant 1 — Pune (HQ / Manufacturing)', city: 'Pune', country: 'India' },
        { id: 'PLANT-JAMSHEDPUR', code: 'JSR-02', name: 'JOST Plant 2 — Jamshedpur (Commercial Axles)', city: 'Jamshedpur', country: 'India' },
        { id: 'PLANT-CHENNAI', code: 'CHN-03', name: 'JOST Plant 3 — Chennai (Fifth Wheel Systems)', city: 'Chennai', country: 'India' },
        { id: 'PLANT-PANTNAGAR', code: 'PNT-04', name: 'JOST Plant 4 — Pantnagar (Assemblies)', city: 'Pantnagar', country: 'India' },
        { id: 'PLANT-NEU-ISENBURG', code: 'GER-01', name: 'JOST Plant Germany — Neu-Isenburg', city: 'Neu-Isenburg', country: 'Germany' }
      ],
      rdCenters: [
        { id: 'RD-STUTTGART', code: 'RD-GER', name: 'JOST Global Tech Center — Neu-Isenburg / Stuttgart', city: 'Neu-Isenburg', country: 'Germany' },
        { id: 'RD-PUNE-TC', code: 'RD-IND', name: 'JOST India Tech Center — Pune R&D', city: 'Pune', country: 'India' },
        { id: 'RD-GRAND-HAVEN', code: 'RD-USA', name: 'JOST Americas Engineering Center — Grand Haven', city: 'Grand Haven', country: 'USA' }
      ]
    },
    systemUsers: [
      {
        id: 'usr-admin',
        name: 'Rajesh Sharma (System Admin)',
        username: 'admin',
        role: 'Admin',
        assignedPlants: ['*'],
        assignedRdCenters: ['*'],
        email: 'admin@jostworld.com'
      },
      {
        id: 'usr-qe-pune',
        name: 'Amit Deshmukh (Quality Lead - Pune)',
        username: 'qe_pune',
        role: 'Quality User',
        assignedPlants: ['PLANT-PUNE-HQ'],
        assignedRdCenters: ['RD-PUNE-TC'],
        email: 'amit.deshmukh@jostworld.com'
      },
      {
        id: 'usr-qe-jsr',
        name: 'Vikram Singh (Quality Lead - Jamshedpur)',
        username: 'qe_jsr',
        role: 'Quality User',
        assignedPlants: ['PLANT-JAMSHEDPUR'],
        assignedRdCenters: [],
        email: 'vikram.singh@jostworld.com'
      },
      {
        id: 'usr-plant-pune',
        name: 'Suresh Patil (Plant Operator - Pune)',
        username: 'operator_pune',
        role: 'Plant User',
        assignedPlants: ['PLANT-PUNE-HQ'],
        assignedRdCenters: [],
        email: 'suresh.patil@jostworld.com'
      },
      {
        id: 'usr-plant-jsr',
        name: 'Rohan Verma (Plant Operator - Jamshedpur)',
        username: 'operator_jsr',
        role: 'Plant User',
        assignedPlants: ['PLANT-JAMSHEDPUR'],
        assignedRdCenters: [],
        email: 'rohan.verma@jostworld.com'
      },
      {
        id: 'usr-lead-eng',
        name: 'Anil Kumar (Lead Design Engineer)',
        username: 'lead_eng',
        role: 'Lead Engineer',
        assignedPlants: ['PLANT-PUNE-HQ', 'PLANT-CHENNAI'],
        assignedRdCenters: ['RD-PUNE-TC', 'RD-STUTTGART'],
        email: 'anil.kumar@jostworld.com'
      }
    ],
    categories: [
      { id: 'cat-geom', name: 'Dimensional / Geometric Deviation', code: 'DIM' },
      { id: 'cat-mach', name: 'Machining Defect (Burr, Chatter, Offset)', code: 'MACH' },
      { id: 'cat-weld', name: 'Welding Imperfection (Porosity, Crack)', code: 'WELD' },
      { id: 'cat-surf', name: 'Surface & Coating (Painting, Plating)', code: 'SURF' },
      { id: 'cat-mat', name: 'Material / Metallurgical Defect', code: 'MAT' },
      { id: 'cat-assy', name: 'Assembly / Fastening Error', code: 'ASSY' },
      { id: 'cat-elec', name: 'Electrical / Sensor Failure', code: 'ELEC' },
      { id: 'cat-func', name: 'Functional Performance Deviation', code: 'FUNC' }
    ],
    observedPlaces: [
      { name: 'Shop Floor (Internal Line)', value: 'Shop Floor', type: 'Plant' },
      { name: 'Incoming Receiving QA', value: 'Incoming QA', type: 'Plant' },
      { name: 'Final Inspection Station', value: 'Final Inspection', type: 'Plant' },
      { name: 'R&D Prototype Lab', value: 'R&D Prototype', type: 'R&D' },
      { name: 'Endurance Test Bench', value: 'Test Bench', type: 'R&D' },
      { name: 'Vehicle Integration Track', value: 'Vehicle Track', type: 'R&D' },
      { name: 'Customer Assembly Plant (0-km)', value: 'Customer 0-km', type: 'Customer' },
      { name: 'Warranty / Field Fleet Observation', value: 'Field Warranty', type: 'End User' }
    ]
  };

  const QualityStorageSync = {
    // Current user context
    getCurrentUser() {
      try {
        const u = localStorage.getItem('jost_current_user') || localStorage.getItem('fmea_user');
        if (u) {
          const parsed = JSON.parse(u);
          // Match with known system users if possible
          const matched = state.systemUsers.find(s => s.id === parsed.id || s.username === parsed.username);
          if (matched) return Object.assign({}, matched, parsed);
          return parsed;
        }
      } catch (e) { }
      // Default: Quality User (Pune)
      return state.systemUsers[1];
    },

    setCurrentUser(userOrId) {
      let user = userOrId;
      if (typeof userOrId === 'string') {
        user = state.systemUsers.find(u => u.id === userOrId || u.username === userOrId) || state.systemUsers[0];
      }
      try {
        localStorage.setItem('jost_current_user', JSON.stringify(user));
        localStorage.setItem('fmea_user', JSON.stringify(user));
      } catch (e) { }
      window.dispatchEvent(new CustomEvent('jost-user-changed', { detail: user }));
      return user;
    },

    isAdmin() {
      const u = this.getCurrentUser();
      return u && (u.role === 'Admin' || u.role === 'SuperAdmin' || u.is_super_admin || u.assignedPlants?.includes('*'));
    },

    isQualityUser() {
      const u = this.getCurrentUser();
      return u && (u.role === 'Quality User' || this.isAdmin());
    },

    isPlantUser() {
      const u = this.getCurrentUser();
      return u && u.role === 'Plant User';
    },

    // ── Location & Plant Authorization ──
    getLocationLibrary() {
      return state.locationLibrary;
    },

    getPlants() {
      return state.locationLibrary?.plants || [];
    },

    getRdCenters() {
      return state.locationLibrary?.rdCenters || [];
    },

    getPlantById(id) {
      return this.getPlants().find(p => p.id === id || p.code === id) || null;
    },

    getRdCenterById(id) {
      return this.getRdCenters().find(r => r.id === id || r.code === id) || null;
    },

    async saveLocationLibrary(locs) {
      if (locs) state.locationLibrary = locs;
      if (state.adminConfig) {
        state.adminConfig.locationLibrary = state.locationLibrary;
        await this.writeFile(FILE_NAMES.ADMIN_CONFIG, state.adminConfig);
      }
      return state.locationLibrary;
    },

    getUserAuthorizedPlants(user = null) {
      const u = user || this.getCurrentUser();
      const allPlants = this.getPlants();
      if (!u || this.isAdmin() || u.assignedPlants?.includes('*')) {
        return allPlants;
      }
      const assigned = Array.isArray(u.assignedPlants) ? u.assignedPlants : [];
      return allPlants.filter(p => assigned.includes(p.id) || assigned.includes(p.code) || assigned.includes(p.name));
    },

    hasPlantAccess(plantId, user = null) {
      if (!plantId) return true;
      const u = user || this.getCurrentUser();
      if (!u || this.isAdmin() || u.assignedPlants?.includes('*')) return true;
      const assigned = Array.isArray(u.assignedPlants) ? u.assignedPlants : [];
      return assigned.includes(plantId) || assigned.includes('*');
    },

    canCreateInPlant(plantId, user = null) {
      if (!plantId) return false;
      const u = user || this.getCurrentUser();
      if (!u) return false;
      if (this.isAdmin() || u.assignedPlants?.includes('*')) return true;
      const assigned = Array.isArray(u.assignedPlants) ? u.assignedPlants : [];
      return assigned.includes(plantId);
    },

    getQualityRepsForPlant(plantId) {
      const users = this.getSystemUsers();
      return users.filter(u => {
        const isQuality = u.role === 'Quality User' || u.role === 'Quality Manager' || (u.qualityRights && u.qualityRights.canReviewTriageLog);
        const hasPlant = !plantId || (Array.isArray(u.assignedPlants) && (u.assignedPlants.includes('*') || u.assignedPlants.includes(plantId)));
        return isQuality && hasPlant;
      });
    },

    getNotificationsForUser(user = null) {
      const u = user || this.getCurrentUser();
      if (!u) return [];
      const notifs = [];
      const failureRecords = state.failureRecords || [];
      const eightDReports = state.eightDReports || [];
      const isAdmin = this.isAdmin();
      const isQuality = u.role === 'Quality User' || u.role === 'Quality Manager' || (u.qualityRights && u.qualityRights.canReviewTriageLog);

      // 1. Pending Failure Log Reviews (For Quality Reps of that plant or Admin)
      if (isQuality || isAdmin) {
        failureRecords.forEach(r => {
          if (!r.eight_d_report_id && (r.status === 'Review Pending' || !r.status)) {
            if (isAdmin || this.hasPlantAccess(r.plant_id, u)) {
              notifs.push({
                id: `notif-log-${r.id}`,
                type: 'log_review',
                priority: 'high',
                icon: '📥',
                title: `Defect Log #${r.id} Awaiting Review`,
                subtitle: `${r.plant_name ? r.plant_name.split('—')[1]?.trim() || r.plant_name : 'Plant'}: ${r.part_number} (${r.category_name || 'Defect'})`,
                timestamp: r.created_at || new Date().toISOString(),
                actionUrl: `FailureRegister.html?view=review&focus=${r.id}`,
                recordId: r.id,
                plantId: r.plant_id
              });
            }
          }
        });
      }

      // 2. Assigned 8D Cases (For Designated Lead or Team Members)
      eightDReports.forEach(r => {
        const isAssignedLead = r.assigned_lead_user_id === u.id || r.assigned_lead_username === u.username;
        const isTeamMember = r.team_member_user_ids && (r.team_member_user_ids.includes(u.id) || r.team_member_user_ids.includes(u.username));
        const isPlantQuality = isQuality && this.hasPlantAccess(r.plant_id, u);
        const isOpen = r.status !== 'Closed' && !r.is_frozen;

        if (isOpen) {
          if (isAssignedLead) {
            notifs.push({
              id: `notif-8d-lead-${r.id}`,
              type: '8d_lead',
              priority: 'urgent',
              icon: '🎯',
              title: `8D Lead Assignment: ${r.report_number}`,
              subtitle: `You are assigned Task Lead for ${r.part_number} (${r.customer_name || 'Customer'})`,
              timestamp: r.updated_at || r.report_date || new Date().toISOString(),
              actionUrl: `FailureRegister.html?view=8d-form&id=${r.id}`,
              recordId: r.id,
              plantId: r.plant_id
            });
          } else if (isTeamMember) {
            notifs.push({
              id: `notif-8d-team-${r.id}`,
              type: '8d_team',
              priority: 'medium',
              icon: '👥',
              title: `8D Team Member: ${r.report_number}`,
              subtitle: `Assigned as Core 8D Team for ${r.part_number}`,
              timestamp: r.updated_at || r.report_date || new Date().toISOString(),
              actionUrl: `FailureRegister.html?view=8d-form&id=${r.id}`,
              recordId: r.id,
              plantId: r.plant_id
            });
          } else if (isPlantQuality && !r.assigned_lead_user_id) {
            notifs.push({
              id: `notif-8d-unassigned-${r.id}`,
              type: '8d_unassigned',
              priority: 'high',
              icon: '⚠️',
              title: `Unassigned 8D Case: ${r.report_number}`,
              subtitle: `Requires Lead Assignment in ${r.plant_name || 'Plant'}`,
              timestamp: r.updated_at || r.report_date || new Date().toISOString(),
              actionUrl: `FailureRegister.html?view=8d-form&id=${r.id}`,
              recordId: r.id,
              plantId: r.plant_id
            });
          }
        }
      });

      return notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // ── System Users Management ──
    getSystemUsers() {
      return state.systemUsers || [];
    },

    getUserById(id) {
      return this.getSystemUsers().find(u => u.id === id || u.username === id) || null;
    },

    async saveSystemUsers(users) {
      if (Array.isArray(users)) state.systemUsers = users;
      if (state.adminConfig) {
        state.adminConfig.systemUsers = state.systemUsers;
        await this.writeFile(FILE_NAMES.ADMIN_CONFIG, state.adminConfig);
      }
      return state.systemUsers;
    },

    // ── Role Definition Master & Module Rights Engine ──
    getRolesMaster() {
      if (!Array.isArray(state.rolesMaster) || state.rolesMaster.length === 0) {
        state.rolesMaster = [
          {
            id: 'role-admin',
            code: 'Admin',
            name: 'System Administrator',
            description: 'Super-user with unrestricted master control, location management, and unlock override.',
            color: '#8b5cf6',
            isSystem: true,
            permissions: {
              canEditFMEA: true, canCreateRevision: true, canFreezeRevision: true, canManagePFMEA: true,
              canManageVariants: true, canExport: true, canManageFileRights: true, canManageUsers: true
            },
            qualityRights: {
              canCreateDefectLog: true, canReviewTriageLog: true, canAssign8DLead: true,
              canEditDesignated8D: true, canFreeze8D: true, canManageLessonsLearned: true,
              canManageLocationMaster: true, canManageTaxonomy: true
            }
          },
          {
            id: 'role-quality',
            code: 'Quality User',
            name: 'Quality Engineer / Representative',
            description: 'Authorized to review defect logs, initiate 8D, assign task leads, and sign off 8D reports for authorized plants.',
            color: '#2563eb',
            isSystem: true,
            permissions: {
              canEditFMEA: true, canCreateRevision: true, canFreezeRevision: false, canManagePFMEA: true,
              canManageVariants: false, canExport: true, canManageFileRights: false, canManageUsers: false
            },
            qualityRights: {
              canCreateDefectLog: true, canReviewTriageLog: true, canAssign8DLead: true,
              canEditDesignated8D: true, canFreeze8D: true, canManageLessonsLearned: false,
              canManageLocationMaster: false, canManageTaxonomy: false
            }
          },
          {
            id: 'role-plant',
            code: 'Plant User',
            name: 'Plant Operator / Line Inspector',
            description: 'Can record failure logs for authorized manufacturing plants and edit 8Ds only when designated as team lead.',
            color: '#10b981',
            isSystem: true,
            permissions: {
              canEditFMEA: false, canCreateRevision: false, canFreezeRevision: false, canManagePFMEA: false,
              canManageVariants: false, canExport: false, canManageFileRights: false, canManageUsers: false
            },
            qualityRights: {
              canCreateDefectLog: true, canReviewTriageLog: false, canAssign8DLead: false,
              canEditDesignated8D: true, canFreeze8D: false, canManageLessonsLearned: false,
              canManageLocationMaster: false, canManageTaxonomy: false
            }
          },
          {
            id: 'role-engineer',
            code: 'Lead Engineer',
            name: 'Product / Design Engineer',
            description: 'Responsible for FMEA structures, function/failure analysis, and prevention engineering.',
            color: '#0284c7',
            isSystem: true,
            permissions: {
              canEditFMEA: true, canCreateRevision: true, canFreezeRevision: true, canManagePFMEA: true,
              canManageVariants: true, canExport: true, canManageFileRights: true, canManageUsers: false
            },
            qualityRights: {
              canCreateDefectLog: true, canReviewTriageLog: true, canAssign8DLead: true,
              canEditDesignated8D: true, canFreeze8D: false, canManageLessonsLearned: true,
              canManageLocationMaster: false, canManageTaxonomy: true
            }
          },
          {
            id: 'role-viewer',
            code: 'Viewer',
            name: 'Read-Only Stakeholder',
            description: 'Can view reports, analytics, and exported files across authorized plants.',
            color: '#64748b',
            isSystem: true,
            permissions: {
              canEditFMEA: false, canCreateRevision: false, canFreezeRevision: false, canManagePFMEA: false,
              canManageVariants: false, canExport: true, canManageFileRights: false, canManageUsers: false
            },
            qualityRights: {
              canCreateDefectLog: false, canReviewTriageLog: false, canAssign8DLead: false,
              canEditDesignated8D: false, canFreeze8D: false, canManageLessonsLearned: false,
              canManageLocationMaster: false, canManageTaxonomy: false
            }
          }
        ];
      }
      return state.rolesMaster;
    },

    getRoleByCode(codeOrId) {
      const roles = this.getRolesMaster();
      return roles.find(r => r.code === codeOrId || r.id === codeOrId || r.name === codeOrId) || null;
    },

    async saveRolesMaster(roles) {
      if (Array.isArray(roles)) {
        state.rolesMaster = roles;
      }
      if (state.adminConfig) {
        state.adminConfig.rolesMaster = state.rolesMaster;
        await this.writeFile(FILE_NAMES.ADMIN_CONFIG, state.adminConfig);
      }
      try {
        localStorage.setItem('jost_roles_master', JSON.stringify(state.rolesMaster));
      } catch (e) { }
      return state.rolesMaster;
    },

    // ── Operational Permission Gating ──
    canCreateFailureLog(user = null) {
      // Plant Users, Quality Users, and Admin can create failure logs
      return true;
    },

    canEditFailureLog(log, user = null) {
      const u = user || this.getCurrentUser();
      if (this.isAdmin()) return true;
      if (!log) return true;

      // Quality person of that plant can edit/review the log
      if (u.role === 'Quality User' && this.hasPlantAccess(log.plant_id, u)) {
        return true;
      }

      // Plant user: Once log is created/submitted, it is NOT editable by Plant User
      if (u.role === 'Plant User') {
        if (log.id && log.is_locked_for_plant_user !== false) {
          return false;
        }
      }
      return false;
    },

    canReviewFailureLog(log = null, user = null) {
      const u = user || this.getCurrentUser();
      if (this.isAdmin()) return true;
      if (u.role === 'Quality User') {
        if (!log || !log.plant_id) return true;
        return this.hasPlantAccess(log.plant_id, u);
      }
      return false;
    },

    canEdit8D(report, user = null) {
      const u = user || this.getCurrentUser();
      if (!report) return false;

      // RULE 1: If 8D is Frozen / Closed, ONLY Admin can unlock / edit
      if (report.is_frozen || report.status === 'Closed') {
        return this.isAdmin();
      }

      // RULE 2: Admin can edit any active 8D
      if (this.isAdmin()) return true;

      // RULE 3: Person designated / assigned by Quality/Admin (Task Lead or Team Member) CAN EDIT their assigned 8D!
      if (report.assigned_lead_user_id && (report.assigned_lead_user_id === u.id || report.assigned_lead_user_id === u.username)) {
        return true;
      }
      if (report.assigned_lead_username && report.assigned_lead_username === u.username) {
        return true;
      }
      if (report.team_member_user_ids && Array.isArray(report.team_member_user_ids) && (report.team_member_user_ids.includes(u.id) || report.team_member_user_ids.includes(u.username))) {
        return true;
      }

      // RULE 4: Quality Representative (Quality User) of that Plant can edit 8Ds of their authorized plant
      if (u.role === 'Quality User' && this.hasPlantAccess(report.plant_id, u)) {
        return true;
      }

      // General Plant Users CANNOT edit 8D unless specifically designated as the task lead or member above
      return false;
    },

    canAssign8D(report = null, user = null) {
      const u = user || this.getCurrentUser();
      if (this.isAdmin()) return true;
      if (u.role === 'Quality User') {
        if (!report || !report.plant_id) return true;
        return this.hasPlantAccess(report.plant_id, u);
      }
      return false;
    },

    canEditLessonsLearned(user = null) {
      // ONLY Admin can edit/modify Lessons Learned repository
      return this.isAdmin();
    },

    // Central Initializer
    async init() {
      console.log('[QualityStorageSync] Initializing Quality Suite Storage Engine...');
      await this.loadAdminConfig();
      await this.loadClassLibrary();
      await this.loadFailureRegister();
      await this.load8DReports();
      await this.loadLessonsLearned();
      return state;
    },

    // File I/O Helpers
    async readFile(filename) {
      const isElectron = window.electronAPI && window.electronAPI.isElectron;
      const basePath = getAdminStoragePath();
      const sep = basePath.includes('/') ? '/' : '\\';
      const fullPath = basePath.endsWith(sep) ? `${basePath}${filename}` : `${basePath}${sep}${filename}`;

      if (isElectron && window.electronAPI.readFileContent) {
        try {
          const res = await window.electronAPI.readFileContent(fullPath);
          if (res && res.success && res.content) {
            return decryptPayload(res.content);
          }
        } catch (e) {
          console.warn(`[QualityStorageSync] Error reading ${fullPath} via electron:`, e);
        }
      }

      // Web LocalStorage Fallback
      try {
        const raw = localStorage.getItem(`jost_qs_${filename}`);
        if (raw) return decryptPayload(raw) || JSON.parse(raw);
      } catch (e) { }
      return null;
    },

    async writeFile(filename, data) {
      const isElectron = window.electronAPI && window.electronAPI.isElectron;
      const basePath = getAdminStoragePath();
      const sep = basePath.includes('/') ? '/' : '\\';
      const fullPath = basePath.endsWith(sep) ? `${basePath}${filename}` : `${basePath}${sep}${filename}`;
      const encrypted = encryptPayload(data);

      if (isElectron && window.electronAPI.writeFile) {
        try {
          await window.electronAPI.writeFile(fullPath, encrypted);
          // Also save backup copy locally in d:\Jost if basePath was remote
          if (basePath.toLowerCase() !== 'd:\\jost') {
            try { await window.electronAPI.writeFile(`d:\\Jost\\${filename}`, encrypted); } catch (e) { }
          }
        } catch (e) {
          console.warn(`[QualityStorageSync] Electron write error for ${filename}:`, e);
        }
      }

      // LocalStorage Sync
      try {
        localStorage.setItem(`jost_qs_${filename}`, encrypted);
      } catch (e) { }
      return true;
    },

    // 1. Admin Config & Classification
    async loadAdminConfig() {
      const data = await this.readFile(FILE_NAMES.ADMIN_CONFIG);
      if (data) state.adminConfig = data;
      return state.adminConfig;
    },

    async loadClassLibrary() {
      const data = await this.readFile(FILE_NAMES.CLASS_LIBRARY);
      if (Array.isArray(data) && data.length > 0) {
        state.classLibrary = data;
      } else {
        // Standard JOST World Classification & Symbols
        state.classLibrary = [
          { code: 'CC', name: 'Critical Characteristic (Safety / Compliance)', symbol: '🔻', severityThreshold: 9 },
          { code: 'SC', name: 'Significant Characteristic (Fit / Function)', symbol: '🔷', severityThreshold: 7 },
          { code: 'OS', name: 'Operator Safety', symbol: '⚠️', severityThreshold: 8 },
          { code: 'HI', name: 'High Impact Process Control', symbol: '🔶', severityThreshold: 6 },
          { code: 'STD', name: 'Standard Quality Characteristic', symbol: '⚪', severityThreshold: 1 }
        ];
      }
      return state.classLibrary;
    },

    // 2. Failure Register CRUD
    async loadFailureRegister() {
      const data = await this.readFile(FILE_NAMES.FAILURE_REGISTER);
      if (Array.isArray(data)) {
        state.failureRecords = data;
      } else if (state.failureRecords.length === 0) {
        // Seed initial sample failure logs if empty with plant metadata
        state.failureRecords = [
          {
            id: 'FR-2026-001',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            logged_by: 'Suresh Patil (Plant Operator - Pune)',
            plant_id: 'PLANT-PUNE-HQ',
            plant_name: 'JOST Plant 1 — Pune (HQ / Manufacturing)',
            project_code: 'P-J500-EV',
            part_number: 'JST-500-BRK',
            part_name: 'Fifth Wheel Mounting Bracket',
            category_id: 'cat-mach',
            category_name: 'Machining Defect (Burr, Chatter, Offset)',
            qty_rejected: 12,
            observed_where: 'Shop Floor (Internal Line)',
            failure_description: 'Bore diameter oversized by +0.35mm after CNC OP-40 reaming operation.',
            eight_d_required: true,
            eight_d_report_id: '8D-2026-0104',
            eight_d_number: '8D-2026-0104',
            is_locked_for_plant_user: true,
            status: 'Under 8D Investigation'
          },
          {
            id: 'FR-2026-002',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            logged_by: 'Rohan Verma (Plant Operator - Jamshedpur)',
            plant_id: 'PLANT-JAMSHEDPUR',
            plant_name: 'JOST Plant 2 — Jamshedpur (Commercial Axles)',
            project_code: 'P-K400-TR',
            part_number: 'JST-400-PIN',
            part_name: 'King Pin Forged Steel',
            category_id: 'cat-weld',
            category_name: 'Welding Imperfection (Porosity, Crack)',
            qty_rejected: 2,
            observed_where: 'Final Inspection Station',
            failure_description: 'Sub-surface porosity detected during ultrasonic test on mounting weld seam.',
            eight_d_required: false,
            eight_d_report_id: null,
            eight_d_number: null,
            is_locked_for_plant_user: true,
            status: 'Review Pending'
          }
        ];
        await this.saveFailureRegister();
      }
      return state.failureRecords;
    },

    async saveFailureRegister() {
      await this.writeFile(FILE_NAMES.FAILURE_REGISTER, state.failureRecords);
      return state.failureRecords;
    },

    async addFailureLog(logData) {
      const u = this.getCurrentUser();
      const userPlants = this.getUserAuthorizedPlants(u);
      const defaultPlant = userPlants[0] || this.getPlants()[0] || { id: 'PLANT-PUNE-HQ', name: 'JOST Plant 1 — Pune (HQ / Manufacturing)' };

      const selectedPlantId = logData.plant_id || defaultPlant.id;
      const plantObj = this.getPlantById(selectedPlantId) || defaultPlant;

      const id = 'FR-' + new Date().getFullYear() + '-' + String(state.failureRecords.length + 1).padStart(3, '0');
      const record = {
        id,
        created_at: new Date().toISOString(),
        logged_by: logData.logged_by || u.name,
        logged_by_user_id: u.id,
        plant_id: plantObj.id,
        plant_name: plantObj.name,
        project_code: logData.project_code || 'N/A',
        part_number: logData.part_number || 'N/A',
        part_name: logData.part_name || 'N/A',
        category_id: logData.category_id || '',
        category_name: logData.category_name || '',
        qty_rejected: parseInt(logData.qty_rejected) || 1,
        observed_where: logData.observed_where || 'Shop Floor',
        failure_description: logData.failure_description || '',
        eight_d_required: false,
        eight_d_report_id: null,
        eight_d_number: null,
        is_locked_for_plant_user: true, // Auto-locked for plant user upon generation
        status: 'Review Pending'
      };
      state.failureRecords.unshift(record);
      await this.saveFailureRegister();
      return record;
    },

    async toggle8DRequirement(recordId, isRequired) {
      const rec = state.failureRecords.find(r => r.id === recordId);
      if (!rec) return null;
      rec.eight_d_required = isRequired;

      if (isRequired && !rec.eight_d_report_id) {
        // Auto-create linked 8D Report Instance
        const new8D = await this.create8DFromFailureLog(rec);
        rec.eight_d_report_id = new8D.id;
        rec.eight_d_number = new8D.report_number;
        rec.status = '8D Initiated';
      } else if (!isRequired) {
        rec.status = 'Minor Non-Conformance (No 8D)';
      }
      await this.saveFailureRegister();
      return rec;
    },

    // 3. 8D Reports Lifecycle CRUD
    async load8DReports() {
      const data = await this.readFile(FILE_NAMES.EIGHT_D_REPORTS);
      if (Array.isArray(data)) {
        state.eightDReports = data;
      } else if (state.eightDReports.length === 0) {
        state.eightDReports = [
          {
            id: '8D-2026-0104',
            report_number: '8D-2026-0104',
            origin_failure_log_id: 'FR-2026-001',
            plant_id: 'PLANT-PUNE-HQ',
            plant_name: 'JOST Plant 1 — Pune (HQ / Manufacturing)',
            assigned_lead_user_id: 'usr-qe-pune',
            assigned_lead_name: 'Amit Deshmukh (Quality Lead - Pune)',
            assigned_lead_username: 'qe_pune',
            team_member_user_ids: ['usr-plant-pune', 'usr-lead-eng'],
            report_date: new Date().toISOString().split('T')[0],
            customer_name: 'JOST Europe OEM Assembly',
            project_code: 'P-J500-EV',
            part_number: 'JST-500-BRK',
            part_name: 'Fifth Wheel Mounting Bracket',
            status: 'In Progress',
            is_frozen: false,
            d0_symptoms: '12 brackets out of tolerance +0.35mm. Containment 100% sorting activated.',
            d1_champion: 'Amit Deshmukh (Quality Lead - Pune)',
            d1_team_members: 'Suresh Patil (Plant Operator), Anil Kumar (Lead Design Engineer)',
            d2_problem_description: 'Bore diameter on OP-40 exceeding drawing tolerance 50.00 +/- 0.05 mm.',
            d2_data_5w2h: {},
            d3_containment_actions: 'Quarantined Lot #4829 (40 pcs). Verified clean boundary at OP-40 reamer.',
            d4_occurrence_root_cause: 'Worn carbide reamer flute exceeded tool life limit without sensor alarm trigger.',
            d4_root_cause: 'Reamer tool wear sensor wire disconnected during previous changeover.',
            d4_data_5why: {
              chains: [
                {
                  id: 'c1',
                  title: 'Tool Wear Detection Chain',
                  type: 'occ',
                  is_real_root_cause: true,
                  why1: 'Bore oversized by 0.35mm',
                  why2: 'Reamer cutting edge wore down unevenly',
                  why3: 'Reamer ran 450 cycles past rated tool life',
                  why4: 'Tool life cycle interlock did not halt the machine',
                  why5: 'Tool counter proximity sensor cable dislodged and bypassed in PLC manual mode'
                }
              ]
            },
            d5_corrective_actions: 'Install hardwired lock on tool life sensor & update PLC recipe logic to auto-lock OP-40.',
            d6_implementation_details: 'PLC interlock validated across 500 trial parts with 0 defects (Cpk 1.84).',
            d7_preventive_actions: 'Updated PFMEA (OP-40 tool monitoring) and Control Plan Inspection Frequency to every 50 parts.',
            d8_recognition: 'Recognition granted to Machining Shift A team for rapid quarantine.',
            lesson_learned_status: 'Pending'
          }
        ];
        await this.save8DReports();
      }
      return state.eightDReports;
    },

    async save8DReports() {
      await this.writeFile(FILE_NAMES.EIGHT_D_REPORTS, state.eightDReports);
      return state.eightDReports;
    },

    async create8DFromFailureLog(rec) {
      const u = this.getCurrentUser();
      const year = new Date().getFullYear();
      const num = '8D-' + year + '-' + String(Math.floor(1000 + Math.random() * 9000));
      const plantId = rec.plant_id || (u.assignedPlants && u.assignedPlants[0] !== '*' ? u.assignedPlants[0] : 'PLANT-PUNE-HQ');
      const plantObj = this.getPlantById(plantId) || { id: plantId, name: rec.plant_name || 'JOST Plant' };

      // Find the designated Quality Representative for this plant
      const qualityReps = this.getQualityRepsForPlant(plantId);
      const plantQualityLead = qualityReps.length > 0 ? qualityReps[0] : null;

      const leadUser = plantQualityLead || u;
      const teamUserIds = [rec.logged_by_user_id].filter(Boolean);

      const report = {
        id: num,
        report_number: num,
        origin_failure_log_id: rec.id,
        plant_id: plantObj.id,
        plant_name: plantObj.name,
        assigned_lead_user_id: leadUser.id,
        assigned_lead_name: leadUser.name,
        assigned_lead_username: leadUser.username,
        team_member_user_ids: teamUserIds,
        report_date: new Date().toISOString().split('T')[0],
        customer_name: 'Internal Plant Quality',
        project_code: rec.project_code,
        part_number: rec.part_number,
        part_name: rec.part_name,
        category_name: rec.category_name,
        status: 'Open',
        is_frozen: false,
        d0_symptoms: rec.failure_description,
        d1_champion: leadUser.name,
        d1_team_members: rec.logged_by ? `${rec.logged_by} (Plant Logger)` : '',
        d2_problem_description: `Incident from ${rec.id}: ${rec.failure_description} (Observed at: ${rec.observed_where}, Qty: ${rec.qty_rejected})`,
        d2_data_5w2h: {},
        d3_containment_actions: '',
        d4_occurrence_root_cause: '',
        d4_root_cause: '',
        d4_data_5why: { chains: [] },
        d4_data_fishbone: {},
        d5_corrective_actions: '',
        d6_implementation_details: '',
        d7_preventive_actions: '',
        d8_recognition: '',
        lesson_learned_status: 'Pending'
      };
      state.eightDReports.unshift(report);
      await this.save8DReports();
      return report;
    },

    async save8DReport(reportData) {
      const idx = state.eightDReports.findIndex(r => r.id === reportData.id || r.report_number === reportData.report_number);
      if (idx >= 0) {
        state.eightDReports[idx] = Object.assign({}, state.eightDReports[idx], reportData);
      } else {
        state.eightDReports.unshift(reportData);
      }
      await this.save8DReports();
      return reportData;
    },

    // 4. Lessons Learned Transfer & Repository
    async loadLessonsLearned() {
      const data = await this.readFile(FILE_NAMES.LESSONS_LEARNED);
      if (Array.isArray(data)) {
        state.lessonsLearned = data;
      } else if (state.lessonsLearned.length === 0) {
        state.lessonsLearned = [
          {
            id: 'LL-2026-001',
            title: 'Hardwired Tool Counter Interlock for CNC Finishing Reamers',
            source_8d_id: '8D-2026-0104',
            project_code: 'P-J500-EV',
            part_number: 'JST-500-BRK',
            part_name: 'Fifth Wheel Mounting Bracket',
            classification_code: 'SC',
            classification_symbol: '🔷',
            classification_name: 'Significant Characteristic (Fit / Function)',
            problem_summary: 'Bore diameter oversized due to tool wear sensor bypass during setup.',
            root_cause: 'Tool counter proximity sensor cable dislodged and bypassed in PLC manual mode.',
            permanent_solution: 'Hardwired interlock on tool counter preventing PLC cycle start without active sensor.',
            preventive_rule: 'All reaming operations on critical mounting bores must enforce hardware-level cycle count lockouts in standard PFMEA template.',
            approved_by: 'System Administrator',
            approved_date: new Date().toISOString().split('T')[0],
            tags: ['Machining', 'Tool Wear', 'PLC Interlock', 'OP-40', 'Reaming']
          }
        ];
        await this.saveLessonsLearned();
      }
      return state.lessonsLearned;
    },

    async saveLessonsLearned() {
      await this.writeFile(FILE_NAMES.LESSONS_LEARNED, state.lessonsLearned);
      return state.lessonsLearned;
    },

    async transfer8DToLessonLearned(eightDId, productClassificationId = 'prod-pipe-bend') {
      const report = state.eightDReports.find(r => r.id === eightDId || r.report_number === eightDId);
      if (!report) throw new Error('8D Report not found');

      const taxNode = (window.ProductClassificationEngine && window.ProductClassificationEngine.getNodeById(productClassificationId))
        || { id: productClassificationId, name: 'Product Feature', path: 'Product > Feature' };

      const llId = 'LL-' + new Date().getFullYear() + '-' + String(state.lessonsLearned.length + 1).padStart(3, '0');

      const lesson = {
        id: llId,
        title: `8D Solution: ${report.part_name || report.part_number} — ${report.d4_root_cause ? report.d4_root_cause.slice(0, 60) + '...' : 'Permanent Quality Safeguard'}`,
        source_8d_id: report.report_number || report.id,
        project_code: report.project_code || 'N/A',
        part_number: report.part_number || 'N/A',
        part_name: report.part_name || 'N/A',
        product_classification_id: taxNode.id,
        product_classification_ids: [taxNode.id],
        product_classification_path: taxNode.path || taxNode.name,
        problem_summary: report.d2_problem_description || report.d0_symptoms,
        failure_mode: report.d0_symptoms || report.d2_problem_description || 'Operational Failure Deviation',
        failure_cause: report.d4_root_cause || report.d4_occurrence_root_cause || 'Identified via 5-Why Analysis',
        root_cause: report.d4_root_cause || report.d4_occurrence_root_cause || 'Identified via 5-Why Analysis',
        permanent_solution: report.d5_corrective_actions || report.d6_implementation_details,
        pca_preventive_rule: report.d7_preventive_actions || report.d5_corrective_actions || 'Update PFMEA and Control Plan standards.',
        preventive_rule: report.d7_preventive_actions || report.d5_corrective_actions || 'Update PFMEA and Control Plan standards.',
        recommended_detection: report.d6_implementation_details || '100% verification on first 5 parts per shift',
        classification_code: 'SC',
        classification_symbol: '🔷',
        approved_by: this.getCurrentUser().name,
        approved_date: new Date().toISOString().split('T')[0],
        tags: [report.category_name || 'Quality', report.project_code, report.part_number, taxNode.name].filter(Boolean)
      };

      state.lessonsLearned.unshift(lesson);
      report.lesson_learned_status = 'Captured';
      report.is_frozen = true;
      report.status = 'Closed';

      await this.saveLessonsLearned();
      await this.save8DReports();
      return lesson;
    },

    // Quality Suite Master Governance Setting
    isQualitySuiteEnabled() {
      try {
        const val = localStorage.getItem('jost_quality_suite_enabled');
        if (val !== null) return val !== 'false';
      } catch (e) { }
      if (state.adminConfig && typeof state.adminConfig.enableQualitySuite === 'boolean') {
        return state.adminConfig.enableQualitySuite;
      }
      return true;
    },

    setQualitySuiteEnabled(enabled) {
      try {
        localStorage.setItem('jost_quality_suite_enabled', enabled ? 'true' : 'false');
        localStorage.setItem('jost_enable_quality_suite', enabled ? 'true' : 'false');
      } catch (e) { }
      if (state.adminConfig) {
        state.adminConfig.enableQualitySuite = Boolean(enabled);
      }
    },

    // Reference Catalogs
    getCategories() { return state.categories; },
    getObservedPlaces() { return state.observedPlaces; },
    getClassLibrary() { return state.classLibrary; },
    getState() { return state; }
  };

  window.QualityStorageSync = QualityStorageSync;
})(typeof window !== 'undefined' ? window : this);
