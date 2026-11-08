// js/data.js

export const QUALITY = {
  white:{name:'普通',color:'#ccc'}, green:{name:'入门',color:'#7fc47f'},
  blue:{name:'进阶',color:'#6aa8ff'}, purple:{name:'史诗',color:'#c48aff'},
  gold:{name:'传说',color:'#e8c86a'}, diamond:{name:'王者',color:'#8ae8e8'},
  red:{name:'传奇',color:'#ff6a6a'}
};

export const NATURES = {
  '孤僻':{up:'atk',down:'pdef'}, '固执':{up:'atk',down:'matk'}, '调皮':{up:'atk',down:'mdef'}, '勇敢':{up:'atk',down:'spd'},
  '大胆':{up:'pdef',down:'atk'}, '淘气':{up:'pdef',down:'matk'}, '无虑':{up:'pdef',down:'mdef'}, '悠闲':{up:'pdef',down:'spd'},
  '保守':{up:'matk',down:'atk'}, '稳重':{up:'matk',down:'pdef'}, '马虎':{up:'matk',down:'mdef'}, '冷静':{up:'matk',down:'spd'},
  '沉着':{up:'mdef',down:'atk'}, '温顺':{up:'mdef',down:'pdef'}, '狂妄':{up:'mdef',down:'matk'}, '慎重':{up:'mdef',down:'spd'},
  '胆小':{up:'spd',down:'atk'}, '急躁':{up:'spd',down:'pdef'}, '开朗':{up:'spd',down:'matk'}, '天真':{up:'spd',down:'mdef'},
  '坦率':{up:null,down:null}, '害羞':{up:null,down:null}, '认真':{up:null,down:null}, '实干':{up:null,down:null}, '浮躁':{up:null,down:null}
};
export const NATURE_KEYS = Object.keys(NATURES);
export const STAT_NAMES = {atk:'物攻',matk:'魔攻',pdef:'物防',mdef:'魔防',spd:'速度',hp:'体力'};

export const TYPE_CHART = {
  '普通系': { double: [], triple: [], half: ['石系', '机械系'] },
  '水系': { double: ['火系', '石系'], triple: ['上古系', '飞行系'], half: ['木系', '水系'] },
  '火系': { double: ['木系', '冰系', '虫系', '机械系'], triple: ['火系'], half: ['水系', '石系', '龙系'] },
  '木系': { double: ['水系', '石系', '光系'], triple: ['木系'], half: ['火系', '飞行系', '毒系', '虫系'] },
  '上古系': { double: ['仙灵系', '虚境系', '恶魔系'], triple: [], half: ['神系', '圣灵系', '机械系', '冰系', '虫系'] },
  '光系': { double: ['暗系', '数码系', '格斗系', '虚境系'], triple: [], half: ['光系', '生命系'] },
  '暗系': { double: ['光系', '时空系', '幻系', '风系'], triple: [], half: ['光系', '格斗系'] },
  '龙系': { double: ['龙系', '神系'], triple: [], half: ['机械系'] },
  '冰系': { double: ['木系', '飞行系', '龙系', '爬行系'], triple: [], half: ['火系', '水系', '冰系'] },
  '石系': { double: ['火系', '冰系', '飞行系', '虫系'], triple: [], half: ['格斗系', '木系', '水系'] },
  '飞行系': { double: ['木系', '虫系', '格斗系'], triple: [], half: ['冰系', '石系', '电系'] },
  '风系': { double: ['木系', '虫系', '格斗系'], triple: [], half: ['冰系', '石系'] },
  '幻系': { double: ['格斗系', '毒系'], triple: [], half: ['幻系', '机械系'] },
  '格斗系': { double: ['普通系', '冰系', '石系', '暗系'], triple: [], half: ['飞行系', '幻系', '毒系'] },
  '机械系': { double: ['冰系', '石系'], triple: [], half: ['火系', '水系'] },
  '神系': { double: ['龙系', '暗系'], triple: [], half: [] },
  '虫系': { double: ['木系', '幻系'], triple: [], half: ['火系', '飞行系', '毒系', '石系'] },
  '毒系': { double: ['木系', '幻系'], triple: [], half: ['毒系', '石系'] },
  '生命系': { double: ['木系'], triple: [], half: ['火系', '暗系'] },
  '恶魔系': { double: ['普通系'], triple: [], half: ['光系', '格斗系'] },
  '爬行系': { double: ['普通系'], triple: [], half: ['冰系'] },
  '电系': { double: ['水系', '飞行系'], triple: [], half: ['木系', '龙系', '石系'] },
};

export const PASSIVE_DESC = {
  "预言": "当技能PP耗尽时触发预言之力，所有技能恢复2点PP（每场战斗限触发一次）。",
  "生命汲取": "攻击命中后有概率吸取伤害值转化为自身生命（普通装备约7%~9%，嗜血妖刀约5%~8%），单次最多恢复25~30点。",
  "夺舍": "自身生命低于阈值时提升伤害，但承受伤害也会提高。（妖刀：低于40%时，伤害+5%，承伤+5%；权杖：低于50%时，伤害+4%，承伤+3%）",
  "治愈": "每回合有20%概率恢复少量生命值（约4%最大生命+10点）。",
  "缠绕": "攻击后有35%概率降低目标物防与魔防各1级。",
  "祭司": "受到的所有伤害降低15%。",
  "防爆": "受到单次伤害高于自身最大生命值30%时，立即恢复自身生命值最大5%+10点（最高25点）。",
  "守护": "每损失最大生命值低于40%时，增加双防1级（每4回合最多触发一次）。",
  "权能": "自身技能威力增加（15% + 目标最大生命值/1000），上限为30%。",
  "贪心": "攻击暴击后，吸收目标1级暴击等级（每3回合最多触发1次）。"
};

export const NEWBIE_GIFTS = [
  {day:1, name:'启程礼包', rewards:{gold:300, ticket:50, ballBasic:5, healSmall:10}},
  {day:2, name:'成长礼包', rewards:{gold:500, expMedium:2, vitalityMedium:2}},
  {day:3, name:'锻造礼包', rewards:{gold:500, ballMid:3, iron:10}},
  {day:4, name:'进阶礼包', rewards:{gold:800, expMedium:3, vitalityLarge:1, copper:10}},
  {day:5, name:'魔法礼包', rewards:{gold:800, ticket:30, ballHigh:2, magicCrystal:5}},
  {day:6, name:'补给礼包', rewards:{gold:1000, expMedium:4, healLarge:3}},
  {day:7, name:'终极大礼', rewards:{gold:1500, ticket:100, ballHigh:5, gem:3, jungleEssence:5}}
];

export const SKILLS = {
  ram:{id:'ram',name:'猛烈撞击',category:'物理',power:105,maxPp:15,type:'普通系',learnLv:1,desc:'用身体猛烈撞击对手。'},
  power:{id:'power',name:'暴力一击',category:'物理',power:80,maxPp:20,type:'普通系',learnLv:1,desc:'全力挥出一击。'},
  angrySlash:{id:'angrySlash',name:'愤怒斩',category:'物理',power:125,maxPp:10,type:'暗系',learnLv:10,desc:'攻击后提升自己暴击。若目标体力高于自身，额外提升速度。'},
  abyssHand:{id:'abyssHand',name:'深渊巨手',category:'物理',power:1,maxPp:5,type:'暗系',learnLv:15,mustHit:true,desc:'必中，造成自身50%最大生命值与100%双防值的固伤。若目标半血以下，恢复自身生命。'},
  thrust:{id:'thrust',name:'突刺',category:'物理',power:90,maxPp:10,type:'普通系',learnLv:25,desc:'快速向前突刺。'},
  slam:{id:'slam',name:'泰山压顶',category:'物理',power:120,maxPp:5,type:'石系',learnLv:35,desc:'以全身重量压制对手。'},
  earth:{id:'earth',name:'大地崩坏',category:'法术',power:150,maxPp:5,type:'石系',learnLv:45,desc:'引发大地崩裂，重创敌人。'},
  frenzy:{name:'狂袭',category:'物理',power:70,type:'普通系',maxPp:10,learnLv:10,desc:'发狂般地连续攻击。'},
  giantPower:{name:'巨兽之力',category:'属性',power:-1,type:'普通系',maxPp:10,learnLv:20,desc:'提升自身攻击及防御一级。'},
  doomSpike:{name:'爆裂角刺',category:'物理',power:250,type:'普通系',maxPp:5,learnLv:45,desc:'高威力物理攻击。'},
  magic:{id:'magic',name:'魔法弹',category:'法术',power:70,maxPp:20,type:'光系',learnLv:1,desc:'凝聚魔力射出一颗弹丸。'},
  magicBarrage:{id:'magicBarrage',name:'魔法弹幕',category:'法术',power:35,maxPp:15,type:'光系',learnLv:15,desc:'随机攻击2-8次。有概率提升魔攻。偶数次削弱目标速度、闪避。'},
  magicBolt:{name:'魔力炮弹',category:'法术',power:60,type:'光系',maxPp:15,learnLv:5,desc:'发射凝聚的魔力弹。'},
  airCut:{name:'空气切割',category:'物理',power:65,type:'飞行系',maxPp:15,learnLv:5,desc:'用锐利的空气切开目标。'},
  meteorShower:{name:'陨石星落',category:'法术',power:200,type:'石系',maxPp:10,learnLv:35,desc:'召唤陨石砸向敌方单体。'},
  storm:{name:'魔力风暴',category:'法术',power:85,type:'风系',maxPp:5,learnLv:15,desc:'召唤狂暴的魔力风暴。'},
  scratch:{name:'刺挠',category:'物理',power:35,type:'普通系',maxPp:20,learnLv:1,desc:'用爪子轻轻挠抓对手。'},
  bite:{name:'抓咬',category:'物理',power:45,type:'普通系',maxPp:20,learnLv:1,desc:'张口咬向对手。'},
  tear:{name:'撕咬',category:'物理',power:60,type:'暗系',maxPp:15,learnLv:5,desc:'凶狠地撕咬对手的弱点。'},
  ramM:{name:'猛烈撞击',category:'物理',power:80,type:'普通系',maxPp:15,learnLv:1,desc:'用身躯狠狠撞击目标。'},
  vortex:{name:'魔法漩涡',category:'法术',power:70,type:'水系',maxPp:10,learnLv:10,desc:'制造漩涡卷入敌人。'},
  healLight:{name:'治愈之光',category:'属性',power:-1,type:'光系',maxPp:10,learnLv:20,desc:'回复自身1/4生命值。'},
  lifeFlow:{name:'生命之流',category:'法术',power:120,type:'木系',maxPp:10,learnLv:15,desc:'回复造成伤害一半的HP。'},
  lightSpeedPunch:{name:'光速拳',category:'物理',power:80,type:'光系',maxPp:30,learnLv:5,desc:'先发制人，攻击敌方单体。',priority:1},
  clearMind:{name:'明镜止水',category:'属性',power:-1,type:'水系',maxPp:5,learnLv:40,desc:'清除自身所有属性等级下降，并回复少量体力。'},
  assault:{name:'强袭突击',category:'物理',power:105,type:'格斗系',maxPp:10,learnLv:35,desc:'命中后削弱目标速度、闪避1级，暴击则削弱目标双防1级。'},
  surge:{name:'狂潮翻涌',category:'法术',power:75,type:'水系',maxPp:15,learnLv:30,desc:'目标生命值低于50%时，该技能威力+15%；否则50%概率提高自身1级魔攻。'},
  devour:{name:'吞噬',category:'法术',power:100,type:'暗系',maxPp:15,learnLv:30,desc:'命中后削弱目标闪避、速度1级。'},
  vineWhip:{name:'藤鞭',category:'物理',power:60,maxPp:20,type:'木系',learnLv:1,desc:'用藤条鞭打对手。'},
  leafBlade:{name:'叶刃',category:'法术',power:40,maxPp:15,type:'木系',learnLv:5,desc:'锋利的叶片攻击敌方2次。'},
  seedBomb:{name:'种子弹',category:'法术',power:70,maxPp:15,type:'木系',learnLv:5,desc:'发射种子，15%概率提高暴击1级。'},
  vineBind:{name:'藤蔓缠绕',category:'属性',power:0,maxPp:10,type:'木系',learnLv:10,desc:'削弱目标2级速度。'},
  thornArmor:{name:'荆棘甲衣',category:'属性',power:0,maxPp:10,type:'木系',learnLv:10,desc:'提高自身双防1级。'},
  photoSynthesize:{name:'光合汲取',category:'物理',power:85,maxPp:10,type:'木系',learnLv:15,desc:'命中后将伤害的1/3恢复自身生命。'},
  thornStrike:{name:'荆棘刺',category:'物理',power:105,maxPp:10,type:'木系',learnLv:20,desc:'25%概率削弱目标物防1级。'},
  leafShuriken:{name:'落叶飞镖',category:'物理',power:30,maxPp:15,type:'木系',learnLv:25,desc:'随机攻击目标3~7次。'},
  wither:{name:'枯萎之殇',category:'法术',power:120,maxPp:6,type:'木系',learnLv:30,desc:'50%削弱目标暴击、闪避1级，否则自身速度+1。生命值低于1/2时恢复伤害1/3。'},
  rootBind:{name:'根须束缚',category:'物理',power:60,maxPp:2,type:'木系',learnLv:35,desc:'先发，必中，消除目标所有属性增益。',priority:1,mustHit:true},
  vineArmor:{name:'滕之铠',category:'属性',power:0,maxPp:5,type:'木系',learnLv:40,desc:'先发，使用后3回合内受到的直接伤害（除固伤外）减半且每受到1段攻击均有1/2概率削弱攻击者全属性1级，该效果不可叠加使用；',priority:1}
};

export const ITEMS = {
  egg:{name:'鸟蛋',emoji:'🥚',category:'肉类',price:6,stamina:15,desc:'从树上的鸟巢里捡到的蛋，还带着一点温度。'},
  mushroom:{name:'蘑菇',emoji:'🍄',category:'蔬菜',price:4,stamina:10,desc:'一丛颜色鲜艳的蘑菇。你不知道它有没有毒。'},
  berry:{name:'野果',emoji:'🍒',category:'水果',price:3,stamina:8,desc:'一颗熟透的野果，酸甜的气味让你想起某个夏天。'},
  grape:{name:'葡萄',emoji:'🍇',category:'水果',price:4,stamina:14,desc:'一串紫得发黑的葡萄。'},
  watermelon:{name:'西瓜',emoji:'🍉',category:'水果',price:6,stamina:35,desc:'敲起来梆梆响的西瓜。'},
  chickenLeg:{name:'鸡腿',emoji:'🍗',category:'肉类',price:8,stamina:45,desc:'烤得金黄的鸡腿。'},
  leaf:{name:'树叶',emoji:'🍃',category:'材料',price:1,desc:'一片脉络清晰的叶子。'},
  branch:{name:'树枝',emoji:'🪵',category:'材料',price:2,desc:'一根笔直的树枝。'},
  stone:{name:'石子',emoji:'🪨',category:'材料',price:1,desc:'一块普通的石头。'},
  iron:{name:'铁矿',emoji:'🔩',category:'材料',price:10,desc:'沉甸甸的矿石。'},
  copper:{name:'铜矿',emoji:'🟠',category:'材料',price:8,desc:'带着绿色锈迹的铜矿石。'},
  gem:{name:'宝石',emoji:'💎',category:'道具',price:50,desc:'一块切割过的宝石。'},
  diamond:{name:'钻石',emoji:'💠',category:'道具',price:150,desc:'最坚硬的东西。'},
  fish:{name:'鱼肉',emoji:'🐟',category:'肉类',price:6,stamina:35,desc:'新鲜的鱼肉。'},
  pork:{name:'猪肉',emoji:'🥩',category:'肉类',price:8,stamina:45,desc:'一块肥瘦相间的猪肉。'},
  mutton:{name:'羊肉',emoji:'🍖',category:'肉类',price:9,stamina:50,desc:'带骨的羊肉。'},
  cabbage:{name:'白菜',emoji:'🥬',category:'蔬菜',price:2,stamina:12,desc:'一颗包得紧实的白菜。'},
  radish:{name:'萝卜',emoji:'🥕',category:'蔬菜',price:2,stamina:12,desc:'一根白胖的萝卜。'},
  cucumber:{name:'黄瓜',emoji:'🥒',category:'蔬菜',price:2,stamina:10,desc:'带着小刺的黄瓜。'},
  apple:{name:'苹果',emoji:'🍎',category:'水果',price:3,stamina:25,desc:'红透的苹果。'},
  pear:{name:'梨子',emoji:'🍐',category:'水果',price:3,stamina:22,desc:'黄绿色的梨。'},
  peach:{name:'桃子',emoji:'🍑',category:'水果',price:4,stamina:20,desc:'绒毛覆盖的桃子。'},
  banana:{name:'香蕉',emoji:'🍌',category:'水果',price:2,stamina:18,desc:'一串香蕉。'},
  coconut:{name:'椰子',emoji:'🥥',category:'水果',price:5,stamina:20,desc:'海边掉落的椰子。'},
  cola:{name:'快乐水',emoji:'🥤',category:'饮品',price:4,stamina:30,desc:'充满气泡的甜味饮料，喝下去打个嗝很舒服。'},
  orangeJuice:{name:'橙汁',emoji:'🧃',category:'饮品',price:3,stamina:25,desc:'酸酸甜甜的鲜榨果汁。'},
  milk:{name:'鲜牛奶',emoji:'🥛',category:'饮品',price:5,stamina:35,desc:'营养丰富的白色液体。'},
  yogurt:{name:'酸奶',emoji:'🍦',category:'饮品',price:4,stamina:20,desc:'浓稠的酸甜口感。'},
  blackTea:{name:'红茶',emoji:'🍵',category:'饮品',price:7,stamina:40,desc:'温润养胃的红茶。'},
  greenTea:{name:'绿茶',emoji:'🍵',category:'饮品',price:7,stamina:40,desc:'清新提神的绿茶。'},
  coffee:{name:'咖啡',emoji:'☕',category:'饮品',price:10,stamina:50,desc:'苦中带香，能快速恢复精力。'},
  daoTea:{name:'悟道茶',emoji:'🍵',category:'饮品',price:30,stamina:100,desc:'蕴含天地灵气的茶，能大幅恢复体力。'},
  blade:{name:'大刀',emoji:'⚔️',category:'武器',price:60,kind:'weapon',slot:'hand',handType:'right',subType:'单手武器',quality:'green',atk:5,desc:'用铁矿石反复锻打成型的大刀。'},
  dagger:{name:'匕首',emoji:'🔪',category:'武器',price:45,kind:'weapon',slot:'hand',handType:'right',subType:'单手武器',quality:'green',atk:3,crit:10,desc:'短小锋利的匕首。'},
  shield:{name:'木制盾牌',emoji:'🛡️',category:'防具',price:20,kind:'armor',slot:'hand',handType:'left',subType:'盾牌',quality:'white',pdef:2,desc:'几块木板钉在一起。'},
  robe:{name:'魔法袍',emoji:'🥼',category:'防具',price:70,kind:'armor',slot:'chest',subType:'衣服',quality:'blue',mdef:3,hp:15,desc:'缝进了微光宝石的袍子。'},
  pill:{name:'普通气血丹',emoji:'💊',category:'丹药',price:15,kind:'consume',stamina:10,heal:30,desc:'一枚温热的小丹药。'},
  axe:{name:'夺命战斧',emoji:'🪓',category:'武器',price:200,kind:'weapon',slot:'hand',handType:'two',subType:'双手武器',quality:'blue',atk:12,critDmg:14,pierce:5,desc:'沉重的双手战斧。'},
  boots:{name:'极速战靴',emoji:'👢',category:'防具',price:60,kind:'armor',slot:'feet',subType:'鞋子',quality:'green',spd:10,pdef:1,desc:'轻便的皮靴。'},
  crown:{name:'荆棘王冠',emoji:'👑',category:'防具',price:120,kind:'armor',slot:'head',subType:'头饰',quality:'blue',atk:5,pdef:3,desc:'一圈缠着荆棘的王冠。'},
  footChain:{name:'清羽足链',emoji:'🪶',category:'防具',price:40,kind:'armor',slot:'feet',subType:'足饰',quality:'green',spd:12,atk:2,desc:'一串缀着青色羽毛的足链。'},
  magicBook:{name:'魔法秘典',emoji:'📖',category:'武器',price:120,kind:'weapon',slot:'hand',handType:'right',subType:'单手武器',quality:'green',matk:5,mpierce:3,desc:'一本记载着基础魔法的秘典。'},
  voidStaff:{name:'虚无法杖',emoji:'🪄',category:'武器',price:260,kind:'weapon',slot:'hand',handType:'two',subType:'双手武器',quality:'purple',matk:12,mpierce:8,desc:'杖顶嵌着一颗虚空石。'},
  apprenticeStaff:{name:'见习法杖',emoji:'🪶',category:'武器',price:40,kind:'weapon',slot:'hand',handType:'right',subType:'单手武器',quality:'white',matk:3,desc:'新手法师的第一根法杖。'},
  elfBow:{name:'精灵短弓',emoji:'🏹',category:'武器',price:180,kind:'weapon',slot:'hand',handType:'right',subType:'单手武器',quality:'blue',atk:4,spd:5,crit:5,desc:'精灵工匠打造的短弓。'},
  expSmall:{name:'小型经验丹',emoji:'🟢',category:'消耗品',price:20,kind:'consume',exp:100,desc:'服用后能获得少量经验。'},
  expMedium:{name:'中型经验丹',emoji:'🔵',category:'消耗品',price:80,kind:'consume',exp:500,desc:'蕴含的经验更加丰富。'},
  expLarge:{name:'大型经验丹',emoji:'🟣',category:'消耗品',price:200,kind:'consume',exp:2000,desc:'蕴含大量经验。'},
  forgetPotion:{name:'遗忘药水',emoji:'🧪',category:'消耗品',price:100,kind:'consume',forget:true,desc:'喝下后角色恢复到1级。'},
  evForgetPotion:{name:'学习力遗忘药剂',emoji:'🧪',category:'消耗品',price:500,kind:'consume',forgetEv:true,desc:'洗掉角色所有已分配的学习力，并全部清零。'},
  natureMint:{name:'性格修改卡',emoji:'🃏',category:'养成',price:100,kind:'consume',natureChange:true,desc:'随机改变角色的性格。'},
  natureMintSpec:{name:'性格指定卡',emoji:'🎴',category:'养成',price:300,kind:'consume',natureSpecify:true,desc:'指定改变角色的性格。'},
  vitalitySmall:{name:'小型活力豆',emoji:'🫘',category:'消耗品',price:15,kind:'consume',pp:5,desc:'恢复所有技能5点PP。'},
  vitalityMedium:{name:'中型活力豆',emoji:'🫘',category:'消耗品',price:30,kind:'consume',pp:10,desc:'恢复所有技能10点PP。'},
  vitalityLarge:{name:'大型活力豆',emoji:'🫘',category:'消耗品',price:60,kind:'consume',pp:20,desc:'恢复所有技能20点PP。'},
  healSmall:{name:'小型治疗丹',emoji:'🩹',category:'消耗品',price:10,kind:'consume',heal:20,healPercent:.2,desc:'恢复生命值。'},
  healMedium:{name:'中型治疗丹',emoji:'🩹',category:'消耗品',price:35,kind:'consume',heal:50,healPercent:.4,desc:'恢复更多生命值。'},
  healLarge:{name:'大型治疗丹',emoji:'🩹',category:'消耗品',price:80,kind:'consume',heal:100,healPercent:.6,desc:'强效治疗丹。'},
  levelFruit:{name:'升级果',emoji:'🍏',category:'养成',price:500,kind:'consume',addLevel:1,desc:'食用后直接提升1级。'},
  levelPill100:{name:'满级经验丹',emoji:'🔮',category:'养成',price:5000,kind:'consume',levelMax:true,desc:'使用后立即升到100级。'},
  expFruitSmall:{name:'小型成长果',emoji:'🫐',category:'养成',price:50,kind:'consume',expPoolSmall:true,desc:'食用者等级越高，所获得经验越多，至高可获得10万经验，至少1万经验。'},
  expFruitMid:{name:'中型成长果',emoji:'🍇',category:'养成',price:200,kind:'consume',expPoolMid:true,desc:'食用者等级越高，所获得经验越多，至高可获得20万经验，至少5万经验。'},
  expFruitLarge:{name:'大型成长果',emoji:'🍈',category:'养成',price:500,kind:'consume',expPoolLarge:true,desc:'食用者等级越高，所获得经验越多，至高可获得35万经验，至少15万经验。'},
  sand:{name:'沙石',emoji:'🪨',category:'材料',price:2,desc:'粗粝的沙石。'},
  crimsonGem:{name:'绯红宝石',emoji:'🔴',category:'道具',price:80,desc:'散发着热量的绯红宝石。'},
  hide:{name:'兽皮',emoji:'🟫',category:'材料',price:6,desc:'完整的兽皮。'},
  fang:{name:'兽牙',emoji:'🦷',category:'材料',price:7,desc:'锋利的兽牙。'},
  bone:{name:'兽骨',emoji:'🦴',category:'材料',price:5,desc:'坚硬的兽骨。'},
  magicCrystal:{name:'魔法晶矿',emoji:'🔷',category:'材料',price:40,desc:'蕴含魔力的晶矿。'},
  jungleEssence:{name:'丛林精华',emoji:'🌿',category:'材料',price:25,desc:'从密林野怪身上掉落的精华。'},
  ironArmor:{name:'铁制甲胄',emoji:'🥋',category:'防具',price:90,kind:'armor',slot:'chest',subType:'衣服',quality:'blue',pdef:6,mdef:2,hp:30,desc:'坚固的铁制甲胄，能抵御大部分物理攻击。'},
  elfCloak:{name:'精灵斗篷',emoji:'🧥',category:'防具',price:180,kind:'armor',slot:'chest',subType:'衣服',quality:'purple',pdef:4,mdef:4,hp:20,spd:5,passive:['治愈','缠绕'],desc:'轻盈的斗篷，蕴含自然之力。'},
  prophetHat:{name:'先知魔法帽',emoji:'🧙',category:'防具',price:150,kind:'armor',slot:'head',subType:'帽子',quality:'blue',hp:20,matk:5,passive:['预言'],desc:'神秘的魔法帽，当技能PP耗尽时，能激发预言之力恢复PP。'},
  bloodBlade:{name:'嗜血妖刀',emoji:'🗡️',category:'武器',price:150,kind:'weapon',slot:'hand',handType:'right',subType:'单手武器',quality:'purple',atk:10,spd:3,passive:['生命汲取','夺舍'],desc:'妖异的长刀，刀身仿佛在呼吸。'},
  scarletStaff:{name:'腥红权杖',emoji:'🪄',category:'武器',price:160,kind:'weapon',slot:'hand',handType:'right',subType:'单手武器',quality:'purple',matk:10,hp:15,passive:['生命汲取','夺舍'],desc:'散发着血腥气的权杖。'},
  shamanNecklace:{name:'萨满项链',emoji:'📿',category:'防具',price:80,kind:'armor',slot:'chest',subType:'项链',quality:'blue',pdef:3,mdef:3,hp:20,passive:['祭司'],desc:'古老萨满传承的项链。'},
  voidStone:{name:'虚空石',emoji:'🌌',category:'材料',price:60,desc:'来自虚空乱流的奇异石头。'},
  chaosJade:{name:'混沌玉',emoji:'🔮',category:'道具',price:120,desc:'一尊混沌之气凝结而成的玉石。'},
  ballBasic:{name:'初级捕捉球',emoji:'🔴',category:'消耗品',price:30,kind:'ball',catchBonus:0,desc:'基础的捕捉球，对虚弱的目标有几率捕捉成功。'},
  ballMid:{name:'中级捕捉球',emoji:'🔵',category:'消耗品',price:80,kind:'ball',catchBonus:0.15,desc:'中级的捕捉球，提升了捕捉成功率。'},
  ballHigh:{name:'高级捕捉球',emoji:'🟣',category:'消耗品',price:150,kind:'ball',catchBonus:0.3,desc:'高级的捕捉球，能大幅提升捕捉成功率。'},
  antiExplosionShield:{name:'特种兵防爆盾牌',emoji:'🛡️',category:'防具',price:300,kind:'armor',slot:'hand',handType:'left',subType:'盾牌',quality:'gold',pdef:8,mdef:8,spd:5,passive:['防爆','守护'],desc:'特种兵专用的重型防爆盾。'},
  dragonRing:{name:'至尊神龙之戒指',emoji:'💍',category:'武器',price:500,kind:'weapon',slot:'hand',handType:'two',subType:'双手武器',quality:'gold',atk:15,crit:10,critDmg:20,passive:['权能','贪心'],desc:'传说是神龙化身而成的戒指，蕴含着无上权能。'}
};

// 动态批量添加 30 种学习力果实
export const EV_STATS = [{k:'atk', n:'物攻'}, {k:'matk', n:'魔攻'}, {k:'hp', n:'体力'}, {k:'pdef', n:'物防'}, {k:'mdef', n:'魔防'}, {k:'spd', n:'速度'}];
export const EV_TIERS = [
  {tier:'普通', val:10,  price:20,  emoji:'🥝'},
  {tier:'高级', val:25,  price:50,  emoji:'🍋'},
  {tier:'大型', val:50,  price:100, emoji:'🍊'},
  {tier:'极品', val:100, price:200, emoji:'🍑'},
  {tier:'完美', val:256, price:500, emoji:'🍎'}
];
EV_STATS.forEach(stat => {
  EV_TIERS.forEach(tier => {
    ITEMS[`evFruit_${stat.k}_${tier.val}`] = {
      name: `${tier.tier}${stat.n}学习力`, emoji: tier.emoji, category: '养成', price: tier.price, kind: 'consume',
      evStat: stat.k, evVal: tier.val, desc: `使用后提高对应${stat.n}学习力${tier.val}点。`
    };
  });
});

export const MONSTERS = {
  bounceSeed:{id:'bounceSeed',name:'蹦蹦种子',emoji:'🌱',type:'木系',lv:[2,4],hp:40,atk:6,matk:2,pdef:2,mdef:1,spd:8,exp:25,gold:8,evYield:{hp:2},skills:['scratch','bite','ramM'],drops:[{id:'jungleEssence',chance:.3},{id:'leaf',chance:.6}],catchRate:0.6},
  onionHead:{id:'onionHead',name:'洋葱头',emoji:'🧅',type:'木系',lv:[3,6],hp:55,atk:8,matk:4,pdef:3,mdef:2,spd:7,exp:35,gold:12,evYield:{matk:2},skills:['scratch','magicBolt','vortex'],drops:[{id:'jungleEssence',chance:.35},{id:'magicCrystal',chance:.1}],catchRate:0.5},
  magicCat:{id:'magicCat',name:'魔力猫',emoji:'🐱',type:'幻系',lv:[4,6],hp:70,atk:10,matk:8,pdef:4,mdef:4,spd:14,exp:60,gold:25,evYield:{spd:3},skills:['bite','magicBolt','airCut','storm'],drops:[{id:'jungleEssence',chance:.5},{id:'magicCrystal',chance:.25}],catchRate:0.3},
  angryPig:{id:'angryPig',name:'暴躁小猪',emoji:'🐖',type:'火系',lv:[2,5],hp:45,atk:7,pdef:2,mdef:1,spd:9,exp:28,gold:9,evYield:{atk:2},skills:['ramM','scratch','frenzy'],drops:[{id:'hide',chance:.3}],catchRate:0.55},
  giantLizard:{id:'giantLizard',name:'史前巨蜥',emoji:'🦎',type:'龙系',lv:[6,12],hp:150,atk:18,matk:4,pdef:8,mdef:3,spd:6,exp:100,gold:40,evYield:{pdef:3},skills:['tear','ramM','airCut'],drops:[{id:'hide',chance:.6},{id:'bone',chance:.5}],catchRate:0.2},
  violentDragon:{id:'violentDragon',name:'暴躁龙',emoji:'🐉',type:'龙系',lv:[5,10],hp:120,atk:16,matk:8,pdef:6,mdef:4,spd:11,exp:80,gold:30,evYield:{atk:3},skills:['ramM','tear','storm'],drops:[{id:'hide',chance:.5}]},
  raptor:{id:'raptor',name:'迅猛龙',emoji:'🦖',type:'普通系',lv:[4,8],hp:90,atk:14,matk:2,pdef:4,mdef:2,spd:16,exp:55,gold:20,evYield:{spd:2},skills:['bite','frenzy','thrust'],drops:[{id:'hide',chance:.4}]},
  titanPython:{id:'titanPython',name:'泰坦巨蟒',emoji:'🐍',type:'爬行系',lv:[8,14],hp:180,atk:20,matk:6,pdef:7,mdef:5,spd:9,exp:130,gold:55,evYield:{hp:4},skills:['bite','tear','storm'],drops:[{id:'hide',chance:.7}]},
  boarKing:{id:'boarKing',name:'野蛮猪王',emoji:'🐗',type:'普通系',lv:[3,7],hp:80,atk:12,pdef:4,mdef:1,spd:8,exp:50,gold:18,evYield:{hp:3},skills:['ramM','bite'],drops:[{id:'hide',chance:.5}]},
  jungleWolf:{id:'jungleWolf',name:'丛林狼',emoji:'🐺',type:'普通系',lv:[3,6],hp:60,atk:10,pdef:3,mdef:1,spd:13,exp:40,gold:14,evYield:{atk:2},skills:['bite','frenzy'],drops:[{id:'hide',chance:.4}]},
  swampCroc:{id:'swampCroc',name:'沼泽鳄',emoji:'🐊',type:'水系',lv:[5,9],hp:110,atk:14,pdef:6,mdef:2,spd:5,exp:70,gold:26,evYield:{pdef:2},skills:['tear','ramM'],drops:[{id:'hide',chance:.5}]},
  snowWolf:{id:'snowWolf',name:'雪原狼',emoji:'🐺',type:'冰系',lv:[7,12],hp:100,atk:15,pdef:5,mdef:2,spd:15,exp:75,gold:28,evYield:{spd:3},skills:['bite','frenzy','airCut'],drops:[{id:'hide',chance:.5}]},
  stormDragon:{id:'stormDragon',name:'风暴龙',emoji:'🐲',type:'飞行系',lv:[12,18],hp:220,atk:22,matk:15,pdef:9,mdef:7,spd:12,exp:180,gold:80,evYield:{matk:3},skills:['storm','airCut','lightSpeedPunch'],drops:[{id:'magicCrystal',chance:.5}]},
  abyssGuard:{id:'abyssGuard',name:'深渊守卫',emoji:'👹',type:'恶魔系',lv:[35,40],hp:800,atk:50,pdef:20,mdef:15,spd:25,exp:500,gold:100,evYield:{pdef:4},skills:['assault','ramM','frenzy'],drops:[{id:'voidStone',chance:.6}]},
  voidWraith:{id:'voidWraith',name:'虚空怨灵',emoji:'👻',type:'暗系',lv:[40,45],hp:700,matk:60,pdef:10,mdef:25,spd:30,exp:550,gold:120,evYield:{mdef:4},skills:['surge','devour','storm'],drops:[{id:'voidStone',chance:.7}]},
  woodLord:{id:'woodLord',name:'朽木领主',emoji:'🦄',type:'木系',lv:[35,35],hp:2933,atk:30,matk:35,pdef:20,mdef:20,spd:15,exp:1000,gold:500,evYield:{hp:10},skills:['vineWhip','leafBlade','seedBomb','vineBind','thornArmor','photoSynthesize','thornStrike','leafShuriken','wither','rootBind','vineArmor'],drops:[{id:'magicCrystal',chance:1},{id:'gem',chance:.5}]}
};

export const MAPS = {
  qingfeng:{name:'清风大陆',regions:{
    //forest:{name:'原始森林',type:'gather',bg:'#1b2e1b',lv:'1~3',cost:2,items:['leaf','branch','egg','mushroom','berry'],commonMonsters:['angryPig'],rareMonsters:['boarKing']},
forest: { 
      name: '原始森林', type: 'explore', bg: '#76c959',
      subMaps: {
        forest_core: { name: '原始森林', nodes: [
          // 装饰物（不可交互）
          { type: 'decor', emoji: '🪨', x: 400, y: 420 },
          { type: 'decor', emoji: '🌸', x: 250, y: 100 },
          { type: 'decor', emoji: '🌲', x: 700, y: 450 },
          { type: 'decor', emoji: '🌿', x: 650, y: 80 },
          
          // NPC
          { id: 'npc_tian', type: 'npc', x: 300, y: 200, emoji: '👧', name: '田田' },
          
          // 资源
          { id: 'tree_1', type: 'gather', x: 180, y: 150, emoji: '🌳', name: '果树', drops: ['berry', 'branch', 'leaf'] },
          { id: 'tree_2', type: 'gather', x: 720, y: 180, emoji: '🌳', name: '果树', drops: ['berry', 'branch', 'leaf'] },
          { id: 'mushroom_1', type: 'gather', x: 550, y: 400, emoji: '🍄', name: '菇丛', drops: ['mushroom'] },
          { id: 'grass_1', type: 'gather', x: 150, y: 300, emoji: '🌾', name: '草丛', drops: ['leaf', 'egg'] },
          
          // 怪物 (新增了野蛮猪王)
          { id: 'pig_1', type: 'monster', x: 600, y: 300, emoji: '🐷', name: '暴躁小猪', monsterId: 'angryPig' },
          { id: 'pig_2', type: 'monster', x: 650, y: 220, emoji: '🐷', name: '暴躁小猪', monsterId: 'angryPig' },
          { id: 'boar_king', type: 'monster', x: 450, y: 100, emoji: '🐗', name: '野蛮猪王', monsterId: 'boarKing', isRare: true }
        ]},
        forest_path: { name: '林间小道', nodes: [
           { type: 'decor', emoji: '🌲', x: 100, y: 100 },
           { type: 'decor', emoji: '🌲', x: 700, y: 400 },
           { id: 'wolf_1', type: 'monster', x: 500, y: 250, emoji: '🐺', name: '丛林狼', monsterId: 'jungleWolf' }
        ]},
        forest_exit: { name: '森林出口', nodes: [] }
      }
    },
    
    
  
    
    magicForest:{name:'魔法密林',type:'gather',bg:'#16281a',lv:'2~6',cost:3,items:['magicCrystal','leaf','berry','branch'],commonMonsters:['bounceSeed','onionHead'],rareMonsters:['magicCat']},
    mushroomCave:{name:'蘑菇洞穴',type:'gather',bg:'#1c2220',lv:'3~7',cost:3,items:['mushroom','stone','leaf'],commonMonsters:['bounceSeed','angryPig'],rareMonsters:['magicCat']},
    orcCamp:{name:'精灵兽人营地',type:'gather',bg:'#2a2016',lv:'4~8',cost:3,items:['hide','fang','bone','branch'],commonMonsters:['jungleWolf','angryPig'],rareMonsters:['boarKing']},
    cave:{name:'原始洞穴',type:'gather',bg:'#1c1c22',lv:'3~8',cost:4,items:['stone','iron','copper','gem','diamond'],commonMonsters:['giantLizard'],rareMonsters:['titanPython']},
    kingdom:{name:'王国境内',type:'kingdom'},
    snowfield:{name:'雪原',type:'gather',bg:'#2a3040',lv:'7~12',cost:4,items:['stone','iron','branch'],commonMonsters:['snowWolf'],rareMonsters:['stormDragon']},
    grassland:{name:'草原',type:'gather',bg:'#2a3a1a',lv:'5~10',cost:3,items:['leaf','berry','branch','hide'],commonMonsters:['jungleWolf','angryPig'],rareMonsters:['boarKing']},
    desert:{name:'无尽荒漠',type:'gather',bg:'#3a3020',lv:'40~45',cost:6,items:['sand','stone','crimsonGem'],commonMonsters:['giantLizard'],rareMonsters:['titanPython']}
  }},
  forgotten:{name:'遗忘大陆',regions:{
    island:{name:'遗忘之岛',type:'gather',bg:'#1a2a2a',lv:'5~10',cost:4,items:['coconut','sand','berry','crimsonGem'],commonMonsters:['violentDragon','raptor'],rareMonsters:['titanPython']},
    noMansLand:{name:'无主之地',type:'gather',bg:'#2a2a20',lv:'10~15',cost:5,items:['stone','iron','bone'],commonMonsters:['swampCroc','jungleWolf'],rareMonsters:['stormDragon']},
    abandonedWaste:{name:'废弃荒原',type:'gather',bg:'#2a2018',lv:'12~18',cost:5,items:['stone','copper','hide'],commonMonsters:['giantLizard','swampCroc'],rareMonsters:['stormDragon']}
  }},
  polar:{name:'极北大陆',regions:{
    polarDomain:{name:'极北域',type:'gather',bg:'#202a38',lv:'15~20',cost:5,items:['stone','iron','magicCrystal'],commonMonsters:['snowWolf'],rareMonsters:['stormDragon']},
    taixuRuins:{name:'太虚遗迹',type:'gather',bg:'#28203a',lv:'20~25',cost:6,items:['magicCrystal','gem','diamond'],commonMonsters:['stormDragon'],rareMonsters:['titanPython']},
    coldMountains:{name:'极寒山脉',type:'gather',bg:'#1a2430',lv:'25~30',cost:6,items:['iron','copper','gem'],commonMonsters:['snowWolf','giantLizard'],rareMonsters:['stormDragon']}
  }},
  forgottenSea:{name:'遗忘海',regions:{
    sea:{name:'遗忘海',type:'gather',bg:'#0a1a2a',lv:'30~35',cost:6,items:['fish','sand','crimsonGem'],commonMonsters:['swampCroc','raptor'],rareMonsters:['titanPython']},
    sunkenCity:{name:'沉沦之城',type:'gather',bg:'#08101a',lv:'35~40',cost:7,items:['voidStone','bone','magicCrystal'],commonMonsters:['abyssGuard'],rareMonsters:['voidWraith']},
    burialAbyss:{name:'葬渊故地',type:'gather',bg:'#050a10',lv:'40~45',cost:8,items:['voidStone','chaosJade','gem'],commonMonsters:['abyssGuard','voidWraith'],rareMonsters:[]},
    voidTurbulence:{name:'虚空乱流',type:'gather',bg:'#020508',lv:'45~50',cost:9,items:['voidStone','chaosJade','diamond'],commonMonsters:['voidWraith'],rareMonsters:['abyssGuard']}
  }}
};

export const CHARACTER_TEMPLATES = {
  tiantian:{ id:'tiantian',name:'天天',emoji:'🧑',type:'木系',gender:'男',height:'165cm',weight:'50kg',intro:'热爱冒险的均衡型少年，物理与魔法兼修。', baseStats:{atk:2,matk:2,pdef:2,mdef:2,crit:12,critDmg:150,spd:10},baseHp:100,baseStamina:1000, skillPool:['ram','power','angrySlash','abyssHand','thrust','slam','earth','lightSpeedPunch'] },
  lele:{ id:'lele',name:'乐乐',emoji:'😄',type:'火系',gender:'男',height:'160cm',weight:'48kg',intro:'热血澎湃的物理战士，崇尚力量。', baseStats:{atk:4,matk:0,pdef:3,mdef:1,crit:15,critDmg:150,spd:12},baseHp:110,baseStamina:1000, skillPool:['ram','power','frenzy','thrust','abyssHand','angrySlash','giantPower','doomSpike'] },
  lili:{ id:'lili',name:'丽丽',emoji:'👧',type:'水系',gender:'女',height:'155cm',weight:'42kg',intro:'安静的魔法天才，掌控着强大的元素之力。', baseStats:{atk:0,matk:5,pdef:1,mdef:4,crit:10,critDmg:150,spd:8},baseHp:80,baseStamina:1000, skillPool:['ram','magic','magicBolt','airCut','magicBarrage','storm','meteorShower','healLight'] },
  bounceSeed:{ id:'bounceSeed',name:'蹦蹦种子',emoji:'🌱',type:'木系',gender:'无',height:'30cm',weight:'2kg',intro:'一只活跃的蹦蹦种子，喜欢在草丛里跳来跳去。', baseStats:{atk:5,matk:2,pdef:2,mdef:1,crit:5,critDmg:150,spd:9},baseHp:50,baseStamina:500, skillPool:['scratch','bite','ramM','lifeFlow'] },
  onionHead:{ id:'onionHead',name:'洋葱头',emoji:'🧅',type:'木系',gender:'无',height:'40cm',weight:'3kg',intro:'会释放魔法的洋葱头，切它的时候会让人流泪。', baseStats:{atk:4,matk:6,pdef:2,mdef:3,crit:5,critDmg:150,spd:8},baseHp:60,baseStamina:500, skillPool:['scratch','magicBolt','vortex','healLight'] },
  magicCat:{ id:'magicCat',name:'魔力猫',emoji:'🐱',type:'幻系',gender:'雌',height:'50cm',weight:'4kg',intro:'拥有高魔力的稀有猫咪，出没于密林深处。', baseStats:{atk:5,matk:8,pdef:3,mdef:4,crit:10,critDmg:150,spd:14},baseHp:70,baseStamina:600, skillPool:['bite','magicBolt','airCut','storm','clearMind'] },
  angryPig:{ id:'angryPig',name:'暴躁小猪',emoji:'🐖',type:'火系',gender:'雄',height:'60cm',weight:'15kg',intro:'动不动就会生气的小猪，撞击力不容小觑。', baseStats:{atk:7,matk:0,pdef:3,mdef:1,crit:5,critDmg:150,spd:8},baseHp:80,baseStamina:600, skillPool:['ramM','scratch','frenzy','giantPower'] },
  giantLizard:{ id:'giantLizard',name:'史前巨蜥',emoji:'🦎',type:'龙系',gender:'雄',height:'120cm',weight:'50kg',intro:'皮糙肉厚的史前生物，依靠坚硬的鳞甲生存。', baseStats:{atk:10,matk:2,pdef:6,mdef:2,crit:5,critDmg:150,spd:6},baseHp:120,baseStamina:800, skillPool:['tear','ramM','airCut','assault'] },
  woodLord:{ id:'woodLord',name:'朽木领主',emoji:'🦄',type:'木系',gender:'雌',height:'200cm',weight:'80kg',intro:'从荒芜中走来的森林领主，将为这片土地带来新生。', baseStats:{atk:10,matk:10,pdef:10,mdef:10,crit:10,critDmg:150,spd:10},baseHp:300,baseStamina:1000, skillPool:['vineWhip','seedBomb','wither','rootBind','vineArmor','thornArmor','leafBlade','leafShuriken','photoSynthesize'] }
};

export const TICKET_GOODS = [
  {id:'natureMint', buyPrice:10, currency:'tickets', stock:999, weeklyLimit:30},
  {id:'natureMintSpec', buyPrice:30, currency:'tickets', stock:999, weeklyLimit:10},
  {id:'levelFruit', buyPrice:100, currency:'tickets', stock:999, weeklyLimit:10},
  {id:'expFruitSmall', buyPrice:20, currency:'tickets', stock:999},
  {id:'expFruitMid', buyPrice:50, currency:'tickets', stock:999},
  {id:'expFruitLarge', buyPrice:100, currency:'tickets', stock:999},
  {id:'levelPill100', buyPrice:500, currency:'tickets', stock:999}
];
EV_STATS.forEach(stat => {
  EV_TIERS.forEach(tier => {
    TICKET_GOODS.push({id: `evFruit_${stat.k}_${tier.val}`, buyPrice: tier.price, currency: 'tickets', stock: 999});
  });
});

export const SHOP = {sections:[
  {type:'food', key:'meat', name:'肉蛋类', icon:'🥩', goods:[{id:'fish',buyPrice:15,stock:60},{id:'pork',buyPrice:18,stock:50},{id:'mutton',buyPrice:20,stock:40},{id:'chickenLeg',buyPrice:16,stock:60},{id:'egg',buyPrice:10,stock:80}]},
  {type:'food', key:'veg', name:'蔬菜类', icon:'🥬', goods:[{id:'cabbage',buyPrice:6,stock:80},{id:'radish',buyPrice:5,stock:90},{id:'cucumber',buyPrice:4,stock:100},{id:'mushroom',buyPrice:8,stock:50}]},
  {type:'food', key:'fruit', name:'水果类', icon:'🍎', goods:[{id:'apple',buyPrice:8,stock:100},{id:'pear',buyPrice:7,stock:100},{id:'peach',buyPrice:9,stock:80},{id:'banana',buyPrice:6,stock:120},{id:'grape',buyPrice:9,stock:100},{id:'watermelon',buyPrice:12,stock:80},{id:'coconut',buyPrice:10,stock:50}]},
  {type:'food', key:'drink', name:'饮品类', icon:'🥤', goods:[{id:'cola',buyPrice:6,stock:100},{id:'orangeJuice',buyPrice:5,stock:100},{id:'milk',buyPrice:8,stock:80},{id:'yogurt',buyPrice:7,stock:80},{id:'blackTea',buyPrice:12,stock:60},{id:'greenTea',buyPrice:12,stock:60},{id:'coffee',buyPrice:18,stock:50},{id:'daoTea',buyPrice:50,stock:20}]},
  {type:'consume', key:'heal', name:'治疗恢复', icon:'🩹', goods:[{id:'healSmall',buyPrice:10,stock:100},{id:'healMedium',buyPrice:35,stock:60},{id:'healLarge',buyPrice:80,stock:30},{id:'vitalitySmall',buyPrice:15,stock:100},{id:'vitalityMedium',buyPrice:30,stock:60},{id:'vitalityLarge',buyPrice:60,stock:50},{id:'pill',buyPrice:20,stock:50}]},
  {type:'consume', key:'catch', name:'捕捉球', icon:'🔴', goods:[{id:'ballBasic',buyPrice:30,stock:50},{id:'ballMid',buyPrice:80,stock:30},{id:'ballHigh',buyPrice:150,stock:10}]},
  {type:'consume', key:'boost', name:'强化养成', icon:'🧪', goods:[{id:'evForgetPotion',buyPrice:500,stock:10},{id:'forgetPotion',buyPrice:100,stock:20}]},
  {type:'consume', key:'exp', name:'经验丹', icon:'🟢', goods:[{id:'expSmall',buyPrice:20,stock:100},{id:'expMedium',buyPrice:80,stock:50},{id:'expLarge',buyPrice:200,stock:20}]},
  {type:'ticket', key:'ticketShop', name:'点券商店', icon:'🎫', goods: TICKET_GOODS}
]};

export const RECIPES = [
  {id:'blade',gold:80,mats:{iron:3}},{id:'dagger',gold:60,mats:{iron:2,copper:1}},{id:'shield',gold:30,mats:{branch:4}},
  {id:'robe',gold:140,mats:{copper:2,gem:1}},{id:'pill',gold:40,mats:{mushroom:2}},{id:'axe',gold:300,mats:{iron:6}},
  {id:'boots',gold:120,mats:{branch:2,copper:1}},{id:'crown',gold:250,mats:{copper:3,gem:1}},{id:'footChain',gold:100,mats:{leaf:8,copper:1}},
  {id:'magicBook',gold:120,mats:{copper:2,leaf:4}},{id:'voidStaff',gold:400,mats:{gem:2,copper:4}},
  {id:'apprenticeStaff',gold:50,mats:{branch:3,copper:1}},{id:'elfBow',gold:220,mats:{branch:6,copper:2,gem:1}},
  {id:'ironArmor',gold:100,mats:{iron:5,copper:3}},
  {id:'elfCloak',gold:300,mats:{jungleEssence:3,hide:5,branch:10}},
  {id:'prophetHat',gold:200,mats:{magicCrystal:2,gem:1,leaf:5}},
  {id:'bloodBlade',gold:500,mats:{iron:6,fang:3,gem:2}},
  {id:'scarletStaff',gold:500,mats:{copper:4,magicCrystal:2,crimsonGem:1}},
  {id:'shamanNecklace',gold:200,mats:{bone:4,jungleEssence:2,leaf:10}},
  {id:'antiExplosionShield',gold:800,mats:{iron:10,gem:2,diamond:1}},
  {id:'dragonRing',gold:1000,mats:{iron:15,gem:3,diamond:2,chaosJade:1}}
];