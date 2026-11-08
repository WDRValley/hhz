// js/inventory.js
import { state, MAX_STAMINA, MAX_LEVEL } from './state.js';
import { ITEMS, SKILLS, NATURE_KEYS, STAT_NAMES, QUALITY } from './data.js';
import { getActiveChar, getCharStats, addExp, updateLearnedSkills } from './character.js';
import { toast, dom, openTradePanel, renderStatus } from './ui.js';
import { save } from './persistence.js';

export function useItem(id, qty = 1) {
  const item = ITEMS[id]; if (!item) return;
  const ch = getActiveChar(), s = getCharStats(ch); let msg = [];
  let actualQtyUsed = 0;
  for (let i = 0; i < qty; i++) {
    let canUseThisOne = true;
    if (item.addLevel) {
      if (ch.level >= 100) { toast('已经满级了'); canUseThisOne = false; }
      else {
        ch.level++; updateLearnedSkills(ch);
        const st = getCharStats(ch); ch.hp = st.maxHp;
        ch.learnedSkills.forEach(sid => { if (ch.skillPp[sid]) ch.skillPp[sid].current = ch.skillPp[sid].max; });
        if (msg.indexOf(`等级提升`) < 0) msg.push(`等级提升至 ${ch.level}`);
      }
    }
    if (item.levelMax) {
      if (ch.level >= 100) { toast('已经满级了'); canUseThisOne = false; }
      else {
        ch.level = 100; ch.exp = 0; updateLearnedSkills(ch);
        const st = getCharStats(ch); ch.hp = st.maxHp;
        ch.learnedSkills.forEach(sid => { if (ch.skillPp[sid]) ch.skillPp[sid].current = ch.skillPp[sid].max; });
        if (msg.indexOf(`等级提升`) < 0) msg.push(`等级提升至 100`);
      }
    }
    if (item.evStat) {
      const currentTotal = Object.values(ch.evs).reduce((a, b) => a + b, 0);
      if (ch.evs[item.evStat] >= 256) { toast(`${STAT_NAMES[item.evStat]}学习力已满`); canUseThisOne = false; }
      else if (currentTotal >= 512) { toast(`总学习力已达上限`); canUseThisOne = false; }
      else {
        let actualAdd = Math.min(item.evVal, 256 - ch.evs[item.evStat], 512 - currentTotal);
        if (actualAdd < item.evVal) toast(`溢出警告：浪费了 ${item.evVal - actualAdd} 点学习力！`);
        ch.evs[item.evStat] += actualAdd;
        if (msg.indexOf(`${STAT_NAMES[item.evStat]}学习力`) < 0) msg.push(`${STAT_NAMES[item.evStat]}学习力 +${actualAdd}`);
      }
    }
    if (item.expPoolSmall || item.expPoolMid || item.expPoolLarge) {
      let minE = 0, maxE = 0;
      if (item.expPoolSmall) { minE = 10000; maxE = 100000; }
      if (item.expPoolMid) { minE = 50000; maxE = 200000; }
      if (item.expPoolLarge) { minE = 150000; maxE = 350000; }
      let ratio = Math.min(1, Math.max(0, (ch.level - 1) / 99));
      let addE = Math.floor(minE + (maxE - minE) * ratio);
      state.expPool += addE;
      if (msg.indexOf(`经验池`) < 0) msg.push(`获得 ${addE} 点全局经验（存入经验池）`);
    }
    if (item.exp && !item.expPoolSmall && !item.expPoolMid && !item.expPoolLarge) {
      if (ch.level >= MAX_LEVEL) { toast('已经满级了'); canUseThisOne = false; }
      else { addExp(ch, item.exp); if (msg.indexOf(`经验+${item.exp}`) === -1) msg.push(`经验+${item.exp}`); }
    }
    if (item.forget) { ch.level = 1; ch.exp = 0; ch.hp = ch.baseHp; ch.stamina = ch.baseStamina; ch.learnedSkills.forEach(sid => { if (SKILLS[sid]) ch.skillPp[sid] = { current: SKILLS[sid].maxPp, max: SKILLS[sid].maxPp }; }); if (!msg.includes('等级归1')) msg.push('等级归1'); }
    if (item.forgetEv) { const total = Object.values(ch.evs).reduce((a, b) => a + b, 0); ch.evs = { atk: 0, matk: 0, pdef: 0, mdef: 0, hp: 0, spd: 0 }; msg.push(`重置了 ${total} 点学习力`); }
    if (item.natureChange) { ch.nature = NATURE_KEYS[Math.floor(Math.random() * NATURE_KEYS.length)]; msg.push(`性格改变为 ${ch.nature}`); }
    if (item.pp) {
      let restored = 0;
      ch.learnedSkills.forEach(sid => {
        const sk = SKILLS[sid]; if (!sk) return;
        if (!ch.skillPp[sid]) ch.skillPp[sid] = { current: 0, max: sk.maxPp };
        if (ch.skillPp[sid].current < ch.skillPp[sid].max) { ch.skillPp[sid].current = Math.min(ch.skillPp[sid].max, ch.skillPp[sid].current + item.pp); restored++; }
      });
      if (restored > 0) msg.push(`技能PP+${item.pp}`);
    }
    if (item.stamina) { const before = ch.stamina; ch.stamina = Math.min(MAX_STAMINA, ch.stamina + item.stamina); if (ch.stamina > before) msg.push(`体力+${ch.stamina - before}`); }
    if (item.heal || item.healPercent) { let amt = 0; if (item.heal) amt = item.heal; if (item.healPercent) amt = Math.max(amt, Math.floor(s.maxHp * item.healPercent)); const before = ch.hp; ch.hp = Math.min(s.maxHp, ch.hp + amt); if (ch.hp > before) msg.push(`生命+${ch.hp - before}`); }
    if (!canUseThisOne) break;
    actualQtyUsed++;
  }
  if (actualQtyUsed > 0) {
    state.inventory[id] -= actualQtyUsed; if (state.inventory[id] <= 0) delete state.inventory[id];
    save(); renderStatus();
    if (dom.charPanel.classList.contains('open')) import('./char-panel.js').then(m => m.renderCharPanel());
    if (msg.length > 0) toast(`使用 ${item.name}：${msg.join('，')}`);
  }
}

export function findEquipSlot(ch, id) { for (const k in ch.equip) if (ch.equip[k] === id) return k; return null; }
export function equipItemToChar(ch, id) {
  const item = ITEMS[id]; if (!item) return false; if ((state.inventory[id] || 0) <= 0) return false;
  if (item.slot === 'hand') {
    const h = item.handType;
    if (h === 'two') { const had = ch.equip.left || ch.equip.right; ch.equip.left = null; ch.equip.right = null; ch.equip.two = id; if (had) toast('双手武器占据双手，左右手已卸下'); }
    else if (h === 'left') { if (ch.equip.two) { toast('已装备双手武器，请先卸下'); return false; } ch.equip.left = id; }
    else { if (ch.equip.two) { toast('已装备双手武器，请先卸下'); return false; } ch.equip.right = id; }
  } else if (item.slot in ch.equip) ch.equip[item.slot] = id; else return false;
  return true;
}
export function toggleEquipForActive(id) {
  const ch = getActiveChar(); const cur = findEquipSlot(ch, id);
  if (cur) { ch.equip[cur] = null; afterEquipChange(ch); import('./bag.js').then(m => m.showDetail(id)); return; }
  if (equipItemToChar(ch, id)) { afterEquipChange(ch); import('./bag.js').then(m => m.showDetail(id)); }
}
export function afterEquipChange(ch) {
  const s = getCharStats(ch); if (ch.hp > s.maxHp) ch.hp = s.maxHp; if (ch.hp < 0) ch.hp = 0;
  if (ch.stamina > MAX_STAMINA) ch.stamina = MAX_STAMINA;
  if (ch.id === state.activeCharId) renderStatus();
  save();
}
export function sellItem(id, qty) {
  const have = state.inventory[id] || 0, n = Math.min(qty, have); if (n <= 0) return;
  const income = ITEMS[id].price * n; state.inventory[id] -= n;
  if (state.inventory[id] <= 0) { delete state.inventory[id]; for (const cid in state.partyCharacters) { const ch = state.partyCharacters[cid]; for (const k in ch.equip) if (ch.equip[k] === id) ch.equip[k] = null; } }
  state.gold += income;
  for (const cid in state.partyCharacters) { const ch = state.partyCharacters[cid], s = getCharStats(ch); if (ch.hp > s.maxHp) ch.hp = s.maxHp; }
  save(); renderStatus(); import('./bag.js').then(m => m.renderInventory());
  if (state.inventory[id] > 0) import('./bag.js').then(m => m.showDetail(id));
  else import('./ui.js').then(m => m.closePanel(dom.detailEl));
}