// js/explore.js
import { state } from './state.js';
import { MAPS, ITEMS, MONSTERS } from './data.js';
import { dom, toast, openPanel, closePanel } from './ui.js';
import { getActiveChar, getCharStats } from './character.js';
import { save } from './persistence.js';
import { startBattle } from './battle.js';

// 世界尺寸
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;

let px = 800, py = 500; 
let targetX = null, targetY = null;
let currentNodes = []; 
let nearestNode = null; 
let isLoopStarted = false;
let isDialogOpen = false; 
let keys = {};
let camX = 0, camY = 0;

let isGathering = false;
let gatherProgress = 0;
let gatherTargetNode = null;

// ===== 采集上限辅助函数 =====
function getGatherLimit(name) {
  if (name === '矿脉' || name === '钓鱼点') return 10;
  if (name === '铜矿脉') return 7;
  if (name === '果树' || name === '奇妙果树') return 3;
  if (name === '菇丛') return 3;
  if (name === '草丛') return 5;
  return 10;
}
function getGatherUsed(nodeId) {
  const today = new Date().toDateString();
  if (!state.dailyGathers[today]) state.dailyGathers[today] = {};
  return state.dailyGathers[today][nodeId] || 0;
}

export function initExplore() {
  const cont = MAPS[state.currentContinentId];
  const reg = cont.regions[state.currentRegionId];
  if (reg.type !== 'explore') return;

  const subMapId = (state.currentSubMapId && reg.subMaps[state.currentSubMapId]) ? state.currentSubMapId : Object.keys(reg.subMaps)[0];
  state.currentSubMapId = subMapId;
  const subMap = reg.subMaps[subMapId];
  currentNodes = JSON.parse(JSON.stringify(subMap.nodes || []));
  
  // 更新按钮名与左上角文字
  const mapNameEl = document.getElementById('btn-explore-map');
  if (mapNameEl) mapNameEl.innerHTML = `🗺️ ${subMap.name}`;
  const mapNameDisplayEl = document.getElementById('map-name-display');
  if (mapNameDisplayEl) mapNameDisplayEl.textContent = subMap.name || '未知区域';
  const topTip = document.getElementById('explore-tip');
  if (topTip) topTip.style.display = 'none'; // 彻底隐藏旧提示防止遮挡
  
  const worldEl = document.getElementById('explore-world');
  const svgEl = worldEl ? worldEl.querySelector('svg') : null;
  const theme = subMap.theme || 'river';

  if (theme === 'river') {
    // 原始森林：绿色基底 + 蓝色河流
    if (worldEl) worldEl.style.background = 'radial-gradient(circle, #8ce569 0%, #4b9a30 100%)';
    if(svgEl) {
      svgEl.style.display = 'block';
      svgEl.innerHTML = `
        <path d="M 200 0 Q 600 500 400 1000" stroke="#5ab8d9" stroke-width="160" fill="none" stroke-linecap="round" />
        <path d="M 200 0 Q 600 500 400 1000" stroke="#81d4fa" stroke-width="120" fill="none" stroke-linecap="round" />
        <path d="M 200 0 Q 600 500 400 1000" stroke="#b3e5fc" stroke-width="40" fill="none" stroke-linecap="round" stroke-dasharray="40 30" />
      `;
    }
  } else if (theme === 'dirt') {
    // 林间小路：偏黄基底 + 泥土路
    if (worldEl) worldEl.style.background = '#6ebd3d';
    if(svgEl) {
      svgEl.style.display = 'block';
      svgEl.innerHTML = `
        <path d="M -100 850 Q 400 700 800 400 T 2000 200" stroke="#b89264" stroke-width="160" fill="none" stroke-linecap="round"/>
        <path d="M -100 850 Q 400 700 800 400 T 2000 200" stroke="#9c7a52" stroke-width="120" fill="none" stroke-linecap="round" opacity="0.4"/>
      `;
    }
  } else if (theme === 'exit') {
    // 森林出口：无河流，深绿渐变
    if (worldEl) worldEl.style.background = 'linear-gradient(to bottom, #4a7c2b, #2c5016)';
    if(svgEl) svgEl.style.display = 'none';
  }

  currentNodes.forEach(n => { n.x *= 1.5; n.y *= 1.5; });

  dom.exploreNodes.innerHTML = '';
  currentNodes.forEach(node => {
    let fontSize = 50;
    if (node.type === 'gather') {
      if (node.name === '果树' || node.name === '矿脉' || node.name === '铜矿脉' || node.name === '奇妙果树') fontSize = 100;
      else if (node.name === '钓鱼点') fontSize = 90;
      else if (node.name === '菇丛') fontSize = 80;
      else fontSize = 50;
    }
    else if (node.type === 'monster' || node.type === 'npc') { fontSize = 65; }
    else if (node.type === 'decor') { 
      // 如果是松树装饰，调大一点
      fontSize = node.emoji === '🌲' ? 80 : 40; 
    }

    if (node.type === 'decor') {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute; left:${node.x}px; top:${node.y}px; font-size:${fontSize}px; z-index:1; transform:translate(-50%, -50%); pointer-events:none; opacity:0.8;`;
      el.innerText = node.emoji;
      dom.exploreNodes.appendChild(el);
      return;
    }

    const el = document.createElement('div');
    el.className = 'explore-node';
    el.dataset.id = node.id;
    el.style.cssText = `position:absolute; left:${node.x}px; top:${node.y}px; font-size:${fontSize}px; z-index:5; transform:translate(-50%, -80%); transition:transform 0.2s; cursor:pointer; display:flex; flex-direction:column; align-items:center;`;
    
    const circle = document.createElement('div');
    circle.className = 'interact-circle';
    circle.style.cssText = `position:absolute; width:130px; height:130px; border:3px dashed rgba(232,200,106,0.8); border-radius:50%; top:50%; left:50%; transform:translate(-50%, -40%); display:none; pointer-events:none; background:rgba(232,200,106,0.1); transition:opacity 0.2s;`;
    el.appendChild(circle);

    const icon = document.createElement('div');
    icon.innerText = node.emoji;
    el.appendChild(icon);

    const nameTag = document.createElement('div');
    nameTag.style.cssText = `position:absolute; bottom:-15px; font-size:14px; background:rgba(0,0,0,0.6); color:${node.isRare ? '#ff6a6a' : '#fff'}; padding:2px 8px; border-radius:12px; white-space:nowrap; pointer-events:none;`;
    nameTag.innerText = node.isRare ? `[稀有] ${node.name}` : node.name;
    el.appendChild(nameTag);

    if (node.type === 'monster') {
      node.patrolTimer = 0; node.vx = 0; node.vy = 0;
    }

    // ===== 悬浮提示：采集节点显示今日剩余次数 =====
    el.addEventListener('mouseenter', (e) => {
      if (node.type === 'gather') {
        const limits = getGatherLimit(node.name);
        const used = getGatherUsed(node.id);
        if (used >= limits) {
          import('./ui.js').then(m => m.showTooltip(`今日可采集次数已耗尽`, e.clientX, e.clientY));
        } else {
          import('./ui.js').then(m => m.showTooltip(`${node.name}\n今日剩余: ${limits - used}次`, e.clientX, e.clientY));
        }
      }
    });
    el.addEventListener('mouseleave', () => import('./ui.js').then(m => m.hideTooltip()));

    dom.exploreNodes.appendChild(el);
    node.dom = el;
    node.circleDom = circle;
  });

  const closeBtn = document.getElementById('close-minimap');
  if (closeBtn) closeBtn.onclick = () => closePanel(dom.minimapPanel);
  
  refreshExplorePlayer();
  renderPlayer();
  updateCamera(true);

  resetExploreState();

  if (!isLoopStarted) {
    isLoopStarted = true;
    requestAnimationFrame(gameLoop);
  }
}

export function resetExploreState() {
  keys = {};
  targetX = null; targetY = null;
  isGathering = false;
  nearestNode = null;
  isDialogOpen = false;
  if (dom.interactPrompt) dom.interactPrompt.style.display = 'none';
  const gUi = document.getElementById('gather-progress-ui');
  if (gUi) gUi.style.display = 'none';
  const dlg = document.getElementById('explore-dialog');
  if (dlg) dlg.style.display = 'none';
}

export function refreshExplorePlayer() {
  const ch = getActiveChar();
  if (!ch) return;
  const emojiEl = document.getElementById('explore-player-emoji');
  const nameEl = document.getElementById('explore-player-name');
  if(emojiEl) emojiEl.innerText = ch.emoji;
  if(nameEl) nameEl.innerText = ch.name;
}

function renderPlayer() {
  if (dom.explorePlayer) {
    dom.explorePlayer.style.transform = `translate(${px}px, ${py}px)`;
  }
}

function updateCamera(instant = false) {
  const worldEl = document.getElementById('explore-world');
  const screenEl = dom.exploreContainer;
  if (!worldEl || !screenEl) return;

  const sw = screenEl.clientWidth;
  const sh = screenEl.clientHeight;

  let tx = px - sw / 2;
  let ty = py - sh / 2;

  tx = Math.max(0, Math.min(WORLD_WIDTH - sw, tx));
  ty = Math.max(0, Math.min(WORLD_HEIGHT - sh, ty));

  if (sw > WORLD_WIDTH) tx = (WORLD_WIDTH - sw) / 2;
  if (sh > WORLD_HEIGHT) ty = (WORLD_HEIGHT - sh) / 2;

  camX = tx;
  camY = ty;

  if (instant) worldEl.style.transition = 'none';
  else worldEl.style.transition = 'transform 0.1s linear';

  worldEl.style.transform = `translate(${-camX}px, ${-camY}px)`;
}

function gameLoop() {
  requestAnimationFrame(gameLoop); 
  
  if (state.currentScene !== 'gather' || state.battle) {
    keys = {};
    return;
  }

  const ch = getActiveChar();
  if (ch && window.lastActiveId !== ch.id) {
    window.lastActiveId = ch.id;
    refreshExplorePlayer();
  }
  
  if (isGathering) {
    const gFill = document.getElementById('gather-progress-fill');
    const gUi = document.getElementById('gather-progress-ui');
    if (!gFill || !gUi) return;
    
    if (ch.stamina < 3) {
      toast('体力不足，无法继续采集');
      resetExploreState();
      return;
    }

    let speed = 0.6;
    if (ch.equip.right === 'gathererGloves') speed *= 1.25; // 丰收被动加速
    gatherProgress += speed;
    gFill.style.width = gatherProgress + '%';

    if (gatherProgress >= 100) {
      ch.stamina -= 3;
      const today = new Date().toDateString();
      if (!state.dailyGathers[today]) state.dailyGathers[today] = {};
      state.dailyGathers[today][gatherTargetNode.id] = getGatherUsed(gatherTargetNode.id) + 1;

      const dropId = gatherTargetNode.drops[Math.floor(Math.random() * gatherTargetNode.drops.length)];
      let qty = 1;
      if (gatherTargetNode.name === '矿脉') qty = Math.floor(Math.random() * 5) + 8;
      else if (gatherTargetNode.name === '铜矿脉') qty = Math.floor(Math.random() * 3) + 6;
      else if (gatherTargetNode.name.includes('果树')) qty = Math.floor(Math.random() * 6) + 10;
      else if (gatherTargetNode.name === '草丛') qty = Math.floor(Math.random() * 3) + 5;
      else if (gatherTargetNode.name === '菇丛') qty = Math.floor(Math.random() * 5) + 18;
      else if (gatherTargetNode.name === '钓鱼点') qty = Math.floor(Math.random() * 5) + 8;

      let extraMsg = '';
      if (gatherTargetNode.name === '草丛' && Math.random() < 0.2) {
        const eggs = Math.floor(Math.random() * 3) + 1;
        state.inventory['egg'] = (state.inventory['egg'] || 0) + eggs;
        extraMsg += ` (额外鸟蛋x${eggs})`;
      }
      if (ch.equip.right === 'gathererGloves' && Math.random() < 0.15) {
        qty *= 2;
        extraMsg += ' (丰收被动触发，双倍产出！)';
      }

      state.inventory[dropId] = (state.inventory[dropId] || 0) + qty;
      toast(`采集成功，获得 ${ITEMS[dropId].name} x${qty}${extraMsg}`);
      save();
      import('./ui.js').then(m => m.renderStatus());
      resetExploreState();
    }
    return;
  }

  if (isDialogOpen) return;

  let dx = 0, dy = 0;
  const stats = getCharStats(ch);
  const speed = 2 + (stats.spd * 0.1);

  if (keys['w'] || keys['arrowup']) dy -= speed;
  if (keys['s'] || keys['arrowdown']) dy += speed;
  if (keys['a'] || keys['arrowleft']) dx -= speed;
  if (keys['d'] || keys['arrowright']) dx += speed;

  if (dx === 0 && dy === 0 && targetX !== null) {
    let tx = targetX - px;
    let ty = targetY - py;
    let dist = Math.hypot(tx, ty);
    if (dist > speed) {
      dx = (tx / dist) * speed;
      dy = (ty / dist) * speed;
    } else {
      targetX = null;
    }
  }

  if (dx !== 0 || dy !== 0) {
    px += dx;
    py += dy;
    px = Math.max(30, Math.min(WORLD_WIDTH - 30, px));
    py = Math.max(30, Math.min(WORLD_HEIGHT - 30, py));
    renderPlayer();
    updateCamera();
  }

  currentNodes.forEach(node => {
    if (node.type === 'monster' && node.dom) {
      if (node.patrolTimer > 0) {
        node.patrolTimer--; node.vx = 0; node.vy = 0;
      } else {
        if (Math.random() < 0.03) {
          node.vx = (Math.random() - 0.5) * 2;
          node.vy = (Math.random() - 0.5) * 2;
          if (Math.random() < 0.3) node.patrolTimer = 120 + Math.random() * 120;
        }
      }
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(30, Math.min(WORLD_WIDTH - 30, node.x));
      node.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, node.y));
      node.dom.style.left = node.x + 'px';
      node.dom.style.top = node.y + 'px';
    }
  });

  checkInteractions();
}

function checkInteractions() {
  let minDist = 90; 
  let foundNode = null;

  currentNodes.forEach(node => {
    if (node.type === 'decor' || !node.circleDom) return;
    const dist = Math.hypot(px - node.x, py - node.y);
    
    if (dist < minDist) {
      node.circleDom.style.display = 'block';
      if (dist < minDist) { minDist = dist; foundNode = node; }
    } else {
      node.circleDom.style.display = 'none';
    }
  });

  if (foundNode) {
    if (nearestNode !== foundNode) {
      nearestNode = foundNode;
      if (dom.interactPrompt) {
        dom.interactPrompt.style.display = 'block';
        let actionText = foundNode.type === 'monster' ? '战斗' : (foundNode.type === 'gather' ? '采集' : '交谈');
        dom.interactPrompt.innerText = `点击或按F ${actionText}`;
      }
    }
    if (dom.interactPrompt) {
      dom.interactPrompt.style.left = (foundNode.x - camX) + 'px';
      dom.interactPrompt.style.top = (foundNode.y - camY - 60) + 'px';
    }
  } else {
    nearestNode = null;
    if (dom.interactPrompt) dom.interactPrompt.style.display = 'none';
  }
}

export function doInteract() {
  if (!nearestNode || state.battle || isDialogOpen || isGathering) return;
  
  if (nearestNode.type === 'monster') {
    const mId = nearestNode.monsterId; // 修复致命Bug：提前保存ID
    resetExploreState();
    startBattle(mId);
  } else if (nearestNode.type === 'gather') {
    const limits = getGatherLimit(nearestNode.name);
    if (getGatherUsed(nearestNode.id) >= limits) { toast(`该据点今日可采集次数已耗尽`); return; }
    const ch = getActiveChar();
    if (ch.stamina < 3) { toast('体力不足，需要3点体力'); return; }
    isGathering = true;
    gatherProgress = 0;
    gatherTargetNode = nearestNode;
    targetX = null; targetY = null;
    const gUi = document.getElementById('gather-progress-ui');
    if (gUi) gUi.style.display = 'block';
    document.getElementById('gather-progress-fill').style.width = '0%';
  } else if (nearestNode.type === 'npc') {
    isDialogOpen = true;
    const dlg = document.getElementById('explore-dialog');
    const txt = document.getElementById('explore-dialog-text');
    const btn = document.getElementById('explore-dialog-btn');
    if (!dlg || !txt) return;

    const closeDlg = () => { dlg.style.display = 'none'; isDialogOpen = false; };

    // ===== 薇薇安：德鲁伊任务 step2 交羊毛布 =====
    if (nearestNode.id === 'npc_vivian' && state.tasks.druid === 'step2') {
      txt.innerText = "薇薇安：这是给我的？太感谢了！这些请你收下！";
      btn.innerText = "提交羊毛布";
      btn.onclick = () => {
        state.tasks.druid = 'done';
        state.expPool += 4500; state.gold += 300;
        state.inventory['woolCloth'] = (state.inventory['woolCloth'] || 0) + 10;
        state.inventory['jungleEssence'] = (state.inventory['jungleEssence'] || 0) + 3;
        save(); import('./ui.js').then(m=>{
          m.renderStatus();
          m.showRewardPopup('任务完成', [
            { id: 'woolCloth', count: 10 },
            { type: 'exp', amount: 4500 },
            { type: 'gold', amount: 300 },
            { id: 'jungleEssence', count: 3 }
          ]);
        });
        closeDlg();
      };
      dlg.style.display = 'block';
      return;
    }

    if (nearestNode.id === 'npc_vivian') {
      if (!state.tasks.vivian) {
        txt.innerText = "薇薇安：你好，冒险者。这片森林最近不太平，你能帮我收集6张兽皮吗？丛林狼身上应该有。";
        btn.innerText = "接受任务";
        btn.onclick = () => {
          state.tasks.vivian = 'accepted';
          state.inventory['wheatSeed'] = (state.inventory['wheatSeed'] || 0) + 15; // 赠送小麦种子
          save(); import('./ui.js').then(m => m.toast("已接受任务：薇薇安的请求，获得小麦种子x15"));
          closeDlg(); btn.innerText = "确定";
        };
      } else if (state.tasks.vivian === 'accepted') {
        if ((state.inventory['hide'] || 0) >= 6) {
          txt.innerText = "薇薇安：太棒了，你真勇敢！这是答应给你的报酬。";
          btn.innerText = "提交任务";
          btn.onclick = () => {
            state.inventory['hide'] -= 6;
            if (state.inventory['hide'] <= 0) delete state.inventory['hide'];
            state.tasks.vivian = 'done';
            state.gold += 1000; state.expPool += 3000;
            state.inventory['spiritStoneShard'] = (state.inventory['spiritStoneShard'] || 0) + 128;
            save(); import('./ui.js').then(m => {
              m.renderStatus();
              m.showRewardPopup('任务完成', [
                { id: 'spiritStoneShard', count: 128 },
                { type: 'gold', amount: 1000 },
                { type: 'exp', amount: 3000 }
              ]);
            });
            closeDlg(); btn.innerText = "确定";
          };
        } else {
          txt.innerText = `薇薇安：你还需要 ${6 - (state.inventory['hide'] || 0)} 张兽皮。`;
          btn.innerText = "确定"; btn.onclick = closeDlg;
        }
      } else {
        txt.innerText = "薇薇安：森林的恩赐真是丰厚！"; btn.innerText = "确定"; btn.onclick = closeDlg;
      }
    } else if (nearestNode.id === 'npc_tian') {
      if (!state.tasks.tian) {
        txt.innerText = "田田：你好呀！能帮我收集3个苹果吗？我想做苹果派！";
        btn.innerText = "接受任务";
        btn.onclick = () => { state.tasks.tian = 'accepted'; save(); import('./ui.js').then(m => m.toast("已接受任务：田田的采集请求")); closeDlg(); btn.innerText = "确定"; };
      } else if (state.tasks.tian === 'accepted') {
        if ((state.inventory['apple'] || 0) >= 3) {
          txt.innerText = "田田：哇，你真的带来了3个苹果！这是给你的奖励！";
          btn.innerText = "提交任务";
          btn.onclick = () => {
            state.inventory['apple'] -= 3; if (state.inventory['apple'] <= 0) delete state.inventory['apple'];
            state.tasks.tian = 'done';
            state.gold += 2500; state.expPool += 4500;
            state.inventory['spiritStoneShard'] = (state.inventory['spiritStoneShard'] || 0) + 128;
            state.inventory['gathererGloves'] = (state.inventory['gathererGloves'] || 0) + 1;
            save(); import('./ui.js').then(m => {
              m.renderStatus();
              m.showRewardPopup('任务完成', [
                { id: 'spiritStoneShard', count: 128 },
                { type: 'gold', amount: 2500 },
                { type: 'exp', amount: 4500 },
                { id: 'gathererGloves', count: 1 }
              ]);
            });
            closeDlg(); btn.innerText = "确定";
          };
        } else {
          txt.innerText = `田田：你还需要收集 ${3 - (state.inventory['apple'] || 0)} 个苹果哦。`;
          btn.innerText = "确定"; btn.onclick = closeDlg;
        }
      } else {
        txt.innerText = "田田：苹果派真好吃，谢谢你！"; btn.innerText = "确定"; btn.onclick = closeDlg;
      }
    } else if (nearestNode.id === 'npc_druid') {
      if (state.tasks.druid === 'done') {
        txt.innerHTML = `德鲁伊：森林的孩子，你需要什么帮助？<br><br>
          <button id="dlg-druid-shop" style="margin-bottom:8px;width:100%;padding:8px;background:#3a5a3a;color:#fff;border:none;border-radius:6px;">德鲁伊的商店</button>
          <button id="dlg-druid-incubate" style="margin-bottom:8px;width:100%;padding:8px;background:#3a5a3a;color:#fff;border:none;border-radius:6px;">孵化室</button>
          <button id="dlg-druid-leave" style="width:100%;padding:8px;background:#333;color:#fff;border:none;border-radius:6px;">离开</button>`;
        btn.style.display = 'none';
        dlg.style.display = 'block';
        document.getElementById('dlg-druid-shop').onclick = () => { closeDlg(); import('./scenes.js').then(m => m.openDruidShop()); };
        document.getElementById('dlg-druid-incubate').onclick = () => { closeDlg(); import('./scenes.js').then(m => m.openIncubator()); };
        document.getElementById('dlg-druid-leave').onclick = closeDlg;
        return;
      }
      
      if (!state.tasks.druid) {
        txt.innerText = "德鲁伊：森林的孩子，我急需3份羊毛来制作御寒的法袍。你愿意帮我吗？";
        btn.innerText = "接受委托";
        btn.onclick = () => { state.tasks.druid = 'accepted'; save(); import('./ui.js').then(m=>m.toast("接受任务：德鲁伊的委托")); closeDlg(); };
      } else if (state.tasks.druid === 'accepted') {
        if ((state.inventory['wool'] || 0) >= 3) {
          txt.innerText = "德鲁伊：感谢你，这是你的报酬。另外，能帮我把这块羊毛布转交给薇薇安吗？";
          btn.innerText = "提交羊毛并接受转交";
          btn.onclick = () => {
            state.inventory['wool'] -= 3; if(state.inventory['wool']<=0) delete state.inventory['wool'];
            state.tasks.druid = 'step2';
            state.expPool += 5000; state.gold += 600;
            state.inventory['gem'] = (state.inventory['gem']||0)+3;
            state.inventory['diamond'] = (state.inventory['diamond']||0)+3;
            state.inventory['woolCloth'] = (state.inventory['woolCloth']||0)+1;
            save(); import('./ui.js').then(m=>m.showRewardPopup('任务完成', [{id:'gem',count:3},{id:'diamond',count:3},{type:'exp',amount:5000},{type:'gold',amount:600},{id:'woolCloth',count:1}]));
            closeDlg();
          };
        } else { txt.innerText = "德鲁伊：我还需要3份羊毛。"; btn.innerText = "确定"; btn.onclick = closeDlg; }
      } else if (state.tasks.druid === 'step2') {
        txt.innerText = "德鲁伊：一定要亲手交给她。"; btn.innerText = "确定"; btn.onclick = closeDlg;
      } else { txt.innerText = "德鲁伊：森林会记住你的恩情。"; btn.innerText = "确定"; btn.onclick = closeDlg; }
    }
    dlg.style.display = 'block';
  }
}

export function initExploreEvents() {
  window.addEventListener('keydown', e => {
    if (isDialogOpen) return; 
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'f') doInteract();
  });
  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });
  
  // 修复无限行走：窗口失焦时强制清空按键
  window.addEventListener('blur', () => {
    keys = {};
  });
  
  if (dom.exploreContainer) {
    dom.exploreContainer.addEventListener('click', e => {
      if (isDialogOpen || state.battle || isGathering) return;

      const rect = dom.exploreContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left + camX;
      const clickY = e.clientY - rect.top + camY;

      const nodeEl = e.target.closest('.explore-node');
      if (nodeEl) {
        const nodeId = nodeEl.dataset.id;
        const node = currentNodes.find(n => n.id === nodeId);
        if (node) {
          if (Math.hypot(px - node.x, py - node.y) < 90) {
            nearestNode = node; 
            doInteract(); 
          } else {
            targetX = node.x; 
            targetY = node.y + 30;
          }
        }
        return;
      }

      if (!e.target.closest('#interact-prompt')) {
        targetX = clickX;
        targetY = clickY;

        // ===== 点击地面特效 =====
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = clickX + 'px';
        effect.style.top = clickY + 'px';
        document.getElementById('explore-world').appendChild(effect);
        setTimeout(() => effect.remove(), 500);
      }
    });
  }

  if (dom.interactPrompt) {
    dom.interactPrompt.onclick = doInteract;
  }

  const btn = document.getElementById('explore-dialog-btn');
  if (btn) {
    btn.onclick = () => {
      const dlg = document.getElementById('explore-dialog');
      if (dlg) dlg.style.display = 'none';
      isDialogOpen = false;
    };
  }
}

export function renderMinimap() {
  const cont = MAPS[state.currentContinentId];
  const reg = cont.regions[state.currentRegionId];
  
  dom.minimapContent.innerHTML = '';
  
  for (const smid in reg.subMaps) {
    const sub = reg.subMaps[smid];
    const isCurrent = (state.currentSubMapId || 'forest_core') === smid;
    
    const box = document.createElement('div');
    box.style.cssText = `position:absolute; padding:10px 20px; border:2px solid ${isCurrent ? '#5a8b5a' : '#b97a4a'}; background:${isCurrent ? 'rgba(90,139,90,0.2)' : '#fff'}; color:#8a5a3a; font-weight:bold; font-size:16px; cursor:pointer; border-radius:4px; transition:0.2s;`;
    
    if (smid === 'forest_core') { box.style.left = '40px'; box.style.top = '40px'; }
    else if (smid === 'forest_path') { box.style.left = '240px'; box.style.top = '160px'; }
    else { box.style.left = '440px'; box.style.top = '300px'; }
    
    box.innerText = sub.name;
    box.onclick = () => {
      state.currentSubMapId = smid;
      px = 800; py = 500; 
      initExplore();
      save();
      closePanel(dom.minimapPanel);
      toast(`已进入 ${sub.name}`);
    };
    dom.minimapContent.appendChild(box);
  }
  openPanel(dom.minimapPanel);
}