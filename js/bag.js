// js/bag.js
import { state } from './state.js';
import { ITEMS, QUALITY, PASSIVE_DESC, NATURE_KEYS, NATURES, STAT_NAMES } from './data.js';
import { dom, openPanel, closePanel, bindTooltips, bindLongPressTips, toast, effectText, openTradePanel } from './ui.js';
import { getActiveChar } from './character.js';
import { useItem, toggleEquipForActive, sellItem, findEquipSlot } from './inventory.js';
import { save } from './persistence.js';

export function renderInventory() {
  dom.bagGold.textContent = state.gold;
  dom.bagTicket.textContent = state.tickets;

  let catOrder = [];
  if (state.currentBagTab === 'equip') catOrder = ['武器', '防具'];
  else if (state.currentBagTab === 'food') catOrder = ['肉类', '蔬菜', '水果', '饮品'];
  else if (state.currentBagTab === 'consume') catOrder = ['消耗品', '丹药', '养成'];
  else if (state.currentBagTab === 'material') catOrder = ['材料', '道具'];

  dom.bagBody.innerHTML = '';
  let hasItems = false;

  catOrder.forEach(cat => {
    const ids = Object.keys(state.inventory).filter(id => ITEMS[id] && ITEMS[id].category === cat && state.inventory[id] > 0);
    if (ids.length > 0) {
      hasItems = true;
      const title = document.createElement('div');
      title.className = 'category-title'; title.textContent = cat;
      dom.bagBody.appendChild(title);
      ids.forEach(id => {
        const item = ITEMS[id];
        const row = document.createElement('div'); row.className = 'item-row'; row.dataset.id = id;
        row.innerHTML = `<span class="emoji">${item.emoji}</span><span class="name ${item.quality ? 'q-' + item.quality : ''}">${item.name}</span><span class="count">×${state.inventory[id]}</span>`;
        dom.bagBody.appendChild(row);
      });
    }
  });

  if (!hasItems) dom.bagBody.innerHTML = '<div class="empty-hint">此分类下暂无物品。</div>';
  bindLongPressTips(dom.bagBody);
}

let detailQty = 1;
export function showDetail(id) {
  const item = ITEMS[id]; if (!item) return;
  const count = state.inventory[id] || 0; detailQty = 1; const active = getActiveChar();
  const isEquip = item.kind === 'weapon' || item.kind === 'armor';
  const isUsable = item.kind === 'consume' || item.stamina || item.heal || item.healPercent || item.pp || item.exp || item.forget || item.forgetEv || item.natureChange || item.natureSpecify;
  const equipped = isEquip && !!findEquipSlot(active, id); const eff = effectText(item); const q = item.quality ? QUALITY[item.quality] : null;

  let actionBtn = '';
  if (isEquip) actionBtn = `<button id="equip-btn">${equipped ? '卸下' : '装备给' + active.name}</button>`;
  else if (isUsable) actionBtn = `<button id="use-btn">使用（${active.name}）</button>`;

  let passiveTip = '';
  if (item.passive) passiveTip = item.passive.map(p => `${p}：${PASSIVE_DESC[p] || '暂无说明'}`).join('\n');

  dom.detailBox.innerHTML = `<div class="big-emoji">${item.emoji}</div><h3 class="${item.quality ? 'q-' + item.quality : ''}">${item.name}${equipped ? ' <span class="equipped-tag">已装备</span>' : ''}</h3>
    <div class="cat-tag">${item.category}${item.subType ? ' · ' + item.subType : ''}</div>
    ${q ? `<div class="detail-quality q-${item.quality}">【${q.name}】</div>` : ''}
    ${eff ? `<div class="detail-effect">${eff}</div>` : ''}
    ${item.passive ? `<div class="detail-passive tooltip-target" data-tip="${passiveTip}">被动：${item.passive.join('、')}</div>` : ''}
    <p>${item.desc}</p>
    <div class="detail-price">单价：💰 ${item.price}　持有：${count}</div>
    ${actionBtn ? `<div class="action-row">${actionBtn}</div>` : ''}
    ${count > 0 ? `<div class="sell-area"><div class="qty-control"><button id="detail-minus">−</button><span id="detail-qty">1</span><button id="detail-plus">+</button></div>
      <button id="sell-btn">出售</button><button id="sell-all-btn">全部出售</button></div>` : '<div class="empty-hint">背包里没有这个物品。</div>'}
    <button id="close-detail">收起来</button>`;
  openPanel(dom.detailEl);
  
  document.getElementById('close-detail').onclick = () => closePanel(dom.detailEl);
  const eb = document.getElementById('equip-btn'); if (eb) eb.onclick = () => toggleEquipForActive(id);
  
  const ub = document.getElementById('use-btn');
  if (ub) ub.onclick = () => {
    if (item.natureSpecify) { closePanel(dom.detailEl); showNatureSelection(id); }
    else {
      closePanel(dom.detailEl);
      openTradePanel({
        title: '使用确认', emoji: item.emoji, name: item.name, price: 0, currency: 'item', max: state.inventory[id],
        callback: (qty) => {
          useItem(id, qty);
          if (state.inventory[id] > 0) showDetail(id);
          else closePanel(dom.detailEl);
          renderInventory();
        }
      });
    }
  };

  if (count > 0) {
    document.getElementById('detail-minus').onclick = () => { if (detailQty > 1) { detailQty--; document.getElementById('detail-qty').textContent = detailQty; } };
    document.getElementById('detail-plus').onclick = () => { if (detailQty < count) { detailQty++; document.getElementById('detail-qty').textContent = detailQty; } };
    document.getElementById('sell-btn').onclick = () => sellItem(id, detailQty);
    document.getElementById('sell-all-btn').onclick = () => sellItem(id, count);
  }
  bindTooltips(dom.detailBox);
}

export function showNatureSelection(itemId) {
  let html = '<h3 style="text-align:center;margin-bottom:16px;">选择性格</h3><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px;">';
  NATURE_KEYS.forEach(n => {
    const nat = NATURES[n];
    let desc = nat.up ? `(${STAT_NAMES[nat.up]}↑ ${STAT_NAMES[nat.down]}↓)` : '(平衡)';
    html += `<div class="nature-option tooltip-target" data-nature="${n}" style="background:rgba(255,255,255,.05);border:1px solid #444;border-radius:8px;padding:8px;text-align:center;cursor:pointer;">
      <div style="font-size:14px;margin-bottom:2px;">${n}</div><div style="font-size:10px;color:#888;">${desc}</div></div>`;
  });
  html += '</div><button id="close-nature-select" style="width:100%;padding:10px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;">取消</button>';

  dom.detailBox.innerHTML = html;
  openPanel(dom.detailEl);
  document.getElementById('close-nature-select').onclick = () => closePanel(dom.detailEl);

  dom.detailBox.querySelectorAll('.nature-option').forEach(el => {
    el.onclick = () => {
      const chosenNat = el.dataset.nature;
      const active = getActiveChar();
      active.nature = chosenNat;

      const count = state.inventory[itemId] || 0;
      if (count <= 1) delete state.inventory[itemId];
      else state.inventory[itemId] = count - 1;

      save(); import('./ui.js').then(m => m.renderStatus()); closePanel(dom.detailEl);
      toast(`已指定 ${active.name} 的性格为 ${chosenNat}`);
      if (dom.charPanel.classList.contains('open')) import('./char-panel.js').then(m => m.renderCharPanel());
      renderInventory();
    };
  });
}

export function initBagEvents() {
  dom.bagBody.addEventListener('click', e => { const row = e.target.closest('.item-row'); if (row) showDetail(row.dataset.id); });
  dom.detailEl.addEventListener('click', e => { if (e.target === dom.detailEl) closePanel(dom.detailEl); });
}