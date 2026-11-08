// js/character.js
import { state, MAX_LEVEL } from './state.js';
import { CHARACTER_TEMPLATES, SKILLS, ITEMS, NATURES, NATURE_KEYS } from './data.js';
import { toast } from './ui.js';

export function updateLearnedSkills(ch) {
  ch.skillPool.forEach(sid => {
    const sk = SKILLS[sid];
    if (sk && ch.level >= sk.learnLv) {
      if (!ch.learnedSkills.includes(sid)) ch.learnedSkills.push(sid);
      if (!ch.skillPp[sid]) ch.skillPp[sid] = { current: sk.maxPp, max: sk.maxPp };
    }
  });
}

export function createCharacter(tid) {
  const t = CHARACTER_TEMPLATES[tid]; if (!t) return null;
  const ch = {
    id: t.id, name: t.name, emoji: t.emoji, type: t.type || '普通系', gender: t.gender, height: t.height, weight: t.weight, intro: t.intro,
    nature: NATURE_KEYS[Math.floor(Math.random() * NATURE_KEYS.length)],
    level: 1, exp: 0, hp: t.baseHp, stamina: t.baseStamina, baseHp: t.baseHp, baseStamina: t.baseStamina,
    baseStats: { ...t.baseStats }, equip: { head: null, chest: null, feet: null, left: null, right: null, two: null },
    learnedSkills: [], equippedSkills: [], skillPp: {}, skillPool: t.skillPool || [],
    evs: { atk: 0, matk: 0, pdef: 0, mdef: 0, hp: 0, spd: 0 }
  };
  updateLearnedSkills(ch);
  ch.equippedSkills = ch.learnedSkills.slice(0, 4);
  return ch;
}

export function initCharacters() {
  state.partyCharacters.tiantian = createCharacter('tiantian');
  state.partyCharacters.lele = createCharacter('lele');
  state.partyCharacters.lili = createCharacter('lili');
  state.party = ['tiantian', 'lele', 'lili'];
  state.activeCharId = 'tiantian';
  state.selectedCharId = 'tiantian';
}

export function getCharacterById(id) { return state.partyCharacters[id] || state.warehouseCharacters[id] || null; }

// 核心兜底保护
export function getActiveChar() { 
  let ch = state.partyCharacters[state.activeCharId]; 
  if (!ch) {
    if (state.party.length > 0) ch = state.partyCharacters[state.party[0]];
    if (!ch) ch = Object.values(state.partyCharacters)[0];
  }
  if (!ch) {
    ch = createCharacter('tiantian');
    state.partyCharacters[ch.id] = ch;
    state.activeCharId = ch.id;
    state.party = [ch.id];
  }
  return ch; 
}

export function getSelectedChar() { 
  let ch = state.currentCharTab === 'party' ? state.partyCharacters[state.selectedCharId] : state.warehouseCharacters[state.selectedCharId];
  if (!ch) {
    // 仓库找不到就返回首选，防止报错
    ch = getActiveChar();
  }
  return ch;
}

export function expNeeded(level) {
  if (level >= MAX_LEVEL) return 0;
  return Math.floor(level * level * 15 + level * 200);
}

export function addExp(ch, amount) {
  if (ch.level >= MAX_LEVEL) return;
  const oldLevel = ch.level;
  ch.exp += amount;
  while (ch.level < MAX_LEVEL) {
    const need = expNeeded(ch.level);
    if (ch.exp >= need) { ch.exp -= need; ch.level++; updateLearnedSkills(ch); }
    else break;
  }
  if (ch.level > oldLevel) {
    const s = getCharStats(ch);
    ch.hp = s.maxHp;
    ch.learnedSkills.forEach(sid => { if (ch.skillPp[sid]) ch.skillPp[sid].current = ch.skillPp[sid].max; });
    toast(`升级了！当前等级 Lv.${ch.level}`);
  }
}

export function getCharStats(ch) {
  if(!ch) return { atk:0,matk:0,pdef:0,mdef:0,spd:0,crit:0,critDmg:0,pierce:0,mpierce:0,maxHp:1 };
  const lv = ch.level, base = ch.baseStats;
  const eq = { atk: 0, matk: 0, pdef: 0, mdef: 0, hp: 0, crit: 0, critDmg: 0, spd: 0, pierce: 0, mpierce: 0 };
  Object.values(ch.equip).forEach(id => {
    if (!id) return; const it = ITEMS[id]; if (!it) return;
    eq.atk += it.atk || 0; eq.matk += it.matk || 0; eq.pdef += it.pdef || 0; eq.mdef += it.mdef || 0; eq.hp += it.hp || 0;
    eq.crit += it.crit || 0; eq.critDmg += it.critDmg || 0; eq.spd += it.spd || 0; eq.pierce += it.pierce || 0; eq.mpierce += it.mpierce || 0;
  });
  const evs = ch.evs || { atk: 0, matk: 0, pdef: 0, mdef: 0, hp: 0, spd: 0 };
  let atk = base.atk + Math.floor(lv / 2) + eq.atk + Math.floor(evs.atk / 4);
  let matk = base.matk + Math.floor(lv / 2) + eq.matk + Math.floor(evs.matk / 4);
  let pdef = base.pdef + Math.floor(lv / 3) + eq.pdef + Math.floor(evs.pdef / 4);
  let mdef = base.mdef + Math.floor(lv / 3) + eq.mdef + Math.floor(evs.mdef / 4);
  let spd = base.spd + Math.floor(lv / 5) + eq.spd + Math.floor(evs.spd / 4);
  const nat = NATURES[ch.nature] || { up: null, down: null };
  if (nat.up === 'atk') atk = Math.floor(atk * 1.1); if (nat.down === 'atk') atk = Math.floor(atk * 0.9);
  if (nat.up === 'matk') matk = Math.floor(matk * 1.1); if (nat.down === 'matk') matk = Math.floor(matk * 0.9);
  if (nat.up === 'pdef') pdef = Math.floor(pdef * 1.1); if (nat.down === 'pdef') pdef = Math.floor(pdef * 0.9);
  if (nat.up === 'mdef') mdef = Math.floor(mdef * 1.1); if (nat.down === 'mdef') mdef = Math.floor(mdef * 0.9);
  if (nat.up === 'spd') spd = Math.floor(spd * 1.1); if (nat.down === 'spd') spd = Math.floor(spd * 0.9);
  return { atk, matk, pdef, mdef, spd, crit: base.crit + eq.crit, critDmg: Math.min(300, base.critDmg + eq.critDmg), pierce: eq.pierce, mpierce: eq.mpierce, maxHp: ch.baseHp + lv * 10 + eq.hp + evs.hp };
}