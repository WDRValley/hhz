// js/scenes.js
import { state, SLOT_COUNT, RESPAWN_MS } from './state.js';
import { MAPS, ITEMS, MONSTERS, SHOP, RECIPES, QUALITY, PASSIVE_DESC } from './data.js';
import { dom, toast, bindTooltips, openTradePanel, renderStatus, effectText } from './ui.js';
import { getActiveChar } from './character.js';
import { save, ensureStockFresh } from './persistence.js';
import { initExplore } from './explore.js';

export function switchScene(key) {
  state.currentScene = key;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.scene === key));
  dom.mapView.style.display = 'none'; dom.gatherView.style.display = 'none'; dom.shopView.style.display = 'none'; dom.forgeView.style.display = 'none';
  if (key === 'map') { dom.mapView.style.display = 'block'; dom.sceneEl.style.background = '#121212'; dom.sceneEl.style.alignItems = 'flex-start'; renderMap(); }
  else if (key === 'gather') { dom.gatherView.style.display = 'flex'; dom.sceneEl.style.alignItems = 'center'; renderGatherScene(); }
  else if (key === 'shop') { dom.shopView.style.display = 'block'; dom.sceneEl.style.background = '#1a1a20'; dom.sceneEl.style.alignItems = 'flex-start'; renderShop(); }
  else if (key === 'forge') { dom.forgeView.style.display = 'block'; dom.sceneEl.style.background = '#1f1a14'; dom.sceneEl.style.alignItems = 'flex-start'; renderForge(); }
}

export function renderMap() {
  dom.mapBody.innerHTML = '';
  for (const cid in MAPS) {
    const cont = MAPS[cid];
    const sec = document.createElement('div'); sec.className = 'map-continent';
    sec.innerHTML = `<h3>${cont.name}</h3>`;
    const grid = document.createElement('div'); grid.className = 'map-region-grid';
    for (const rid in cont.regions) {
      const reg = cont.regions[rid];
      const card = document.createElement('div');
      if (reg.type === 'kingdom') {
        card.className = 'map-region kingdom';
        card.innerHTML = `<div class="mr-name">🏰 ${reg.name}</div>
          <div class="kingdom-actions">
            <button data-place="shop">🛒 购物街</button>
            <button data-place="forge">⚒️ 锻造台</button>
            <button data-place="farm">🌾 农场</button>
          </div>`;
      } else {
        card.className = 'map-region';
        card.dataset.continent = cid; card.dataset.region = rid;
        card.innerHTML = `<div class="mr-name">${reg.name}</div><div class="mr-lv">Lv.${reg.lv || '?'}</div>`;
      }
      grid.appendChild(card);
    }
    sec.appendChild(grid); dom.mapBody.appendChild(sec);
  }
  dom.mapBody.querySelectorAll('.map-region[data-region]').forEach(el => {
    el.addEventListener('click', () => {
      state.currentContinentId = el.dataset.continent;
      state.currentRegionId = el.dataset.region;
      state.currentSubMapId = 'forest_core'; // 默认进入核心区
      switchScene('gather');
      save();
    });
  });
  dom.mapBody.querySelectorAll('.kingdom-actions button').forEach(btn => {
    btn.addEventListener('click', () => {
      const place = btn.dataset.place;
      if (place === 'shop') switchScene('shop');
      else if (place === 'forge') switchScene('forge');
      else toast('农场还在建设中……');
    });
  });
}

export function randomItem(region) { const list = region.items; return list[Math.floor(Math.random() * list.length)]; }

export function renderGatherScene() {
  const cont = MAPS[state.currentContinentId];
  const reg = cont.regions[state.currentRegionId];
  if (!reg) { switchScene('map'); return; }

  // 如果是探索类型
  if (reg.type === 'explore') {
    initExplore();
  } else {
    // 兼容原来的简单逻辑
    initExplore();
  }
}

export function findGood(id) { for (const s of SHOP.sections) { const g = s.goods.find(x => x.id === id); if (g) return g; } return null; }

export function renderShop() {
  ensureStockFresh(); dom.shopSections.innerHTML = '';
  SHOP.sections.filter(s => s.type === state.currentShopTab).forEach(section => {
    const sec = document.createElement('section'); sec.className = 'shop-section'; sec.innerHTML = `<h3>${section.icon} ${section.name}</h3>`;
    const grid = document.createElement('div'); grid.className = 'shop-grid';
    section.goods.forEach(good => {
      const item = ITEMS[good.id]; if (!item) return;
      let maxStock = good.stock;
      if (good.weeklyLimit) { maxStock = good.weeklyLimit - (state.shopBuyCount[good.id] || 0); }
      const stock = good.weeklyLimit ? maxStock : (state.shopStock[good.id] || 0);
      const soldOut = stock <= 0;
      const cur = good.currency === 'tickets' ? '🎫' : '💰';
      const card = document.createElement('div'); card.className = 'shop-item' + (soldOut ? ' sold-out' : ''); card.dataset.id = good.id;
      card.innerHTML = `<div class="shop-emoji">${item.emoji}</div><div class="shop-name">${item.name}</div><div class="shop-price">${cur} ${good.buyPrice}</div><div class="shop-stock">${good.weeklyLimit ? '周限购剩余' : '剩余'} ${stock}</div>
        ${soldOut ? '<div class="sold-out-tag">已售罄</div>' : `<button class="buy-btn">购买</button>`}`;
      grid.appendChild(card);
    });
    sec.appendChild(grid); dom.shopSections.appendChild(sec);
  });
}

export function canCraft(r) { if (state.gold < r.gold) return false; for (const m in r.mats) if ((state.inventory[m] || 0) < r.mats[m]) return false; return true; }

export function renderForge() {
  dom.forgeGrid.innerHTML = '';
  RECIPES.forEach(r => {
    const item = ITEMS[r.id]; if (!item) return; const ok = canCraft(r); const q = QUALITY[item.quality || 'white'];
    const passiveTip = item.passive ? item.passive.map(p => `${p}：${PASSIVE_DESC[p] || '暂无说明'}`).join('\n') : '';
    const costLines = Object.keys(r.mats).map(m => { const need = r.mats[m], have = state.inventory[m] || 0; return `<div class="cost-line ${have >= need ? '' : 'lack'}"><span>${ITEMS[m]?.emoji || ''} ${ITEMS[m]?.name || m} ×${need}</span><span>有 ${have}</span></div>`; }).join('');
    const card = document.createElement('div'); card.className = 'forge-card tooltip-target'; card.dataset.tip = passiveTip;
    card.innerHTML = `<div class="shop-emoji">${item.emoji}</div><div class="shop-name q-${item.quality || 'white'}">${item.name}</div>
      <div class="forge-sub q-${item.quality || 'white'}">【${q.name}】${item.subType || ''}</div>
      <div class="forge-effect">${effectText(item)}</div>
      ${item.passive ? `<div class="forge-sub" style="color:#c48aff">被动：${item.passive.join('、')}</div>` : ''}
      <div class="forge-cost">${costLines}<div class="cost-line ${state.gold >= r.gold ? '' : 'lack'}"><span>💰 金币 ×${r.gold}</span><span>有 ${state.gold}</span></div></div>
      <button class="buy-btn craft-btn" data-id="${r.id}" ${ok ? '' : 'disabled'}>锻造</button>`;
    dom.forgeGrid.appendChild(card);
  });
  bindTooltips(dom.forgeGrid);
}

// 场景内部事件绑定
export function initSceneEvents() {
  // ⚠️ 旧版采集按钮事件：gatherGrid 现在已隐藏，监听不会触发，仅保留避免报错
  dom.gatherGrid.addEventListener('click', e => {
    const btn = e.target.closest('.gather-btn'); if (!btn || btn.classList.contains('cooldown')) return;
    const ch = getActiveChar(); const reg = MAPS[state.currentContinentId].regions[state.currentRegionId]; const cost = reg.cost;
    if (ch.stamina < cost) { toast(`体力不足（需要 ${cost} 点）`); return; }
    ch.stamina -= cost; const id = btn.dataset.item; state.inventory[id] = (state.inventory[id] || 0) + 1;
    renderStatus(); save();
    toast(`获得 ${ITEMS[id].name} x 1`);
    btn.classList.add('cooldown');
    setTimeout(() => { const nid = randomItem(reg); btn.dataset.item = nid; btn.textContent = ITEMS[nid]?.emoji || '❓'; btn.classList.remove('cooldown'); }, RESPAWN_MS);
  });

  dom.shopSections.addEventListener('click', e => {
    const btn = e.target.closest('.buy-btn'); if (!btn) return;
    const card = e.target.closest('.shop-item'); const id = card.dataset.id;
    const good = findGood(id);
    let maxStock = good.stock;
    if (good.weeklyLimit) maxStock = good.weeklyLimit - (state.shopBuyCount[id] || 0);
    else maxStock = state.shopStock[id] || 0;
    if (maxStock <= 0) { toast('已达限购上限'); return; }
    const currency = good.currency || 'gold';
    let own = currency === 'tickets' ? state.tickets : state.gold;
    let affordable = Math.floor(own / good.buyPrice);
    let maxBuy = Math.min(maxStock, affordable);
    if (maxBuy < 1) { toast(currency === 'tickets' ? '点券不足' : '金币不足'); return; }
    openTradePanel({
      title: '购买确认', emoji: ITEMS[id].emoji, name: ITEMS[id].name, price: good.buyPrice, currency: currency, max: maxBuy,
      callback: (qty) => {
        if (currency === 'tickets') state.shopBuyCount[id] = (state.shopBuyCount[id] || 0) + qty;
        else state.shopStock[id] -= qty;
        state.inventory[id] = (state.inventory[id] || 0) + qty;
        renderShop();
      }
    });
  });

  dom.forgeGrid.addEventListener('click', e => {
    const btn = e.target.closest('.craft-btn'); if (!btn || btn.disabled) return;
    const r = RECIPES.find(x => x.id === btn.dataset.id); if (!r) return;
    if (!canCraft(r)) { toast('材料或金币不足'); return; }
    state.gold -= r.gold;
    for (const m in r.mats) { state.inventory[m] -= r.mats[m]; if (state.inventory[m] <= 0) delete state.inventory[m]; }
    state.inventory[r.id] = (state.inventory[r.id] || 0) + 1;
    save(); renderStatus(); renderForge(); toast(`锻造成功：${ITEMS[r.id].name}`);
  });
}