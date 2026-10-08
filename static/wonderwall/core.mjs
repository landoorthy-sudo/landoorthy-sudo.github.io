export const VERSION = 1;
export const STORAGE_KEY = 'wonderwall.save.v1';
export const SHOP = [
  { id: 'drink', icon: '🧋', name: '好喝的', price: 2, detail: '果茶、奶茶、特调，选一杯你喜欢的。', tag: '一口快乐' },
  { id: 'dessert', icon: '🍰', name: '小甜品', price: 4, detail: '把一直想吃的小蛋糕带回家。', tag: '甜蜜掉落' },
  { id: 'tea', icon: '🧋🍰', name: '下午茶 Combo', price: 6, detail: '好喝的 + 小甜品，快乐成套掉落。', tag: '双倍快乐' },
  { id: 'meal', icon: '🍜', name: '出去搓一顿', price: 10, detail: '今天离开厨房，吃一顿真正想吃的。', tag: '厨房放假' },
  { id: 'feast', icon: '🍽️', name: '豪华搓饭', price: 20, detail: '去那家平时觉得没必要专门去的店。', tag: '稀有奖励' },
  { id: 'sea', icon: '🌊', name: '海滨公园出逃', price: 30, detail: '耳机、饮料、海风。晃半天，随便发呆。', tag: '现实世界 DLC' },
  { id: 'sea-plus', icon: '🏖️', name: '海滨公园豪华 DLC', price: 40, detail: '去看海，再找一家喜欢的咖啡店。', tag: '扩展地图' },
  { id: 'big', icon: '👑', name: '阶段大礼包', price: 60, detail: '你当时最想吃、想去、想买的，自选。', tag: '传说级掉落' },
];
export function emptySave() { return { version: VERSION, events: [] }; }
export function rank(words) {
  if (words >= 3000) return { label: 'S', name: '今天有大动静', icon: '👑' };
  if (words >= 2000) return { label: 'A', name: '故事明显推进', icon: '⚡' };
  if (words >= 1000) return { label: 'B', name: '有效写作日', icon: '✍️' };
  if (words >= 500) return { label: 'C', name: '成功进入故事', icon: '🌱' };
  return { label: '🔥', name: words ? '点火成功' : '随时可以回来', icon: '🔥' };
}
function integer(value, min, max = 1000000000) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validateSave(input) {
  if (!input || input.version !== VERSION || !Array.isArray(input.events) || input.events.length > 100000) throw Error('这不是有效的 Wonderwall v1 存档。');
  const ids = new Set();
  let balance = 0, wordCarry = 0, minuteCarry = 0;
  const events = input.events.map(event => {
    if (!event || typeof event.id !== 'string' || !event.id || event.id.length > 100 || ids.has(event.id) || typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at)) || typeof event.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event.day) || typeof event.note !== 'string' || event.note.length > 500 || !integer(event.coins, 0)) throw Error('存档记录不完整或重复，请检查原文件。');
    ids.add(event.id);
    const clean = { id: event.id, at: event.at, day: event.day, type: event.type, note: event.note, coins: event.coins };
    if (event.type === 'words') {
      if (!integer(event.amount, 1)) throw Error('字数记录无效。');
      const amount = wordCarry + event.amount;
      if (event.coins !== Math.floor(amount / 500)) throw Error('字数与金币记录不一致。');
      wordCarry = amount % 500; clean.amount = event.amount; balance += event.coins;
    } else if (event.type === 'invisible') {
      if (!integer(event.amount, 1, 1000000)) throw Error('Invisible Writing 时间无效。');
      const amount = minuteCarry + event.amount;
      if (event.coins !== Math.floor(amount / 45)) throw Error('时间与金币记录不一致。');
      minuteCarry = amount % 45; clean.amount = event.amount; balance += event.coins;
    } else if (event.type === 'boss') {
      if (!integer(event.coins, 1, 5) || !event.note.trim()) throw Error('Boss 奖励应为 1–5 WC，并写下这次成就。');
      balance += event.coins;
    } else if (event.type === 'redeem') {
      const item = SHOP.find(item => item.id === event.itemId);
      if (!item || item.price !== event.coins || balance < event.coins) throw Error('兑换记录无效或余额不足。');
      clean.itemId = item.id; balance -= event.coins;
    } else throw Error('未知的存档记录类型。');
    return clean;
  });
  return { version: VERSION, events };
}
export function summary(save, day = localDay()) {
  let totalWords = 0, invisibleMinutes = 0, earned = 0, redeemed = 0, todayWords = 0;
  const bosses = [];
  for (const event of save.events) {
    if (event.type === 'redeem') { redeemed += event.coins; continue; }
    earned += event.coins;
    if (event.type === 'words') { totalWords += event.amount; if (event.day === day) todayWords += event.amount; }
    if (event.type === 'invisible') invisibleMinutes += event.amount;
    if (event.type === 'boss') bosses.push(event);
  }
  return { totalWords, invisibleMinutes, equivalentWords: Math.floor(invisibleMinutes / 45) * 500, earned, redeemed, balance: earned - redeemed, carryWords: totalWords % 500, carryMinutes: invisibleMinutes % 45, todayWords, bosses };
}
export function addEvent(save, action, date = new Date(), id = globalThis.crypto.randomUUID()) {
  const clean = validateSave(save);
  const state = summary(clean);
  const event = { id, at: date.toISOString(), day: localDay(date), type: action.type, note: String(action.note ?? '').trim(), coins: 0 };
  if (action.type === 'words') {
    if (!integer(action.amount, 1)) throw Error('填一个大于 0 的整数字数，就可以存档。');
    event.amount = action.amount; event.coins = Math.floor((state.carryWords + action.amount) / 500);
  } else if (action.type === 'invisible') {
    if (!integer(action.amount, 1, 1000000)) throw Error('填一个大于 0 的整数分钟数。');
    event.amount = action.amount; event.coins = Math.floor((state.carryMinutes + action.amount) / 45);
  } else if (action.type === 'boss') {
    if (!integer(action.coins, 1, 5) || !event.note) throw Error('写下这次 Boss Clear，奖励选 1–5 WC。');
    event.coins = action.coins;
  } else if (action.type === 'redeem') {
    const item = SHOP.find(item => item.id === action.itemId);
    if (!item) throw Error('没有找到这个奖励。');
    if (state.balance < item.price) throw Error('金币还在路上，这个奖励会一直等你。');
    event.coins = item.price; event.itemId = item.id; event.note = item.name;
  } else throw Error('未知操作。');
  const next = validateSave({ version: VERSION, events: [...clean.events, event] });
  return { save: next, event };
}
