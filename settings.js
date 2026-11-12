// js/settings.js
import { dom, closePanel, toast } from './ui.js';
import { state } from './state.js';

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

  // 指引面板
  document.getElementById('btn-guide').onclick = () => {
    renderGuideUI();
    import('./ui.js').then(m => m.openPanel(document.getElementById('guide-panel')));
  };
  document.getElementById('close-guide').onclick = () => closePanel(document.getElementById('guide-panel'));
  document.querySelectorAll('#guide-tabs button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#guide-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGuideUI(btn.dataset.tab);
    };
  });

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

// 渲染游戏指引面板
function renderGuideUI(tab = 'task') {
  const body = document.getElementById('guide-body');
  if (tab === 'task') {
    let html = '<h3>主线任务</h3><p style="color:#888;">（暂时还未有主线任务）</p><h3 style="margin-top:16px;">支线任务</h3>';
    if (state.tasks.vivian === 'done') html += '<p style="color:#7fc47f;">✅ 薇薇安的请求 (已完成)</p>';
    else html += `<p><b>薇薇安的请求</b><br><span style="font-size:13px;color:#aaa;">收集6个兽皮，可挑战【林间小道】的丛林狼获得。</span><br><span style="color:#e8c86a;font-size:13px;">奖励：128灵石碎片+1000金币+3000经验</span></p>`;
    
    if (state.tasks.tian === 'done') html += '<p style="color:#7fc47f;">✅ 田田的采集请求 (已完成)</p>';
    else html += `<p><b>田田的采集请求</b><br><span style="font-size:13px;color:#aaa;">帮助田田收集3个苹果。</span><br><span style="color:#e8c86a;font-size:13px;">奖励：128灵石碎片+2500金币+4500经验 + 装备【采集者手套】</span></p>`;

    // 德鲁伊的委托
    if (state.tasks.druid === 'done') html += '<p style="color:#7fc47f;">✅ 德鲁伊的委托 (已完成)</p>';
    else if (state.tasks.druid === 'step2') html += '<p style="color:#e8c86a;">🔄 德鲁伊的委托：将羊毛布交给薇薇安</p>';
    else if (state.tasks.druid === 'accepted') html += `<p><b>德鲁伊的委托</b><br><span style="font-size:13px;color:#aaa;">收集3个羊毛。</span></p>`;
    else html += `<p><b>德鲁伊的委托</b><br><span style="font-size:13px;color:#aaa;">寻找森林出口的德鲁伊。</span></p>`;

    body.innerHTML = html;
  } else if (tab === 'active') {
    body.innerHTML = '<h3>每日活跃</h3><p style="color:#888;">正在施工中...</p><h3>每周活跃</h3><p style="color:#888;">正在施工中...</p><h3>活跃商城</h3><p style="color:#888;">正在施工中...</p>';
  } else {
    body.innerHTML = '<h3>探索成就</h3><p style="color:#888;">正在施工中...</p><h3>探索图鉴</h3><p style="color:#888;">正在施工中...</p>';
  }
}