# 施工方案审查 P0：DOCX 端到端试跑路线图

更新时间：2026-07-25

## 产品边界

本文件只服务 **施工方案审查** 产品线。

- 本窗口：施工方案审查（文档任务 / DOCX 解析 / 问题决策 / 报告 / 重审）
- 另一窗口：开工条件核查（含 MaxKB 本机联调 P1）
- 共享层可复用：登录壳、MinIO、主题 token、provider 适配器、DOCX 导出 handoff
- **禁止** 在本路线图实现中修改开工条件状态机、pilot store、opening-condition smoke

## 为什么 P0 是 DOCX 试跑闭环

1. 真实施工方案以 DOCX 为主，PDF OCR 会产生乱码，不能作为主路径。
2. DOCX 解析器、规则引擎、LLM 生成器已有底座，但上传后结果未稳定落入 `ReviewTask.issues`。
3. 没有端到端可重复试跑，后续报告导出和知识库 grounding 都无法验收。

## P0 目标闭环

```text
上传 DOCX
  -> 后端识别 .docx
  -> 解析章节/段落/表格/图片标记
  -> 规则预检 +（可选）LLM 问题
  -> 写入 ReviewTask.recoveredStructure 与 issues
  -> 工作台定位原文并人工接受/驳回
  -> 生成 resultAsset
  -> 重新审查创建新任务（previousTaskId）
  -> smoke 可回归
```

## 明确不做

- MaxKB 联调与开工条件知识库绑定（另一窗口 P1）
- 十二类智能体全量拆分
- 正式数据库迁移
- 全面 UI 重构
- 把施工方案改造成开工条件复制品

## 任务组

| 任务 | 目标 | 主要文件 | 验收 |
|------|------|----------|------|
| T1 配置基线 | 平台侧 MaxKB 只连 8091 代理；后端可读配置 | `.env`（本地）、docs | 平台连 `192.168.0.219:8091`，不直连 8080 |
| T2 上传贯通 | DOCX 提交后同步得到结构与问题 | `server/index.mjs`、`ConstructionPlanReviewApp.tsx`、`backendConnectivity.ts` | 上传测试 DOCX 后任务可进入 ready/可审查，无 OCR HTML 乱码 |
| T3 问题落库 | 规则/LLM 问题成为可决策 issues | `reviewRuleEngine.mjs`、前端 merge | 工作台可见问题，可接受/驳回并完成 |
| T4 smoke | 可重复回归 | `server/reviewDocxMvpSmoke.test.mjs`、`package.json` | `pnpm smoke:review:docx` 通过 |
| T5 归档 | 规格与边界可交接 | openspec change / docs | 双产品边界检查通过 |

## 与并行开发的关系

另一窗口可同时改开工条件与 MaxKB。本窗口只触碰：

- `src/ConstructionPlanReviewApp.tsx`
- `src/ReviewWorkbenchPage.tsx`
- `src/domain/review*`
- `server/review*`
- `server/docxParser.mjs`
- 施工方案 docs / openspec / smoke

若 git 工作区出现开工条件文件变化，视为另一窗口并行提交，不回滚、不“顺手修复”。

## 验证命令

```bash
pnpm typecheck
pnpm governance:check
pnpm smoke:product-boundaries
pnpm smoke:review
pnpm smoke:review:docx
```

## P0 收口（2026-07-26）

| 任务 | 目标 | 规格 |
|------|------|------|
| 规则兜底提示 | LLM 空/失败时，文档库 + 工作台明确“规则兜底可审查” | `openspec/changes/2026-07-26-construction-plan-p0-rule-fallback-notice/` |
| 锚点验收 | DOCX smoke 校验 issue.anchor.paragraphId 可落回真实段落 | 同上 |

## 下一阶段（不在本 P0 实现）

1. 开工条件 MaxKB 本机联调（P1，另一窗口）
2. 施工方案审查报告 DOCX 导出（P2）
3. 知识库 grounding 增强审查依据（P3）

## 下一阶段收口建议（2026-07-26）

- 优先将施工方案审查任务持久化收口到“后端主导、前端机会型缓存”：
  - 创建任务走单任务 `PUT /api/review-tasks/:taskId`
  - reviewer action 继续走已有精确后端接口
  - 删除任务暂以显式 `bulk` 兼容，后续再补 task DELETE API
- 在这一步完成前，不建议继续把大量时间投入到 viewer 细节或提示词微调，否则刷新一致性与运行稳定性会继续成为验收瓶颈
## P2 Closure (2026-07-26)

- Construction-plan `supervisor-report` now has a report-delivery loop:
  - backend `buildReviewReportHtml(asset)` builds bounded HTML
  - `POST /api/review-tasks/:taskId/report/export-docx` returns a safe DOCX export result
  - result preview keeps a DOCX export action and an HTML fallback download
- New verification command: `pnpm smoke:review:report-export`
- Covered boundaries:
  - escaped report HTML content
  - `missing_report`
  - `export_failed` with `fallback=html` when `http_tools` is not configured
- Follow-up export work should focus on:
  - `revised-plan-snapshot` export
  - stronger shared report HTML builder parity between backend export and frontend fallback
