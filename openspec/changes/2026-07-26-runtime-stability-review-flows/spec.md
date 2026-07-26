# 运行时稳定性修复：审查上传与报告工作台

变更日期：2026-07-26

## 背景

当前仓库已完成施工方案审查 DOCX 解析与开工条件报告交付等功能交付，但在真实浏览器试跑中暴露出两个一阶运行时阻塞：

1. 开工条件报告交付工作台 `OpeningConditionReportDeliveryWorkbench` 在渲染阶段抛出 `Cannot access 'selectedOpenReviewCount' before initialization`，导致工作台白屏。
2. 施工方案审查在上传后创建任务时，将过大的任务快照直接持久化与同步，触发 `QuotaExceededError`，并放大 `/api/review-tasks/bulk` 的同步负担。

本变更只修复“真实运行时稳定性”问题，不扩展新业务功能，不改变双平台 MVP 边界。

## 假设

- 当前本地运行环境为 Node.js 24.x，`globalThis.fetch` 可用。
- 施工方案审查与开工条件核查仍然是统一平台下的独立业务门面，本次只允许修复运行时稳定性，不重写状态机。
- 轻量验证以 `typecheck` 和定向 smoke 为主，不执行全量 build。

## 架构决策

### D1：上传中的施工方案任务必须使用轻量占位内容

当任务状态为 `uploaded` 或 `parsing` 时，前端任务对象 SHALL 只持有最小占位结构，不再克隆整份 demo `documentParagraphs` 进入任务快照。

### D2：本地持久化失败不得阻塞 UI

`reviewTaskRepository` SHALL 将 `localStorage` 视为机会型缓存：

- 优先写入正常快照；
- 配额不足时降级写入压缩快照；
- 若仍失败，则清除该缓存键并继续返回内存态任务；
- 不得因本地持久化失败让上传或页面渲染抛出未捕获异常。

### D3：开工条件报告工作台的阻塞计数必须单点派生

`OpeningConditionReportDeliveryWorkbench` SHALL 在 `runSnapshot` 之后立即派生阻塞复核计数，并让后续包构建、按钮可用性和提示文案统一复用该稳定值，避免热更新或局部重构后再次触发 TDZ 类渲染异常。

### D4：后端同步保持尽力而为

`/api/review-tasks/bulk` 同步继续作为后台快照同步能力，但其失败、超时或不可达不得阻塞前端交互完成。

## Requirements

### Requirement: 开工条件报告工作台稳定渲染

系统 SHALL 保证 `OpeningConditionReportDeliveryWorkbench` 在当前轮次和历史轮次两种场景下都能稳定渲染。

#### Scenario: 当前轮次进入报告交付工作台

- WHEN 用户完成上传后进入开工条件报告交付工作台
- THEN 页面不抛出 `selectedOpenReviewCount before initialization`
- AND 阻塞复核数、报告可生成状态、整改复审入口状态正常显示

#### Scenario: 历史轮次只读查看

- WHEN 用户切换到历史轮次
- THEN 页面仍能渲染只读快照
- AND 不因阻塞计数派生逻辑崩溃

### Requirement: 施工方案上传任务不再创建超大占位快照

系统 SHALL 在 `uploaded` / `parsing` 状态下为施工方案任务创建轻量任务结构。

#### Scenario: 新上传文件进入 parsing

- WHEN 用户添加文档并创建任务
- THEN 新任务不再携带整份 demo `documentParagraphs`
- AND 任务仍保留后续 OCR/解析所需的最小进度占位信息

### Requirement: 本地存储压力下上传流程仍可继续

系统 SHALL 在浏览器本地存储压力下保持施工方案上传流程可继续推进。

#### Scenario: 本地存储空间紧张

- WHEN `localStorage.setItem` 因 `QuotaExceededError` 失败
- THEN 仓库层降级为压缩快照或移除机会型缓存
- AND `createDocumentTask` 不向上抛出未捕获异常
- AND 页面仍保留当前内存态任务并继续审查流程

### Requirement: 后端同步失败不阻塞前端

系统 SHALL 将任务 bulk 同步视为后台尽力行为。

#### Scenario: `/api/review-tasks/bulk` 超时或不可达

- WHEN 前端同步请求失败或超时
- THEN UI 不因同步失败而中断上传或渲染
- AND 失败只作为诊断噪音，不改变当前页面内存态任务

## 修改文件

- `src/productWorkspacePages.tsx`
- `src/domain/reviewSessionService.ts`
- `src/domain/reviewTaskRepository.ts`
- 必要时补充相关定向 smoke/文档

## 不做

- 不重构双平台整体路由或状态机
- 不扩展新的报告能力、知识库能力或 MaxKB 联调
- 不执行全量 UI 重设计

## 验证

```bash
pnpm typecheck
pnpm smoke:review
pnpm smoke:review:docx
pnpm smoke:product-boundaries
```
