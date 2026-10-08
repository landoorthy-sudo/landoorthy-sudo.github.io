import { SHOP, STORAGE_KEY, emptySave, validateSave, summary, addEvent, rank } from './core.mjs';

const $ = selector => document.querySelector(selector);
const format = number => number.toLocaleString('zh-CN');
let save = emptySave(), storageFailure = false, invalidRaw = null, pendingItem = null, pendingImport = null, historyLimit = 8;
let toastTimeout;
function toast(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 5500);
}
function readSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) { storageFailure = false; invalidRaw = null; return emptySave(); }
    try { const parsed = validateSave(JSON.parse(raw)); storageFailure = false; invalidRaw = null; return parsed; }
    catch { invalidRaw = raw; storageFailure = true; throw Error('现有存档无法读取。请先导出保留原文件，再导入有效存档；原数据没有被覆盖。'); }
  } catch (error) {
    storageFailure = true;
    throw Error(invalidRaw !== null ? error.message : '浏览器无法访问存档。请允许此网站使用本地存储，再刷新页面。');
  }
}
function persist(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  save = next; storageFailure = false; invalidRaw = null;
}
async function withLock(action) {
  if (navigator.locks) return navigator.locks.request(STORAGE_KEY, action);
  return action();
}
async function commit(action) {
  return withLock(() => {
    const current = readSave();
    const result = addEvent(current, action);
    try { persist(result.save); }
    catch { throw Error('这次存档没有保存成功，请检查浏览器存储空间后重试。金币尚未扣除或增加。'); }
    render(); return result.event;
  });
}
function render() {
  const state = summary(save);
  for (const [selector, value] of Object.entries({ '#balance': state.balance, '#total-words': state.totalWords, '#earned': state.earned, '#boss-count': state.bosses.length, '#carry-words': state.carryWords })) $(selector).textContent = format(value);
  $('#invisible-total').textContent = `${format(state.invisibleMinutes)} 分钟 · ${format(state.equivalentWords)} 字等价`;
  $('#carry-minutes').textContent = `${state.carryMinutes} / 45 分钟`;
  $('#redeemed').textContent = `${format(state.redeemed)} WC`;
  $('#sea-progress').value = Math.min(30, state.balance);
  $('#sea-progress-label').textContent = `${format(state.balance)} / 30 WC`;
  $('#sea-status').textContent = state.balance >= 30 ? '海风地图已解锁！' : '快乐地图，慢慢解锁';
  $('#sea-redeem').disabled = state.balance < 30 || storageFailure;
  $('#sea-redeem').textContent = state.balance >= 30 ? '去海边吧 · 兑换 30 WC ↗' : '海风会等你 · 30 WC';
  $('#storage-status').textContent = storageFailure ? '存档读取受阻，已暂停结算。可以导出原文件，或导入有效备份。' : '存档保存在当前浏览器；换设备前，先导出带走。';
  document.querySelectorAll('.submit').forEach(button => { button.disabled = storageFailure; });
  const shop = $('#shop'); shop.replaceChildren();
  for (const item of SHOP) {
    const card = document.createElement('article'); card.className = 'shop-item';
    const icon = document.createElement('div'); icon.className = 'shop-icon'; icon.textContent = item.icon; icon.setAttribute('aria-hidden', 'true');
    const tag = document.createElement('span'); tag.className = 'shop-tag'; tag.textContent = item.tag;
    const title = document.createElement('h3'); title.textContent = item.name;
    const detail = document.createElement('p'); detail.textContent = item.detail;
    const bottom = document.createElement('div'); bottom.className = 'shop-bottom';
    const price = document.createElement('span'); price.className = 'shop-price'; price.append(String(item.price), Object.assign(document.createElement('small'), { textContent: ' WC' }));
    const button = document.createElement('button'); button.type = 'button'; button.disabled = state.balance < item.price || storageFailure;
    button.textContent = state.balance >= item.price ? '兑换 ↗' : `还差 ${item.price - state.balance} WC`;
    button.setAttribute('aria-label', `兑换${item.name}，${item.price} WC`);
    button.addEventListener('click', () => openRedeem(item));
    bottom.append(price, button); card.append(icon, tag, title, detail, bottom); shop.append(card);
  }
  renderList($('#history'), [...save.events].reverse().slice(0, historyLimit), '还没有冒险记录。<br>你的第一个字，就是第一颗火星。');
  renderList($('#bosses'), [...state.bosses].reverse(), 'Boss 图鉴等你点亮。<br>回到故事里，也可以是一次 Boss Clear。');
  $('#show-more').hidden = save.events.length <= historyLimit;
}
function renderList(container, events, emptyText) {
  container.replaceChildren();
  if (!events.length) {
    const empty = document.createElement('p'); empty.className = 'empty-state';
    emptyText.split('<br>').forEach((line, index) => { if (index) empty.append(document.createElement('br')); empty.append(line); });
    container.append(empty); return;
  }
  for (const event of events) {
    const row = document.createElement('div'); row.className = 'event-row';
    const icon = document.createElement('span'); icon.className = 'event-icon'; icon.setAttribute('aria-hidden', 'true');
    icon.textContent = { words: '✍️', invisible: '🧠', boss: '👑', redeem: '🎁' }[event.type];
    const copy = document.createElement('div'); copy.className = 'event-copy';
    const title = document.createElement('strong');
    title.textContent = event.type === 'words' ? `故事前进了 ${format(event.amount)} 字` : event.type === 'invisible' ? `隐形创作 ${format(event.amount)} 分钟` : event.type === 'boss' ? event.note : `奖励券：${event.note}`;
    const note = document.createElement('p'); note.textContent = ['words', 'invisible'].includes(event.type) ? event.note : event.type === 'boss' ? 'BOSS DEFEATED · 历史成就永久保留' : '快乐已兑换，随时去享用';
    const time = document.createElement('time'); time.dateTime = event.at; time.textContent = `${event.day} · ${new Date(event.at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    copy.append(title, note, time);
    const coins = document.createElement('span'); coins.className = `event-coins${event.type === 'redeem' ? ' spent' : ''}`;
    coins.textContent = `${event.type === 'redeem' ? '−' : '+'}${format(event.coins)} WC`;
    row.append(icon, copy, coins); container.append(row);
  }
}
function celebrate(event) {
  const state = summary(save), dayRank = rank(state.todayWords);
  const isBoss = event.type === 'boss', isInvisible = event.type === 'invisible', isRedeem = event.type === 'redeem';
  $('#result-kicker').textContent = isBoss ? 'BOSS DEFEATED · 全服公告' : isRedeem ? 'REWARD UNLOCKED' : 'WONDERWALL SAVE COMPLETE';
  $('#result-icon').textContent = isBoss ? '👑' : isRedeem ? SHOP.find(item => item.id === event.itemId).icon : isInvisible ? '🧠' : dayRank.icon;
  $('#result-title').textContent = isBoss ? '这次，Boss 被你拿下了。' : isRedeem ? event.note + '，安排！' : isInvisible ? '看不见的创作，也算数。' : event.coins ? '嘿嘿，写文爆金币了。' : '点火成功，每个字都存好了。';
  $('#result-coins').textContent = `${isRedeem ? '−' : '+'}${format(event.coins)} WC`;
  $('#result-message').textContent = isBoss ? `「${event.note}」——这是你亲手推进故事留下的成就，永久进入 Boss 图鉴。` : isRedeem ? '奖励券已经放进冒险日志。挑一个你喜欢的时候，把这份快乐领回现实。' : isInvisible ? `你认真处理了 ${format(event.amount)} 分钟的故事问题。没有留下新字的工作，也有它的重量。` : state.todayWords >= 3000 ? `${format(event.amount)} 个新字已存档！今日 S Rank，全服礼花就位。这次爆更是庆典，下一次写一点也照样爆金币。` : `${format(event.amount)} 个新字进入了你的故事。${event.note ? `「${event.note}」——这一笔推进，已经记下了。` : '人物又多了一段可以发生的生活。'}`;
  $('#result-detail').textContent = isRedeem ? `当前余额 ${format(state.balance)} WC · 这份奖励不会过期` : isBoss ? `当前余额 ${format(state.balance)} WC · 第 ${state.bosses.length} 次 Boss Clear` : isInvisible ? `时间零头 ${state.carryMinutes} / 45 分钟 · 当前余额 ${format(state.balance)} WC` : `今日 ${format(state.todayWords)} 字 · ${dayRank.label} Rank · ${dayRank.name} · 字数零头 ${state.carryWords} / 500`;
  $('#npc-line').textContent = isBoss ? '公告发完了。请作者本人签收皇冠。' : isRedeem ? '记得真的去享受奖励，快乐不用性价比最大化。' : event.coins ? '叮，金币已到账。零头也帮你收进背包了。' : '火星已经存好了，下次回来就接着亮。';
  $('#result-dialog').showModal();
  if (event.coins && !isRedeem) burst(event.coins);
}
function burst(coins) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const container = $('#coin-burst'); container.replaceChildren();
  for (let i = 0; i < Math.min(18, coins * 3 + 3); i++) {
    const coin = document.createElement('span'); coin.className = 'flying-coin'; coin.textContent = '🪙';
    coin.style.setProperty('--dx', `${(Math.random() - .5) * 650}px`); coin.style.setProperty('--dy', `${-100 - Math.random() * 300}px`);
    coin.style.animationDelay = `${Math.random() * .22}s`; container.append(coin);
  }
  setTimeout(() => container.replaceChildren(), 1600);
}
function selectTab(button) {
  document.querySelectorAll('[data-tab]').forEach(tab => { const active = tab === button; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
  document.querySelectorAll('[data-form]').forEach(form => { form.hidden = form.dataset.form !== button.dataset.tab; });
  $('#form-error').hidden = true;
}
document.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', () => selectTab(button));
  button.addEventListener('keydown', event => {
    const tabs = [...document.querySelectorAll('[data-tab]')]; const index = tabs.indexOf(button);
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') next = tabs[0]; if (event.key === 'End') next = tabs.at(-1);
    if (next) { event.preventDefault(); selectTab(next); next.focus(); }
  });
});
document.querySelectorAll('[data-form]').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault(); $('#form-error').hidden = true;
  const button = form.querySelector('[type=submit]'); button.disabled = true;
  const data = new FormData(form);
  try {
    const saved = await commit({ type: form.dataset.form, amount: Number(data.get('amount')), coins: Number(data.get('coins')), note: data.get('note') });
    form.reset(); celebrate(saved);
  } catch (error) { $('#form-error').textContent = error.message; $('#form-error').hidden = false; }
  finally { button.disabled = storageFailure; }
}));
function openRedeem(item) {
  pendingItem = item;
  $('#redeem-icon').textContent = item.icon; $('#redeem-title').textContent = item.name;
  $('#redeem-detail').textContent = item.detail;
  $('#redeem-cost').textContent = `花费 ${item.price} WC · 当前余额 ${format(summary(save).balance)} WC`;
  $('#redeem-dialog').showModal();
}
$('#sea-redeem').addEventListener('click', () => openRedeem(SHOP.find(item => item.id === 'sea')));
$('#confirm-redeem').addEventListener('click', async () => {
  if (!pendingItem) return;
  const button = $('#confirm-redeem'); button.disabled = true;
  try { const event = await commit({ type: 'redeem', itemId: pendingItem.id }); $('#redeem-dialog').close(); pendingItem = null; celebrate(event); }
  catch (error) { toast(error.message); }
  finally { button.disabled = false; }
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#show-more').addEventListener('click', () => { historyLimit += 20; render(); });
function exportSave() {
  try { save = readSave(); render(); } catch { /* Export the original unreadable file rather than destroying it. */ }
  const raw = invalidRaw !== null ? invalidRaw : JSON.stringify(save, null, 2);
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `wonderwall-save-${new Date().toISOString().slice(0, 10)}${invalidRaw !== null ? '-recovery' : ''}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('存档已打包。换设备时，把它带走就好。');
}
$('#export').addEventListener('click', exportSave); $('#backup-before-import').addEventListener('click', exportSave);
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  try {
    if (file.size > 20 * 1024 * 1024) throw Error('文件太大了，请选择 20 MB 以内的 JSON 存档。');
    pendingImport = validateSave(JSON.parse(await file.text()));
    const state = summary(pendingImport);
    $('#import-summary').textContent = `${pendingImport.events.length} 条记录 · ${format(state.totalWords)} 字 · 余额 ${format(state.balance)} WC · ${state.bosses.length} 次 Boss Clear`;
    $('#import-dialog').showModal();
  } catch (error) { pendingImport = null; toast(error instanceof SyntaxError ? '这份文件不是有效的 JSON 存档。' : error.message); }
});
$('#confirm-import').addEventListener('click', async () => {
  if (!pendingImport) return;
  const button = $('#confirm-import'); button.disabled = true;
  try { await withLock(() => persist(validateSave(pendingImport))); pendingImport = null; $('#import-dialog').close(); $('#form-error').hidden = true; render(); toast('冒险已接续。历史成就都在，欢迎回来。'); }
  catch { toast('导入没有保存成功，当前存档保持原样。请检查浏览器本地存储。'); }
  finally { button.disabled = false; }
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  try { save = readSave(); render(); toast('已接续另一个标签页的最新存档。'); }
  catch (error) { render(); toast(error.message); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  try { save = readSave(); render(); } catch (error) { render(); toast(error.message); }
});
try { save = readSave(); } catch (error) { toast(error.message); }
render();
