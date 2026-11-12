// js/gift.js
import { state, MAX_STAMINA } from './state.js';
import { NEWBIE_GIFTS, ITEMS } from './data.js';
import { dom, toast, showRewardPopup, renderStatus } from './ui.js';
import { save, todayStr } from './persistence.js';

function getNewbieProgress() {
  const day = parseInt(localStorage.getItem('newbie_day') || '0');
  const lastDate = localStorage.getItem('newbie_last_date') || '';
  return { day: Math.max(0, Math.min(7, day)), lastDate };
}

export function renderGiftPanel() {
  const today = todayStr();
  const { day: newbieDay, lastDate: newbieLast } = getNewbieProgress();
  const dailyGot = localStorage.getItem('daily_gift_date') === today;
  
  if (state.currentGiftTab === 'newbie') {
    let newbieHtml = '<div class="gift-grid">';
    NEWBIE_GIFTS.forEach(gift => {
      const got = gift.day <= newbieDay;
      const canGet = gift.day === newbieDay + 1 && newbieLast !== today;
      const rewardText = Object.keys(gift.rewards).map(k => {
        const it = ITEMS[k];
        if (k === 'ticket') return `🎫 点券 ×${gift.rewards[k]}`;
        if (it) return `${it.emoji} ${it.name} ×${gift.rewards[k]}`;
        if (k === 'gold') return `💰 金币 ×${gift.rewards[k]}`;
        return '';
      }).filter(Boolean).join('<br>');
      
      newbieHtml += `<div class="gift-card ${got ? 'got' : ''} ${canGet ? 'can-get' : ''}">
        <div class="gift-day">第${gift.day}天 · ${gift.name}</div>
        <div class="gift-reward">${rewardText}</div>
        <button data-day="${gift.day}" ${canGet ? '' : 'disabled'}>${got ? '已领取' : canGet ? '领取' : '未解锁'}</button>
      </div>`;
    });
    newbieHtml += '</div>';
    dom.giftBody.innerHTML = `<div class="shop-section"><h3>🎉 7天新手礼包</h3>${newbieHtml}</div>`;
    
    dom.giftBody.querySelectorAll('.gift-card button').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.dataset.day);
        const prog = getNewbieProgress();
        if (day !== prog.day + 1 || prog.lastDate === today) return;
        const gift = NEWBIE_GIFTS.find(g => g.day === day);
        if (!gift) return;
        const itemsToShow = [];
        Object.keys(gift.rewards).forEach(k => {
          if (k === 'gold') { state.gold += gift.rewards[k]; itemsToShow.push({ type: 'gold', amount: gift.rewards[k] }); }
          else if (k === 'ticket') { state.tickets += gift.rewards[k]; itemsToShow.push({ type: 'ticket', amount: gift.rewards[k] }); }
          else { state.inventory[k] = (state.inventory[k] || 0) + gift.rewards[k]; itemsToShow.push({ id: k, count: gift.rewards[k] }); }
        });
        localStorage.setItem('newbie_day', day); localStorage.setItem('newbie_last_date', today);
        save(); renderStatus(); renderGiftPanel(); showRewardPopup('领取成功', itemsToShow);
      });
    });
  } else if (state.currentGiftTab === 'daily') {
    dom.giftBody.innerHTML = `
      <div class="shop-section"><h3>📅 每日登录赠礼</h3>
        <div class="shop-item" style="padding:16px;text-align:left;">
          <div style="font-size:15px;margin-bottom:6px;">今日签到奖励</div>
          <div style="font-size:13px;color:#999;margin-bottom:10px;line-height:1.6;">💰 金币 ×100<br>🎫 点券 ×5<br>⚡ 全体力全恢复</div>
          <button class="buy-btn" id="get-daily-gift" ${dailyGot ? 'disabled' : ''}>${dailyGot ? '今日已签到' : '立即签到'}</button>
        </div>
      </div>`;
    document.getElementById('get-daily-gift').addEventListener('click', () => {
      if (dailyGot) return;
      state.gold += 100; state.tickets += 5;
      const allChars = { ...state.partyCharacters, ...state.warehouseCharacters };
      for (const id in allChars) allChars[id].stamina = MAX_STAMINA;
      localStorage.setItem('daily_gift_date', today);
      save(); renderStatus(); renderGiftPanel(); toast('每日签到成功！获得 100 金币, 5 点券，体力已全满');
    });
  } else if (state.currentGiftTab === 'redeem') {
    dom.giftBody.innerHTML = `
      <div class="redeem-box">
        <div style="font-size:16px;color:#e8c86a;margin-bottom:10px;">输入兑换码领取奖励</div>
        <input type="text" id="redeem-code" class="redeem-input" placeholder="点击输入兑换码">
        <button class="redeem-btn" id="btn-redeem">兑换</button>
      </div>`;
    document.getElementById('btn-redeem').onclick = () => {
      const code = document.getElementById('redeem-code').value.trim();
      if (!code) { toast('请输入兑换码'); return; }
      let itemsToShow = [];
      if (code === '5555') { state.gold += 55555; state.tickets += 5555; itemsToShow = [{ type: 'gold', amount: 55555 }, { type: 'ticket', amount: 5555 }]; }
      else if (code === 'qfdl666') { state.expPool += 666666; itemsToShow = [{ type: 'exp', amount: 666666 }]; toast(`获得 666666 经验（已存入经验池）`); }
      else if (code === 'qfdl8888') {
        const rewards = { expSmall: 88, expMedium: 88, expLarge: 88, jungleEssence: 88, ballHigh: 88, ballMid: 88, ballBasic: 88, natureMintSpec: 88, natureMint: 88 };
        state.tickets += 888; for (let k in rewards) state.inventory[k] = (state.inventory[k] || 0) + rewards[k];
        itemsToShow.push({ type: 'ticket', amount: 888 }); for (let k in rewards) itemsToShow.push({ id: k, count: rewards[k] });
      } else { toast('兑换码无效！'); return; }
      save(); renderStatus(); document.getElementById('redeem-code').value = ''; showRewardPopup('兑换成功', itemsToShow);
    };
  } else if (state.currentGiftTab === 'online') {
    const timeMin = Math.floor(state.onlineData.time / 60);
    const rewards = [
      { min: 5, rewards: [{id:'gold', count:225}, {id:'diamond', count:5}, {id:'greenStarShard', count:2}] },
      { min: 10, rewards: [{id:'gold', count:545}, {id:'exp', count:3366}, {id:'spiritStoneShard', count:65}] },
      { min: 15, rewards: [{id:'fang', count:5}, {id:'bone', count:5}, {id:'hide', count:5}] },
      { min: 20, rewards: [{id:'vitalitySmall', count:10}, {id:'levelFruit', count:2}, {id:'gold', count:330}] },
      { min: 25, rewards: [{id:'gem', count:5}, {id:'crimsonGem', count:2}, {id:'exp', count:5000}] },
      { min: 30, rewards: [{id:'summonScroll', count:2}, {id:'chaosJade', count:1}] }
    ];

    let gridHtml = '<div class="online-grid">';
    rewards.forEach((r, i) => {
      const isClaimed = state.onlineData.claimed[i];
      const canClaim = !isClaimed && timeMin >= r.min;
      
      let rHtml = r.rewards.map(rw => {
        if (rw.id === 'gold') return `💰${rw.count}`;
        if (rw.id === 'exp') return `⭐${rw.count}经验`;
        return `${ITEMS[rw.id].emoji}${rw.count}`;
      }).join('<br>');

      gridHtml += `<div class="online-card ${isClaimed ? 'claimed' : ''}">
        <div class="online-title">在线 ${r.min} 分钟</div>
        <div class="online-rewards">${rHtml}</div>
        <button class="online-btn" data-idx="${i}" ${canClaim ? '' : 'disabled'}>${isClaimed ? '已领取' : (timeMin >= r.min ? '领取' : '未达成')}</button>
      </div>`;
    });
    gridHtml += '</div>';

    const fc = state.onlineData.fortuneCount;
    const cost = [0, 0, 35, 65, 75, 75, 75, 75][fc];
    const costText = fc < 2 ? '免费' : `${cost} 灵石碎片`;
    const canFortune = fc < 8 && (fc < 2 || (state.inventory.spiritStoneShard || 0) >= cost);

    dom.giftBody.innerHTML = `
      <div class="online-gift-wrap">
        <div class="online-left">
          <div class="online-header">本周累计在线时长：<span>${timeMin}</span> 分钟 <span style="font-size:12px;color:#888;font-weight:normal;">(每日重置)</span></div>
          ${gridHtml}
        </div>
        <div class="fortune-panel">
          <div style="font-size:16px;font-weight:bold;color:#fff;text-shadow:1px 1px 2px #000;">🌳 招财树</div>
          <div class="fortune-tree">🌳</div>
          <button class="fortune-btn" id="btn-fortune" ${canFortune ? '' : 'disabled'}>招财</button>
          <div class="fortune-info">
            本次消耗：${costText}<br>
            今日还可招财 ${8 - fc} 次
          </div>
        </div>
      </div>`;

    // 绑定领取事件
    dom.giftBody.querySelectorAll('.online-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        if (state.onlineData.claimed[idx]) return;
        state.onlineData.claimed[idx] = true;
        
        const rewardList = [];
        rewards[idx].rewards.forEach(rw => {
          if (rw.id === 'gold') { state.gold += rw.count; rewardList.push({type:'gold', amount:rw.count}); }
          else if (rw.id === 'exp') { state.expPool += rw.count; rewardList.push({type:'exp', amount:rw.count}); }
          else { state.inventory[rw.id] = (state.inventory[rw.id] || 0) + rw.count; rewardList.push({id:rw.id, count:rw.count}); }
        });
        save(); renderStatus(); renderGiftPanel();
        import('./ui.js').then(m => m.showRewardPopup('在线奖励', rewardList));
      };
    });

    // 绑定招财事件
    document.getElementById('btn-fortune').onclick = () => {
      if (state.onlineData.fortuneCount >= 8) return;
      
      const currentCost = [0, 0, 35, 65, 75, 75, 75, 75][state.onlineData.fortuneCount];
      if (currentCost > 0) {
        if ((state.inventory.spiritStoneShard || 0) < currentCost) { toast('灵石碎片不足'); return; }
        state.inventory.spiritStoneShard -= currentCost;
        if (state.inventory.spiritStoneShard <= 0) delete state.inventory.spiritStoneShard;
      }

      let goldGain = 0, expGain = 0;
      if (state.onlineData.fortuneCount < 2) {
        goldGain = Math.floor(Math.random() * 223) + 666; // 666~888
      } else {
        goldGain = Math.floor(Math.random() * 501) + 999; // 999~1499
        expGain = Math.floor(Math.random() * 841) + 1080; // 1080~1920
      }

      state.gold += goldGain;
      state.expPool += expGain;
      state.onlineData.fortuneCount++;
      
      save(); renderStatus(); renderGiftPanel();
      
      let popupItems = [{type:'gold', amount:goldGain}];
      if (expGain > 0) popupItems.push({type:'exp', amount:expGain});
      import('./ui.js').then(m => m.showRewardPopup('招财成功', popupItems));
    };
  }
}