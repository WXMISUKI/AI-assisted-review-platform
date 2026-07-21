## 1. Spec

- [x] 1.1 为 trial intake overview 补充资料接入页和依据/主数据页的展示规格。

## 2. Implementation

- [x] 2.1 在 App 中同步当前工作区 basis/master-data/knowledge-base 后端记录。
- [x] 2.2 在资料接入页新增“试点接入总览”面板，展示当前 run 的后端事实与 next action。
- [x] 2.3 在“依据与主数据”页优先显示后端记录，并标注当前 run 绑定与试点占位属性。
- [x] 2.4 在 trial bootstrap 中优先复用当前工作区可正式核查的 ready 知识库，避免默认 provisional KB 误阻塞新 run。
- [x] 2.5 在 intake-init / re-init 中统一 ready KB 选择逻辑，避免历史 provisional 绑定反复回填。
- [x] 2.6 前端 re-init 入口禁止用 demo packet 覆盖真实试点 run，并在真实对象引用缺失时给出重新上传指引。

## 3. Verification

- [x] 3.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 3.2 运行 `openspec validate opening-condition-trial-intake-overview`。
