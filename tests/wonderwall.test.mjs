import test from 'node:test';
import assert from 'node:assert/strict';
import { emptySave, addEvent, summary, validateSave, rank, SHOP } from '../static/wonderwall/core.mjs';
const date = new Date('2026-10-08T12:00:00Z');
let nextId = 0;
const add = (save, action, when = date) => addEvent(save, action, when, `test-${++nextId}`);
test('300 + 400 + 300 字跨 session 累积，零头不会丢失', () => {
  let { save, event } = add(emptySave(), { type: 'words', amount: 300 });
  assert.equal(event.coins, 0); assert.equal(summary(save).carryWords, 300);
  ({ save, event } = add(save, { type: 'words', amount: 400 }));
  assert.equal(event.coins, 1); assert.equal(summary(save).carryWords, 200);
  ({ save, event } = add(save, { type: 'words', amount: 300 }));
  assert.equal(event.coins, 1); assert.equal(summary(save).carryWords, 0);
  assert.equal(summary(save).totalWords, 1000); assert.equal(summary(save).balance, 2);
});
test('1376 字获得 2 WC 并留下 376 字', () => {
  const { save, event } = add(emptySave(), { type: 'words', amount: 1376 });
  assert.equal(event.coins, 2); assert.equal(summary(save).carryWords, 376);
});
test('隐形创作跨次累计，与实际字数分别记录', () => {
  let { save } = add(emptySave(), { type: 'words', amount: 300 });
  ({ save } = add(save, { type: 'invisible', amount: 30 }));
  const result = add(save, { type: 'invisible', amount: 65 });
  const state = summary(result.save);
  assert.equal(result.event.coins, 2); assert.equal(state.carryMinutes, 5);
  assert.equal(state.carryWords, 300); assert.equal(state.totalWords, 300);
  assert.equal(state.invisibleMinutes, 95); assert.equal(state.equivalentWords, 1000);
});
test('Boss 奖励为 1–5，并永久记录具体成就', () => {
  const { save } = add(emptySave(), { type: 'boss', coins: 5, note: '完成世界一' });
  assert.equal(summary(save).bosses[0].note, '完成世界一'); assert.equal(summary(save).balance, 5);
  for (const coins of [0, 6, 1.5, NaN]) assert.throws(() => add(save, { type: 'boss', coins, note: '通关' }));
  assert.throws(() => add(save, { type: 'boss', coins: 1, note: '  ' }));
});
test('兑换扣当前余额，累计获得与历史字数保持完整', () => {
  let { save } = add(emptySave(), { type: 'words', amount: 5000 });
  ({ save } = add(save, { type: 'redeem', itemId: 'meal' }));
  const state = summary(save);
  assert.equal(state.balance, 0); assert.equal(state.earned, 10); assert.equal(state.redeemed, 10);
  assert.equal(state.totalWords, 5000); assert.equal(save.events[1].note, '出去搓一顿');
  assert.throws(() => add(save, { type: 'redeem', itemId: 'drink' }));
});
test('序列化导出再导入保持所有进度，并从零头继续计算', () => {
  let { save } = add(emptySave(), { type: 'words', amount: 1376 });
  ({ save } = add(save, { type: 'boss', coins: 2, note: '<script>这只是文本</script>' }));
  ({ save } = add(save, { type: 'redeem', itemId: 'drink' }));
  const restored = validateSave(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(restored, save);
  const result = add(restored, { type: 'words', amount: 124 });
  assert.equal(result.event.coins, 1); assert.equal(summary(result.save).balance, 3);
});
test('拒绝伪造金币、超额兑换、重复记录和未知类型的存档', () => {
  const { save } = add(emptySave(), { type: 'words', amount: 1376 });
  for (const change of [{ coins: 10 }, { amount: -100 }, { type: 'unknown' }, { note: null }]) {
    assert.throws(() => validateSave({ version: 1, events: [{ ...save.events[0], ...change }] }));
  }
  assert.throws(() => validateSave({ version: 1, events: [...save.events, ...save.events] }));
  assert.throws(() => validateSave({ version: 2, events: [] }));
  assert.throws(() => validateSave({ version: 1, events: [{ ...save.events[0], type: 'redeem', itemId: 'sea', coins: 30 }] }));
});
test('休息与跨天不清空进度，今天 600 字仍为 C Rank', () => {
  let { save } = add(emptySave(), { type: 'words', amount: 4000 });
  const tomorrow = new Date('2026-10-09T12:00:00Z');
  ({ save } = add(save, { type: 'words', amount: 600 }, tomorrow));
  const state = summary(save, save.events[1].day);
  assert.equal(state.todayWords, 600); assert.equal(rank(state.todayWords).label, 'C');
  assert.equal(state.balance, 9); assert.equal(state.totalWords, 4600);
  assert.equal(summary(save, '2030-01-01').balance, 9);
});
test('Rank 边界与专属商店价格', () => {
  assert.deepEqual([1, 499, 500, 999, 1000, 1999, 2000, 2999, 3000].map(n => rank(n).label), ['🔥', '🔥', 'C', 'C', 'B', 'B', 'A', 'A', 'S']);
  assert.deepEqual(SHOP.map(item => item.price), [2, 4, 6, 10, 20, 30, 40, 60]);
});
test('拒绝小数、负数、空输入和非有限数', () => {
  for (const type of ['words', 'invisible']) for (const amount of [0, -1, 1.5, NaN, Infinity, '500']) assert.throws(() => add(emptySave(), { type, amount }));
});
