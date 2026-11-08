// js/settings.js
import { dom, closePanel, toast } from './ui.js';

// 默认设置：自动识别设备，手机端默认全屏，电脑端默认不全屏
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

let settings = {
  mode: 'auto',
  fullscreen: isMobile,
  animations: true
};

export function initSettings() {
  const saved = localStorage.getItem('game_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      settings = { ...settings, ...parsed };
    } catch (e) {}
  }

  applySettings();

  // 绑定顶部悬浮栏按钮
  document.getElementById('btn-explore-world').onclick = () => import('./scenes.js').then(m => m.switchScene('map'));
  document.getElementById('btn-explore-map').onclick = () => import('./explore.js').then(m => m.renderMinimap());
  document.getElementById('btn-explore-settings').onclick = () => { renderSettingsUI(); import('./ui.js').then(m => m.openPanel(document.getElementById('settings-panel'))); };

  // 关闭设置面板
  document.getElementById('close-settings').onclick = () => closePanel(document.getElementById('settings-panel'));

  // Tab 切换
  document.querySelectorAll('#settings-tabs button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#settings-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.settings-section').forEach(sec => sec.style.display = 'none');
      const tabId = btn.dataset.tab;
      document.getElementById(`settings-tab-${tabId}`).style.display = 'block';
    };
  });

  // 绑定 UI 控件
  document.querySelectorAll('input[name="game_mode"]').forEach(radio => {
    radio.onchange = (e) => { settings.mode = e.target.value; saveSettings(); };
  });
  
  document.getElementById('setting-fullscreen').onchange = (e) => {
    settings.fullscreen = e.target.checked;
    saveSettings();
    applyFullscreen();
  };

  document.getElementById('setting-animations').onchange = (e) => {
    settings.animations = e.target.checked;
    saveSettings();
    applySettings();
  };

  // 清空存档
  document.getElementById('btn-clear-save').onclick = () => {
    if (confirm('确定要清空所有本地存档吗？此操作不可恢复！')) {
      localStorage.clear();
      location.reload();
    }
  };
}

function saveSettings() {
  localStorage.setItem('game_settings', JSON.stringify(settings));
}

function applySettings() {
  // 应用模式
  document.querySelectorAll('input[name="game_mode"]').forEach(r => r.checked = (r.value === settings.mode));
  
  // 应用全屏
  const fsToggle = document.getElementById('setting-fullscreen');
  if (fsToggle) fsToggle.checked = settings.fullscreen;
  applyFullscreen();

  // 应用动画
  const animToggle = document.getElementById('setting-animations');
  if (animToggle) animToggle.checked = settings.animations;
  if (settings.animations) {
    document.body.classList.remove('no-anim');
  } else {
    document.body.classList.add('no-anim');
  }
}

function applyFullscreen() {
  const docEl = document.documentElement;
  if (settings.fullscreen) {
    if (!document.fullscreenElement) {
      if (docEl.requestFullscreen) docEl.requestFullscreen().catch(()=>{});
      else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
    }
  } else {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }
}

// 渲染设置面板时的数据绑定
function renderSettingsUI() {
  applySettings();
}