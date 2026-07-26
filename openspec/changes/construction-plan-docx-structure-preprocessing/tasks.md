## 1. 规格

- [x] 1.1 为 DOCX 结构预处理补齐 proposal、design 与 spec delta。
- [x] 1.2 明确本次先做结构门禁，不直接进入 viewer 引入。

## 2. 实现

- [x] 2.1 为 DOCX 段落增加 `blockType` 与 `reviewEligible` 元数据。
- [x] 2.2 在解析阶段识别封面、目录和正文段落，并只用正文构建 review sections。
- [x] 2.3 让规则引擎与 LLM 章节审查忽略 `reviewEligible === false` 的段落。

## 3. 验证

- [x] 3.1 扩展 DOCX smoke，覆盖目录样式内容不再触发审查。
- [x] 3.2 运行 `pnpm typecheck`。
- [x] 3.3 运行 `pnpm smoke:review:docx`。

## 4. 归档

- [x] 4.1 同步实现结论与任务状态。
- [ ] 4.2 作为下一组 viewer MVP 的前置变更保留。
