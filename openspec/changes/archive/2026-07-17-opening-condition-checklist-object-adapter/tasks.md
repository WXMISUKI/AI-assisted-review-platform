## 1. 规格与适配边界

- [x] 1.1 编写 checklist-object adapter 的 proposal、design 与 delta specs。
- [x] 1.2 明确 intake/init 的 checklist definition 来源优先级与安全诊断契约。

## 2. 后端受控适配

- [x] 2.1 新增后端受控 checklist template registry 与 checklist-object adapter。
- [x] 2.2 在 intake/init 中接入 adapter，支持显式输入、模板派生和既有定义复用。
- [x] 2.3 为 intake/init 返回 checklist adapter 诊断，并保持 formal match 的无定义阻塞语义。
- [x] 2.4 添加针对模板识别、既有定义回退和未识别模板的 focused tests。

## 3. 前端编排收口

- [x] 3.1 更新 opening-condition 门户 intake 请求，默认不再传递 demo checklistItems。
- [x] 3.2 在操作状态文案中体现 checklist adapter 的结果，避免误判为已完全就绪。

## 4. 验证与同步

- [x] 4.1 运行最小 typecheck 与 pilot store 定向测试。
- [x] 4.2 同步主 specs/docs，并在实现完成后归档本次 change。
