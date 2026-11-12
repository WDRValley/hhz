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
  
  // 清理之前动态修改的内联样式
  dom.sceneEl.style.padding = '';
  dom.sceneEl.style.paddingBottom = '';
  dom.sceneEl.style.overflow = '';
  dom.sceneEl.style.alignItems = '';

  if (key === 'gather') {
    // 探索模式：全屏沉浸
    document.body.classList.add('in-explore');
    dom.gatherView.style.display = 'flex';
    renderGatherScene();
  } else {
    // 普通界面：恢复默认顶部状态栏和底部导航
    document.body.classList.remove('in-explore');
    if (key === 'map') { 
      dom.mapView.style.display = 'block'; 
      dom.sceneEl.style.background = '#121212'; 
      dom.sceneEl.style.alignItems = 'flex-start'; 
      renderMap(); 
    }
    else if (key === 'shop') { 
      dom.shopView.style.display = 'block'; 
      dom.sceneEl.style.background = '#1a1a20'; 
      dom.sceneEl.style.alignItems = 'flex-start';
      renderShop(); 
    }
    else if (key === 'forge') { 
      dom.forgeView.style.display = 'block'; 
      dom.sceneEl.style.background = '#1f1a14'; 
      dom.sceneEl.style.alignItems = 'flex-start';
      renderForge(); 
    }
  }
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
        
        // 增加悬浮提示（跟随鼠标）
        if (reg.type === 'explore') {
          card.addEventListener('mouseenter', (e) => {
            let tip = document.getElementById('map-hover-tip');
            if (!tip) {
              tip = document.createElement('div');
              tip.id = 'map-hover-tip';
              document.body.appendChild(tip); // 挂载到 body 下
            }
            tip.innerHTML = `
              <div class="mh-title">${reg.name} (主)</div>
              <div class="mh-row" style="color:#6aa8ff;text-align:center;margin-bottom:8px;">适合等级：${reg.desc || '未知'}</div>
              <div class="mh-row">🌍 场景：${reg.scenes || '无'}</div>
              <div class="mh-row">💎 资源：${reg.resources || '无'}</div>
              <div class="mh-row">🐺 野怪：${reg.monsters || '无'}</div>
              <div class="mh-row">✨ 稀有：${reg.rares || '无'}</div>
              <div class="mh-row">👨‍🌾 NPC：${reg.npcs || '无'}</div>
            `;
            tip.style.display = 'block';
            tip.style.left = (e.clientX + 15) + 'px';
            tip.style.top = (e.clientY + 15) + 'px';
          });
          card.addEventListener('mousemove', (e) => {
            const tip = document.getElementById('map-hover-tip');
            if (tip && tip.style.display === 'block') {
              tip.style.left = (e.clientX + 15) + 'px';
              tip.style.top = (e.clientY + 15) + 'px';
            }
          });
          card.addEventListener('mouseleave', () => {
            const tip = document.getElementById('map-hover-tip');
            if (tip) tip.style.display = 'none';
          });
        }
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
      const isUnlimited = good.currency === 'tickets' && !good.weeklyLimit;

      let stock;
      if (good.weeklyLimit) stock = good.weeklyLimit - (state.shopBuyCount[good.id] || 0);
      else if (isUnlimited) stock = Infinity;
      else stock = state.shopStock[good.id] || 0;

      const soldOut = stock <= 0;
      const cur = good.currency === 'tickets' ? '🎫' : '💰';

      let stockText;
      if (isUnlimited) stockText = '不限量';
      else if (good.weeklyLimit) stockText = `周限购剩余 ${stock}`;
      else stockText = `剩余 ${stock}`;

      const card = document.createElement('div');
      card.className = 'shop-item tooltip-target' + (soldOut ? ' sold-out' : '');
      card.dataset.id = good.id;
      card.setAttribute('data-tip', `价格：${good.buyPrice}\n简介：${item.desc}`);
      card.innerHTML = `<div class="shop-emoji">${item.emoji}</div><div class="shop-name">${item.name}</div><div class="shop-price">${cur} ${good.buyPrice}</div><div class="shop-stock">${stockText}</div>
        ${soldOut ? '<div class="sold-out-tag">已售罄</div>' : `<button class="buy-btn">购买</button>`}`;
      grid.appendChild(card);
    });
    sec.appendChild(grid); dom.shopSections.appendChild(sec);
  });
  bindTooltips(dom.shopSections);
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
    const isUnlimited = good.currency === 'tickets' && !good.weeklyLimit;

    let maxStock;
    if (good.weeklyLimit) maxStock = good.weeklyLimit - (state.shopBuyCount[id] || 0);
    else if (isUnlimited) maxStock = 999999;
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
        if (good.weeklyLimit) state.shopBuyCount[id] = (state.shopBuyCount[id] || 0) + qty;
        else if (!isUnlimited) state.shopStock[id] -= qty;
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

// ===== 德鲁伊设施与商店逻辑 =====

export function openDruidShop() {
  const panel = document.getElementById('druid-shop-panel');
  const tabs = document.getElementById('druid-shop-tabs');
  
  tabs.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDruidGoods(btn.dataset.tab);
    };
  });
  
  renderDruidGoods('combat');
  import('./ui.js').then(m => m.openPanel(panel));
}

function renderDruidGoods(tab) {
  const body = document.getElementById('druid-shop-body');
  const allGoods = {
    combat: [
      { id: 'ballBasicPlus', price: 40, limit: 20 }, { id: 'ballMidPlus', price: 90, limit: 15 }, { id: 'ballHighPlus', price: 160, limit: 10 }
    ],
    consume: [
      { id: 'potionUniversal', price: 120, limit: 10 }, { id: 'potionBurn', price: 80, limit: 15 }, { id: 'potionFreeze', price: 80, limit: 15 },
      { id: 'potionPoison', price: 80, limit: 15 }, { id: 'potionBind', price: 80, limit: 15 }
    ],
    egg: [
      { id: 'eggWood', price: 450, limit: 3, weeklyLimit: 7 }, { id: 'eggTiantian', price: 800, foreverLimit: 1 }
    ]
  };
  
  const goods = allGoods[tab] || [];
  let html = '<div class="shop-grid">';
  goods.forEach(g => {
    const item = ITEMS[g.id];
    let maxStock = g.limit ? g.limit - (state.shopBuyCount[g.id] || 0) : 999;
    if (g.foreverLimit) maxStock = Math.min(maxStock, 1 - (state.shopBuyCount[g.id] || 0));
    
    const soldOut = maxStock <= 0;
    const tip = `简介：${item.desc}`;
    
    html += `<div class="shop-item tooltip-target ${soldOut ? 'sold-out' : ''}" data-tip="${tip}">
      <div class="shop-emoji">${item.emoji}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-price">💰 ${g.price}</div>
      <div class="shop-stock">剩余 ${soldOut ? 0 : maxStock}</div>
      ${soldOut ? '<div class="sold-out-tag">已售罄</div>' : `<button class="buy-btn" onclick="buyDruidItem('${g.id}', ${g.price}, ${maxStock})">购买</button>`}
    </div>`;
  });
  html += '</div>';
  body.innerHTML = html;
  import('./ui.js').then(m => m.bindTooltips(body));
}

window.buyDruidItem = function(id, price, maxStock) {
  if (state.gold < price) { import('./ui.js').then(m => m.toast('金币不足')); return; }
  const item = ITEMS[id];
  import('./ui.js').then(m => {
    // 金币能买得起的数量，与限购剩余数量，取最小值
    const affordable = Math.floor(state.gold / price);
    const maxBuy = Math.min(maxStock, affordable);
    
    m.openTradePanel({
      title: '购买确认', emoji: item.emoji, name: item.name, price: price, currency: 'gold', max: maxBuy, 
      callback: (qty) => {
        const totalCost = price * qty;
        if (state.gold < totalCost) { m.toast('金币不足'); return; }
        state.gold -= totalCost;
        state.shopBuyCount[id] = (state.shopBuyCount[id] || 0) + qty;
        state.inventory[id] = (state.inventory[id] || 0) + qty;
        import('./persistence.js').then(p => p.save());
        m.renderStatus();
        const activeTab = document.querySelector('#druid-shop-tabs button.active').dataset.tab;
        renderDruidGoods(activeTab);
      }
    });
  });
};

let incubatorTimer = null;
export function openIncubator() {
  const panel = document.getElementById('incubator-panel');
  const render = () => {
    const slotsContainer = document.getElementById('incubator-slots-container');
    const bagGrid = document.getElementById('incubator-bag-grid');
    
    // 渲染 3 个槽位
    let slotsHtml = '';
    state.incubator.forEach((slot, idx) => {
      if (slot.active) {
        const remain = Math.max(0, Math.ceil((slot.finishTime - Date.now()) / 1000));
        const item = ITEMS[slot.eggType];
        const tip = `${item.name} | 正在孵化${item.name}, 点击可取出`;
        if (remain <= 0) {
          slotsHtml += `<div class="tooltip-target" data-tip="${tip}" style="width:100px; height:100px; border:2px dashed #5a8b5a; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;" onclick="hatchEgg(${idx})">
            <div style="font-size:40px;">🐣</div><div style="font-size:12px; color:#7fc47f; margin-top:5px;">点击破壳</div>
          </div>`;
        } else {
          slotsHtml += `<div class="tooltip-target" data-tip="${tip}" style="width:100px; height:100px; border:1px solid #3a3a3a; background:rgba(255,255,255,.05); border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;" onclick="cancelIncubate(${idx})">
            <div style="font-size:40px;">🥚</div><div style="font-size:12px; color:#e8c86a; margin-top:5px;">${remain} 秒</div>
          </div>`;
        }
      } else {
        slotsHtml += `<div style="width:100px; height:100px; border:2px dashed #444; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#777;">
          <div style="font-size:40px;">🪹</div><div style="font-size:12px; margin-top:5px;">空槽位</div>
        </div>`;
      }
    });
    slotsContainer.innerHTML = slotsHtml;
    import('./ui.js').then(m => m.bindTooltips(slotsContainer)); // 重新绑定悬浮
    
    // 渲染背包蛋（至少9个格子）
    const eggIds = Object.keys(state.inventory).filter(id => ITEMS[id] && ITEMS[id].category === '道具' && id.includes('egg') && state.inventory[id] > 0);
    let bagHtml = '';
    for (let i = 0; i < 9; i++) {
      const id = eggIds[i];
      if (id) {
        const item = ITEMS[id];
        bagHtml += `<div style="height:80px; border:1px solid #4a8ae8; background:rgba(74,138,232,0.1); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;" onclick="startIncubate('${id}')">
          <div style="font-size:30px;">${item.emoji}</div>
          <div style="font-size:11px; color:#fff; text-align:center;">${item.name} x${state.inventory[id]}</div>
        </div>`;
      } else {
        bagHtml += `<div style="height:80px; border:1px dashed #333; border-radius:8px; background:rgba(0,0,0,0.2);"></div>`;
      }
    }
    bagGrid.innerHTML = bagHtml;
  };
  
  render();
  clearInterval(incubatorTimer);
  incubatorTimer = setInterval(render, 1000);
  import('./ui.js').then(m => m.openPanel(panel));
}

window.closeIncubator = function() {
  clearInterval(incubatorTimer);
  import('./ui.js').then(m => m.closePanel(document.getElementById('incubator-panel')));
};

window.startIncubate = function(eggId) {
  const emptySlotIdx = state.incubator.findIndex(s => !s.active);
  if (emptySlotIdx === -1) { import('./ui.js').then(m => m.toast('没有空闲的孵化槽位')); return; }
  
  state.inventory[eggId]--;
  if (state.inventory[eggId] <= 0) delete state.inventory[eggId];
  
  state.incubator[emptySlotIdx] = { active: true, finishTime: Date.now() + 300000, eggType: eggId };
  import('./persistence.js').then(m => m.save());
  openIncubator();
};

window.hatchEgg = function(idx) {
  const eggType = state.incubator[idx].eggType;
  let charId = eggType === 'eggTiantian' ? 'tian_npc' : ['woodSheep', 'flowerBud', 'magicCat', 'bounceSeed'][Math.floor(Math.random() * 4)];
  import('./character.js').then(c => {
    const newChar = c.createCharacter(charId);
    if (newChar) {
      let finalId = charId, count = 1;
      while (c.getCharacterById(finalId)) { finalId = charId + '_' + count; count++; }
      newChar.id = finalId;
      import('./state.js').then(s => {
        s.state.warehouseCharacters[finalId] = newChar;
        state.incubator[idx] = { active: false, finishTime: 0, eggType: null };
        import('./persistence.js').then(p => p.save());
        import('./ui.js').then(u => u.showRewardPopup('孵化成功', [{ emoji: newChar.emoji, name: newChar.name, count: 1 }]));
        openIncubator();
      });
    }
  });
};

window.cancelIncubate = function(idx) {
  if (confirm("正在孵化中，现在取出则孵化时间将被清空，需要重新孵化。（是/否）")) {
    state.incubator[idx] = { active: false, finishTime: 0, eggType: null };
    import('./persistence.js').then(m => m.save());
    openIncubator();
  }
};