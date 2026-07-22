## 1. Spec

- [x] 1.1 创建“整改复审差异闭环”proposal、design 和 delta specs。

## 2. Diff Model

- [x] 2.1 在报告页实现相邻 run 的问题项对比模型。
- [x] 2.2 将对比结果归类为已整改、仍未整改、本轮新增、待人工判断。

## 3. Report Delivery

- [x] 3.1 在报告页增加整改闭环摘要卡。
- [x] 3.2 在报告页增加整改闭环明细列表，展示核查项、分类、上一轮状态、当前状态和下一步建议。

## 4. Verification

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-rectification-diff-and-closure-loop`。
