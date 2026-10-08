# Wonderwall

GitHub Pages 上的纯静态创作奖励游戏，访问 `/wonderwall/`。Hugo 将 `static/wonderwall/` 原样复制到输出目录；主页「工具栏」中的入口由 `content/tools/wonderwall.md` 提供，该条目直接链接到游戏，不生成额外介绍页。

[桌面预览](wonderwall-preview.png) · [手机预览](wonderwall-mobile.png)

## 游戏规则

- 新增字数每 500 字获得 1 WC，零头跨 session 和日期累计。
- Invisible Writing 每 45 分钟获得 1 WC，时间零头单独累计。实际新增字数与等价工作量分别显示。
- Boss Clear 由作者自己认定，每次额外奖励 1–5 WC。
- 商店奖励价格为 2、4、6、10、20、30、40、60 WC；兑换生成日志中的奖励券，实际消费由作者安排。
- 没有负分、连续打卡要求、字数债务或休息惩罚。今日 Rank 按当天实际新增字数计算，S Rank 不额外自动发币，也不会改变未来标准。

## 存档

初始为空存档。所有记录仅保存在当前域名和浏览器的 `localStorage`，键名为 `wonderwall.save.v1`；无账号、后端或 AI 调用。导出 JSON 后可在另一设备手动导入。导入前校验完整事件和金币，显示摘要并确认替换；支持先备份当前存档。损坏存档不会被空档覆盖，导出会保留原始内容用于恢复。

支持 Web Locks 的浏览器会对同源跨标签页结算加锁，写入前读取最新存档；其他浏览器提供存储事件同步，但不保证同时提交的原子性。清理网站数据或使用隐私浏览模式可能丢失本地存档，请定期导出。

NPC 文案是本地文本，用户战报始终作为纯文本呈现。页面使用 CSS 绘制金币与海边插画；Google Fonts 加载失败时使用系统字体。减少动态效果偏好会关闭金币动画。

## 本地检查

```sh
node --check static/wonderwall/app.mjs
node --test tests/wonderwall.test.mjs
hugo --minify --destination /tmp/wonderwall-public
python -m http.server 8765 --directory /tmp/wonderwall-public
```

打开 `http://localhost:8765/wonderwall/`。请在测试浏览器中试玩，测试数据会保存到该浏览器的存档里。

第一版验证：10 项结算与存档单元测试通过；Hugo Extended 0.147.9 构建通过。Chromium 实际操作验证了新增字数、隐形创作、Boss 奖励、商店兑换、刷新持久化、JSON 导出导入、双标签页并发提交、非法导入拒绝与损坏存档原样导出；320、390、768 px 页面无横向溢出，桌面和手机页面无 JavaScript 异常。
