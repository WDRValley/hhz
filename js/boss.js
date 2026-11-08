// js/boss.js
import { state } from './state.js';
import { dom, toast, openPanel, closePanel } from './ui.js';
import { save } from './persistence.js';
import { startBossBattle } from './battle.js';

export function renderAltar() {
  if (!state.altarState) {
    dom.bossAreaContent.innerHTML = `<div class="altar-btn" id="btn-altar-click"><span class="ab-icon">🏛️</span><span class="ab-name">符文祭坛</span><span class="ab-status">未开启</span></div>`;
    document.getElementById('btn-altar-click').onclick = () => { dom.altarDialog.classList.add('open'); };
  } else {
    dom.bossAreaContent.innerHTML = `<div class="altar-btn active" id="btn-altar-click"><span class="ab-icon">✨</span><span class="ab-name">符文祭坛</span><span class="ab-status">已开启</span></div>`;
    document.getElementById('btn-altar-click').onclick = () => { renderBossPanel(); openPanel(dom.bossPanel); };
  }
}

export function renderBossPanel() {
  const limits = { s1: 15, s2: 15, s3: 30 };
  const counts = state.bossDailyCount;
  const stages = [
    { id: 's1', title: '1. 暗影林灵', desc: '森林中的生灵不知道受到什么污染源的影响而变得暴躁异常，快去净化它们吧！', enemies: '2只15级蹦蹦种子，2只20级洋葱头' },
    { id: 's2', title: '2. 黑暗法坛', desc: '魔力猫学会了黑魔法技能「枯萎之殇」，要小心它的技能。', enemies: '1只35级魔力猫（生命值：900）' },
    { id: 's3', title: '3. 枯木祀场', desc: '沉寂已久的「朽木领主」从荒芜中走来，将为这片土地带来新生，战胜后即可获得「朽木领主」角色。', enemies: '1只35级朽木领主（生命值：2933）' }
  ];

  let html = '';
  stages.forEach((stg, idx) => {
    const cleared = state.bossClear >= idx + 1;
    const unlocked = idx === 0 || state.bossClear >= idx;
    const remaining = limits[stg.id] - (counts[stg.id] || 0);
    html += `<div class="boss-stage-card ${unlocked ? '' : 'locked'}">
        <div class="boss-stage-title">${stg.title} ${cleared ? '<span style="color:#7fc47f;font-size:12px;">(已通关)</span>' : ''}</div>
        <div class="boss-stage-desc">${stg.desc}</div>
        <div class="boss-stage-desc" style="color:#6aa8ff;font-size:12px;">敌阵：${stg.enemies}</div>
        <div class="boss-stage-actions">
          <span>今日挑战剩余：${remaining} / ${limits[stg.id]}</span>
          <button class="btn-challenge" data-stage="${stg.id}" ${unlocked && remaining > 0 ? '' : 'disabled'}>
            ${unlocked ? (remaining > 0 ? '挑战' : '次数耗尽') : '未解锁'}
          </button>
        </div>
      </div>`;
  });
  dom.bossPanelBody.innerHTML = html;
  dom.bossPanelBody.querySelectorAll('.btn-challenge').forEach(btn => {
    btn.onclick = () => { startBossBattle(btn.dataset.stage); closePanel(dom.bossPanel); };
  });
}

export function initBossEvents() {
  document.getElementById('btn-altar-leave').onclick = () => dom.altarDialog.classList.remove('open');
  document.getElementById('btn-altar-offer').onclick = () => {
    if ((state.inventory['magicCrystal'] || 0) < 15) { toast('魔法晶矿不足，需要15个！'); return; }
    state.inventory['magicCrystal'] -= 15;
    if (state.inventory['magicCrystal'] <= 0) delete state.inventory['magicCrystal'];
    state.altarState = true; save();
    import('./ui.js').then(m => m.renderStatus());
    dom.altarDialog.classList.remove('open'); renderAltar();
    toast('法阵已修复，守护者试炼开启！');
  };
  document.getElementById('btn-boss-rules').onclick = () => dom.bossRulesDialog.classList.add('open');
  document.getElementById('btn-rules-close').onclick = () => dom.bossRulesDialog.classList.remove('open');
  document.getElementById('close-boss-panel').onclick = () => closePanel(dom.bossPanel);
}