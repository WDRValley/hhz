// js/main.js
import { state } from './state.js';
import { dom, initDom, renderStatus, openPanel, closePanel, initTradeEvents } from './ui.js';
import { load, save } from './persistence.js';
import { switchScene, renderShop, renderForge, renderMap, initSceneEvents } from './scenes.js';
import { renderInventory, initBagEvents } from './bag.js';
import { renderCharPanel, initCharPanelEvents } from './char-panel.js';
import { renderGiftPanel } from './gift.js';
import { initBossEvents } from './boss.js';
import { initExploreEvents, renderMinimap } from './explore.js';
import { initSettings } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    initDom();
    initTradeEvents();
    load();
    renderStatus();
    switchScene('map');
    bindGlobalEvents();
    initSceneEvents();
    initBagEvents();
    initCharPanelEvents();
    initBossEvents();
    initExploreEvents();
  } catch (error) {
    console.error("初始化崩了:", error);
    // 如果这里报错，屏幕上会显示红字
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:50px;left:0;width:100%;background:red;color:white;z-index:99999;padding:10px;font-size:14px;word-break:break-all;';
    errDiv.innerText = '初始化错误: ' + error.message;
    document.body.appendChild(errDiv);
  }

  // 每 5 秒恢复体力
  setInterval(() => {
    let changed = false;
    const allChars = { ...state.partyCharacters, ...state.warehouseCharacters };
    for (const id in allChars) {
      const ch = allChars[id];
      if (ch.stamina < 1000) { ch.stamina = Math.min(1000, ch.stamina + 1); changed = true; }
    }
    if (changed) {
      renderStatus();
      if (dom.charPanel.classList.contains('open')) renderCharPanel();
      save();
    }
  }, 5000);

  initSettings(); // 初始化设置
  document.addEventListener('contextmenu', e => e.preventDefault());
});

function bindGlobalEvents() {
  document.querySelectorAll('.tabs button').forEach(btn => btn.addEventListener('click', () => {
    // 如果点击“当前区域”，且已经在探索，弹出小地图
    if (btn.dataset.scene === 'gather' && state.currentScene === 'gather') {
      renderMinimap();
    } else {
      switchScene(btn.dataset.scene);
    }
  }));

  document.getElementById('bag-btn').onclick = () => { renderInventory(); openPanel(dom.bagPanel); };
  document.getElementById('close-bag').onclick = () => closePanel(dom.bagPanel);
  
  document.getElementById('char-btn').onclick = () => {
    state.currentCharTab = 'party';
    state.selectedCharId = state.activeCharId;
    document.querySelectorAll('#char-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === 'party'));
    renderCharPanel(); openPanel(dom.charPanel);
  };
  document.getElementById('close-char').onclick = () => closePanel(dom.charPanel);

  document.getElementById('gift-btn').onclick = () => { renderGiftPanel(); openPanel(dom.giftPanel); };
  document.getElementById('close-gift').onclick = () => closePanel(dom.giftPanel);

  document.querySelectorAll('#bag-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentBagTab = btn.dataset.tab;
      document.querySelectorAll('#bag-tabs button').forEach(b => b.classList.toggle('active', b === btn));
      renderInventory();
    });
  });

  document.querySelectorAll('#char-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentCharTab = btn.dataset.tab;
      document.querySelectorAll('#char-tabs button').forEach(b => b.classList.toggle('active', b === btn));
      if (state.currentCharTab === 'party' && state.party.length > 0) state.selectedCharId = state.party[0];
      else if (state.currentCharTab === 'warehouse') { const ids = Object.keys(state.warehouseCharacters); state.selectedCharId = ids[0] || state.party[0]; }
      renderCharPanel();
    });
  });

  document.querySelectorAll('#shop-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentShopTab = btn.dataset.tab;
      document.querySelectorAll('#shop-tabs button').forEach(b => b.classList.toggle('active', b === btn));
      renderShop();
    });
  });

  document.querySelectorAll('#gift-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentGiftTab = btn.dataset.tab;
      document.querySelectorAll('#gift-tabs button').forEach(b => b.classList.toggle('active', b === btn));
      renderGiftPanel();
    });
  });

  document.getElementById('close-skill-allocate').onclick = () => closePanel(dom.skillAllocatePanel);
  document.getElementById('close-equip-panel').onclick = () => closePanel(dom.equipPanel);
}