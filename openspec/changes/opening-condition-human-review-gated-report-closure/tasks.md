## 1. Task Workbench Closure

- [x] 1.1 收口选中任务工作台模式，确保文件预览、待核查项复核、返回列表都围绕同一个 selected task 运转。
- [x] 1.2 将待核查项详情页补齐为“左侧预览/证据，右侧 AI 审核意见与人工决策”的在位复核界面，并统一按钮样式。
- [x] 1.3 串联“完成人工复核 -> 生成最终报告”主动作，失败时提供分步错误提示但不丢失当前任务上下文。

## 2. Progress And Report Delivery

- [x] 2.1 将右侧进度面板改为基于 backend run events 的智能体时间线，突出唯一需要用户处理的人审暂停节点。
- [x] 2.2 将最终报告改为优先渲染 `reportAsset.markdownContent`，把 dense diagnostics 降为次级内容。
- [ ] 2.3 修正新建审核成功、删除历史任务、返回新建审核首页时的选中任务与页面回退逻辑。

## 3. Verification And Archive

- [ ] 3.1 补充开工条件任务工作台的小粒度 UI/domain smoke，覆盖人审完成、报告渲染和任务删除回退。
- [x] 3.2 运行轻量验证并同步 OpenSpec 任务状态。
