## Why

当前真实试点已经能进入正式核查、人工复核和报告归档，但“资料核查”页仍然主要以卡片摘要展示结果，操作员很难直接回答几个关键问题：

- 这次到底要核哪些项目
- 每个核查项是否已经匹配到资料
- 没匹配到时具体缺什么、为什么缺
- 哪些项进入了人工复核，人工复核回链到哪一项

这直接影响真实试点的可解释性，也限制了后续报告升级为“监理可读的不符合项报告”。

## What Changes

- 在“资料核查”页新增以核查表为主对象的核查项矩阵。
- 每一项核查内容显示：
  - 一级分类 / 二级分类 / 核查项名称
  - 是否强制、是否试点范围内
  - 匹配状态与最终结论
  - 命中的资料文件
  - 未命中或不合规原因
  - 期望资料提示
  - 关联的人工复核状态
- 在尚未正式核查时，也显示从 `checklistDefinition` 派生出的待核查清单，而不是让页面只剩空白或 fallback 卡片。

## Capabilities

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 资料核查页应以核查项矩阵展示当前 run 的 `checklistDefinition` / `checkItems` / `evidence` / `humanReviewQueue` 关系。

## Impact

- `src/productWorkspacePages.tsx`：补充核查项矩阵和人工复核回链展示。
- `src/styles.css`：补充矩阵视图样式。
- 本变更不重写 basis/master-data 发布状态机，不升级报告正文格式，不生成 docx。
