## 1. 规格

- [x] 1.1 为施工方案 DOCX 运行时硬化补齐 proposal、design 和 spec delta。
- [x] 1.2 明确本次只做运行时诊断与解析链路硬化，不扩展预览架构或业务功能。

## 2. 实现

- [x] 2.1 在后端统一封装 DOCX 对象下载 fetch 解析与安全错误信息。
- [x] 2.2 扩展 `/api/health` 运行时诊断，暴露安全的 Node/fetch 能力摘要。
- [x] 2.3 增加定向 smoke，覆盖当前源码不再依赖 `node-fetch` 且健康检查可读。

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck`。
- [x] 3.2 运行 `node --test server/reviewRuntimeHardeningSmoke.test.mjs`。
- [x] 3.3 运行 `pnpm smoke:review:docx`。

## 4. 归档

- [x] 4.1 同步任务状态与实现结论。
- [ ] 4.2 若验证通过，准备归档并同步长期 spec。
