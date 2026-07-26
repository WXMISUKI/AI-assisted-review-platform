## 1. 规格

- [x] 1.1 补齐 `2026-07-26-construction-plan-p2-report-docx-export` 的 proposal、design、tasks 与 spec delta。
- [x] 1.2 明确本次只覆盖施工方案审查 `supervisor-report` 的 DOCX 导出闭环，不扩展到 `revised-plan-snapshot`。

## 2. 实现

- [x] 2.1 收口施工方案报告导出闭环的实现缺口，确保结果页、导出 API 和 HTML builder 的职责边界清晰。
- [x] 2.2 新增 construction-plan 报告导出 smoke，覆盖 HTML 构建与导出 API 的缺失报告/未配置适配器边界。

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck`。
- [x] 3.2 运行新增的 construction-plan report export smoke。

## 4. 归档

- [x] 4.1 同步 `docs/construction-plan-p0-docx-trial-roadmap.md`，将 P2 状态从规划更新为已打通或已具备闭环基础。
- [x] 4.2 回写本任务组状态，并为后续 `revised-plan-snapshot` 导出保留扩展位。
