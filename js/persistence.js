// js/persistence.js
import { state, SAVE_KEY, RESET_KEY, WEEK_RESET_KEY, BOSS_RESET_KEY, MAX_PARTY, MAX_LEVEL, MAX_STAMINA } from './state.js';
import { SHOP, ITEMS, SKILLS, MAPS, NATURES } from './data.js';
import { createCharacter, updateLearnedSkills, getCharStats, initCharacters } from './character.js';

export function initStock() {
  state.shopStock = {}; state.shopBuyCount = {};
  SHOP.sections.forEach(s => s.goods.forEach(g => { state.shopStock[g.id] = g.stock; state.shopBuyCount[g.id] = 0; }));
}
export function todayStr() { return new Date().toDateString(); }
export function getWeekStr() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); return d.getTime().toString(); }

export function ensureStockFresh() {
  const last = localStorage.getItem(RESET_KEY);
  if (last !== todayStr()) {
    initStock();
    state.bossDailyCount = { s1: 0, s2: 0, s3: 0 };
    state.dailyGathers = {}; // 清空采集记录
    state.onlineData = { date: todayStr(), time: 0, claimed: [false, false, false, false, false, false], fortuneCount: 0 };
    localStorage.setItem(RESET_KEY, todayStr());
    localStorage.setItem(WEEK_RESET_KEY, getWeekStr());
    localStorage.setItem(BOSS_RESET_KEY, todayStr());
    save();
  } else {
    const lastWeek = localStorage.getItem(WEEK_RESET_KEY);
    if (lastWeek !== getWeekStr()) {
      SHOP.sections.forEach(s => s.goods.forEach(g => { if (g.weeklyLimit) state.shopBuyCount[g.id] = 0; }));
      localStorage.setItem(WEEK_RESET_KEY, getWeekStr()); save();
    }
    const lastBossDay = localStorage.getItem(BOSS_RESET_KEY);
    if (lastBossDay !== todayStr()) {
      state.bossDailyCount = { s1: 0, s2: 0, s3: 0 };
      localStorage.setItem(BOSS_RESET_KEY, todayStr()); save();
    }
  }
}

export function serializeChar(ch) {
  return { level: ch.level, nature: ch.nature, exp: ch.exp, hp: ch.hp, stamina: ch.stamina, equip: ch.equip, learnedSkills: ch.learnedSkills, equippedSkills: ch.equippedSkills, skillPp: ch.skillPp, evs: ch.evs };
}

export function applyCharData(ch, cd) {
  if (typeof cd.level === 'number') ch.level = Math.min(MAX_LEVEL, Math.max(1, cd.level));
  if (cd.nature && NATURES[cd.nature]) ch.nature = cd.nature;
  if (typeof cd.exp === 'number') ch.exp = cd.exp;
  if (typeof cd.hp === 'number') ch.hp = cd.hp;
  if (typeof cd.stamina === 'number') ch.stamina = cd.stamina;
  if (cd.equip) ['head', 'chest', 'feet', 'left', 'right', 'two'].forEach(k => { if (cd.equip[k] && ITEMS[cd.equip[k]]) ch.equip[k] = cd.equip[k]; });
  if (Array.isArray(cd.learnedSkills)) ch.learnedSkills = cd.learnedSkills.filter(sid => SKILLS[sid]);
  if (Array.isArray(cd.equippedSkills)) ch.equippedSkills = cd.equippedSkills.filter(sid => SKILLS[sid]).slice(0, 4);
  if (cd.skillPp) { for (const sid in cd.skillPp) { if (SKILLS[sid]) ch.skillPp[sid] = { current: cd.skillPp[sid].current, max: cd.skillPp[sid].max }; } }
  if (cd.evs) ch.evs = { ...ch.evs, ...cd.evs };
  updateLearnedSkills(ch);
  if (ch.equippedSkills.length === 0 && ch.learnedSkills.length > 0) ch.equippedSkills = ch.learnedSkills.slice(0, 4);
}

export function save() {
  const pd = {}; for (const id in state.partyCharacters) pd[id] = serializeChar(state.partyCharacters[id]);
  const wd = {}; for (const id in state.warehouseCharacters) wd[id] = serializeChar(state.warehouseCharacters[id]);
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    gold: state.gold, tickets: state.tickets, expPool: state.expPool,
    inventory: state.inventory, shopStock: state.shopStock, shopBuyCount: state.shopBuyCount,
    activeCharId: state.activeCharId, selectedCharId: state.selectedCharId,
    currentContinentId: state.currentContinentId, currentRegionId: state.currentRegionId,
    currentSubMapId: state.currentSubMapId,   // ← 新增
    tasks: state.tasks,
    dailyGathers: state.dailyGathers,
    incubator: state.incubator,
    onlineData: state.onlineData,
    party: state.party, partyCharacters: pd, warehouseCharacters: wd,
    altarState: state.altarState, bossClear: state.bossClear, bossDailyCount: state.bossDailyCount
  }));
}

export function load() {
  initStock();
  initCharacters(); // 改成同步执行，保证UI渲染前角色已存在

  const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem('gather_save_v16') || localStorage.getItem('gather_save_v15') || localStorage.getItem('gather_save_v14');
  if (raw) {
    try {
      const d = JSON.parse(raw);
      if (typeof d.gold === 'number') state.gold = d.gold;
      if (typeof d.tickets === 'number') state.tickets = d.tickets;
      if (typeof d.expPool === 'number') state.expPool = d.expPool;
      if (d.inventory) Object.assign(state.inventory, d.inventory);
      if (d.shopStock) Object.keys(d.shopStock).forEach(k => { if (k in state.shopStock) state.shopStock[k] = d.shopStock[k]; });
      if (d.shopBuyCount) Object.keys(d.shopBuyCount).forEach(k => { if (k in state.shopBuyCount) state.shopBuyCount[k] = d.shopBuyCount[k]; });
      if (typeof d.altarState === 'boolean') state.altarState = d.altarState;
      if (typeof d.bossClear === 'number') state.bossClear = d.bossClear;
      if (d.bossDailyCount) state.bossDailyCount = d.bossDailyCount;
      if (d.tasks) state.tasks = d.tasks;
      if (d.dailyGathers) state.dailyGathers = d.dailyGathers;
      if (d.incubator) state.incubator = d.incubator;
      if (d.onlineData) state.onlineData = d.onlineData;

      if (d.characters && !d.partyCharacters) {
        const oldIds = Object.keys(d.characters);
        state.party = oldIds.slice(0, MAX_PARTY);
        state.party.forEach(id => { if (d.characters[id]) { const ch = createCharacter(id) || createCharacter('tiantian'); applyCharData(ch, d.characters[id]); state.partyCharacters[id] = ch; } });
        oldIds.slice(MAX_PARTY).forEach(id => { if (d.characters[id]) { const ch = createCharacter(id) || createCharacter('tiantian'); applyCharData(ch, d.characters[id]); state.warehouseCharacters[id] = ch; } });
      } else {
        if (Array.isArray(d.party)) state.party = d.party.filter(id => d.partyCharacters?.[id]);
        if (d.partyCharacters) { for (const id in d.partyCharacters) { const ch = createCharacter(id); if (ch) { applyCharData(ch, d.partyCharacters[id]); state.partyCharacters[id] = ch; } } }
        if (d.warehouseCharacters) { for (const id in d.warehouseCharacters) { const ch = createCharacter(id); if (ch) { applyCharData(ch, d.warehouseCharacters[id]); state.warehouseCharacters[id] = ch; } } }
      }
      if (d.activeCharId && state.partyCharacters[d.activeCharId]) state.activeCharId = d.activeCharId;
      if (d.selectedCharId) state.selectedCharId = d.selectedCharId;
      if (d.currentContinentId && MAPS[d.currentContinentId]) state.currentContinentId = d.currentContinentId;
      if (d.currentRegionId && MAPS[state.currentContinentId].regions[d.currentRegionId]) state.currentRegionId = d.currentRegionId;

      // 新增：子地图恢复（校验是否属于当前区域，否则回落到第一个）
      if (d.currentSubMapId) {
        const reg = MAPS[state.currentContinentId]?.regions?.[state.currentRegionId];
        if (reg?.subMaps?.[d.currentSubMapId]) state.currentSubMapId = d.currentSubMapId;
        else if (reg?.subMaps) state.currentSubMapId = Object.keys(reg.subMaps)[0];
      }
    } catch (e) { console.error('存档加载失败', e); }
  }
  ensureStockFresh();
  const allChars = { ...state.partyCharacters, ...state.warehouseCharacters };
  for (const id in allChars) {
    const ch = allChars[id], s = getCharStats(ch);
    if (ch.hp > s.maxHp) ch.hp = s.maxHp; if (ch.hp < 0) ch.hp = 0;
    if (ch.stamina > MAX_STAMINA) ch.stamina = MAX_STAMINA; if (ch.stamina < 0) ch.stamina = 0;
  }
}