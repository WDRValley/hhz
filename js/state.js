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
  partyCharacters: {},
  warehouseCharacters: {},
  party: ['tiantian', 'lele', 'lili'],
  activeCharId: 'tiantian',
  selectedCharId: 'tiantian',
  currentContinentId: 'qingfeng',
  currentRegionId: 'forest',

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