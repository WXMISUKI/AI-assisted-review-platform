## 1. Specification

- [x] 1.1 建立 `opening-condition-trial-package-handoff-surface` 变更，明确本次只补任务台账选中态的试点交付快照，不扩展接口和状态机。

## 2. Implementation

- [x] 2.1 为任务台账选中态补 `trialPackage` / `deliveryHandoff` 的 bounded handoff 面板。
- [x] 2.2 保持当前 run / 历史 run 的只读语义与下一步入口表达清晰。
- [x] 2.3 补 focused UI smoke，锁住 trial package handoff surface。

## 3. Verification

- [x] 3.1 `node --test server/openingConditionPilotUiBoundarySmoke.test.mjs`
- [x] 3.2 检查源码中 handoff 面板继续直接消费 `trialPackage` 与 `deliveryHandoff`。

## 4. Archive

- [x] 4.1 回写任务状态。
- [ ] 4.2 明确下一步再进入真实样本试跑 / provider 联调，不继续在局部页面无限打磨。
