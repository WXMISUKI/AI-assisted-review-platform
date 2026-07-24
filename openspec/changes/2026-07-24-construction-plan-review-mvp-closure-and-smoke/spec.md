# 施工方案审查 MVP 闭环与 Smoke 验证

变更日期：2026-07-24

## 背景

施工方案审查已有完整的类型系统、任务生命周期、会话服务、后端存储、问题生成、人工决策和结果资产能力。但存在以下阻塞 MVP 闭环的差距：

1. 前端数据源以 localStorage 为主，刷新后可能丢失审查进度
2. 无施工方案专属 smoke 测试，无法自动验证核心流程不回归
3. 同一方案无法发起重新审查，旧轮次无法只读保留
4. 审查历史无专门展示

## 架构决策

### D1: 前端数据源策略
采用 localStorage 先渲染 + 后端静默水合。首屏用 localStorage 同步渲染避免白屏，`useEffect` 异步拉后端，有差异则覆盖。

### D2: 重新审查语义
创建新 ReviewTask（`previousTaskId` 关联原任务），原任务只读保留。旧问题不继承，全部重新生成。继承 recoveredStructure、paragraphs、sourceObject。

### D3: 旧任务只读
ReviewWorkbenchPage 新增显式 `readonly` prop。ConstructionPlanReviewApp 作为编排层决定只读语义。旧任务隐藏 accept/reject/modify 按钮、禁止添加手动问题、禁止完成审查。

### D4: Smoke 数据隔离
reviewTaskStore 导出函数新增 storePath 参数，smoke 使用临时目录隔离。

### D5: 重新审查入口
结果预览页和文档库列表行都有"重新审查"入口。点击后弹确认对话框，可选审查模式。

### D6: Smoke 范围
覆盖主流程（创建到生成到决策到完成到资产）+ 重新审查流程。

### D7: 历史任务视觉区分
靠已有状态标签区分，不加轮次角标。

## Requirements

### Requirement: 后端优先数据源
前端加载审查任务时优先从后端 API 读取，后端不可用时 fallback 到 localStorage。

#### Scenario: 首屏加载
- WHEN 用户进入施工方案审查
- THEN 首屏从 localStorage 同步渲染
- AND 异步请求后端 API
- AND 后端数据有差异时静默覆盖本地状态

#### Scenario: 后端不可用
- WHEN 后端 API 不可达或返回错误
- THEN 继续使用 localStorage 数据
- AND 不阻塞用户操作

### Requirement: 重新审查能力
已完成的施工方案可以发起新一轮审查，旧轮次只读保留。

#### Scenario: 发起重新审查
- WHEN 用户对已完成任务点击重新审查
- THEN 弹确认对话框，可选审查模式
- AND 创建新 ReviewTask，previousTaskId 关联原任务
- AND 新任务继承 recoveredStructure、paragraphs、sourceObject
- AND 新任务问题为空，等待重新生成

#### Scenario: 旧任务只读
- WHEN 用户打开已完成任务的审查工作台
- THEN ReviewWorkbenchPage 以 readonly 模式渲染
- AND 隐藏 accept/reject/modify 按钮
- AND 禁止添加手动问题
- AND 禁止完成审查

### Requirement: 施工方案 Smoke 测试
施工方案审查拥有独立的 smoke 测试，覆盖核心流程和重新审查。

#### Scenario: 核心流程 smoke
- WHEN smoke 运行
- THEN 验证创建任务、问题生成、问题决策、完成审查、结果资产存在
- AND 使用临时目录隔离，不污染开发数据

#### Scenario: 重新审查 smoke
- WHEN 核心流程完成后
- THEN 创建关联的新任务
- AND 验证旧任务状态不变
- AND 完成新任务并验证结果资产

### Requirement: Store 可测试性
reviewTaskStore 导出函数支持 storePath 参数。

#### Scenario: 自定义存储路径
- WHEN 调用方传入 storePath
- THEN 读写操作使用指定路径
- AND 不影响默认路径的开发数据

## 修改文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| src/domain/reviewTypes.ts | 修改 | ReviewTask 新增 previousTaskId |
| server/reviewTaskStore.mjs | 修改 | 导出函数新增 storePath 参数 |
| server/reviewTaskDecisionService.mjs | 修改 | 透传 storePath |
| server/reviewMvpSmoke.test.mjs | 新建 | 施工方案 smoke 测试 |
| package.json | 修改 | 添加 smoke:review 脚本 |
| src/domain/reviewTaskRepository.ts | 修改 | 后端优先 + localStorage fallback |
| src/ConstructionPlanReviewApp.tsx | 修改 | readonly 传递、重新审查入口、确认对话框 |
| src/ReviewWorkbenchPage.tsx | 修改 | readonly prop 支持 |
| src/appShellPages.tsx | 修改 | ResultPreviewPage 添加重新审查按钮 |

## 不修改的文件

- src/productWorkspacePages.tsx 开工条件业务逻辑
- src/App.tsx 中 opening-condition 状态
- src/openingConditionPortalState.ts
- src/openingConditionRunSnapshot.ts
- server/openingConditionPilotStore.mjs
- 开工条件相关 smoke 测试

## 验证命令

pnpm typecheck
pnpm governance:check
pnpm smoke:product-boundaries
pnpm smoke:review
