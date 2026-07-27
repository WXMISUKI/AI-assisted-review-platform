# Design

## Summary

这次改动只补当前开工条件智能体工作台的三个关键断点：历史删除、旧资料预览降级、主流程报告交付。实现原则是复用现有任务事实和上传/报告链路，不扩散到新的平台子系统。

## Decisions

### 1. 历史删除恢复为显式入口

- 左侧历史列表所有任务行都显示删除按钮。
- 删除动作继续调用既有 `DELETE /api/opening-condition/pilot-tasks/:taskId`。
- 若后端返回 `404/not_found`，前端将其视为“当前实例已不存在”，直接把该条目从列表清掉，避免用户卡死。

这样既保留了后端作为事实源，也避免再次用“隐藏按钮”解决异常。

### 2. 旧资料包预览改为可解释降级

- `packet.inventoryEntries` 继续作为资料文档库的一部分展示。
- 当 inventory 条目没有独立 `storageKey` 时，不再显示英文报错。
- 前端补充与其来源 `sourceObjectId` 对应的原始资料包信息：
  - 若能定位到原始资料包对象，则提示“该条目来自旧资料包清单，当前没有独立预览对象，可打开原始资料包或重新上传新资料包获得逐文件预览”。
  - 若连原始资料包也不可定位，则明确说明“这是历史/旧数据限制”。

### 3. Markdown 报告成为右侧进度面板主交付

- 保留右侧进度时间线，但最终报告展示改为格式化 Markdown 渲染，而不是 `<pre>` 原样堆文本。
- 渲染范围只覆盖当前平台输出需要的块级结构：
  - `##` / `###` 标题
  - 强调/加粗
  - 无序列表
  - Markdown 表格
  - 普通段落和链接
- 这是“只为当前报告格式服务”的轻量 renderer，不引入新依赖。

### 4. 报告内容优先用人类可读上下文

- 后端报告生成优先读取：
  - `basisVersion.ingestionPreview.facts.projectName`
  - `context.reviewObjectId`
  - `context.contractPackageId`
- 同时补齐 `normalizeWorkspaceContext` 对 `reviewObjectId` 和 `participantEntityId` 的保留，避免前端传了、后端入库时丢失。

## Risks

- 轻量 Markdown renderer 不是通用编辑器，因此只应承载平台报告格式，不承诺支持任意 Markdown 方言。
- 某些历史资料条目仍然无法真正逐文件预览；本次只保证降级路径清晰，不承诺为旧对象补回独立文件资产。
