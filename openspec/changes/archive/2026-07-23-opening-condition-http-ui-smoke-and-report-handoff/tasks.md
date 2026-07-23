## 1. Acceptance Smoke

- [x] 1.1 设计 HTTP smoke 测试入口，复用现有后端测试数据和安全 object refs。
- [x] 1.2 覆盖 API 链路：创建/初始化 run -> 正式核查 -> 人工复核决策 -> 报告生成 -> 归档。
- [x] 1.3 覆盖 archived run 的 API 不可变性：match/report/intake 继续返回安全 invalid-state。
- [x] 1.4 覆盖下一轮 run-specific task id 创建，不污染旧 archived run。
- [x] 1.5 增加 npm 脚本，例如 `smoke:opening-condition:http` 或合并到统一 smoke。

## 2. UI Boundary Smoke

- [x] 2.1 增加轻量 UI/render smoke，验证 archived run 下关键 mutation 按钮不可用。
- [x] 2.2 验证 report-ready/current/archived/history run 的报告页主动作边界。
- [x] 2.3 将 UI smoke 断言限制在关键文案、按钮可用性和状态语义，不断言像素布局。

## 3. Report Handoff

- [x] 3.1 优化报告页 handoff 区块：选中轮次、交付结论、当前状态、下一动作。
- [x] 3.2 按平台事实展示问题清单：核查项、父级分类、风险等级、缺失原因、期望证据、整改建议。
- [x] 3.3 展示人工复核决策账本：确认、修正、驳回、延期及 reviewer note。
- [x] 3.4 历史轮次详情可进入完整查看，并保持只读。
- [x] 3.5 保留 docx/pdf 导出扩展点，但本组不做正式文件生成。

## 4. Documentation

- [x] 4.1 更新真实试点 runbook，补充 HTTP/UI smoke 命令、执行时机和预期结果。
- [x] 4.2 更新投产路线图，记录本组完成后下一阶段再进入依据入库治理或前端体验重构。

## 5. Verification

- [x] 5.1 运行 `npm run smoke:opening-condition`。
- [x] 5.2 运行新增 HTTP/UI smoke 脚本。
- [x] 5.3 运行 `npm run typecheck`。
- [x] 5.4 运行 `openspec validate --changes opening-condition-http-ui-smoke-and-report-handoff`。
