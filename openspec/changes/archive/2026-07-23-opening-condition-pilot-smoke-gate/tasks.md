## 1. Spec

- [x] 1.1 完成试点链路 smoke gate 的 proposal、design、delta spec 与任务拆分。

## 2. Backend Smoke Gate

- [x] 2.1 在后端保留测试中新增完整链路 smoke：intake -> match -> human review -> report -> archive。
- [x] 2.2 覆盖报告生成前的人审阻塞、全部处理后的 `report_ready` 转移。
- [x] 2.3 覆盖 archived run 的正式核查、报告生成、重新初始化均不可变。
- [x] 2.4 覆盖归档后用新 run-specific task id 创建下一轮，不污染旧归档 run。

## 3. Developer Script

- [x] 3.1 在 `package.json` 增加开工条件试点 smoke 脚本。

## 4. Verification And Archive

- [x] 4.1 运行开工条件 smoke 脚本。
- [x] 4.2 运行 `npm run typecheck`。
- [x] 4.3 运行 `openspec validate --changes opening-condition-pilot-smoke-gate`。
- [x] 4.4 归档 `opening-condition-pilot-smoke-gate` 并校验主规格。
