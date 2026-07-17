## 1. 规格与数据边界

- [x] 1.1 编写 packet inventory manifest 的 proposal、design 与 delta specs。
- [x] 1.2 明确 packet inventory 的来源优先级、持久化位置与安全诊断字段。

## 2. 后端 packet inventory

- [x] 2.1 扩展 opening-condition pilot packet 数据模型，支持 inventory entries。
- [x] 2.2 在 intake/init 与 packet intake 中接入 inventory 解析：显式输入优先，否则由 sourceObjects 默认派生。
- [x] 2.3 让 formal match 优先使用 packet inventory entries 作为候选来源。
- [x] 2.4 为 inventory 派生、显式清单与 matching 命中路径补 focused tests。

## 3. 前端与文档契约

- [x] 3.1 扩展 frontend typed contract，支持 inventory entries 与 inventory diagnostics。
- [x] 3.2 同步 pilot workflow/docs，让下一阶段 ZIP manifest / OCR 接入有统一边界。

## 4. 验证与归档

- [x] 4.1 运行最小 typecheck 与 pilot store 定向测试。
- [x] 4.2 同步主 specs/docs，并在完成后归档本次 change。
