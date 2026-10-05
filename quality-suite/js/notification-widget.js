/**
 * JOST World & Quality Suite — Interactive Review & Notification Engine
 * Provides Universal Topbar Bell Icon (🔔) with Real-Time Actionable Task Queue.
 * Works across FMEA Workbench, Failure Register, 8D Problem Solving, and Lessons Learned.
 */

(function (window) {
  'use strict';

  function ensureNotificationStyles() {
    if (document.getElementById('qs-notif-styles')) return;
    const style = document.createElement('style');
    style.id = 'qs-notif-styles';
    style.textContent = `
      .qs-notif-container {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      .qs-notif-bell-btn {
        position: relative;
        background: var(--qs-bg-card-alt, #1e293b);
        color: var(--qs-text-main, #f8fafc);
        border: 1px solid var(--qs-border-main, #334155);
        border-radius: 9px;
        padding: 6px 10px;
        font-size: 15px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .qs-notif-bell-btn:hover {
        background: var(--qs-primary-surface, rgba(56, 189, 248, 0.15));
        border-color: var(--qs-primary, #38bdf8);
        transform: translateY(-1px);
      }
      .qs-notif-badge {
        position: absolute;
        top: -5px;
        right: -6px;
        background: #ef4444;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        min-width: 17px;
        height: 17px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
        animation: qs-pulse 2s infinite;
      }
      @keyframes qs-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.12); }
      }
      .qs-notif-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 380px;
        max-width: 90vw;
        background: var(--qs-bg-card, #18181b);
        border: 1px solid var(--qs-border-main, #27272a);
        border-radius: 12px;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.75);
        z-index: 5000;
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: qs-fade-in 0.2s ease-out;
      }
      @keyframes qs-fade-in {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .qs-notif-dropdown.open {
        display: flex;
      }
      .qs-notif-header {
        padding: 12px 16px;
        background: var(--qs-bg-card-alt, #202024);
        border-bottom: 1px solid var(--qs-border-main, #27272a);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .qs-notif-list {
        max-height: 380px;
        overflow-y: auto;
        padding: 6px 0;
        display: flex;
        flex-direction: column;
      }
      .qs-notif-item {
        padding: 10px 14px;
        border-bottom: 1px solid var(--qs-border-light, rgba(255, 255, 255, 0.05));
        display: flex;
        gap: 12px;
        align-items: flex-start;
        transition: background 0.15s;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
      }
      .qs-notif-item:hover {
        background: var(--qs-primary-surface, rgba(56, 189, 248, 0.1));
      }
      .qs-notif-item.read {
        opacity: 0.65;
      }
      .qs-notif-icon-box {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        flex-shrink: 0;
      }
      .qs-notif-footer {
        padding: 8px 14px;
        background: var(--qs-bg-card-alt, #202024);
        border-top: 1px solid var(--qs-border-main, #27272a);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: var(--qs-text-muted, #94a3b8);
      }
    `;
    document.head.appendChild(style);
  }

  const NotificationWidget = {
    dismissedIds: new Set(),

    init() {
      ensureNotificationStyles();
      this.loadDismissed();
      this.mount();
      
      // Auto-refresh notifications every 15 seconds or on custom events
      setInterval(() => this.updateBadgeAndList(), 15000);
      window.addEventListener('jost-user-changed', () => this.updateBadgeAndList());
      window.addEventListener('storage', () => this.updateBadgeAndList());
      document.addEventListener('click', (e) => this.handleOutsideClick(e));
    },

    loadDismissed() {
      try {
        const raw = sessionStorage.getItem('jost_read_notifs');
        if (raw) {
          const list = JSON.parse(raw);
          this.dismissedIds = new Set(list);
        }
      } catch (e) { }
    },

    saveDismissed() {
      try {
        sessionStorage.setItem('jost_read_notifs', JSON.stringify(Array.from(this.dismissedIds)));
      } catch (e) { }
    },

    mount() {
      // Find mount target container on various pages
      let target = document.getElementById('notification-bell-mount') ||
                   document.getElementById('theme-toggle-container') ||
                   document.querySelector('.header-right') ||
                   document.querySelector('.qs-topbar div:last-child') ||
                   document.getElementById('sidebar');

      if (!target) return;

      // Avoid double mount
      if (document.getElementById('qs-notif-wrapper')) return;

      const wrap = document.createElement('div');
      wrap.id = 'qs-notif-wrapper';
      wrap.className = 'qs-notif-container';
      wrap.innerHTML = `
        <button id="qs-notif-btn" class="qs-notif-bell-btn" title="Pending Reviews & 8D Assignments" onclick="NotificationWidget.toggleDropdown(event)">
          <span>🔔</span>
          <span id="qs-notif-count-badge" class="qs-notif-badge" style="display:none;">0</span>
        </button>

        <div id="qs-notif-dropdown" class="qs-notif-dropdown">
          <div class="qs-notif-header">
            <div style="font-weight:700; font-size:12.5px; color:var(--qs-text-main, #ffffff); display:flex; align-items:center; gap:6px;">
              <span>🔔 Review &amp; Task Center</span>
            </div>
            <button class="btn btn-ghost" onclick="NotificationWidget.markAllRead(event)" style="padding:2px 8px; font-size:10.5px;">Mark all read</button>
          </div>

          <div id="qs-notif-list-body" class="qs-notif-list">
            <!-- Dynamically populated -->
          </div>

          <div class="qs-notif-footer">
            <span id="qs-notif-user-context">👤 Current User Scope</span>
            <a href="FailureRegister.html?view=review" style="color:var(--qs-primary, #38bdf8); text-decoration:none; font-weight:600;">View Failure Register &rarr;</a>
          </div>
        </div>
      `;

      // Prepend to target or insert appropriately
      if (target.id === 'sidebar') {
        const footerArea = target.querySelector('div[style*="margin-top: auto"]') || target;
        footerArea.insertBefore(wrap, footerArea.firstChild);
      } else {
        target.appendChild(wrap);
      }

      this.updateBadgeAndList();
    },

    toggleDropdown(e) {
      if (e) e.stopPropagation();
      const dd = document.getElementById('qs-notif-dropdown');
      if (!dd) return;
      const isOpen = dd.classList.contains('open');
      if (isOpen) {
        dd.classList.remove('open');
      } else {
        this.updateBadgeAndList();
        dd.classList.add('open');
      }
    },

    handleOutsideClick(e) {
      const wrap = document.getElementById('qs-notif-wrapper');
      if (wrap && !wrap.contains(e.target)) {
        const dd = document.getElementById('qs-notif-dropdown');
        if (dd) dd.classList.remove('open');
      }
    },

    getNotifications() {
      if (window.QualityStorageSync && typeof window.QualityStorageSync.getNotificationsForUser === 'function') {
        return window.QualityStorageSync.getNotificationsForUser();
      }
      return [];
    },

    updateBadgeAndList() {
      const badge = document.getElementById('qs-notif-count-badge');
      const listBody = document.getElementById('qs-notif-list-body');
      const userContext = document.getElementById('qs-notif-user-context');
      if (!listBody) return;

      const user = window.QualityStorageSync ? window.QualityStorageSync.getCurrentUser() : null;
      if (userContext && user) {
        userContext.innerText = `👤 ${user.name || user.username} (${user.role || 'User'})`;
      }

      const notifs = this.getNotifications();
      const unread = notifs.filter(n => !this.dismissedIds.has(n.id));

      if (badge) {
        if (unread.length > 0) {
          badge.innerText = unread.length > 99 ? '99+' : unread.length;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }

      if (notifs.length === 0) {
        listBody.innerHTML = `
          <div style="padding: 2.5rem 1rem; text-align: center; color: var(--qs-text-muted, #94a3b8);">
            <span style="font-size: 2rem; display: block; margin-bottom: 6px;">🎉</span>
            <div style="font-weight: 700; font-size: 12px; color: var(--qs-text-main, #ffffff);">All caught up!</div>
            <div style="font-size: 11px; margin-top: 2px;">No pending review logs or assigned 8D tasks for your plant profile.</div>
          </div>
        `;
        return;
      }

      listBody.innerHTML = notifs.map(n => {
        const isRead = this.dismissedIds.has(n.id);
        const iconBg = n.priority === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : (n.priority === 'high' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)');
        const iconColor = n.priority === 'urgent' ? '#ef4444' : (n.priority === 'high' ? '#f59e0b' : '#38bdf8');

        return `
          <div class="qs-notif-item ${isRead ? 'read' : ''}" onclick="NotificationWidget.handleItemClick('${n.id}', '${n.actionUrl}')">
            <div class="qs-notif-icon-box" style="background: ${iconBg}; color: ${iconColor};">
              ${n.icon || '📌'}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 6px;">
                <div style="font-weight: 700; font-size: 12px; color: var(--qs-text-main, #ffffff); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${escapeHtml(n.title)}
                </div>
                <small style="font-size: 9.5px; color: var(--qs-text-muted, #94a3b8); white-space: nowrap;">
                  ${this.formatTime(n.timestamp)}
                </small>
              </div>
              <div style="font-size: 11px; color: var(--qs-text-sub, #cbd5e1); margin-top: 2px; line-height: 1.35;">
                ${escapeHtml(n.subtitle)}
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    handleItemClick(id, actionUrl) {
      this.dismissedIds.add(id);
      this.saveDismissed();
      this.updateBadgeAndList();

      const dd = document.getElementById('qs-notif-dropdown');
      if (dd) dd.classList.remove('open');

      if (!actionUrl) return;

      // Handle in-page view switches or navigation
      if (actionUrl.startsWith('FailureRegister.html')) {
        if (window.location.pathname.endsWith('FailureRegister.html')) {
          const url = new URL(actionUrl, window.location.href);
          const view = url.searchParams.get('view');
          const recId = url.searchParams.get('id') || url.searchParams.get('focus');
          if (view === '8d-form' && recId && window.open8DReport) {
            window.open8DReport(recId);
          } else if (view === 'review' && window.switchView) {
            window.switchView('review');
          }
          return;
        }
      }

      if (typeof window.safeNavigateTo === 'function') {
        window.safeNavigateTo(actionUrl);
      } else {
        window.location.href = actionUrl;
      }
    },

    markAllRead(e) {
      if (e) e.stopPropagation();
      const notifs = this.getNotifications();
      notifs.forEach(n => this.dismissedIds.add(n.id));
      this.saveDismissed();
      this.updateBadgeAndList();
    },

    formatTime(ts) {
      if (!ts) return 'Just now';
      const diff = Date.now() - new Date(ts).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
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

  window.NotificationWidget = NotificationWidget;

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationWidget.init());
  } else {
    NotificationWidget.init();
  }
})(typeof window !== 'undefined' ? window : this);
