/**
 * JOST Quality Suite — Universal Multi-Theme Engine
 * Coordinates Bright Mode, Black Ice Mode, and Night Sky Mode with instant synchronization.
 */

(function (window) {
  'use strict';

  const THEMES = ['bright', 'dark', 'night-sky'];

  const ThemeEngine = {
    init() {
      const savedTheme = localStorage.getItem('app_theme') || 'bright';
      this.applyTheme(savedTheme);
      this.renderThemeToggleButton();

      // Listen to cross-window storage events
      window.addEventListener('storage', (e) => {
        if (e.key === 'app_theme' && e.newValue) {
          this.applyTheme(e.newValue);
        }
      });
    },

    applyTheme(themeName) {
      const normalized = (themeName === 'black' || themeName === 'dark')
        ? 'dark'
        : (themeName === 'night-sky' || themeName === 'nightSky')
          ? 'night-sky'
          : 'bright';

      document.documentElement.setAttribute('data-theme', normalized);
      document.body.setAttribute('data-theme', normalized);

      document.body.classList.remove('dark-theme', 'black-theme', 'night-sky-theme', 'bright-mode');

      if (normalized === 'night-sky') {
        document.body.classList.add('night-sky-theme');
      } else if (normalized === 'dark') {
        document.body.classList.add('dark-theme', 'black-theme');
      } else {
        document.body.classList.add('bright-mode');
      }

      localStorage.setItem('app_theme', normalized);
      this.updateToggleButtonUI(normalized);
    },

    toggleTheme() {
      const current = localStorage.getItem('app_theme') || 'bright';
      let next = 'dark';
      if (current === 'bright') next = 'dark';
      else if (current === 'dark' || current === 'black') next = 'night-sky';
      else next = 'bright';

      this.applyTheme(next);
    },

    setTheme(themeName) {
      this.applyTheme(themeName);
    },

    renderThemeToggleButton() {
      const container = document.getElementById('theme-toggle-container');
      if (!container) return;

      container.innerHTML = `
        <button id="qsThemeToggleBtn" class="qs-theme-btn" onclick="QualityThemeEngine.toggleTheme()" title="Switch UI Theme">
          <span id="qsThemeIcon">☀️</span>
          <span id="qsThemeText" style="font-size:0.75rem; font-weight:700;">Bright</span>
        </button>
      `;
      this.updateToggleButtonUI(localStorage.getItem('app_theme') || 'bright');
    },

    updateToggleButtonUI(theme) {
      const icon = document.getElementById('qsThemeIcon');
      const text = document.getElementById('qsThemeText');
      const btn = document.getElementById('qsThemeToggleBtn');

      if (!btn) return;

      if (theme === 'night-sky') {
        if (icon) icon.innerText = '🌌';
        if (text) text.innerText = 'Night Sky';
        btn.style.background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
        btn.style.borderColor = '#6366f1';
        btn.style.color = '#ffffff';
      } else if (theme === 'dark') {
        if (icon) icon.innerText = '🌙';
        if (text) text.innerText = 'Black Ice';
        btn.style.background = 'linear-gradient(135deg, #09090b 0%, #27272a 100%)';
        btn.style.borderColor = '#52525b';
        btn.style.color = '#ffffff';
      } else {
        if (icon) icon.innerText = '☀️';
        if (text) text.innerText = 'Bright';
        btn.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';
        btn.style.borderColor = '#38bdf8';
        btn.style.color = '#0369a1';
      }
    }
  };

  window.QualityThemeEngine = ThemeEngine;
  window.setTheme = (t) => ThemeEngine.setTheme(t);
  window.toggleTheme = () => ThemeEngine.toggleTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeEngine.init());
  } else {
    ThemeEngine.init();
  }
})(typeof window !== 'undefined' ? window : this);
