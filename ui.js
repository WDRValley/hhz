// js/ui.js
import { state } from './state.js';
import { ITEMS } from './data.js';
import { getActiveChar, getCharStats } from './character.js';

export const dom = {};
export function initDom() {
  dom.sceneEl = document.getElementById('scene');
  dom.mapView = document.getElementById('map-view');
  dom.mapBody = document.getElementById('map-body');
  dom.gatherView = document.getElementById('gather-view');
  dom.gatherTip = document.getElementById('gather-tip');
  dom.gatherGrid = document.getElementById('gather-grid');
  dom.monsterArea = document.getElementById('monster-area');
  dom.shopView = document.getElementById('shop-view');
  dom.shopSections = document.getElementById('shop-sections');
  dom.forgeView = document.getElementById('forge-view');
  dom.forgeGrid = document.getElementById('forge-grid');
  dom.bagPanel = document.getElementById('bag-panel');
  dom.bagBody = document.getElementById('bag-body');
  dom.charPanel = document.getElementById('char-panel');
  dom.charBody = document.getElementById('char-body');
  dom.detailEl = document.getElementById('detail');
  dom.detailBox = document.getElementById('detail-content');
  dom.battlePanel = document.getElementById('battle-panel');
  dom.battleTop = document.getElementById('battle-top');
  dom.battleLog = document.getElementById('battle-log');
  dom.battleActions = document.getElementById('battle-actions');
  dom.battleSubmenu = document.getElementById('battle-submenu');
  dom.battleTurnIndicator = document.getElementById('battle-turn-indicator');
  dom.giftPanel = document.getElementById('gift-panel');
  dom.giftBody = document.getElementById('gift-body');
  dom.skillAllocatePanel = document.getElementById('skill-allocate-panel');
  dom.skillAllocateBody = document.getElementById('skill-allocate-body');
  dom.expAllocatePanel = document.getElementById('exp-allocate-panel');
  dom.expItemList = document.getElementById('exp-item-list');
  dom.equipPanel = document.getElementById('equip-panel');
  dom.equipPanelBody = document.getElementById('equip-panel-body');
  dom.longpressTooltip = document.getElementById('item-longpress-tooltip');
  dom.bossArea = document.getElementById('boss-area');
  dom.bossAreaContent = document.getElementById('boss-area-content');
  dom.altarDialog = document.getElementById('altar-dialog');
  dom.bossRulesDialog = document.getElementById('boss-rules-dialog');
  dom.bossPanel = document.getElementById('boss-panel');
  dom.bossPanelBody = document.getElementById('boss-panel-body');
  
  dom.goldDisplay = document.getElementById('gold-display');
  dom.ticketDisplay = document.getElementById('ticket-display');
  dom.levelDisplay = document.getElementById('level-display');
  dom.atkDisplay = document.getElementById('atk-display');
  dom.matkDisplay = document.getElementById('matk-display');
  dom.defDisplay = document.getElementById('def-display');
  dom.mdefDisplay = document.getElementById('mdef-display');
  dom.critDisplay = document.getElementById('crit-display');
  dom.critDmgDisplay = document.getElementById('critdmg-display');
  dom.spdDisplay = document.getElementById('spd-display');
  dom.hpDisplay = document.getElementById('hp-display');
  dom.maxHpDisplay = document.getElementById('maxhp-display');
  dom.hpFill = document.getElementById('hp-fill');
  dom.staminaDisplay = document.getElementById('stamina-display');
  dom.maxStaminaDisp = document.getElementById('maxstamina-display');
  dom.staminaFill = document.getElementById('stamina-fill');
  dom.bagGold = document.getElementById('bag-gold');
  dom.bagTicket = document.getElementById('bag-ticket');
  dom.tooltipEl = document.getElementById('global-tooltip');
  
    // 在 initDom 的末尾补充：
  dom.exploreContainer = document.getElementById('explore-container');
  dom.explorePlayer = document.getElementById('explore-player');
  dom.exploreNodes = document.getElementById('explore-nodes');
  dom.interactPrompt = document.getElementById('interact-prompt');
  dom.minimapPanel = document.getElementById('minimap-panel');
  dom.minimapContent = document.getElementById('minimap-content');
}

let toastTimer = null;
export function toast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 1600);
}

export function openPanel(panel) { panel.classList.add('open'); document.body.classList.add('panel-open'); }
export function closePanel(panel) { panel.classList.remove('open'); document.body.classList.remove('panel-open'); }

let tooltipTimer = null;
export function showTooltip(text, x, y) {
  dom.tooltipEl.textContent = text;
  dom.tooltipEl.style.display = 'block';
  const rect = dom.tooltipEl.getBoundingClientRect();
  let left = x + 12, top = y + 12;
  if (left + rect.width > window.innerWidth) left = x - rect.width - 12;
  if (top + rect.height > window.innerHeight) top = y - rect.height - 12;
  dom.tooltipEl.style.left = left + 'px'; dom.tooltipEl.style.top = top + 'px';
}
export function hideTooltip() {
  dom.tooltipEl.style.display = 'none';
  clearTimeout(tooltipTimer); tooltipTimer = null;
}
export function bindTooltips(container) {
  container.querySelectorAll('.tooltip-target').forEach(el => {
    const tip = el.dataset.tip; if (!tip) return;
    el.addEventListener('pointerenter', e => {
      clearTimeout(tooltipTimer);
      tooltipTimer = setTimeout(() => showTooltip(tip, e.clientX, e.clientY), 300);
    });
    el.addEventListener('pointerleave', hideTooltip);
    el.addEventListener('pointermove', e => { if (dom.tooltipEl.style.display === 'block') showTooltip(tip, e.clientX, e.clientY); });
    let touchTimer = null;
    el.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      touchTimer = setTimeout(() => showTooltip(tip, touch.clientX, touch.clientY), 1000);
    }, {passive: true});
    el.addEventListener('touchend', () => { clearTimeout(touchTimer); setTimeout(hideTooltip, 2000); });
    el.addEventListener('touchcancel', () => { clearTimeout(touchTimer); hideTooltip(); });
  });
}

let longPressTimer = null;
export function bindLongPressTips(container) {
  container.querySelectorAll('.item-row').forEach(el => {
    const id = el.dataset.id; const item = ITEMS[id]; if (!item) return;
    const showLTooltip = (x, y) => {
      dom.longpressTooltip.innerHTML = `<div style="font-size:15px; font-weight:bold; color:#e8c86a; margin-bottom:4px;">${item.name}</div>
          <div style="font-size:12px; color:#ccc; margin-bottom:4px;">数量：${state.inventory[id]}</div>
          <div style="font-size:12px; color:#aaa; line-height:1.4;">简介：${item.desc}</div>`;
      dom.longpressTooltip.style.display = 'block';
      dom.longpressTooltip.style.left = Math.min(x + 10, window.innerWidth - 200) + 'px';
      dom.longpressTooltip.style.top = (y - 80) + 'px';
    };
    el.addEventListener('touchstart', e => { const t = e.touches[0]; longPressTimer = setTimeout(() => showLTooltip(t.clientX, t.clientY), 500); });
    el.addEventListener('touchend', () => { clearTimeout(longPressTimer); dom.longpressTooltip.style.display = 'none'; });
    el.addEventListener('touchmove', () => { clearTimeout(longPressTimer); dom.longpressTooltip.style.display = 'none'; });
    el.addEventListener('mousedown', e => { longPressTimer = setTimeout(() => showLTooltip(e.clientX, e.clientY), 500); });
    el.addEventListener('mouseup', () => { clearTimeout(longPressTimer); dom.longpressTooltip.style.display = 'none'; });
    el.addEventListener('mouseleave', () => { clearTimeout(longPressTimer); dom.longpressTooltip.style.display = 'none'; });
  });
}

export function effectText(item) {
  const p=[];
  if(item.atk)p.push(`物攻+${item.atk}`);if(item.matk)p.push(`魔攻+${item.matk}`);if(item.pdef)p.push(`物抗+${item.pdef}`);
  if(item.mdef)p.push(`魔抗+${item.mdef}`);if(item.hp)p.push(`生命+${item.hp}`);if(item.crit)p.push(`暴击+${item.crit}%`);
  if(item.critDmg)p.push(`爆伤+${item.critDmg}%`);if(item.pierce)p.push(`物穿+${item.pierce}`);if(item.mpierce)p.push(`魔穿+${item.mpierce}`);
  if(item.spd)p.push(`速度+${item.spd}`);if(item.stamina)p.push(`体力+${item.stamina}`);if(item.heal)p.push(`生命+${item.heal}`);
  if(item.exp)p.push(`经验+${item.exp}`);if(item.pp)p.push(`PP+${item.pp}`);if(item.forget)p.push('等级归1');
  if(item.forgetEv)p.push('重置学习力');if(item.natureChange)p.push('随机修改性格');if(item.natureSpecify)p.push('指定修改性格');
  return p.join('　');
}

export function renderStatus() {
  const ch = getActiveChar(), s = getCharStats(ch);
  dom.goldDisplay.textContent = state.gold; dom.ticketDisplay.textContent = state.tickets;
  dom.levelDisplay.textContent = ch.level; dom.atkDisplay.textContent = s.atk; dom.matkDisplay.textContent = s.matk;
  dom.defDisplay.textContent = s.pdef; dom.mdefDisplay.textContent = s.mdef; dom.critDisplay.textContent = s.crit;
  dom.critDmgDisplay.textContent = s.critDmg; dom.spdDisplay.textContent = s.spd;
  dom.hpDisplay.textContent = Math.max(0, Math.ceil(ch.hp)); dom.maxHpDisplay.textContent = s.maxHp;
  dom.hpFill.style.width = Math.max(0, Math.min(100, ch.hp / s.maxHp * 100)) + '%';
  dom.staminaDisplay.textContent = Math.floor(ch.stamina); dom.maxStaminaDisp.textContent = 1000;
  dom.staminaFill.style.width = (ch.stamina / 1000 * 100) + '%';
  if (dom.bagPanel.classList.contains('open')) {
    dom.bagGold.textContent = state.gold; dom.bagTicket.textContent = state.tickets;
  }
}

// Trade Panel
export let currentTradeAction = null;
export let tradeQty = 1;
export function openTradePanel(config) {
  currentTradeAction = config; tradeQty = 1;
  const tradePanel = document.getElementById('trade-panel');
  document.getElementById('trade-title').textContent = config.title || '确认';
  document.getElementById('trade-emoji').textContent = config.emoji;
  document.getElementById('trade-name').textContent = config.name;
  let currencyIcon = config.currency === 'tickets' ? '🎫' : (config.currency === 'item' ? '📦' : '💰');
  if (config.currency === 'item') document.getElementById('trade-price').textContent = `可用数量：${config.max}`;
  else document.getElementById('trade-price').textContent = `单价：${currencyIcon} ${config.price}`;
  updateTradeUI();
  tradePanel.classList.add('open');
}
export function updateTradeUI() {
  if (!currentTradeAction) return;
  const { price, currency, max } = currentTradeAction;
  if (tradeQty > max) tradeQty = max; if (tradeQty < 1) tradeQty = 1;
  document.getElementById('trade-qty').textContent = tradeQty;
  let currencyIcon = currency === 'tickets' ? '🎫' : (currency === 'item' ? '📦' : '💰');
  if (currency === 'item') {
    document.getElementById('trade-cost').textContent = `消耗 ${tradeQty} 个`;
    document.getElementById('trade-cost').style.color = '#e8c86a';
    document.getElementById('trade-own').textContent = `${max} 个`;
    document.getElementById('trade-confirm').disabled = false;
    document.getElementById('trade-confirm').textContent = '使用';
  } else {
    const total = price * tradeQty;
    let own = currency === 'tickets' ? state.tickets : state.gold;
    document.getElementById('trade-cost').textContent = `${currencyIcon} ${total}`;
    document.getElementById('trade-cost').style.color = own >= total ? '#e8c86a' : '#d95a5a';
    document.getElementById('trade-own').textContent = `${currencyIcon} ${own}`;
    document.getElementById('trade-confirm').disabled = own < total;
    document.getElementById('trade-confirm').textContent = '确定';
  }
  document.getElementById('trade-max').disabled = tradeQty >= max;
}
export function initTradeEvents() {
  document.getElementById('trade-minus').onclick = () => { if (tradeQty > 1) { tradeQty--; updateTradeUI(); } };
  document.getElementById('trade-plus').onclick = () => { if (tradeQty < currentTradeAction.max) { tradeQty++; updateTradeUI(); } };
  document.getElementById('trade-max').onclick = () => { tradeQty = currentTradeAction.max; updateTradeUI(); };
  document.getElementById('trade-cancel').onclick = () => { document.getElementById('trade-panel').classList.remove('open'); currentTradeAction = null; };
  document.getElementById('trade-confirm').onclick = () => {
    if (!currentTradeAction) return;
    const { price, currency, callback } = currentTradeAction;
    if (currency === 'item') {
      callback(tradeQty);
      document.getElementById('trade-panel').classList.remove('open');
      currentTradeAction = null; return;
    }
    let own = currency === 'tickets' ? state.tickets : state.gold;
    const total = price * tradeQty;
    if (own >= total) {
      if (currency === 'tickets') state.tickets -= total;
      else state.gold -= total;
      callback(tradeQty);
      document.getElementById('trade-panel').classList.remove('open');
      currentTradeAction = null;
      renderStatus();
    }
  };
}

export function showRewardPopup(title, items) {
  const rewardModal = document.getElementById('reward-modal');
  const rewardGrid = document.getElementById('reward-grid');
  document.querySelector('#reward-modal h3').textContent = title;
  rewardGrid.innerHTML = '';
  items.forEach(it => {
    let emoji = '', name = '', count = 0;
    if (it.type === 'gold') { emoji = '💰'; name = '金币'; count = it.amount; }
    else if (it.type === 'ticket') { emoji = '🎫'; name = '点券'; count = it.amount; }
    else if (it.type === 'exp') { emoji = '⭐'; name = '经验'; count = it.amount; }
    else {
      const itemData = ITEMS[it.id];
      if (itemData) { emoji = itemData.emoji; name = itemData.name; count = it.count; }
    }
    if (emoji) {
      const tipText = `数量：${count}\n简介：${it.type === 'gold' || it.type === 'ticket' || it.type === 'exp' ? '游戏货币或经验。' : (ITEMS[it.id]?.desc || '')}`;
      rewardGrid.innerHTML += `<div class="reward-item tooltip-target" data-tip="${tipText}"><span class="ri-emoji">${emoji}</span><span class="ri-name">${name}</span><span class="ri-count">×${count}</span></div>`;
    }
  });
  rewardModal.classList.add('open');
  document.getElementById('reward-confirm').onclick = () => { rewardModal.classList.remove('open'); };
  bindTooltips(rewardGrid);
}