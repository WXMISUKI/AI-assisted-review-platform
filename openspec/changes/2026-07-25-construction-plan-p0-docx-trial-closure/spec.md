# 施工方案 P0：DOCX 试跑闭环贯通

变更日期：2026-07-25

## 背景

DOCX 解析、规则引擎、LLM 生成器已存在，但上传后的同步结果未稳定进入施工方案 `ReviewTask`：

1. `/api/ocr/jobs/object` 对 DOCX 直接返回 `status=done` + `result`，前端仍按异步 OCR job 轮询处理。
2. 规则 findings 未稳定转为可决策 `ReviewIssue`。
3. 缺少 DOCX 专属 smoke，真实试跑不可回归。

本变更只服务施工方案审查。开工条件 MaxKB 联调属于另一窗口，不在本 change 实现。

## 架构决策

### D1: 同步落库
DOCX 上传解析在 object job 接口内同步完成。前端若收到 `status=done` 且带 `result.recoveredStructure`，立即写入任务结构与问题，不再轮询 PaddleOCR。

### D2: 问题来源优先级
1. LLM issues（若有）
2. 规则 findings 转为 issues 作为兜底/补充
3. 去重后限制 top N（默认 20），保证可人工审完

### D3: 产品边界
- 只改施工方案 review 模块与 docs/openspec/smoke
- 不修改 opening-condition pilot 状态机与其 smoke

## Requirements

### Requirement: DOCX 同步结果契约
系统在 DOCX 对象解析成功时 SHALL 返回可被前端直接消费的完成态结果。

#### Scenario: DOCX 提交成功
- WHEN 前端对 `.docx` 对象调用 `/api/ocr/jobs/object`
- THEN 响应 `ok=true` 且 `status=done`
- AND 包含 `jobId`
- AND 包含 `result.recoveredStructure`
- AND 可包含 `result.llmIssues` 与 `result.ruleFindings`

### Requirement: 前端同步贯通
施工方案文档上传流程 SHALL 在收到 DOCX 完成态结果后，立即更新任务结构与问题。

#### Scenario: 上传 DOCX 后可审查
- WHEN 用户上传 DOCX 且后端返回完成态结果
- THEN 任务写入 `recoveredStructure`
- AND 任务写入可决策 `issues`
- AND 任务进入可打开工作台的状态（ready 或等价可审查态）
- AND 不依赖 PaddleOCR 轮询

### Requirement: 规则问题可决策
规则预检结果 SHALL 能转换为 `ReviewIssue`，支持接受/驳回/完成。

#### Scenario: 规则兜底
- WHEN LLM 未返回问题但规则有 findings
- THEN 系统仍生成有限数量的 pending issues
- AND 用户可完成审查并生成 resultAsset

### Requirement: DOCX smoke
仓库 SHALL 提供施工方案 DOCX 试跑 smoke，且与开工条件 smoke 隔离。

#### Scenario: DOCX smoke
- WHEN 运行 `pnpm smoke:review:docx`
- THEN 解析测试 DOCX
- AND 产生规则 findings 或 issues
- AND 不初始化 opening-condition workspace

## 修改文件清单

| 文件 | 变更 |
|------|------|
| docs/construction-plan-p0-docx-trial-roadmap.md | 新建路线图 |
| docs/dual-portal-mvp-boundaries.md | 补充并行窗口与 P0/P1 指向 |
| server/reviewRuleEngine.mjs | findings 转 issues + topN |
| server/index.mjs | DOCX 响应带 ruleIssues |
| src/domain/backendConnectivity.ts | 提交结果类型扩展 |
| src/ConstructionPlanReviewApp.tsx | 同步落库 |
| server/reviewDocxMvpSmoke.test.mjs | 新建 |
| package.json | smoke:review:docx |

## 验证

```bash
pnpm typecheck
pnpm smoke:product-boundaries
pnpm smoke:review
pnpm smoke:review:docx
```
