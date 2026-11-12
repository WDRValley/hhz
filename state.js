// js/state.js
export const SAVE_KEY       = 'gather_save_v17';
export const RESET_KEY      = 'gather_reset_v1';
export const WEEK_RESET_KEY = 'gather_week_v1';
export const BOSS_RESET_KEY = 'gather_boss_v1';
export const MAX_PARTY      = 6;
export const SLOT_COUNT     = 12;
export const RESPAWN_MS     = 1200;
export const MAX_STAMINA    = 1000;
export const MAX_LEVEL      = 100;

export const state = {
	
  onlineData: {
    date: '',
    time: 0, // 单位：秒
    claimed: [false, false, false, false, false, false], // 5,10,15,20,25,30分钟
    fortuneCount: 0 // 今日招财次数
  },
	
  // 存盘数据
  gold: 0,
  tickets: 0,
  expPool: 0,
  inventory: {},
  shopStock: {},
  shopBuyCount: {},
  altarState: false,
  bossClear: 0,
  bossDailyCount: { s1: 0, s2: 0, s3: 0 },
  tasks: { vivian: null, tian: null }, // 任务状态：null未接, 'accepted'进行中, 'done'已完成
  dailyGathers: {}, // 记录每日采集次数 { "日期": { "节点id": count } }
  incubator: [
    { active: false, finishTime: 0, eggType: null },
    { active: false, finishTime: 0, eggType: null },
    { active: false, finishTime: 0, eggType: null }
  ],
  partyCharacters: {},
  warehouseCharacters: {},
  party: ['tiantian', 'lele', 'lili'],
  activeCharId: 'tiantian',
  selectedCharId: 'tiantian',
  currentContinentId: 'qingfeng',
  currentRegionId: 'forest',
  currentSubMapId: 'forest_core',   // ← 新增

  // 内存 UI 态
  currentScene: 'map',
  currentCharTab: 'party',
  currentBagTab: 'food',
  currentShopTab: 'food',
  currentGiftTab: 'newbie',
  selectedExpCharId: null,
  tempAllocatedSkills: [],
  currentEquipFilter: 'all',
  currentEquipSlotKey: null,
  battle: null
};