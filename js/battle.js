// js/battle.js
import { state, MAX_STAMINA } from './state.js';
import { ITEMS, SKILLS, MONSTERS, TYPE_CHART, CHARACTER_TEMPLATES } from './data.js';
import { getActiveChar, getCharStats, addExp, createCharacter, updateLearnedSkills, getCharacterById } from './character.js';
import { dom, toast, bindTooltips, renderStatus } from './ui.js';
import { save } from './persistence.js';

export function addBattleLog(text, type = 'system') {
  if (!state.battle) return;
  state.battle.log.push({ text, type });
  if (state.battle.log.length > 60) state.battle.log.shift();
}

export function getStatLevelText(lvObj) {
  let arr = [];
  const names = { atk: '物攻', matk: '魔攻', pdef: '物防', mdef: '魔防', hit: '命中', dodge: '闪避', spd: '速度', crit: '暴击' };
  for (let k in lvObj) {
    if (lvObj[k] > 0) arr.push(`<span class="stat-up">${names[k]}+${lvObj[k]}</span>`);
    if (lvObj[k] < 0) arr.push(`<span class="stat-down">${names[k]}${lvObj[k]}</span>`);
  }
  return arr.length ? arr.join(' ') : '<span class="stat-none">无状态变化</span>';
}

export function renderBattle() {
  if (!state.battle) return;
  const hero = state.partyCharacters[state.battle.heroId];
  const hs = getCharStats(hero);
  const e = state.battle.enemy;
  
  dom.battleTurnIndicator.textContent = `第 ${state.battle.turn} 回合 · 你的回合`;
  let enemyStatus = e.hasVineArmor > 0 ? `<span style="color:#7fc47f;font-size:10px;margin-left:10px;">[滕之铠 ${e.hasVineArmor}回合]</span>` : '';
  let heroStatus = state.battle.heroVineArmor > 0 ? `<span style="color:#7fc47f;font-size:10px;margin-left:10px;">[滕之铠 ${state.battle.heroVineArmor}回合]</span>` : '';

  dom.battleTop.innerHTML = `
    <div class="battle-side">
      <h3>${hero.emoji} ${hero.name} ${heroStatus} <span class="type-tag type-${hero.type}" style="font-size:10px;">${hero.type}</span></h3>
      <div class="bs-lv">Lv.${hero.level}　速度 ${hs.spd}</div>
      <div class="battle-hp"><div class="battle-hp-fill" style="width:${Math.max(0, Math.min(100, state.battle.heroHp / hs.maxHp * 100))}%"></div></div>
      <div class="battle-hp-text">${Math.max(0, Math.ceil(state.battle.heroHp))}/${hs.maxHp}</div>
      <div class="battle-stats">${getStatLevelText(state.battle.heroStatLevels)}</div>
    </div>
    <div class="battle-side">
      <h3>${e.emoji} ${e.name} ${enemyStatus} <span class="type-tag type-${e.type}" style="font-size:10px;">${e.type}</span></h3>
      <div class="bs-lv">Lv.${e.lv}　速度 ${e.stats.spd}</div>
      <div class="battle-hp"><div class="battle-hp-fill" style="width:${Math.max(0, Math.min(100, e.hp / e.stats.maxHp * 100))}%"></div></div>
      <div class="battle-hp-text">${Math.max(0, Math.ceil(e.hp))}/${e.stats.maxHp}</div>
      <div class="battle-stats">${getStatLevelText(e.statLevels)}</div>
    </div>`;
  dom.battleLog.innerHTML = state.battle.log.map(l => `<div class="log-line ${l.type}">${l.text}</div>`).join('');
  dom.battleLog.scrollTop = dom.battleLog.scrollHeight;
  renderBattleActions();
}

export function renderBattleActions() {
  if (!state.battle) { dom.battleActions.innerHTML = ''; dom.battleSubmenu.classList.remove('open'); return; }
  if (state.battle.battleOver) {
    if (!document.getElementById('end-battle-btn')) { dom.battleActions.innerHTML = ''; dom.battleSubmenu.classList.remove('open'); }
    return;
  }
  if (state.battle.waiting) { dom.battleActions.innerHTML = '<button disabled>结算中…</button>'; return; }
  
  const isCatchable = MONSTERS[state.battle.enemy.id] && MONSTERS[state.battle.enemy.id].catchRate && !state.battle.isBossBattle;
  dom.battleActions.innerHTML = `
    <button class="primary" data-act="skill">⚔️ 进攻</button>
    <button data-act="item">🧪 恢复</button>
    ${isCatchable ? '<button data-act="catch" style="background:#8a5a3a;border-color:#b97a4a">🔴 捕捉</button>' : ''}
    <button data-act="switch">🔄 切换角色</button>
    <button class="danger" data-act="flee">🏃 逃跑</button>`;
  dom.battleActions.querySelectorAll('button[data-act]').forEach(btn => {
    btn.onclick = () => {
      const act = btn.dataset.act;
      if (act === 'skill') showSkillMenu();
      else if (act === 'item') showItemMenu();
      else if (act === 'catch') showCatchMenu();
      else if (act === 'switch') showSwitchMenu();
      else if (act === 'flee') doFlee();
    };
  });
}

export function showSkillMenu() {
  if (!state.battle || state.battle.battleOver) return;
  const hero = state.partyCharacters[state.battle.heroId]; const sids = hero.equippedSkills;
  dom.battleSubmenu.classList.add('open');
  if (sids.length === 0) { dom.battleSubmenu.innerHTML = '<div class="empty-hint">没有装备技能。</div>'; return; }
  dom.battleSubmenu.innerHTML = '<div class="battle-skill-grid">' + sids.map(sid => {
    const sk = SKILLS[sid];
    if (!hero.skillPp[sid]) hero.skillPp[sid] = { current: sk.maxPp, max: sk.maxPp };
    const pp = hero.skillPp[sid];
    return `<div class="battle-skill tooltip-target" data-tip="${sk.desc}" data-skill="${sid}"><div style="display:flex;justify-content:space-between;align-items:center">${sk.name} <span class="type-tag type-${sk.type}" style="font-size:10px;padding:0 4px;">${sk.type}</span></div><div class="bsk-info">${sk.category} · 威力${sk.power > 0 ? sk.power : '-'} · PP ${pp.current}/${pp.max}</div></div>`;
  }).join('') + '</div>';
  dom.battleSubmenu.querySelectorAll('.battle-skill').forEach(el => {
    el.onclick = () => {
      const sid = el.dataset.skill; const pp = hero.skillPp[sid];
      if (!pp || pp.current <= 0) { toast('PP不足'); return; }
      state.battle.playerAction = { type: 'skill', skillId: sid };
      dom.battleSubmenu.classList.remove('open');
      executeTurn();
    };
  });
  bindTooltips(dom.battleSubmenu);
}

export function showItemMenu() {
  const usable = Object.keys(state.inventory).filter(id => {
    const it = ITEMS[id]; if (!it || state.inventory[id] <= 0) return false;
    if (['食物', '肉类', '蔬菜', '水果', '饮品'].includes(it.category)) return false;
    return (it.heal || it.healPercent || it.pp || it.kind === 'consume');
  });
  dom.battleSubmenu.classList.add('open');
  if (usable.length === 0) { dom.battleSubmenu.innerHTML = '<div class="empty-hint">没有可用的恢复道具。</div>'; return; }
  dom.battleSubmenu.innerHTML = '<div class="battle-item-list">' + usable.map(id => {
    const it = ITEMS[id]; return `<div class="battle-item" data-item="${id}"><span>${it.emoji} ${it.name}</span><span>×${state.inventory[id]}</span></div>`;
  }).join('') + '</div>';
  dom.battleSubmenu.querySelectorAll('.battle-item').forEach(el => {
    el.onclick = () => {
      state.battle.playerAction = { type: 'item', itemId: el.dataset.item };
      dom.battleSubmenu.classList.remove('open');
      executeTurn();
    };
  });
}

export function showCatchMenu() {
  const usable = Object.keys(state.inventory).filter(id => state.inventory[id] > 0 && ITEMS[id] && ITEMS[id].kind === 'ball');
  dom.battleSubmenu.classList.add('open');
  if (usable.length === 0) { dom.battleSubmenu.innerHTML = '<div class="empty-hint">没有捕捉球，去商店买点吧。</div>'; return; }
  dom.battleSubmenu.innerHTML = '<div class="battle-item-list">' + usable.map(id => {
    const it = ITEMS[id]; return `<div class="battle-item" data-item="${id}"><span>${it.emoji} ${it.name}</span><span>×${state.inventory[id]}</span></div>`;
  }).join('') + '</div>';
  dom.battleSubmenu.querySelectorAll('.battle-item').forEach(el => {
    el.onclick = () => {
      state.battle.playerAction = { type: 'catch', itemId: el.dataset.item };
      dom.battleSubmenu.classList.remove('open');
      executeTurn();
    };
  });
}

export function showSwitchMenu() {
  const ids = state.party.filter(id => id !== state.battle.heroId);
  dom.battleSubmenu.classList.add('open');
  if (ids.length === 0) { dom.battleSubmenu.innerHTML = '<div class="empty-hint">没有其他角色可切换。</div>'; return; }
  dom.battleSubmenu.innerHTML = '<div class="battle-switch-list">' + ids.map(id => {
    const ch = state.partyCharacters[id]; const s = getCharStats(ch);
    return `<div class="battle-switch" data-switch="${id}">${ch.emoji} ${ch.name} Lv.${ch.level} HP ${Math.ceil(ch.hp)}/${s.maxHp}</div>`;
  }).join('') + '</div>';
  dom.battleSubmenu.querySelectorAll('.battle-switch').forEach(el => {
    el.onclick = () => {
      state.battle.playerAction = { type: 'switch', charId: el.dataset.switch };
      dom.battleSubmenu.classList.remove('open');
      executeTurn();
    };
  });
}

export function doFlee() { state.battle.playerAction = { type: 'flee' }; executeTurn(); }
export function getEffectiveStat(base, lv) { return base * (1 + lv * 0.1); }
export function checkHit(skill, attackerStatLevels, defenderStatLevels) {
  if (skill.mustHit) return true;
  const hitLv = attackerStatLevels.hit || 0; const dodgeLv = defenderStatLevels.dodge || 0;
  let hitRate = 75 + (hitLv - dodgeLv) * 5; hitRate = Math.max(10, Math.min(100, hitRate));
  return Math.random() * 100 < hitRate;
}

export function calcDamage(attackerStats, skill, defenderStats, attackerStatLevels, defenderStatLevels, powerMultiplier = 1) {
  const isMagic = skill.category === '法术';
  const atkBase = isMagic ? attackerStats.matk : attackerStats.atk;
  const atkLv = isMagic ? (attackerStatLevels.matk || 0) : (attackerStatLevels.atk || 0);
  const atk = getEffectiveStat(atkBase, atkLv);
  const defBase = isMagic ? defenderStats.mdef : defenderStats.pdef;
  const defLv = isMagic ? (defenderStatLevels.mdef || 0) : (defenderStatLevels.pdef || 0);
  const def = getEffectiveStat(defBase, defLv);
  const pierce = isMagic ? (attackerStats.mpierce || 0) : (attackerStats.pierce || 0);
  const power = (skill.power || 50) * powerMultiplier;
  let base = Math.max(1, (atk * power / 100) - (def * 0.5 - pierce * 0.5));
  base = Math.max(1, Math.round(base * (0.9 + Math.random() * 0.2)));
  const critLv = attackerStatLevels.crit || 0; const critRate = (attackerStats.crit || 0) + critLv * 5;
  const isCrit = Math.random() * 100 < critRate; const critDmg = attackerStats.critDmg || 150;
  let typeMulti = 1; const skType = skill.type; const defType = defenderStats.type || '普通系';
  if (TYPE_CHART[skType]) {
    if (TYPE_CHART[skType].triple?.includes(defType)) typeMulti = 3;
    else if (TYPE_CHART[skType].double?.includes(defType)) typeMulti = 2;
    else if (TYPE_CHART[skType].half?.includes(defType)) typeMulti = 0.5;
  }
  let damage = isCrit ? Math.round(base * critDmg / 100) : base;
  damage = Math.round(damage * typeMulti);
  return { damage: Math.max(1, damage), crit: isCrit, typeMulti };
}

export function executeTurn() {
  if (!state.battle || state.battle.waiting || state.battle.battleOver) return;
  state.battle.waiting = true; renderBattleActions();
  const hero = state.partyCharacters[state.battle.heroId], hs = getCharStats(hero), e = state.battle.enemy;
  const action = state.battle.playerAction; state.battle.playerAction = null;
  let heroPriority = 0;
  if (action.type === 'switch') heroPriority = 3;
  else if (action.type === 'item' || action.type === 'catch') heroPriority = 2;
  else if (action.type === 'skill') { heroPriority = 1; const sk = SKILLS[action.skillId]; if (sk && sk.priority) heroPriority += sk.priority; }
  else if (action.type === 'flee') heroPriority = 1;
  
  const enemyPriority = 1;
  const heroSpd = getEffectiveStat(hs.spd, state.battle.heroStatLevels.spd || 0);
  const enemySpd = getEffectiveStat(e.stats.spd, e.statLevels.spd || 0);
  let heroFirst;
  if (heroPriority !== enemyPriority) heroFirst = heroPriority > enemyPriority;
  else heroFirst = heroSpd >= enemySpd;
  const order = heroFirst ? ['hero', 'enemy'] : ['enemy', 'hero'];
  state.battle.waiting = true; let idx = 0;
  
  function next() {
    if (!state.battle) return;
    if (state.battle.battleOver) { state.battle.waiting = false; renderBattle(); return; }
    if (idx >= order.length) {
      state.battle.turn++; state.battle.waiting = false;
      if (state.battle.enemy.hasVineArmor > 0) {
        state.battle.enemy.hasVineArmor--;
        if (state.battle.enemy.hasVineArmor === 0) addBattleLog(`🌿 ${state.battle.enemy.name} 的滕之铠效果结束。`, 'system');
      }
      if (state.battle.heroVineArmor > 0) {
        state.battle.heroVineArmor--;
        if (state.battle.heroVineArmor === 0) addBattleLog(`🌿 ${hero.name} 的滕之铠效果结束。`, 'system');
      }
      checkBattleEnd();
      if (!state.battle.battleOver) { renderBattle(); showSkillMenu(); }
      return;
    }
    const who = order[idx++];
    if (who === 'hero') heroTurn(action);
    else enemyTurn();
    setTimeout(next, 350);
  }
  next();
}

export function heroTurn(action) {
  const hero = state.partyCharacters[state.battle.heroId], hs = getCharStats(hero), e = state.battle.enemy;
  
  if (action.type === 'switch') {
    const newId = action.charId;
    if (!state.partyCharacters[newId] || newId === state.battle.heroId) { addBattleLog('切换无效。', 'system'); return; }
    state.battle.heroId = newId;
    const nh = state.partyCharacters[newId];
    state.battle.heroHp = nh.hp;
    state.battle.heroStatLevels = { atk: 0, matk: 0, pdef: 0, mdef: 0, hit: 0, dodge: 0, spd: 0, crit: 0 };
    addBattleLog(`🔄 切换到 ${nh.name}（HP ${Math.ceil(state.battle.heroHp)}/...）。所有属性等级已重置。`, 'hero'); return;
  }
  if (action.type === 'item') {
    const item = ITEMS[action.itemId];
    if (!item || state.inventory[action.itemId] <= 0) { addBattleLog('道具不足。', 'system'); return; }
    state.inventory[action.itemId]--; if (state.inventory[action.itemId] <= 0) delete state.inventory[action.itemId];
    let msg = [];
    if (item.heal || item.healPercent) { let amt = 0; if (item.heal) amt = item.heal; if (item.healPercent) amt = Math.max(amt, Math.floor(hs.maxHp * item.healPercent)); const before = state.battle.heroHp; state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + amt); hero.hp = state.battle.heroHp; msg.push(`生命+${state.battle.heroHp - before}`); }
    if (item.stamina) { const before = hero.stamina; hero.stamina = Math.min(MAX_STAMINA, hero.stamina + item.stamina); msg.push(`体力+${hero.stamina - before}`); }
    if (item.pp) {
      let restored = 0;
      hero.learnedSkills.forEach(sid => {
        const sk = SKILLS[sid]; if (!sk) return;
        if (!hero.skillPp[sid]) hero.skillPp[sid] = { current: 0, max: sk.maxPp };
        if (hero.skillPp[sid].current < hero.skillPp[sid].max) { hero.skillPp[sid].current = Math.min(hero.skillPp[sid].max, hero.skillPp[sid].current + item.pp); restored++; }
      });
      if (restored > 0) msg.push(`所有技能PP+${item.pp}`); else msg.push(`PP已满`);
    }
    addBattleLog(`🧪 ${hero.name} 使用 ${item.name}：${msg.join('，')}`, 'hero'); return;
  }
  if (action.type === 'catch') {
    const item = ITEMS[action.itemId];
    if (!item || state.inventory[action.itemId] <= 0) { addBattleLog('道具不足。', 'system'); return; }
    const hpPct = e.hp / e.stats.maxHp;
    if (hpPct >= 0.2) { addBattleLog(`捕捉失败！${e.name} 的生命值过高，需要削弱到20%以下。`, 'system'); return; }
    state.inventory[action.itemId]--; if (state.inventory[action.itemId] <= 0) delete state.inventory[action.itemId];
    let rate = MONSTERS[e.id].catchRate + item.catchBonus + (0.2 - hpPct) * 2; rate = Math.min(0.95, rate);
    addBattleLog(`🔴 ${hero.name} 使用了 ${item.name}！`, 'hero');
    if (Math.random() < rate) {
      state.battle.battleOver = true;
      addBattleLog(`🎉 成功捕捉了 ${e.name}！`, 'system');
      const tplId = e.id;
      if (CHARACTER_TEMPLATES[tplId]) {
        const newChar = createCharacter(tplId);
        if (newChar) {
          newChar.level = Math.max(1, e.lv - 2);
          updateLearnedSkills(newChar);
          const s = getCharStats(newChar); newChar.hp = s.maxHp; newChar.stamina = MAX_STAMINA;
          let finalId = tplId, count = 1;
          while (getCharacterById(finalId)) { finalId = tplId + '_' + count; count++; }
          newChar.id = finalId; state.warehouseCharacters[finalId] = newChar;
          addBattleLog(`📦 ${newChar.name} 已存入角色仓库，可在角色界面中调配出战。`, 'system');
          toast(`成功捕捉 ${newChar.name}！已存入仓库`);
        }
      }
      save(); renderStatus();
      setTimeout(() => {
        dom.battlePanel.classList.remove('open'); document.body.classList.remove('battle-open'); state.battle = null;
        import('./explore.js').then(m => m.resetExploreState());
        import('./scenes.js').then(m => m.renderGatherScene());
      }, 1500);
      return;
    } else { addBattleLog(`❌ 捕捉失败！${e.name} 挣脱了捕捉球。`, 'system'); }
    return;
  }
  if (action.type === 'flee') {
    addBattleLog('🏃 逃跑成功！', 'system'); 
    dom.battlePanel.classList.remove('open'); document.body.classList.remove('battle-open');
    state.battle = null;
    import('./explore.js').then(m => m.resetExploreState());
    toast('成功逃跑'); save(); return;
  }
  if (action.type === 'skill') {
    const sid = action.skillId; const sk = SKILLS[sid]; const pp = hero.skillPp[sid];
    if (!pp || pp.current <= 0) { addBattleLog('PP不足，无法使用。', 'system'); return; }
    
    pp.current--;
    if (pp.current === 0 && state.battle.prophecyTriggered !== state.battle.heroId) {
      let hasProphecy = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('预言'));
      if (hasProphecy) {
        state.battle.prophecyTriggered = state.battle.heroId;
        hero.learnedSkills.forEach(s => { if (hero.skillPp[s]) hero.skillPp[s].current = Math.min(hero.skillPp[s].max, hero.skillPp[s].current + 2); });
        addBattleLog(`🔮 预言被动触发！${hero.name} 的所有技能PP恢复了2点。`, 'system');
      }
    }
    if (!checkHit(sk, state.battle.heroStatLevels, e.statLevels)) {
      addBattleLog(`⚔️ ${hero.name} 使用 ${sk.name}，但是被 ${e.name} 闪避了！`, 'enemy'); return;
    }
    
    let dmgMultiplier = 1;
    const soulStealWeapon = Object.values(hero.equip).find(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('夺舍'));
    if (soulStealWeapon) {
      const isBlade = soulStealWeapon === 'bloodBlade', threshold = isBlade ? 0.4 : 0.5, bonus = isBlade ? 0.05 : 0.04;
      if (state.battle.heroHp / hs.maxHp < threshold) { dmgMultiplier += bonus; addBattleLog(`🩸 夺舍被动触发！${hero.name} 造成的伤害增加了${bonus * 100}%`, 'system'); }
    }
    
    let powerMultiplier = 1;
    const hasAuthority = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('权能'));
    if (hasAuthority) {
      let bonus = 0.15 + e.stats.maxHp / 1000; bonus = Math.min(0.30, bonus);
      powerMultiplier += bonus; addBattleLog(`💍 权能被动触发！${hero.name} 的技能威力提升了${Math.floor(bonus * 100)}%`, 'system');
    }
    
    if (e.hasVineArmor > 0 && Math.random() < 0.5) {
      for (let k in state.battle.heroStatLevels) if (state.battle.heroStatLevels[k] > -6) state.battle.heroStatLevels[k]--;
      addBattleLog(`🌿 滕之铠触发！${hero.name} 的全属性被削弱了1级！`, 'enemy');
    }

    function dealDamageAndDrain(dmgValue, typeMulti, isFixed = false) {
      let finalDmg = Math.floor(dmgValue * dmgMultiplier);
      if (e.hasVineArmor > 0 && !isFixed) finalDmg = Math.floor(finalDmg / 2);
      e.hp = Math.max(0, e.hp - finalDmg);
      let typeMsg = ''; if (typeMulti === 2) typeMsg = '（效果拔群！）'; else if (typeMulti === 0.5) typeMsg = '（收效甚微...）'; else if (typeMulti === 3) typeMsg = '（绝对克制！！）';
      const drainWeaponId = Object.values(hero.equip).find(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('生命汲取'));
      if (drainWeaponId) {
        const isBlade = drainWeaponId === 'bloodBlade', rate = isBlade ? (0.05 + Math.random() * 0.03) : (0.07 + Math.random() * 0.02), limit = isBlade ? 25 : 30;
        const healAmt = Math.min(limit, Math.floor(finalDmg * rate));
        if (healAmt > 0) { state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + healAmt); hero.hp = state.battle.heroHp; addBattleLog(`🩸 生命汲取被动触发！恢复 ${healAmt} 点生命值。`, 'system'); }
      }
      return { finalDmg, typeMsg };
    }

    if (sid === 'vineArmor') { state.battle.heroVineArmor = 3; addBattleLog(`🛡️ ${hero.name} 使用了 滕之铠，受到的直接伤害将减半且反击敌人！`, 'hero'); return; }
    if (sid === 'vineBind') { if (e.statLevels.spd > -4) e.statLevels.spd = Math.max(-6, e.statLevels.spd - 2); addBattleLog(`🌿 ${hero.name} 使用 藤蔓缠绕，${e.name} 的速度下降了2级！`, 'hero'); return; }
    if (sid === 'thornArmor') { if (state.battle.heroStatLevels.pdef < 6) state.battle.heroStatLevels.pdef++; if (state.battle.heroStatLevels.mdef < 6) state.battle.heroStatLevels.mdef++; addBattleLog(`🛡️ ${hero.name} 使用 荆棘甲衣，双防提升了1级！`, 'hero'); return; }
    if (sid === 'leafBlade') {
      let totDmg = 0, lastMsg = '';
      for (let i = 0; i < 2; i++) { let d = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier); let res = dealDamageAndDrain(d.damage, d.typeMulti); totDmg += res.finalDmg; lastMsg = res.typeMsg; }
      addBattleLog(`💥 ${hero.name} 使用 叶刃，对 ${e.name} 造成 ${totDmg} 点总伤害${lastMsg}`, 'hero'); return;
    }
    if (sid === 'leafShuriken') {
      let hits = Math.floor(Math.random() * 5) + 3, totDmg = 0, lastMsg = '';
      for (let i = 0; i < hits; i++) { let d = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier); let res = dealDamageAndDrain(d.damage, d.typeMulti); totDmg += res.finalDmg; lastMsg = res.typeMsg; }
      addBattleLog(`💥 ${hero.name} 使用 落叶飞镖，攻击了 ${hits} 次，造成 ${totDmg} 点总伤害${lastMsg}`, 'hero'); return;
    }
    if (sid === 'photoSynthesize') {
      const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
      const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
      let heal = Math.floor(finalDmg / 3); state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + heal); hero.hp = state.battle.heroHp;
      addBattleLog(`⚔️ ${hero.name} 使用 光合汲取，造成 ${finalDmg} 点伤害${typeMsg}并恢复了 ${heal} 点生命！`, 'hero'); return;
    }
    if (sid === 'thornStrike') {
      const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
      const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
      addBattleLog(`⚔️ ${hero.name} 使用 荆棘刺，对 ${e.name} 造成 ${finalDmg} 点伤害${dmg.crit ? '（暴击！）' : ''}${typeMsg}`, 'hero');
      if (Math.random() < 0.25) { if (e.statLevels.pdef > -6) e.statLevels.pdef--; addBattleLog(`⬇️ ${e.name} 的物防下降了1级！`, 'system'); } return;
    }
    if (sid === 'wither') {
      const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
      const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
      addBattleLog(`⚔️ ${hero.name} 使用 枯萎之殇，对 ${e.name} 造成 ${finalDmg} 点伤害${dmg.crit ? '（暴击！）' : ''}${typeMsg}`, 'hero');
      if (Math.random() < 0.5) { if (e.statLevels.crit > -6) e.statLevels.crit--; if (e.statLevels.dodge > -6) e.statLevels.dodge--; addBattleLog(`⬇️ ${e.name} 的暴击、闪避下降了1级！`, 'system'); }
      else { if (state.battle.heroStatLevels.spd < 6) state.battle.heroStatLevels.spd++; addBattleLog(`⬆️ ${hero.name} 的速度提升了1级！`, 'system'); }
      if (state.battle.heroHp < hs.maxHp / 2) { let heal = Math.floor(finalDmg / 3); state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + heal); hero.hp = state.battle.heroHp; addBattleLog(`💚 枯萎之力汲取了 ${heal} 点生命！`, 'system'); } return;
    }
    if (sid === 'rootBind') {
      const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
      const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
      addBattleLog(`⚔️ ${hero.name} 使用 根须束缚，对 ${e.name} 造成 ${finalDmg} 点伤害${typeMsg}`, 'hero');
      for (let k in e.statLevels) if (e.statLevels[k] > 0) e.statLevels[k] = 0;
      addBattleLog(`🌿 根须束缚！${e.name} 的所有属性增益被清除了！`, 'system'); return;
    }
    if (sid === 'seedBomb') {
      const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
      const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
      addBattleLog(`⚔️ ${hero.name} 使用 种子弹，对 ${e.name} 造成 ${finalDmg} 点伤害${dmg.crit ? '（暴击！）' : ''}${typeMsg}`, 'hero');
      if (Math.random() < 0.15) { if (state.battle.heroStatLevels.crit < 6) state.battle.heroStatLevels.crit++; addBattleLog(`⬆️ ${hero.name} 的暴击提升了1级！`, 'system'); } return;
    }
    if (sid === 'lifeFlow') {
      const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
      const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
      const heal = Math.floor(finalDmg / 2); state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + heal); hero.hp = state.battle.heroHp;
      addBattleLog(`⚔️ ${hero.name} 使用 生命之流，造成 ${finalDmg} 点伤害${typeMsg}并恢复了 ${heal} 点生命！`, 'hero'); return;
    }
    if (sid === 'healLight') { let heal = Math.floor(hs.maxHp / 4); state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + heal); hero.hp = state.battle.heroHp; addBattleLog(`✨ ${hero.name} 使用 治愈之光，恢复了 ${heal} 点生命！`, 'hero'); return; }
    if (sid === 'giantPower') { if (state.battle.heroStatLevels.atk < 6) state.battle.heroStatLevels.atk++; if (state.battle.heroStatLevels.pdef < 6) state.battle.heroStatLevels.pdef++; addBattleLog(`✨ ${hero.name} 使用 巨兽之力，攻击和防御提升了1级！`, 'hero'); return; }
    if (sid === 'clearMind') { state.battle.heroStatLevels = { atk: 0, matk: 0, pdef: 0, mdef: 0, hit: 0, dodge: 0, spd: 0, crit: 0 }; let heal = Math.floor(hs.maxHp * 0.2); state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + heal); hero.hp = state.battle.heroHp; addBattleLog(`✨ ${hero.name} 使用 明镜止水，清除了所有负面状态并恢复了 ${heal} 点生命！`, 'hero'); return; }
    if (sid === 'angrySlash') {
      const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
      const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
      addBattleLog(`⚔️ ${hero.name} 使用 愤怒斩，对 ${e.name} 造成 ${finalDmg} 点伤害${dmg.crit ? '（暴击！）' : ''}${typeMsg}`, 'hero');
      if (state.battle.heroStatLevels.crit < 6) { state.battle.heroStatLevels.crit++; addBattleLog(`⬆️ ${hero.name} 的暴击提升了1级！`, 'system'); }
      if (e.hp > state.battle.heroHp && state.battle.heroStatLevels.spd < 6) { state.battle.heroStatLevels.spd++; addBattleLog(`⬆️ ${hero.name} 的速度提升了1级！`, 'system'); } return;
    }
    if (sid === 'magicBarrage') {
      let hits = Math.floor(Math.random() * 7) + 2, totalDamage = 0, lastTypeMsg = '';
      for (let i = 0; i < hits; i++) {
        if (checkHit(sk, state.battle.heroStatLevels, e.statLevels)) {
          let d = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
          const res = dealDamageAndDrain(d.damage, d.typeMulti);
          totalDamage += res.finalDmg; lastTypeMsg = res.typeMsg;
          if (Math.random() < 0.25) { if (state.battle.heroStatLevels.matk < 6) state.battle.heroStatLevels.matk++; }
        }
      }
      addBattleLog(`⚔️ ${hero.name} 使用 魔法弹幕，攻击了 ${hits} 次，造成 ${totalDamage} 点总伤害${lastTypeMsg}！`, 'hero');
      if (hits % 2 === 0) { if (e.statLevels.spd > -6) e.statLevels.spd--; if (e.statLevels.dodge > -6) e.statLevels.dodge--; addBattleLog(`⬇️ ${e.name} 的速度、闪避下降了1级！`, 'system'); } return;
    }
    if (sid === 'abyssHand') {
      let defSum = getEffectiveStat(hs.pdef, state.battle.heroStatLevels.pdef) + getEffectiveStat(hs.mdef, state.battle.heroStatLevels.mdef);
      let rawDmg = Math.floor(hs.maxHp * 0.5) + Math.floor(defSum);
      const { finalDmg, typeMsg } = dealDamageAndDrain(rawDmg, 1, true);
      addBattleLog(`⚔️ ${hero.name} 使用 深渊巨手，对 ${e.name} 造成 ${finalDmg} 点真实伤害！`, 'hero');
      if (e.hp < e.stats.maxHp / 2) { let heal = 20 + Math.floor(finalDmg * 0.1); state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + heal); hero.hp = state.battle.heroHp; addBattleLog(`💚 ${hero.name} 恢复了 ${heal} 点生命值！`, 'hero'); } return;
    }
    
    const dmg = calcDamage(hs, sk, e.stats, state.battle.heroStatLevels, e.statLevels, powerMultiplier);
    const { finalDmg, typeMsg } = dealDamageAndDrain(dmg.damage, dmg.typeMulti);
    addBattleLog(`⚔️ ${hero.name} 使用 ${sk.name}，对 ${e.name} 造成 ${finalDmg} 点伤害${dmg.crit ? '（暴击！）' : ''}${typeMsg}`, 'hero');
    if (dmg.crit) {
      const hasGreed = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('贪心'));
      if (hasGreed) {
        if (!state.battle.heroCooldowns.greed || state.battle.turn - state.battle.heroCooldowns.greed >= 3) {
          state.battle.heroCooldowns.greed = state.battle.turn;
          if (e.statLevels.crit > 0) { e.statLevels.crit--; state.battle.heroStatLevels.crit = Math.min(6, state.battle.heroStatLevels.crit + 1); addBattleLog(`💍 贪心被动触发！吸收目标1级暴击等级。`, 'system'); }
        }
      }
    }
    return;
  }
}

export function enemyTurn() {
  const e = state.battle.enemy; const hero = state.partyCharacters[state.battle.heroId]; const hs = getCharStats(hero);
  if (e.hp <= 0 || state.battle.battleOver) return;
  
  let availableSkills = e.skills.filter(sid => e.skillPp[sid] && e.skillPp[sid].current > 0);
  if (availableSkills.length === 0) {
    e.skills.forEach(sid => { if (e.skillPp[sid]) { e.skillPp[sid].current = Math.min(e.skillPp[sid].max, e.skillPp[sid].current + 20); } });
    addBattleLog(`💊 ${e.name} 的PP耗尽了，使用大型活力豆恢复了20点PP！`, 'system'); return;
  }
  const sid = availableSkills[Math.floor(Math.random() * availableSkills.length)];
  const sk = SKILLS[sid];
  e.skillPp[sid].current--;
  
  if (!checkHit(sk, e.statLevels, state.battle.heroStatLevels)) {
    addBattleLog(`💥 ${e.name} 使用 ${sk.name}，但是被 ${hero.name} 闪避了！`, 'hero'); return;
  }
  let skillPower = sk.power;
  
  function dealDamageToHero(dmgVal, tMulti, isFixed = false) {
    let takenMultiplier = 1;
    const hasPriest = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('祭司'));
    if (hasPriest) { takenMultiplier -= 0.15; addBattleLog(`🛡️ 祭司被动触发！${hero.name} 受到的伤害减少了15%`, 'system'); }
    const soulStealWeapon = Object.values(hero.equip).find(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('夺舍'));
    if (soulStealWeapon) {
      const isBlade = soulStealWeapon === 'bloodBlade', threshold = isBlade ? 0.4 : 0.5, penalty = isBlade ? 0.05 : 0.03;
      if (state.battle.heroHp / hs.maxHp < threshold) { takenMultiplier += penalty; addBattleLog(`🩸 夺舍被动触发！${hero.name} 受到的伤害增加了${penalty * 100}%`, 'system'); }
    }
    let fDmg = Math.max(1, Math.floor(dmgVal * takenMultiplier));
    if (state.battle.heroVineArmor > 0 && !isFixed) fDmg = Math.floor(fDmg / 2);
    state.battle.heroHp = Math.max(0, state.battle.heroHp - fDmg); hero.hp = state.battle.heroHp;
    let typeMsg = ''; if (tMulti === 2) typeMsg = '（效果拔群！）'; else if (tMulti === 0.5) typeMsg = '（收效甚微...）'; else if (tMulti === 3) typeMsg = '（绝对克制！！）';
    return { fDmg, typeMsg };
  }

  if (state.battle.heroVineArmor > 0 && Math.random() < 0.5) {
    for (let k in e.statLevels) if (e.statLevels[k] > -6) e.statLevels[k]--;
    addBattleLog(`🌿 滕之铠触发！${e.name} 的全属性被削弱了1级！`, 'hero');
  }

  if (sid === 'vineArmor') { e.hasVineArmor = 3; addBattleLog(`🛡️ ${e.name} 使用了 滕之铠，受到的直接伤害将减半且反击敌人！`, 'enemy'); return; }
  if (sid === 'vineBind') { if (state.battle.heroStatLevels.spd > -4) state.battle.heroStatLevels.spd = Math.max(-6, state.battle.heroStatLevels.spd - 2); addBattleLog(`🌿 ${e.name} 使用 藤蔓缠绕，${hero.name} 的速度下降了2级！`, 'enemy'); return; }
  if (sid === 'thornArmor') { if (e.statLevels.pdef < 6) e.statLevels.pdef++; if (e.statLevels.mdef < 6) e.statLevels.mdef++; addBattleLog(`🛡️ ${e.name} 使用 荆棘甲衣，双防提升了1级！`, 'enemy'); return; }
  if (sid === 'leafBlade') {
    let totDmg = 0, lastMsg = '';
    for (let i = 0; i < 2; i++) { let d = calcDamage(e.stats, sk, hs, e.statLevels, state.battle.heroStatLevels); let res = dealDamageToHero(d.damage, d.typeMulti); totDmg += res.fDmg; lastMsg = res.typeMsg; }
    addBattleLog(`💥 ${e.name} 使用 叶刃，对 ${hero.name} 造成 ${totDmg} 点总伤害${lastMsg}`, 'enemy'); return;
  }
  if (sid === 'leafShuriken') {
    let hits = Math.floor(Math.random() * 5) + 3, totDmg = 0, lastMsg = '';
    for (let i = 0; i < hits; i++) { let d = calcDamage(e.stats, sk, hs, e.statLevels, state.battle.heroStatLevels); let res = dealDamageToHero(d.damage, d.typeMulti); totDmg += res.fDmg; lastMsg = res.typeMsg; }
    addBattleLog(`💥 ${e.name} 使用 落叶飞镖，攻击了 ${hits} 次，造成 ${totDmg} 点总伤害${lastMsg}`, 'enemy'); return;
  }

  const tempSk = { ...sk, power: skillPower };
  const dmg = calcDamage(e.stats, tempSk, { ...hs, type: hero.type }, e.statLevels, state.battle.heroStatLevels);
  const { fDmg, typeMsg } = dealDamageToHero(dmg.damage, dmg.typeMulti);
  addBattleLog(`💥 ${e.name} 使用 ${sk.name}，对 ${hero.name} 造成 ${fDmg} 点伤害${dmg.crit ? '（暴击！）' : ''}${typeMsg}`, 'enemy');
  
  if (sid === 'seedBomb') { if (Math.random() < 0.15) { if (e.statLevels.crit < 6) e.statLevels.crit++; addBattleLog(`⬆️ ${e.name} 的暴击提升了1级！`, 'system'); } }
  if (sid === 'photoSynthesize') { let heal = Math.floor(fDmg / 3); e.hp = Math.min(e.stats.maxHp, e.hp + heal); addBattleLog(`💚 ${e.name} 恢复了 ${heal} 点生命值！`, 'system'); }
  if (sid === 'thornStrike') { if (Math.random() < 0.25) { if (state.battle.heroStatLevels.pdef > -6) state.battle.heroStatLevels.pdef--; addBattleLog(`⬇️ ${hero.name} 的物防下降了1级！`, 'system'); } }
  if (sid === 'wither') {
    if (Math.random() < 0.5) { if (state.battle.heroStatLevels.crit > -6) state.battle.heroStatLevels.crit--; if (state.battle.heroStatLevels.dodge > -6) state.battle.heroStatLevels.dodge--; addBattleLog(`⬇️ ${hero.name} 的暴击、闪避下降了1级！`, 'system'); }
    else { if (e.statLevels.spd < 6) e.statLevels.spd++; addBattleLog(`⬆️ ${e.name} 的速度提升了1级！`, 'system'); }
    if (e.hp < e.stats.maxHp / 2) { let heal = Math.floor(fDmg / 3); e.hp = Math.min(e.stats.maxHp, e.hp + heal); addBattleLog(`💚 枯萎之力汲取了 ${heal} 点生命！`, 'system'); }
  }
  if (sid === 'rootBind') { for (let k in state.battle.heroStatLevels) if (state.battle.heroStatLevels[k] > 0) state.battle.heroStatLevels[k] = 0; addBattleLog(`🌿 根须束缚！${hero.name} 的所有属性增益被清除了！`, 'system'); }

  const hasAntiExplosion = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('防爆'));
  if (hasAntiExplosion) { if (fDmg > hs.maxHp * 0.3) { const healAmt = Math.min(25, Math.floor(hs.maxHp * 0.05) + 10); state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + healAmt); hero.hp = state.battle.heroHp; addBattleLog(`🛡️ 防爆被动触发！恢复 ${healAmt} 点生命值。`, 'system'); } }
  
  const hasGuardian = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('守护'));
  if (hasGuardian) { if (state.battle.heroHp / hs.maxHp < 0.4) { if (!state.battle.heroCooldowns.guardian || state.battle.turn - state.battle.heroCooldowns.guardian >= 4) { state.battle.heroCooldowns.guardian = state.battle.turn; if (state.battle.heroStatLevels.pdef < 6) state.battle.heroStatLevels.pdef++; if (state.battle.heroStatLevels.mdef < 6) state.battle.heroStatLevels.mdef++; addBattleLog(`🛡️ 守护被动触发！双防提升1级！`, 'system'); } } }

  if (sid === 'assault') { if (state.battle.heroStatLevels.spd > -6) state.battle.heroStatLevels.spd--; if (state.battle.heroStatLevels.dodge > -6) state.battle.heroStatLevels.dodge--; addBattleLog(`⬇️ ${hero.name} 的速度、闪避下降了1级！`, 'system'); if (dmg.crit) { if (state.battle.heroStatLevels.pdef > -6) state.battle.heroStatLevels.pdef--; if (state.battle.heroStatLevels.mdef > -6) state.battle.heroStatLevels.mdef--; addBattleLog(`💥 暴击附带效果！${hero.name} 的物防、魔防下降了1级！`, 'system'); } }
  if (sid === 'devour') { if (state.battle.heroStatLevels.spd > -6) state.battle.heroStatLevels.spd--; if (state.battle.heroStatLevels.dodge > -6) state.battle.heroStatLevels.dodge--; addBattleLog(`⬇️ ${hero.name} 的速度、闪避下降了1级！`, 'system'); }
  const hasHealPassive = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('治愈'));
  if (hasHealPassive && Math.random() < 0.2) { let healAmt = Math.floor(hs.maxHp * 0.04) + 10; state.battle.heroHp = Math.min(hs.maxHp, state.battle.heroHp + healAmt); hero.hp = state.battle.heroHp; addBattleLog(`💚 治愈被动触发！${hero.name} 恢复了 ${healAmt} 点生命值。`, 'system'); }
  const hasEntanglePassive = Object.values(hero.equip).some(id => id && ITEMS[id].passive && ITEMS[id].passive.includes('缠绕'));
  if (hasEntanglePassive && Math.random() < 0.35) { if (e.statLevels.pdef > -6) e.statLevels.pdef--; if (e.statLevels.mdef > -6) e.statLevels.mdef--; addBattleLog(`✨ 缠绕被动触发！${e.name} 的物防、魔防下降了1级！`, 'system'); }
}

export function checkBattleEnd() {
  if (!state.battle || state.battle.battleOver) return;
  const hero = state.partyCharacters[state.battle.heroId], e = state.battle.enemy;
  
  if (e.hp <= 0) {
    if (state.battle.enemyList && state.battle.enemyList.length > 1) {
      addBattleLog(`💀 ${e.name} 倒下了！`, 'system'); state.battle.enemyList.shift(); state.battle.currentEnemyIdx = 0;
      const nextEnemy = state.battle.enemy;
      addBattleLog(`⚠️ 敌方后续队伍登场：${nextEnemy.emoji} ${nextEnemy.name}（Lv.${nextEnemy.lv}）！`, 'system');
      renderBattle(); return;
    }

    state.battle.battleOver = true;
    addBattleLog(`🎉 击败了 ${e.name}！`, 'system'); addBattleLog(`获得经验 ${e.exp}，金币 ${e.gold}`, 'system');
    const battleHero = state.partyCharacters[state.battle.heroId];
    addExp(battleHero, e.exp); state.gold += e.gold;
    
    let evMsg = '', evStat = null, evAmount = 0;
    const statNameMap = { atk: '物攻', matk: '魔攻', pdef: '物防', mdef: '魔防', hp: '体力', spd: '速度' };
    if (e.evYield && Object.keys(e.evYield).length > 0) {
      evStat = Object.keys(e.evYield)[0]; evAmount = e.evYield[evStat];
      evMsg = `击败敌人，可获得 ${statNameMap[evStat]}学习力 +${evAmount}。`; addBattleLog(`✨ ${evMsg}`, 'system');
    }
    
    let dropMsgs = [];
    (e.drops || []).forEach(d => {
      if (Math.random() < d.chance && ITEMS[d.id]) {
        state.inventory[d.id] = (state.inventory[d.id] || 0) + 1;
        dropMsgs.push(`${ITEMS[d.id].emoji} ${ITEMS[d.id].name} ×1`); addBattleLog(`获得 ${ITEMS[d.id].emoji} ${ITEMS[d.id].name} ×1`, 'system');
      }
    });
    
    if (state.battle.isBossBattle) {
      if (state.battle.bossStage === 's1' && state.bossClear < 1) state.bossClear = 1;
      if (state.battle.bossStage === 's2' && state.bossClear < 2) state.bossClear = 2;
      if (state.battle.bossStage === 's3' && state.bossClear < 3) {
        state.bossClear = 3;
        if (!getCharacterById('woodLord')) {
          const newChar = createCharacter('woodLord'); newChar.level = 1; updateLearnedSkills(newChar); newChar.hp = getCharStats(newChar).maxHp;
          state.warehouseCharacters['woodLord'] = newChar;
          addBattleLog(`🎊 获得传说守护者：朽木领主！已存入角色仓库！`, 'system'); dropMsgs.push(`🦄 朽木领主 (角色)`);
        } else { addBattleLog(`🎊 再次击败朽木领主，获得额外奖励！`, 'system'); state.gold += 1000; dropMsgs.push(`💰 金币 ×1000`); }
      }
    }
    
    save(); renderStatus();
    let html = `<div style="text-align:center;padding:10px;">
      <div style="color:#e8c86a;font-size:18px;margin-bottom:10px;">🏆 战斗胜利！</div>
      <div style="font-size:14px;margin-bottom:6px;color:#fff;">获得经验：${e.exp}</div>
      <div style="font-size:14px;margin-bottom:6px;color:#fff;">获得金币：${e.gold}</div>
      ${evMsg ? `<div style="font-size:14px;margin-bottom:10px;color:#6aa8ff;">${evMsg}</div>` : ''}
      ${dropMsgs.length > 0 ? `<div style="font-size:13px;color:#7fc47f;line-height:1.6;">获得物品：<br>${dropMsgs.join('<br>')}</div>` : '<div style="font-size:13px;color:#777;">没有获得额外物品。</div>'}
    </div>`;
    dom.battleSubmenu.innerHTML = html; dom.battleSubmenu.classList.add('open');

    const endBattle = () => {
      dom.battlePanel.classList.remove('open'); document.body.classList.remove('battle-open'); state.battle = null;
      import('./explore.js').then(m => m.resetExploreState());
      import('./scenes.js').then(m => m.renderGatherScene());
    };

    if (evStat) {
      const currentTotal = Object.values(battleHero.evs).reduce((a, b) => a + b, 0);
      if (battleHero.evs[evStat] >= 256 || currentTotal >= 512) {
        dom.battleActions.innerHTML = `<button class="primary" id="end-battle-btn">已达上限，确认并离开</button>`;
        document.getElementById('end-battle-btn').onclick = endBattle;
      } else {
        let actualGet = Math.min(evAmount, 256 - battleHero.evs[evStat], 512 - currentTotal);
        dom.battleActions.innerHTML = `<button class="primary" id="accept-ev-btn" style="background:#4a6a9a;border-color:#6a8aba">吸收 ${statNameMap[evStat]}学习力 +${actualGet}</button>
          <button class="danger" id="end-battle-btn">放弃并离开</button>`;
        document.getElementById('accept-ev-btn').onclick = () => {
          battleHero.evs[evStat] += actualGet; addBattleLog(`✨ ${battleHero.name} 吸收了 ${statNameMap[evStat]}学习力 +${actualGet}`, 'system');
          save(); renderStatus(); document.getElementById('accept-ev-btn').disabled = true; document.getElementById('accept-ev-btn').textContent = '已吸收';
          document.getElementById('end-battle-btn').className = 'primary'; document.getElementById('end-battle-btn').textContent = '确认并离开';
        };
        document.getElementById('end-battle-btn').onclick = endBattle;
      }
    } else {
      dom.battleActions.innerHTML = `<button class="primary" id="end-battle-btn">确认并离开</button>`;
      document.getElementById('end-battle-btn').onclick = endBattle;
    }
    return;
  }
  const hs = getCharStats(hero);
  if (state.battle.heroHp <= 0) {
    const others = state.party.filter(id => id !== state.battle.heroId && state.partyCharacters[id].hp > 0);
    if (others.length > 0) {
      const nid = others[0]; const nh = state.partyCharacters[nid];
      state.battle.heroId = nid; state.battle.heroHp = nh.hp;
      state.battle.heroStatLevels = { atk: 0, matk: 0, pdef: 0, mdef: 0, hit: 0, dodge: 0, spd: 0, crit: 0 }; state.battle.heroVineArmor = 0;
      addBattleLog(`💔 ${hero.name} 倒下了！自动切换到 ${nh.name}。所有属性等级已重置。`, 'system');
      renderBattle(); showSkillMenu();
    } else {
      state.battle.battleOver = true;
      addBattleLog('💀 全员倒下，战斗失败……', 'system');
      for (const id in state.partyCharacters) { const c = state.partyCharacters[id]; if (c.hp <= 0) c.hp = 1; }
      save(); renderStatus();
      dom.battleSubmenu.innerHTML = `<div style="text-align:center;padding:10px;"><div style="color:#d95a5a;font-size:18px;margin-bottom:10px;">💀 战斗失败</div><div style="font-size:14px;color:#aaa;">全员倒下，已恢复至1点生命值。</div></div>`;
      dom.battleSubmenu.classList.add('open');
      dom.battleActions.innerHTML = `<button class="danger" id="end-battle-btn">确认并离开</button>`;
      document.getElementById('end-battle-btn').onclick = () => {
        dom.battlePanel.classList.remove('open'); document.body.classList.remove('battle-open'); state.battle = null;
        import('./explore.js').then(m => m.resetExploreState());
        import('./scenes.js').then(m => m.renderGatherScene());
      };
      return;
    }
  }
}

export function startBattle(monsterId) {
  const hero = getActiveChar();
  if (!hero || hero.equippedSkills.length === 0) { toast('请先为当前角色装备至少1个技能'); return; }
  
  const tpl = MONSTERS[monsterId];
  if (!tpl) return;
  const lv = Math.floor(Math.random() * (tpl.lv[1] - tpl.lv[0] + 1)) + tpl.lv[0];
  const scale = 1 + (lv - tpl.lv[0]) * 0.08;
  
  const enemyStats = {
    maxHp: Math.round(tpl.hp * scale), atk: Math.round(tpl.atk * scale), matk: Math.round((tpl.matk || 0) * scale),
    pdef: Math.round(tpl.pdef * scale), mdef: Math.round((tpl.mdef || 0) * scale), spd: Math.round(tpl.spd * scale), crit: 5, critDmg: 150, pierce: 0, mpierce: 0,
    type: tpl.type || '普通系'
  };
  
  const enemySkillPp = {};
  tpl.skills.forEach(sid => { if (SKILLS[sid]) enemySkillPp[sid] = { current: SKILLS[sid].maxPp, max: SKILLS[sid].maxPp }; });
  
  const newEnemy = {
    id: tpl.id, name: tpl.name, emoji: tpl.emoji, type: tpl.type, lv, hp: enemyStats.maxHp, stats: enemyStats,
    skills: tpl.skills, exp: tpl.exp, gold: tpl.gold, drops: tpl.drops || [], evYield: tpl.evYield || {},
    skillPp: enemySkillPp, statLevels: { atk: 0, matk: 0, pdef: 0, mdef: 0, hit: 0, dodge: 0, spd: 0, crit: 0 }, hasVineArmor: 0
  };

  state.battle = {
    enemyList: [newEnemy], currentEnemyIdx: 0, heroId: state.activeCharId, heroHp: hero.hp,
    heroStatLevels: { atk: 0, matk: 0, pdef: 0, mdef: 0, hit: 0, dodge: 0, spd: 0, crit: 0 },
    heroCooldowns: {}, heroVineArmor: 0, log: [], turn: 1, waiting: false, battleOver: false, playerAction: null, prophecyTriggered: null, isBossBattle: false
  };
  
  Object.defineProperty(state.battle, 'enemy', { get: function () { return this.enemyList[this.currentEnemyIdx]; }, configurable: true });

  addBattleLog(`⚔️ 遭遇 ${state.battle.enemy.name}（Lv.${state.battle.enemy.lv}，${state.battle.enemy.type}）！`, 'system');
  addBattleLog(`你派出了 ${hero.name}（${hero.type}）。`, 'hero');
  dom.battlePanel.classList.add('open'); document.body.classList.add('battle-open');
  renderBattle(); showSkillMenu();
}

export function startBossBattle(stage) {
  state.bossDailyCount[stage]++; save();
  const hero = getActiveChar();
  if (!hero || hero.equippedSkills.length === 0) { toast('请先为当前角色装备至少1个技能'); return; }

  let enemyTemplates = [];
  if (stage === 's1') { enemyTemplates = [{ id: 'bounceSeed', lv: 15 }, { id: 'bounceSeed', lv: 15 }, { id: 'onionHead', lv: 20 }, { id: 'onionHead', lv: 20 }]; }
  else if (stage === 's2') { enemyTemplates = [{ id: 'magicCat', lv: 35, hpOverride: 900 }]; }
  else if (stage === 's3') { enemyTemplates = [{ id: 'woodLord', lv: 35, hpOverride: 2933 }]; }

  const enemyList = enemyTemplates.map(tpl => {
    const base = MONSTERS[tpl.id];
    const scale = 1 + (tpl.lv - base.lv[0]) * 0.08;
    const maxHp = tpl.hpOverride || Math.round(base.hp * scale);
    const enemySkillPp = {};
    base.skills.forEach(sid => { if (SKILLS[sid]) enemySkillPp[sid] = { current: SKILLS[sid].maxPp, max: SKILLS[sid].maxPp }; });
    return {
      id: base.id, name: base.name, emoji: base.emoji, type: base.type, lv: tpl.lv, hp: maxHp,
      stats: { maxHp: maxHp, atk: Math.round(base.atk * scale), matk: Math.round((base.matk || 0) * scale), pdef: Math.round(base.pdef * scale), mdef: Math.round((base.mdef || 0) * scale), spd: Math.round(base.spd * scale), crit: 5, critDmg: 150, pierce: 0, mpierce: 0, type: base.type },
      skills: base.skills, exp: base.exp, gold: base.gold, drops: base.drops || [], evYield: base.evYield || {},
      skillPp: enemySkillPp, statLevels: { atk: 0, matk: 0, pdef: 0, mdef: 0, hit: 0, dodge: 0, spd: 0, crit: 0 }, hasVineArmor: 0
    };
  });

  state.battle = {
    enemyList: enemyList, currentEnemyIdx: 0, heroId: state.activeCharId, heroHp: hero.hp,
    heroStatLevels: { atk: 0, matk: 0, pdef: 0, mdef: 0, hit: 0, dodge: 0, spd: 0, crit: 0 },
    heroCooldowns: {}, heroVineArmor: 0, log: [], turn: 1, waiting: false, battleOver: false, playerAction: null, prophecyTriggered: null, isBossBattle: true, bossStage: stage
  };
  
  Object.defineProperty(state.battle, 'enemy', { get: function () { return this.enemyList[this.currentEnemyIdx]; }, configurable: true });

  addBattleLog(`⚔️ 试炼开始！遭遇 ${state.battle.enemy.name}（Lv.${state.battle.enemy.lv}）！`, 'system');
  addBattleLog(`你派出了 ${hero.name}。`, 'hero');
  dom.battlePanel.classList.add('open'); document.body.classList.add('battle-open');
  renderBattle(); showSkillMenu();
}