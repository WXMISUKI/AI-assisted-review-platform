## 1. 规格与契约

- [x] 1.1 编写 ZIP manifest extraction 的 proposal、design 与 delta specs。
- [x] 1.2 明确 inventory 来源优先级、提取边界与安全回退诊断字段。

## 2. 后端 ZIP manifest 提取

- [x] 2.1 为 MinIO provider 增加对象读取能力，并引入轻量 ZIP manifest 解析依赖。
- [x] 2.2 实现 bounded ZIP manifest extractor，只返回条目级安全摘要。
- [x] 2.3 在 `intake/init` 与 packet intake 中接入 ZIP manifest inventory 解析，保持显式输入优先、失败安全回退。
- [x] 2.4 为 intake diagnostics、packet event 与 formal match 路径补 focused tests。

## 3. 前端契约与主文档

- [x] 3.1 扩展 typed contract，使 `inventoryResolution` / fallback diagnostics 支持 ZIP manifest 来源。
- [x] 3.2 同步主 specs/docs，明确 packet inventory 现已支持真实 ZIP manifest 提取。

## 4. 验证与归档

- [x] 4.1 运行最小 typecheck、pilot store tests 和相关 `node --check` 验证。
- [x] 4.2 完成主文档同步后归档本次 change。
