/**
 * JOST Quality Suite & FMEA Workbench
 * Electron-Safe Non-Blocking Dialogs, Custom Modals & Safe Navigation Guard
 * Prevents main thread freeze in Electron & provides seamless single-screen SPA navigation
 */

(function () {
  'use strict';

  // Inject CSS styles for Custom Dialogs & Workspace Selector Modal if not already present
  function ensureDialogStyles() {
    if (document.getElementById('qs-dialog-custom-styles')) return;
    const style = document.createElement('style');
    style.id = 'qs-dialog-custom-styles';
    style.textContent = `
      /* Universal Modal Backdrop */
      .qs-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 15, 29, 0.75);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .qs-modal-overlay.active {
        opacity: 1;
      }
      .qs-modal-card {
        background: var(--bg-card, #1e293b);
        color: var(--text-main, #f8fafc);
        border: 1px solid var(--border-color, #334155);
        border-radius: 14px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        width: 90%;
        max-width: 480px;
        overflow: hidden;
        transform: scale(0.95) translateY(10px);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      .qs-modal-overlay.active .qs-modal-card {
        transform: scale(1) translateY(0);
      }
      .qs-modal-header {
        padding: 18px 24px 14px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid var(--border-color, #334155);
      }
      .qs-modal-icon {
        font-size: 24px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        flex-shrink: 0;
      }
      .qs-modal-icon.info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
      .qs-modal-icon.success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      .qs-modal-icon.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      .qs-modal-icon.error { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      .qs-modal-icon.question { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }

      .qs-modal-title {
        font-size: 17px;
        font-weight: 600;
        margin: 0;
        color: var(--text-main, #f8fafc);
        flex: 1;
      }
      .qs-modal-body {
        padding: 20px 24px;
        font-size: 14px;
        line-height: 1.55;
        color: var(--text-muted, #94a3b8);
        word-break: break-word;
      }
      .qs-modal-input-wrap {
        margin-top: 14px;
      }
      .qs-modal-input {
        width: 100%;
        padding: 10px 14px;
        border-radius: 8px;
        background: var(--bg-input, #0f172a);
        border: 1px solid var(--border-color, #334155);
        color: var(--text-main, #f8fafc);
        font-size: 14px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .qs-modal-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      }
      .qs-modal-footer {
        padding: 14px 24px 18px 24px;
        background: rgba(0, 0, 0, 0.15);
        border-top: 1px solid var(--border-color, #334155);
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .qs-btn {
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 13.5px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .qs-btn-secondary {
        background: rgba(255, 255, 255, 0.07);
        color: var(--text-main, #f8fafc);
        border-color: var(--border-color, #334155);
      }
      .qs-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .qs-btn-primary {
        background: #2563eb;
        color: #ffffff;
      }
      .qs-btn-primary:hover {
        background: #1d4ed8;
      }
      .qs-btn-success {
        background: #059669;
        color: #ffffff;
      }
      .qs-btn-success:hover {
        background: #047857;
      }
      .qs-btn-danger {
        background: #dc2626;
        color: #ffffff;
      }
      .qs-btn-danger:hover {
        background: #b91c1c;
      }

      /* Workspace Selector Modal (Large) */
      .qs-workspace-modal {
        max-width: 680px !important;
      }
      .qs-workspace-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
        margin-top: 14px;
      }
      .qs-workspace-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border-color, #334155);
        border-radius: 12px;
        padding: 18px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: left;
      }
      .qs-workspace-card:hover {
        background: rgba(59, 130, 246, 0.08);
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      }
      .qs-workspace-card-icon {
        font-size: 28px;
        margin-bottom: 2px;
      }
      .qs-workspace-card-title {
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .qs-workspace-card-desc {
        font-size: 12.5px;
        color: #94a3b8;
        line-height: 1.4;
      }
      .qs-workspace-tag {
        font-size: 10.5px;
        padding: 2px 7px;
        border-radius: 6px;
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
        font-weight: 600;
      }

      /* Toast Notification Container */
      #qs-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000000;
        pointer-events: none;
      }
      .qs-toast {
        pointer-events: auto;
        padding: 12px 20px;
        border-radius: 10px;
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        font-size: 13.5px;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 280px;
        max-width: 420px;
        animation: qsToastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .qs-toast.hide {
        animation: qsToastOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .qs-toast.success { border-left: 4px solid #10b981; }
      .qs-toast.error { border-left: 4px solid #ef4444; }
      .qs-toast.warning { border-left: 4px solid #f59e0b; }
      .qs-toast.info { border-left: 4px solid #3b82f6; }

      @keyframes qsToastIn {
        from { opacity: 0; transform: translateY(15px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes qsToastOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(15px) scale(0.96); }
      }
    `;
    document.head.appendChild(style);
  }

  // Ensure DOM is ready before style injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureDialogStyles);
  } else {
    ensureDialogStyles();
  }

  /**
   * Electron-Safe Custom Alert Modal
   */
  window.showCustomAlert = function (title, message, type = 'info') {
    return new Promise((resolve) => {
      ensureDialogStyles();
      const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        question: '❓'
      };

      const overlay = document.createElement('div');
      overlay.className = 'qs-modal-overlay';
      overlay.innerHTML = `
        <div class="qs-modal-card">
          <div class="qs-modal-header">
            <div class="qs-modal-icon ${type}">${icons[type] || 'ℹ️'}</div>
            <h3 class="qs-modal-title">${escapeHtml(title || 'Alert')}</h3>
          </div>
          <div class="qs-modal-body">
            ${message}
          </div>
          <div class="qs-modal-footer">
            <button class="qs-btn qs-btn-primary" id="qsAlertOkBtn">OK</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      const okBtn = overlay.querySelector('#qsAlertOkBtn');
      okBtn.focus();

      const closeAlert = () => {
        overlay.classList.remove('active');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(true);
        }, 200);
      };

      okBtn.addEventListener('click', closeAlert);
      overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          closeAlert();
        }
      });
    });
  };

  /**
   * Electron-Safe Custom Confirm Modal
   */
  window.showCustomConfirm = function (title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false) {
    return new Promise((resolve) => {
      ensureDialogStyles();
      const overlay = document.createElement('div');
      overlay.className = 'qs-modal-overlay';
      overlay.innerHTML = `
        <div class="qs-modal-card">
          <div class="qs-modal-header">
            <div class="qs-modal-icon ${danger ? 'warning' : 'question'}">${danger ? '⚠️' : '❓'}</div>
            <h3 class="qs-modal-title">${escapeHtml(title || 'Confirmation')}</h3>
          </div>
          <div class="qs-modal-body">
            ${message}
          </div>
          <div class="qs-modal-footer">
            <button class="qs-btn qs-btn-secondary" id="qsConfirmCancelBtn">${escapeHtml(cancelText)}</button>
            <button class="qs-btn ${danger ? 'qs-btn-danger' : 'qs-btn-primary'}" id="qsConfirmOkBtn">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      const okBtn = overlay.querySelector('#qsConfirmOkBtn');
      const cancelBtn = overlay.querySelector('#qsConfirmCancelBtn');
      okBtn.focus();

      const closeConfirm = (result) => {
        overlay.classList.remove('active');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(result);
        }, 200);
      };

      okBtn.addEventListener('click', () => closeConfirm(true));
      cancelBtn.addEventListener('click', () => closeConfirm(false));

      overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeConfirm(false);
        }
      });
    });
  };

  /**
   * Electron-Safe Custom Prompt Modal
   */
  window.showCustomPrompt = function (title, message, defaultValue = '', placeholder = '') {
    return new Promise((resolve) => {
      ensureDialogStyles();
      const overlay = document.createElement('div');
      overlay.className = 'qs-modal-overlay';
      overlay.innerHTML = `
        <div class="qs-modal-card">
          <div class="qs-modal-header">
            <div class="qs-modal-icon question">✏️</div>
            <h3 class="qs-modal-title">${escapeHtml(title || 'Input Required')}</h3>
          </div>
          <div class="qs-modal-body">
            <div>${message}</div>
            <div class="qs-modal-input-wrap">
              <input type="text" class="qs-modal-input" id="qsPromptInput" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(placeholder)}" />
            </div>
          </div>
          <div class="qs-modal-footer">
            <button class="qs-btn qs-btn-secondary" id="qsPromptCancelBtn">Cancel</button>
            <button class="qs-btn qs-btn-primary" id="qsPromptOkBtn">Submit</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        overlay.classList.add('active');
        const input = overlay.querySelector('#qsPromptInput');
        input.focus();
        input.select();
      });

      const okBtn = overlay.querySelector('#qsPromptOkBtn');
      const cancelBtn = overlay.querySelector('#qsPromptCancelBtn');
      const input = overlay.querySelector('#qsPromptInput');

      const closePrompt = (val) => {
        overlay.classList.remove('active');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(val);
        }, 200);
      };

      okBtn.addEventListener('click', () => closePrompt(input.value));
      cancelBtn.addEventListener('click', () => closePrompt(null));

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          closePrompt(input.value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closePrompt(null);
        }
      });
    });
  };

  /**
   * Non-Intrusive Floating Toast Notifications
   */
  window.showCustomToast = function (message, type = 'info', duration = 3500) {
    ensureDialogStyles();
    let container = document.getElementById('qs-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'qs-toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    const toast = document.createElement('div');
    toast.className = `qs-toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span style="flex:1;">${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, duration);
  };

  /**
   * Single-Screen Safe Navigation Guard
   * Protects unsaved data before switching screens in the same window
   */
  window.safeNavigateTo = async function (targetUrl, checkDirtyFn, saveActionFn) {
    ensureDialogStyles();
    
    // Check if the current view has unsaved changes
    let isDirty = false;
    if (typeof checkDirtyFn === 'function') {
      try {
        isDirty = Boolean(checkDirtyFn());
      } catch (err) {
        console.warn('Error checking dirty state:', err);
      }
    }

    if (!isDirty) {
      // In-place navigation in the same window
      window.location.href = targetUrl;
      return;
    }

    // Prompt user with 3 choices: Save & Switch, Discard & Switch, Cancel
    const action = await new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'qs-modal-overlay';
      overlay.innerHTML = `
        <div class="qs-modal-card">
          <div class="qs-modal-header">
            <div class="qs-modal-icon warning">💾</div>
            <h3 class="qs-modal-title">Unsaved Changes Detected</h3>
          </div>
          <div class="qs-modal-body">
            You have unsaved modifications on the current screen. Leaving now without saving will cause these changes to be lost.
          </div>
          <div class="qs-modal-footer" style="justify-content: space-between;">
            <button class="qs-btn qs-btn-secondary" id="qsNavCancelBtn">Cancel</button>
            <div style="display:flex; gap:8px;">
              <button class="qs-btn qs-btn-danger" id="qsNavDiscardBtn">Discard &amp; Switch</button>
              <button class="qs-btn qs-btn-success" id="qsNavSaveBtn">💾 Save &amp; Switch</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      const saveBtn = overlay.querySelector('#qsNavSaveBtn');
      const discardBtn = overlay.querySelector('#qsNavDiscardBtn');
      const cancelBtn = overlay.querySelector('#qsNavCancelBtn');

      const closeChoice = (choice) => {
        overlay.classList.remove('active');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(choice);
        }, 200);
      };

      saveBtn.addEventListener('click', () => closeChoice('save'));
      discardBtn.addEventListener('click', () => closeChoice('discard'));
      cancelBtn.addEventListener('click', () => closeChoice('cancel'));
      
      overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeChoice('cancel');
        }
      });
    });

    if (action === 'save') {
      if (typeof saveActionFn === 'function') {
        try {
          const saveResult = await saveActionFn();
          if (saveResult !== false) {
            window.location.href = targetUrl;
          }
        } catch (err) {
          window.showCustomAlert('Save Failed', 'Could not save modifications before switching: ' + err.message, 'error');
        }
      } else {
        window.location.href = targetUrl;
      }
    } else if (action === 'discard') {
      window.location.href = targetUrl;
    }
    // If 'cancel', stay on current screen
  };

  /**
   * Post-Login Interactive Workspace Selector Modal
   * Displays when a user has dual access (FMEA Workbench + Quality Suite)
   */
  window.openWorkspaceSelectorModal = function (user) {
    ensureDialogStyles();
    const currentUser = user || (window.QualityStorageSync ? window.QualityStorageSync.getCurrentUser() : null) || { name: 'User', role: 'Engineer' };
    const authorizedPlants = (window.QualityStorageSync && window.QualityStorageSync.getUserAuthorizedPlants) 
      ? window.QualityStorageSync.getUserAuthorizedPlants(currentUser.id || currentUser.username) 
      : ['*'];
    const plantDisplay = authorizedPlants.includes('*') ? 'All Global Plants' : authorizedPlants.join(', ');

    const overlay = document.createElement('div');
    overlay.className = 'qs-modal-overlay';
    overlay.innerHTML = `
      <div class="qs-modal-card qs-workspace-modal">
        <div class="qs-modal-header">
          <div class="qs-modal-icon info">🧭</div>
          <div>
            <h3 class="qs-modal-title">Welcome to JOST Platform</h3>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
              Logged in as <strong style="color:#f8fafc;">${escapeHtml(currentUser.fullName || currentUser.name || currentUser.username)}</strong> 
              (${escapeHtml(currentUser.role || 'User')}) &bull; Plants: <span style="color:#60a5fa;">${escapeHtml(plantDisplay)}</span>
            </div>
          </div>
        </div>
        <div class="qs-modal-body" style="padding-bottom: 10px;">
          <div style="font-size: 13.5px; color: #cbd5e1; margin-bottom: 12px;">
            Select which workspace module you would like to open:
          </div>
          <div class="qs-workspace-grid">
            <div class="qs-workspace-card" id="wsCardFmea">
              <div class="qs-workspace-card-icon">🧭</div>
              <div class="qs-workspace-card-title">
                <span>FMEA Workbench</span>
                <span class="qs-workspace-tag">Design &amp; Process</span>
              </div>
              <div class="qs-workspace-card-desc">
                DFMEA, PFMEA, Control Plans, Master Catalogs, Risk Matrix and Lineage Trees.
              </div>
            </div>

            <div class="qs-workspace-card" id="wsCardReview">
              <div class="qs-workspace-card-icon">📋</div>
              <div class="qs-workspace-card-title">
                <span>Failure Register</span>
                <span class="qs-workspace-tag" style="background:rgba(16,185,129,0.2); color:#6ee7b7;">Quality Triage</span>
              </div>
              <div class="qs-workspace-card-desc">
                Review plant defect logs, triage failure modes, and initiate required 8D workflows.
              </div>
            </div>

            <div class="qs-workspace-card" id="wsCard8d">
              <div class="qs-workspace-card-icon">📑</div>
              <div class="qs-workspace-card-title">
                <span>8D Problem Solving</span>
                <span class="qs-workspace-tag" style="background:rgba(245,158,11,0.2); color:#fcd34d;">D0 &ndash; D8 RCA</span>
              </div>
              <div class="qs-workspace-card-desc">
                Execute Containment, Ishikawa, 5-Why root cause analysis, and permanent CAPA.
              </div>
            </div>

            <div class="qs-workspace-card" id="wsCardLessons">
              <div class="qs-workspace-card-icon">🎓</div>
              <div class="qs-workspace-card-title">
                <span>Lessons Learned</span>
                <span class="qs-workspace-tag" style="background:rgba(139,92,246,0.2); color:#c4b5fd;">Knowledge Base</span>
              </div>
              <div class="qs-workspace-card-desc">
                Corporate failure prevention library linked directly with FMEA prevention actions.
              </div>
            </div>
          </div>
        </div>
        <div class="qs-modal-footer">
          <button class="qs-btn qs-btn-secondary" id="wsCloseBtn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const closeWorkspaceModal = () => {
      overlay.classList.remove('active');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    };

    overlay.querySelector('#wsCardFmea').addEventListener('click', () => {
      closeWorkspaceModal();
      if (typeof window.openSharePointFileBrowserModal === 'function') {
        window.openSharePointFileBrowserModal();
      } else if (window.location.pathname.toLowerCase().indexOf('index.html') === -1) {
        window.location.href = 'index.html';
      }
    });

    overlay.querySelector('#wsCardReview').addEventListener('click', () => {
      closeWorkspaceModal();
      window.location.href = 'FailureRegister.html?view=review';
    });

    overlay.querySelector('#wsCard8d').addEventListener('click', () => {
      closeWorkspaceModal();
      window.location.href = 'FailureRegister.html?view=8d';
    });

    overlay.querySelector('#wsCardLessons').addEventListener('click', () => {
      closeWorkspaceModal();
      window.location.href = 'LessonsLearned.html';
    });

    overlay.querySelector('#wsCloseBtn').addEventListener('click', closeWorkspaceModal);
  };

  function ensureQualitySuiteAccessGuard() {
    const isQualityPage = window.location.pathname.toLowerCase().includes('failureregister.html') || window.location.pathname.toLowerCase().includes('lessonslearned.html');
    if (!isQualityPage) return true;

    try {
      const enabled = localStorage.getItem('jost_quality_suite_enabled');
      const enabled2 = localStorage.getItem('jost_enable_quality_suite');
      if (enabled === 'false' || enabled2 === 'false') {
        const renderBlockedScreen = () => {
          if (document.getElementById('quality-disabled-policy-overlay')) return;
          const overlay = document.createElement('div');
          overlay.id = 'quality-disabled-policy-overlay';
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0f172a;z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f8fafc;padding:24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
          overlay.innerHTML = `
            <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:36px 32px;max-width:500px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
              <div style="font-size:48px;margin-bottom:16px;">🛡️</div>
              <h2 style="font-size:20px;font-weight:700;color:#f8fafc;margin:0 0 12px 0;">Quality Suite Disabled</h2>
              <p style="font-size:13.5px;color:#94a3b8;line-height:1.6;margin:0 0 24px 0;">
                The JOST Quality Suite and Failure Register modules have been deactivated by your System Administrator under Master Governance Policy.
              </p>
              <a href="index.html" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;box-shadow:0 4px 12px rgba(2,132,199,0.3);transition:transform 0.15s ease;">
                🧭 Return to FMEA Workbench
              </a>
            </div>
          `;
          document.body.appendChild(overlay);
        };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', renderBlockedScreen);
        } else {
          renderBlockedScreen();
        }
        return false;
      }
    } catch (e) { }
    return true;
  }

  ensureQualitySuiteAccessGuard();
  window.ensureQualitySuiteAccessGuard = ensureQualitySuiteAccessGuard;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
