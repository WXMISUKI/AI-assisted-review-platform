## 1. 规格

- [x] 1.1 补齐 `construction-plan-source-faithful-preview-mvp` 的 proposal、design 与 spec delta。
- [x] 1.2 明确本次仅覆盖已上传 `.docx` 任务的“原文近似预览 + issue 定位”MVP，不扩展到 PDF、OnlyOffice、真实页坐标。

## 2. 实现

- [x] 2.1 新增前端 presign helper，允许工作台安全获取源文档临时访问地址。
- [x] 2.2 将任务 `sourceObject` 透传到施工方案审查工作台。
- [x] 2.3 新增 `docx-preview` 原文近似预览组件，支持加载、失败、非 DOCX 回退状态。
- [x] 2.4 将活跃 issue 与预览视图联动，实现最小可用的滚动定位与高亮提示。

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck`。
- [ ] 3.2 手动保证无源文档、非 DOCX、预览失败时工作台仍可继续使用现有文本审查流。

## 4. 归档

- [ ] 4.1 回写本任务组完成状态与实现结论。
- [ ] 4.2 为下一任务组保留“更细粒度锚点映射 / 双向定位 / viewer 内批注”扩展位。
