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

let isGathering = false;
let gatherProgress = 0;
let gatherTargetNode = null;

export function initExplore() {
  const cont = MAPS[state.currentContinentId];
  const reg = cont.regions[state.currentRegionId];
  if (reg.type !== 'explore') return;

  const subMapId = state.currentSubMapId || 'forest_core'; 
  const subMap = reg.subMaps[subMapId];
  currentNodes = JSON.parse(JSON.stringify(subMap.nodes || []));
  
  currentNodes.forEach(n => { n.x *= 1.5; n.y *= 1.5; });

  dom.exploreNodes.innerHTML = '';
  currentNodes.forEach(node => {
    let fontSize = 50;
    if (node.type === 'gather') { fontSize = node.name === '果树' ? 90 : 45; }
    else if (node.type === 'monster' || node.type === 'npc') { fontSize = 65; }
    else if (node.type === 'decor') { fontSize = 40; }

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

  let camX = px - sw / 2;
  let camY = py - sh / 2;

  camX = Math.max(0, Math.min(WORLD_WIDTH - sw, camX));
  camY = Math.max(0, Math.min(WORLD_HEIGHT - sh, camY));

  if (sw > WORLD_WIDTH) camX = (WORLD_WIDTH - sw) / 2;
  if (sh > WORLD_HEIGHT) camY = (WORLD_HEIGHT - sh) / 2;

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

    gatherProgress += 0.6; 
    gFill.style.width = gatherProgress + '%';

    if (gatherProgress >= 100) {
      ch.stamina -= 3;
      const dropId = gatherTargetNode.drops[Math.floor(Math.random() * gatherTargetNode.drops.length)];
      state.inventory[dropId] = (state.inventory[dropId] || 0) + 1;
      toast(`采集成功，消耗3体力，获得 ${ITEMS[dropId].name} x1`);
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
      const worldEl = document.getElementById('explore-world');
      const camX = -parseInt(worldEl.style.transform.match(/translate\(([-\d.]+)px/)?.[1] || 0);
      const camY = -parseInt(worldEl.style.transform.match(/,\s*([-\d.]+)px\)/)?.[1] || 0);
      
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
    if (dlg && txt) {
      txt.innerText = `${nearestNode.name}：你好呀！欢迎来到原始森林，注意这里的野猪很危险哦！`;
      dlg.style.display = 'block';
    }
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
      
      const worldEl = document.getElementById('explore-world');
      const rect = dom.exploreContainer.getBoundingClientRect();
      
      const camX = -parseInt(worldEl.style.transform.match(/translate\(([-\d.]+)px/)?.[1] || 0);
      const camY = -parseInt(worldEl.style.transform.match(/,\s*([-\d.]+)px\)/)?.[1] || 0);

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
      closePanel(dom.minimapPanel);
      toast(`已进入 ${sub.name}`);
    };
    dom.minimapContent.appendChild(box);
  }
  openPanel(dom.minimapPanel);
}