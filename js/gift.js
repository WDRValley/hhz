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
  }
}