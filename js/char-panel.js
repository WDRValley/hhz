// js/char-panel.js
import { state, MAX_PARTY, MAX_STAMINA, MAX_LEVEL } from './state.js';
import { SKILLS, NATURES, NATURE_KEYS, STAT_NAMES, ITEMS, QUALITY, PASSIVE_DESC } from './data.js';
import { dom, openPanel, closePanel, bindTooltips, toast, effectText, renderStatus } from './ui.js';
import { getCharStats, getSelectedChar, getCharacterById, getActiveChar, expNeeded, addExp } from './character.js';
import { save } from './persistence.js';
import { afterEquipChange, equipItemToChar } from './inventory.js';
import { refreshExplorePlayer } from './explore.js';

export function renderCharPanel() {
  const sel = getSelectedChar();
  if (!sel) { dom.charBody.innerHTML = '<div class="empty-hint">暂无角色</div>'; return; }
  const s = getCharStats(sel);
  const listIds = state.currentCharTab === 'party' ? state.party : Object.keys(state.warehouseCharacters);
  
  let listTitle = state.currentCharTab === 'party' ? `角色背包（出战：${listIds.length}/${MAX_PARTY}）` : `角色仓库（${listIds.length}）`;
  let whTop = `<div class="warehouse-title">${listTitle}`;
  if (state.currentCharTab === 'party') {
    whTop += `<div style="display:flex; gap:6px;">
      <button class="buy-btn" id="btn-exp-allocate" style="margin:0; padding:4px 10px; font-size:12px; background:#4a6a9a;">分配经验</button>
      <button class="buy-btn" id="heal-all-btn" style="margin:0; padding:4px 10px; font-size:12px;">全队补给 (50金币)</button>
    </div>`;
  }
  whTop += `</div>`;

  let wh = `<div class="warehouse">${whTop}<div class="warehouse-grid">`;
  listIds.forEach(id => {
    const ch = getCharacterById(id); if (!ch) return;
    const isA = id === state.activeCharId;
    const isS = id === state.selectedCharId;
    wh += `<div class="char-card ${isS ? 'active' : ''}" data-char-id="${id}">
      <span class="cc-emoji">${ch.emoji}</span>
      <span class="cc-name">${ch.name}</span>
      <span class="cc-lv">Lv.${ch.level}</span>
      ${isA && state.currentCharTab === 'party' ? '<span class="cc-badge">首选</span>' : ''}
    </div>`;
  });
  wh += '</div></div>';

  let actionBtn = '';
  if (state.currentCharTab === 'party') {
    actionBtn = `<button id="move-to-warehouse-btn" ${state.party.length > 1 ? '' : 'disabled'}>移入仓库</button>`;
  } else {
    actionBtn = `<button id="move-to-party-btn" ${state.party.length < MAX_PARTY ? '' : 'disabled'}>加入队伍</button>`;
  }

  const expNeed = expNeeded(sel.level), expPct = Math.min(100, sel.exp / expNeed * 100);
  const skillSlots = [];
  for (let i = 0; i < 4; i++) {
    const sid = sel.equippedSkills[i];
    if (sid && SKILLS[sid]) {
      const sk = SKILLS[sid], pp = sel.skillPp[sid] || { current: 0, max: sk.maxPp };
      skillSlots.push(`<div class="skill-slot filled tooltip-target" data-tip="${sk.desc}" data-skill-slot="${i}">
        <div class="ss-name">${sk.name} <span class="type-tag type-${sk.type}" style="font-size:10px;padding:0 4px;">${sk.type}</span></div>
        <div class="ss-info">${sk.category} · 威力${sk.power > 0 ? sk.power : '-'} · PP ${pp.current}/${pp.max}</div>
      </div>`);
    } else skillSlots.push(`<div class="skill-slot"><div class="ss-empty">— 空技能槽 —</div><div class="ss-info">点击下方技能装备</div></div>`);
  }

  const learnedList = sel.learnedSkills.map(sid => {
    const sk = SKILLS[sid]; if (!sk) return '';
    const used = sel.equippedSkills.includes(sid);
    return `<span class="learned-skill tooltip-target ${used ? 'used' : ''}" data-tip="${sk.desc}" data-learned-skill="${sid}">${sk.name} <span class="type-tag type-${sk.type}" style="font-size:10px;padding:0 4px;">${sk.type}</span> <span class="skill-pp">${sk.category}</span></span>`;
  }).join('');

  const slotDefs = [{ key: 'head', label: '头部', icon: '🎩', tip: '帽子/头饰' }, { key: 'chest', label: '胸部', icon: '👕', tip: '衣服/项链' }, { key: 'feet', label: '足部', icon: '👟', tip: '鞋子/足饰' }, { key: 'left', label: '左手', icon: '✋', tip: '盾牌/单手' }, { key: 'right', label: '右手', icon: '🤚', tip: '单手武器' }, { key: 'two', label: '双手', icon: '🙌', tip: '双手武器' }];
  let eqH = '<div class="equip-grid">';
  slotDefs.forEach(def => {
    const id = sel.equip[def.key], item = id ? ITEMS[id] : null;
    let passiveTip = '';
    if (item && item.passive) { passiveTip = item.passive.map(p => `${p}：${PASSIVE_DESC[p] || '暂无说明'}`).join('\n'); }
    eqH += `<div class="equip-slot ${item ? 'filled' : ''} tooltip-target" data-tip="${passiveTip ? passiveTip + '\n点击更换装备' : '点击更换装备'}" data-slot-key="${def.key}">
      <span class="slot-icon">${item ? item.emoji : def.icon}</span>
      <div class="slot-info">
        <span class="slot-name">${def.label} · ${item ? (item.subType || '') : def.tip}</span>
        <span class="slot-item ${item && item.quality ? 'q-' + item.quality : ''}">${item ? item.name : '空'}</span>
      </div>
    </div>`;
  });
  eqH += '</div>';

  const isActive = state.currentCharTab === 'party' && state.selectedCharId === state.activeCharId;
  const evs = sel.evs || { atk: 0, matk: 0, pdef: 0, mdef: 0, hp: 0, spd: 0 };
  const totalEvs = Object.values(evs).reduce((a, b) => a + b, 0);

  let evHtml = `<div class="ev-panel"><div style="font-size:12px;color:#e8c86a;margin-bottom:6px;">已分配总和：${totalEvs}/512</div>`;
  const evStats = [{ k: 'atk', label: '物攻' }, { k: 'matk', label: '魔攻' }, { k: 'pdef', label: '物防' }, { k: 'mdef', label: '魔防' }, { k: 'hp', label: '体力' }, { k: 'spd', label: '速度' }];
  evStats.forEach(stat => {
    const val = evs[stat.k] || 0, pct = (val / 256) * 100;
    evHtml += `<div class="ev-row"><span class="ev-label">${stat.label}</span><div class="ev-bar"><div class="ev-fill" style="width:${pct}%"></div></div><span class="ev-num">${val}/256</span></div>`;
  });
  evHtml += '</div>';

  const nat = NATURES[sel.nature] || { up: null, down: null };
  let natText = `性格：${sel.nature}`;
  if (nat.up) natText += ` <span style="color:#7fc47f;font-size:12px;">(${STAT_NAMES[nat.up]}↑)</span>`;
  if (nat.down) natText += ` <span style="color:#d95a5a;font-size:12px;">(${STAT_NAMES[nat.down]}↓)</span>`;

  dom.charBody.innerHTML = wh + `<div class="char-detail">
    <div class="active-char-bar">
      <span class="acb-text">当前查看：${sel.name}</span>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${state.currentCharTab === 'party' ? `
          <button id="move-up-btn" ${state.party.indexOf(state.selectedCharId) === 0 ? 'disabled' : ''}>⬆️ 上移</button>
          <button id="move-down-btn" ${state.party.indexOf(state.selectedCharId) === state.party.length - 1 ? 'disabled' : ''}>⬇️ 下移</button>
          <button id="set-active-btn" ${isActive ? 'disabled' : ''}>${isActive ? '当前首选' : '设为首选'}</button>
        ` : ''}
        ${actionBtn}
      </div>
    </div>
    <div class="char-top">
      <div class="char-avatar">${sel.emoji}</div>
      <div class="char-basic">
        <div class="cb-name">${sel.name} <span class="type-tag type-${sel.type}" style="font-size:12px;vertical-align:middle">${sel.type}</span></div>
        <div class="cb-meta" style="margin-bottom:4px;">${natText}</div>
        <div class="cb-meta">性别：${sel.gender}　身高：${sel.height}　体重：${sel.weight}<br>等级：Lv.${sel.level}</div>
        <div class="cb-intro">${sel.intro}</div>
      </div>
    </div>
    <div class="char-section"><h4>属性面板</h4><div class="stat-grid">
      <div class="stat-cell"><span>物攻</span><b>${s.atk}</b></div><div class="stat-cell"><span>魔攻</span><b>${s.matk}</b></div>
      <div class="stat-cell"><span>物抗</span><b>${s.pdef}</b></div><div class="stat-cell"><span>魔抗</span><b>${s.mdef}</b></div>
      <div class="stat-cell"><span>暴击</span><b>${s.crit}%</b></div><div class="stat-cell"><span>爆伤</span><b>${s.critDmg}%</b></div>
      <div class="stat-cell"><span>速度</span><b>${s.spd}</b></div>
    </div></div>
    <div class="char-section"><h4>状态面板</h4>
      <div class="bar-line"><span class="bl-label">❤️生命</span><div class="bl-bar"><div class="bl-fill hp" style="width:${Math.min(100, sel.hp / s.maxHp * 100)}%"></div></div><span class="bl-text">${Math.ceil(sel.hp)}/${s.maxHp}</span></div>
      <div class="bar-line"><span class="bl-label">⚡体力</span><div class="bl-bar"><div class="bl-fill st" style="width:${Math.min(100, sel.stamina / MAX_STAMINA * 100)}%"></div></div><span class="bl-text">${Math.floor(sel.stamina)}/${MAX_STAMINA}</span></div>
      <div class="bar-line"><span class="bl-label">经验</span><div class="bl-bar"><div class="bl-fill exp" style="width:${expPct}%"></div></div><span class="bl-text">${sel.exp}/${expNeed}</span></div>
    </div>
    <div class="char-section"><h4>学习力养成 <span style="font-size:11px;font-weight:400;color:#777">(4点学习力=1点属性，体力1:1)</span></h4>${evHtml}</div>
    <div class="char-section"><h4>装备栏</h4>${eqH}</div>
    <div class="char-section"><h4>技能配置（最多4个，最少1个）<button id="open-allocate-btn">技能分配</button></h4>
      <div class="skill-slots">${skillSlots.join('')}</div>
      <div style="font-size:12px;color:#777;margin-bottom:8px;">已学会技能（点击装备/卸下，悬浮/长按查看说明）</div>
      <div class="learned-skills">${learnedList || '<span class="empty-hint">暂无已学技能</span>'}</div>
    </div>
  </div>`;

  dom.charBody.querySelectorAll('.char-card').forEach(c => { c.addEventListener('click', () => { state.selectedCharId = c.dataset.charId; renderCharPanel(); }); });
  const moveUpBtn = dom.charBody.querySelector('#move-up-btn');
  if (moveUpBtn && !moveUpBtn.disabled) { moveUpBtn.addEventListener('click', () => { const idx = state.party.indexOf(state.selectedCharId); if (idx > 0) { [state.party[idx - 1], state.party[idx]] = [state.party[idx], state.party[idx - 1]]; save(); renderCharPanel(); } }); }
  const moveDownBtn = dom.charBody.querySelector('#move-down-btn');
  if (moveDownBtn && !moveDownBtn.disabled) { moveDownBtn.addEventListener('click', () => { const idx = state.party.indexOf(state.selectedCharId); if (idx < state.party.length - 1) { [state.party[idx + 1], state.party[idx]] = [state.party[idx], state.party[idx + 1]]; save(); renderCharPanel(); } }); }
  const setBtn = dom.charBody.querySelector('#set-active-btn');
  if (setBtn && !isActive) { setBtn.addEventListener('click', () => { state.activeCharId = state.selectedCharId; renderStatus(); renderCharPanel(); save(); refreshExplorePlayer(); toast(`首选角色已切换为 ${getActiveChar().name}`); }); }
  const moveWBtn = dom.charBody.querySelector('#move-to-warehouse-btn');
  if (moveWBtn) { moveWBtn.addEventListener('click', () => { if (state.party.length <= 1) { toast('队伍至少需要保留1名角色'); return; } const id = state.selectedCharId; const ch = state.partyCharacters[id]; if (!ch) return; state.party = state.party.filter(pid => pid !== id); delete state.partyCharacters[id]; state.warehouseCharacters[id] = ch; if (state.activeCharId === id) state.activeCharId = state.party[0]; state.selectedCharId = state.party[0] || Object.keys(state.warehouseCharacters)[0]; renderStatus(); renderCharPanel(); save(); toast(`${ch.name} 已移入仓库`); }); }
  const movePBtn = dom.charBody.querySelector('#move-to-party-btn');
  if (movePBtn) { movePBtn.addEventListener('click', () => { if (state.party.length >= MAX_PARTY) { toast('出战队伍已满'); return; } const id = state.selectedCharId; const ch = state.warehouseCharacters[id]; if (!ch) return; delete state.warehouseCharacters[id]; state.party.push(id); state.partyCharacters[id] = ch; state.selectedCharId = id; renderStatus(); renderCharPanel(); save(); toast(`${ch.name} 已加入队伍`); }); }
  const expBtn = dom.charBody.querySelector('#btn-exp-allocate');
  if (expBtn) expBtn.addEventListener('click', openExpAllocate);
  const healAllBtn = dom.charBody.querySelector('#heal-all-btn');
  if (healAllBtn) {
    healAllBtn.addEventListener('click', () => {
      if (state.gold < 50) { toast('金币不足，需要50金币'); return; }
      state.gold -= 50;
      state.party.forEach(id => { const c = state.partyCharacters[id]; if (c) { c.hp = getCharStats(c).maxHp; c.learnedSkills.forEach(sid => { if (c.skillPp[sid]) c.skillPp[sid].current = c.skillPp[sid].max; }); } });
      renderStatus(); renderCharPanel(); save(); toast('全队生命与PP已完全恢复！(消耗50金币)');
    });
  }
  dom.charBody.querySelectorAll('.equip-slot').forEach(sl => { sl.addEventListener('click', () => { openEquipPanel(sl.dataset.slotKey); }); });
  dom.charBody.querySelectorAll('.skill-slot.filled').forEach(sl => { sl.addEventListener('click', () => { if (sel.equippedSkills.length <= 1) { toast('至少需要装备1个技能'); return; } const i = parseInt(sl.dataset.skillSlot, 10); sel.equippedSkills.splice(i, 1); save(); renderCharPanel(); }); });
  dom.charBody.querySelectorAll('.learned-skill').forEach(el => { el.addEventListener('click', () => { const sid = el.dataset.learnedSkill; if (sel.equippedSkills.includes(sid)) { if (sel.equippedSkills.length <= 1) { toast('至少需要装备1个技能'); return; } sel.equippedSkills = sel.equippedSkills.filter(s => s !== sid); } else { if (sel.equippedSkills.length >= 4) { toast('技能槽已满'); return; } sel.equippedSkills.push(sid); } save(); renderCharPanel(); }); });
  document.getElementById('open-allocate-btn').onclick = openSkillAllocate;
  bindTooltips(dom.charBody);
}

export function openEquipPanel(slotKey) {
  state.currentEquipSlotKey = slotKey;
  if (slotKey === 'head') state.currentEquipFilter = 'head';
  else if (slotKey === 'chest') state.currentEquipFilter = 'chest';
  else if (slotKey === 'feet') state.currentEquipFilter = 'feet';
  else if (slotKey === 'left' || slotKey === 'right' || slotKey === 'two') state.currentEquipFilter = 'hand';
  else state.currentEquipFilter = 'all';
  renderEquipPanel();
  openPanel(dom.equipPanel);
}

export function renderEquipPanel() {
  const ch = getSelectedChar(); if (!ch) return;
  const slotNames = { head: '头部', chest: '胸部', feet: '足部', left: '左手', right: '右手', two: '双手' };
  document.getElementById('equip-panel-title').textContent = `装备库`;
  
  let html = `<div class="bag-tabs" style="border-bottom:1px solid #333; padding:10px 0; margin-bottom:12px; flex-wrap:wrap; gap:6px; justify-content:flex-start;">
    <button class="${state.currentEquipFilter === 'all' ? 'active' : ''}" onclick="setEquipFilter('all')">全部</button>
    <button class="${state.currentEquipFilter === 'hand' ? 'active' : ''}" onclick="setEquipFilter('hand')">手部</button>
    <button class="${state.currentEquipFilter === 'head' ? 'active' : ''}" onclick="setEquipFilter('head')">头部</button>
    <button class="${state.currentEquipFilter === 'chest' ? 'active' : ''}" onclick="setEquipFilter('chest')">胸部</button>
    <button class="${state.currentEquipFilter === 'feet' ? 'active' : ''}" onclick="setEquipFilter('feet')">足部</button>
  </div>`;
  
  let equippedHtml = '';
  for (const k in ch.equip) {
    const id = ch.equip[k];
    if (id && ITEMS[id]) {
      const item = ITEMS[id];
      if (state.currentEquipFilter !== 'all') {
        let match = false;
        if (state.currentEquipFilter === 'head' && item.slot === 'head') match = true;
        else if (state.currentEquipFilter === 'chest' && item.slot === 'chest') match = true;
        else if (state.currentEquipFilter === 'feet' && item.slot === 'feet') match = true;
        else if (state.currentEquipFilter === 'hand' && item.slot === 'hand') match = true;
        if (!match) continue;
      }
      equippedHtml += `<div class="equip-item-row unequip-row" data-slot="${k}" style="border:1px solid #8a5a5a;">
        <span class="ei-emoji">${item.emoji}</span>
        <div class="ei-info">
          <div class="ei-name ${item.quality ? 'q-' + item.quality : ''}">${item.name} <span style="font-size:12px;color:#888;">(${slotNames[k]})</span></div>
          <div class="ei-stats">${effectText(item)}</div>
        </div><span class="ei-action" style="color:#d95a5a;">卸下</span>
      </div>`;
    }
  }
  if (equippedHtml) html += `<div class="category-title">当前已装备</div>` + equippedHtml;
  
  let availableHtml = '';
  for (const id in state.inventory) {
    if (state.inventory[id] <= 0) continue;
    const item = ITEMS[id];
    if (!item || (item.kind !== 'weapon' && item.kind !== 'armor')) continue;
    if (state.currentEquipFilter !== 'all') {
      let match = false;
      if (state.currentEquipFilter === 'head' && item.slot === 'head') match = true;
      else if (state.currentEquipFilter === 'chest' && item.slot === 'chest') match = true;
      else if (state.currentEquipFilter === 'feet' && item.slot === 'feet') match = true;
      else if (state.currentEquipFilter === 'hand' && item.slot === 'hand') match = true;
      if (!match) continue;
    }
    let partText = '未知';
    if (item.slot === 'head') partText = '头部';
    else if (item.slot === 'chest') partText = '胸部';
    else if (item.slot === 'feet') partText = '足部';
    else if (item.slot === 'hand') partText = item.handType === 'two' ? '双手武器' : (item.handType === 'left' ? '左手/副手' : '单手武器');
    if (item.subType) partText += ' · ' + item.subType;
    availableHtml += `<div class="equip-item-row equip-row" data-id="${id}">
      <span class="ei-emoji">${item.emoji}</span>
      <div class="ei-info">
        <div class="ei-name ${item.quality ? 'q-' + item.quality : ''}">${item.name} <span style="font-size:12px;color:#888;">×${state.inventory[id]}</span></div>
        <div class="ei-stats" style="color:#8ab88a;">${partText}</div>
        <div class="ei-stats">${effectText(item)}</div>
      </div><span class="ei-action">装备</span>
    </div>`;
  }
  if (availableHtml) html += `<div class="category-title">背包中的装备</div>` + availableHtml;
  else html += `<div class="category-title">背包中的装备</div><div class="empty-hint">没有找到相关装备。</div>`;
  
  dom.equipPanelBody.innerHTML = html;
  dom.equipPanelBody.querySelectorAll('.unequip-row').forEach(row => {
    row.onclick = () => { const k = row.dataset.slot; ch.equip[k] = null; afterEquipChange(ch); renderCharPanel(); renderEquipPanel(); };
  });
  dom.equipPanelBody.querySelectorAll('.equip-row').forEach(row => {
    row.onclick = () => { const id = row.dataset.id; if (equipItemToChar(ch, id)) { afterEquipChange(ch); renderCharPanel(); renderEquipPanel(); } };
  });
}
window.setEquipFilter = function (filter) { state.currentEquipFilter = filter; renderEquipPanel(); };

export function openSkillAllocate() {
  const ch = getSelectedChar(); if (!ch) return;
  state.tempAllocatedSkills = [...ch.equippedSkills];
  renderSkillAllocate(); openPanel(dom.skillAllocatePanel);
}

export function renderSkillAllocate() {
  const ch = getSelectedChar(); if (!ch) return;
  let slotsHtml = '<div class="allocate-slots">';
  for (let i = 0; i < 4; i++) {
    const sid = state.tempAllocatedSkills[i];
    if (sid && SKILLS[sid]) {
      const sk = SKILLS[sid];
      slotsHtml += `<div class="allocate-slot filled"><div class="as-name">${sk.name}</div><div class="as-info"><span class="type-tag type-${sk.type}" style="font-size:10px;padding:0 4px;">${sk.type}</span> ${sk.category} 威力${sk.power > 0 ? sk.power : '-'}</div></div>`;
    } else slotsHtml += `<div class="allocate-slot"><div class="as-empty">空技能槽</div></div>`;
  }
  slotsHtml += '</div>';

  const learned = ch.skillPool.filter(sid => ch.learnedSkills.includes(sid));
  const unlearned = ch.skillPool.filter(sid => !ch.learnedSkills.includes(sid));
  
  let learnedHtml = '<div class="skill-group-title">已学会（可装备）</div><div class="skill-list-grid">';
  learned.forEach(sid => {
    const sk = SKILLS[sid];
    const selected = state.tempAllocatedSkills.includes(sid);
    learnedHtml += `<div class="skill-item tooltip-target ${selected ? 'selected' : ''}" data-tip="${sk.desc}" data-sid="${sid}">
      <div class="si-name"><span>${sk.name}</span> <span class="type-tag type-${sk.type}" style="font-size:10px;padding:0 4px;">${sk.type}</span></div>
      <div class="si-info"><div>${sk.category} · 威力${sk.power > 0 ? sk.power : '-'}</div><div>PP ${sk.maxPp}</div></div>
    </div>`;
  });
  learnedHtml += '</div>';

  let unlearnedHtml = '<div class="skill-group-title">未解锁</div><div class="skill-list-grid">';
  unlearned.forEach(sid => {
    const sk = SKILLS[sid];
    unlearnedHtml += `<div class="skill-item locked tooltip-target" data-tip="${sk.desc}">
      <div class="si-name"><span>${sk.name}</span> <span class="type-tag type-${sk.type}" style="font-size:10px;padding:0 4px;">${sk.type}</span></div>
      <div class="si-info"><div>${sk.category} · 威力${sk.power > 0 ? sk.power : '-'}</div><div style="color:#e8c86a">${sk.learnLv}级解锁</div></div>
    </div>`;
  });
  unlearnedHtml += '</div>';

  dom.skillAllocateBody.innerHTML = slotsHtml + learnedHtml + unlearnedHtml + `
    <div class="allocate-footer"><button class="btn-cancel" id="allocate-cancel">取消</button><button class="btn-save" id="allocate-save">保存修改</button></div>
  `;

  dom.skillAllocateBody.querySelectorAll('.skill-item:not(.locked)').forEach(el => {
    el.addEventListener('click', () => {
      const sid = el.dataset.sid;
      const idx = state.tempAllocatedSkills.indexOf(sid);
      if (idx > -1) {
        if (state.tempAllocatedSkills.length <= 1) { toast('至少需要装备1个技能'); return; }
        state.tempAllocatedSkills.splice(idx, 1);
      } else {
        if (state.tempAllocatedSkills.length >= 4) { toast('最多装备4个技能'); return; }
        state.tempAllocatedSkills.push(sid);
      }
      renderSkillAllocate();
    });
  });
  document.getElementById('allocate-cancel').onclick = () => { closePanel(dom.skillAllocatePanel); };
  document.getElementById('allocate-save').onclick = () => {
    if (state.tempAllocatedSkills.length === 0) { toast('至少需要装备1个技能'); return; }
    ch.equippedSkills = [...state.tempAllocatedSkills];
    save(); renderCharPanel(); closePanel(dom.skillAllocatePanel); toast('技能配置已保存');
  };
  bindTooltips(dom.skillAllocateBody);
}

export function openExpAllocate() {
  state.selectedExpCharId = state.activeCharId;
  document.getElementById('tab-eat-exp').classList.add('active');
  document.getElementById('tab-eat-item').classList.remove('active');
  document.getElementById('exp-eat-view').style.display = 'block';
  document.getElementById('exp-item-view').style.display = 'none';
  renderExpAllocateView();
  openPanel(dom.expAllocatePanel);
}

export function renderExpAllocateView() {
  const ch = getCharacterById(state.selectedExpCharId); if (!ch) return;
  const currentNeed = expNeeded(ch.level);
  const nextNeed = expNeeded(ch.level) - ch.exp;
  document.getElementById('exp-lv-text').textContent = `Lv.${ch.level}`;
  document.getElementById('exp-cur-text').textContent = `${ch.exp}/${currentNeed}`;
  document.getElementById('exp-need-text').textContent = nextNeed > 0 ? nextNeed : 0;
  document.getElementById('exp-bar-fill').style.width = (ch.level >= 100 ? 100 : (ch.exp / currentNeed * 100)) + '%';
  document.getElementById('exp-pool-text').textContent = state.expPool;
  document.getElementById('exp-alloc-input').value = 0;
}

export function renderExpItemsList() {
  dom.expItemList.innerHTML = '';
  const expItems = Object.keys(state.inventory).filter(id => {
    const it = ITEMS[id];
    return it && state.inventory[id] > 0 && (it.exp || it.expPoolSmall || it.expPoolMid || it.expPoolLarge);
  });
  if (expItems.length === 0) dom.expItemList.innerHTML = '<div class="empty-hint">背包中没有经验道具。</div>';
  else {
    expItems.forEach(id => {
      const item = ITEMS[id];
      dom.expItemList.innerHTML += `<div class="exp-item-row" data-id="${id}" style="background:rgba(255,255,255,.1);padding:10px;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;">
          <span class="ei-emoji" style="font-size:24px;">${item.emoji}</span>
          <div class="ei-info" style="flex:1;"><div class="ei-name" style="font-size:14px;color:#fff;">${item.name} <span style="color:#8ab88a">×${state.inventory[id]}</span></div><div class="ei-desc" style="font-size:12px;color:#aaa;">${item.desc}</div></div>
        </div>`;
    });
    dom.expItemList.querySelectorAll('.exp-item-row').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id, item = ITEMS[id];
        import('./ui.js').then(m => m.openTradePanel({
          title: '使用确认', emoji: item.emoji, name: item.name, price: 0, currency: 'item', max: state.inventory[id],
          callback: (qty) => {
            for (let i = 0; i < qty; i++) {
              let addE = 0;
              if (item.exp) addE = item.exp;
              if (item.expPoolSmall) { let ratio = Math.min(1, Math.max(0, (getActiveChar().level - 1) / 99)); addE = Math.floor(10000 + 90000 * ratio); }
              if (item.expPoolMid) { let ratio = Math.min(1, Math.max(0, (getActiveChar().level - 1) / 99)); addE = Math.floor(50000 + 150000 * ratio); }
              if (item.expPoolLarge) { let ratio = Math.min(1, Math.max(0, (getActiveChar().level - 1) / 99)); addE = Math.floor(150000 + 200000 * ratio); }
              state.expPool += addE;
            }
            state.inventory[id] -= qty;
            if (state.inventory[id] <= 0) delete state.inventory[id];
            save(); renderStatus(); toast(`成功使用 ${item.name}，获得 ${qty} 份经验并存入经验池`);
            renderExpItemsList(); import('./bag.js').then(m => m.renderInventory());
          }
        }));
      };
    });
  }
}

export function initCharPanelEvents() {
  document.getElementById('tab-eat-exp').onclick = function () {
    this.classList.add('active'); document.getElementById('tab-eat-item').classList.remove('active');
    document.getElementById('exp-eat-view').style.display = 'block'; document.getElementById('exp-item-view').style.display = 'none'; renderExpAllocateView();
  };
  document.getElementById('tab-eat-item').onclick = function () {
    this.classList.add('active'); document.getElementById('tab-eat-exp').classList.remove('active');
    document.getElementById('exp-eat-view').style.display = 'none'; document.getElementById('exp-item-view').style.display = 'block'; renderExpItemsList();
  };
  document.getElementById('close-exp-allocate').onclick = () => closePanel(dom.expAllocatePanel);
  document.getElementById('btn-exp-minus').onclick = () => { const input = document.getElementById('exp-alloc-input'); let v = parseInt(input.value) || 0; if (v > 0) input.value = Math.max(0, v - 1000); };
  document.getElementById('btn-exp-plus').onclick = () => { const input = document.getElementById('exp-alloc-input'); let v = parseInt(input.value) || 0; input.value = Math.min(state.expPool, v + 1000); };
  document.getElementById('exp-alloc-input').onchange = (e) => { let v = parseInt(e.target.value) || 0; if (v < 0) v = 0; if (v > state.expPool) v = state.expPool; e.target.value = v; };
  document.getElementById('btn-exp-confirm').onclick = () => {
    const v = parseInt(document.getElementById('exp-alloc-input').value) || 0;
    if (v <= 0) { toast('请输入大于0的经验值'); return; }
    if (v > state.expPool) { toast('经验池经验不足'); return; }
    const ch = getCharacterById(state.selectedExpCharId);
    if (!ch || ch.level >= 100) { toast('角色已满级或无效'); return; }
    state.expPool -= v; addExp(ch, v); save(); renderStatus(); renderExpAllocateView();
    if (dom.charPanel.classList.contains('open')) renderCharPanel(); toast(`分配成功！角色获得 ${v} 点经验`);
  };
  document.querySelectorAll('.exp-quick-btn').forEach(btn => {
    btn.onclick = () => {
      const ch = getCharacterById(state.selectedExpCharId);
      if (!ch || ch.level >= 100) { toast('角色已满级或无效'); return; }
      const action = btn.dataset.action; let cost = 0;
      if (action === '1') cost = expNeeded(ch.level) - ch.exp;
      else if (action === '10') { let targetLv = Math.min(100, ch.level + 10); let c = expNeeded(ch.level) - ch.exp; for (let lv = ch.level + 1; lv < targetLv; lv++) c += expNeeded(lv); cost = c; }
      else if (action === 'max') { cost = expNeeded(ch.level) - ch.exp; for (let lv = ch.level + 1; lv < 100; lv++) cost += expNeeded(lv); }
      if (cost > state.expPool) { toast(`经验池不足！需要 ${cost}，当前仅有 ${state.expPool}`); return; }
      state.expPool -= cost; addExp(ch, cost); save(); renderStatus(); renderExpAllocateView();
      if (dom.charPanel.classList.contains('open')) renderCharPanel(); toast(`分配成功！角色获得 ${cost} 点经验`);
    };
  });
}