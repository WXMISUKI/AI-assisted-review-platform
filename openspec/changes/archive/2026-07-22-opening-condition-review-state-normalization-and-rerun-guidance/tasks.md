## 1. Spec

- [x] 1.1 补充“状态归一与复审引导收口”proposal、design 与 delta specs。

## 2. State Normalization

- [x] 2.1 为报告交付与整改闭环实现基于人工复核结果的最终状态归一。
- [x] 2.2 避免已被人工驳回、确认或修正的核查项继续显示为 `待人工判断`。

## 3. Rerun Entry Guidance

- [x] 3.1 为 archived run 增加显式的复审入口意图状态。
- [x] 3.2 收口资料接入页入口，使其在 archived run 下默认作为承接页而非并列主入口。

## 4. Verification

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-review-state-normalization-and-rerun-guidance`。
