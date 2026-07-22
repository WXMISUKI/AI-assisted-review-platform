## 1. Spec

- [x] 1.1 补充“复审复用与差异处理”proposal、design 与 delta specs。

## 2. Reuse Model

- [x] 2.1 为当前 run 与上一归档轮次实现 basis / master-data 复用与差异派生模型。
- [x] 2.2 将复用、新增、待重确认、已退出使用四类状态收敛为操作者可读标签。

## 3. Workspace UI

- [x] 3.1 在资料接入页补充上一轮可复用资产与本轮变化项摘要。
- [x] 3.2 在依据与主数据治理页补充当前 run 复用快照与差异清单，并保持与资料接入页语义一致。

## 4. Verification

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-rerun-asset-reuse-and-diff`。
