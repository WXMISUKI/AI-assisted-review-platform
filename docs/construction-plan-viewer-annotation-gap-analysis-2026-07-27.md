# 施工方案原页预览与批注缺口分析

更新时间：2026-07-27

## 1. 这次要回答什么

围绕当前施工方案审查详情页，回答 4 个实际问题：

1. 为什么已经有按页原文预览了，目录、封面、非正文内容仍然会被当成正文审查。
2. 为什么当前 viewer 不能准确跳到问题位置，也不能在页内做背景高亮。
3. 为什么当前不能直接在原页上拖选文本，新增人工标注。
4. 市面成熟平台和 GitHub 开源方案里，有哪些能力可以直接复用，哪些只能借鉴思路。

## 2. 结论先说

### 2.1 当前不是单个组件 bug，而是两套模型还没有合并

当前详情页实际上是两套系统并存：

- 一套是旧的 `paragraph-based` 审查模型。
- 一套是新的 `source-faithful viewer` 原页显示模型。

现在的问题不是 viewer 没渲染出来，而是：

- 审查问题的语义锚点仍然主要是 `paragraphId + startOffset + endOffset`。
- 原页 viewer 只是把 DOCX 近似渲染成 HTML 页面。
- 二者之间没有稳定的 `page / dom range / geometry` 绑定层。

所以自然会出现三个现象：

- 目录、封面误审还在。
- issue 能在列表里出现，但不能在原页上精确贴住。
- 人工标注只能在旧段落文本区拖选，不能在原页里拖选。

### 2.2 当前最该停掉的不是 viewer，而是旧 paragraph 审查展示在详情页里的主导地位

如果产品方向已经明确转向“原页查看 + 原页定位 + 原页批注闭环”，那就不应该继续把旧的 paragraph 拆分视图作为主交互中心。

更合理的 MVP 方向是：

- viewer 变成主视图。
- issue 列表与 viewer 做双向联动。
- 旧 paragraph 工作台退为调试/兜底层，而不是主要审查承载层。

### 2.3 对本项目来说，最适合的成熟路线仍然是 `page-view annotation`，不是继续深化纯 paragraph 路线

如果目标是最小 MVP 尽快投产，当前最合适的不是继续增强“段落拆分 + 文本高亮”，而是：

`原页 viewer -> 页内定位 -> overlay 高亮 -> viewer 内人工批注`

这条路线更接近工程资料审查平台、论文审阅平台、PDF 审图平台的成熟做法。

## 3. 当前问题的代码级根因

## 3.1 旧结构恢复链仍然在为审查引擎提供主输入

当前 [server/docxParser.mjs](/C:/project/nanjin/AI-assisted-review-platform/server/docxParser.mjs) 仍然是把 `word/document.xml` 里的 `<w:p>` 粗粒度 flatten 成 paragraph。

它已经引入了：

- `blockType`
- `reviewEligible`

但它仍有几个天然限制：

- 没有 run/range 级锚点。
- 没有 page 级布局信息。
- 没有稳定的 field/TOC 结构恢复。
- 目录、封面、正文的区分仍偏启发式。

这意味着它适合做“审查输入门禁”和“结构预清洗”，但不适合直接承担“原页精确定位”。

## 3.2 当前 viewer 只有“文本搜索命中 + 滚动”，没有真正的 annotation binding

当前 [src/SourceFaithfulDocxPreview.tsx](/C:/project/nanjin/AI-assisted-review-platform/src/SourceFaithfulDocxPreview.tsx) 的能力边界非常明确：

- 用 `docx-preview` 渲染 DOCX。
- 用 `anchor.text / fallback paragraph text / issue title` 生成搜索词。
- 遍历 DOM 节点做 `textContent.includes(term)`。
- 给命中的第一个节点加一个临时 class。
- `scrollIntoView`。

它没有做这些事情：

- 没有记录 issue 到具体 page 的绑定。
- 没有记录 issue 到具体 DOM Range 的绑定。
- 没有保存坐标框或高亮矩形。
- 没有多 issue overlay 层。
- 没有手工创建 annotation 的选择事件。

所以它本质上只是“可视化原文 + 近似定位”，不是成熟批注组件。

## 3.3 当前人工标注仍然绑定在旧段落文本块里

当前 [src/ReviewWorkbenchPage.tsx](/C:/project/nanjin/AI-assisted-review-platform/src/ReviewWorkbenchPage.tsx) 里的人工标注入口，仍发生在 `DocumentParagraphBlock` 的 `<p>` 文本区域中。

这意味着：

- 用户拖选的是“系统重建的 paragraph 文本”。
- 不是 viewer 里的原页文本层。
- 也不是图片/页面上的真实区域。

因此即使中间已经有按页预览图，用户也无法在那个视图中直接新增人工标注。

## 3.4 当前 issue 重绑定依然是“按文本回搜段落”

当前 [src/domain/reviewIssueAnchorBinding.ts](/C:/project/nanjin/AI-assisted-review-platform/src/domain/reviewIssueAnchorBinding.ts) 的核心逻辑是：

- 遍历 recovered paragraphs。
- 用 `paragraphText.indexOf(expectedText)` 找文本。
- 找不到就按顺序 fallback。

这不是：

- Word range 绑定。
- DOM Range 绑定。
- page geometry 绑定。

所以它对 viewer 联动的帮助非常有限，更适合作为旧 paragraph 模型下的弱恢复手段。

## 4. 为什么目录、封面误审还会继续出现

虽然前一轮结构预处理已经引入 `reviewEligible === false` 的门禁思路，但从当前用户现象看，误审没有完全从详情页体验里消失，通常只会有 3 类原因：

1. 旧任务或旧缓存中仍保存了之前生成的 issues/recoveredStructure。
2. 详情页仍把旧 paragraph 审查结果和新 viewer 同时展示，导致用户视觉上认为 viewer 也在误审。
3. 非正文块虽然不再进入新一轮审查，但旧 issue 锚点或旧 section 结果仍被带到前端。

对当前产品阶段来说，最直接的处理不是继续打补丁优化目录识别，而是：

- 在详情页先停止把 paragraph 拆分视图当成主审查视图。
- 对 `cover/toc` 的 issue 展示直接做关闭或过滤。
- 明确 viewer 视图里的问题只展示“当前可定位、可闭环”的问题集。

## 5. 当前 viewer 为什么不能准确定位、页内高亮、拖选新增批注

这三个能力不是同一级别，分别需要不同的基础设施：

### 5.1 准确定位

至少需要其一：

- `paragraph/run -> page` 的映射。
- `issue -> DOM Range` 的映射。
- `issue -> page rectangle(s)` 的映射。

当前都没有，只有全文本模糊搜索。

### 5.2 页内背景高亮

至少需要其一：

- HTML text layer range wrap。
- 叠加 overlay 矩形。
- canvas/svg annotation layer。

当前只有给一个 DOM 节点加 class，不是对具体文本范围做标注。

### 5.3 原页拖选新增人工批注

至少需要其一：

- viewer 内文本层 selection capture。
- image/page 区域框选。
- 选择结果持久化为 anchor model。

当前 viewer 组件没有 selection capture，也没有 annotation create 事件。

## 6. 成熟平台通常怎么做

### 6.1 Word-native 路线

代表：

- Microsoft Word / Office.js
- ONLYOFFICE Docs

特点：

- 批注锚定在文档 range/run/comment range 上。
- 页面是编辑器自己的排版结果。
- 最像“真正的 DOCX 原生批注”。

适用：

- 目标是像 Word 一样处理批注、修订、接受/拒绝。

不适合当前最小施工审查 MVP 的原因：

- 集成重。
- 需要把很多交互让位给现成编辑器。
- 审查平台自己的 issue/workflow 要围绕编辑器重新设计。

### 6.2 Page-view annotation 路线

代表：

- Adobe Acrobat / PDF Embed
- Bluebeam
- Procore
- Autodesk Reviews

特点：

- 真正审阅对象是稳定的页面视图。
- 锚点通常是 `page + coordinates + annotation object`。
- 适合“问题列表 -> 页内定位 -> 人工批注 -> 状态闭环”。

这条路线更接近当前施工方案审查平台想要的体验。

## 7. 开源与可复用方案调研

下面按“能不能直接帮当前项目推进”来分。

### 7.1 `docx-preview / docxjs`

现状：项目已在用。

能提供：

- DOCX 近似原页 HTML 预览。
- `breakPages`。
- `ignoreLastRenderedPageBreak`。
- 实验性的 comments、tab stop 等支持。

边界：

- 不是成熟排版引擎。
- 不是 annotation framework。
- 不提供 issue/page/rect 持久化模型。
- 不提供拖选创建标注闭环。

结论：

- 适合作为当前 MVP 的 viewer 底座。
- 不足以单独解决原页定位和人工标注。

参考：

- [docxjs README](https://github.com/VolodymyrBaydalka/docxjs)

### 7.2 `react-pdf-highlighter`

能提供：

- 基于 PDF.js 的高亮组件。
- 文本和图片高亮。
- Popover 文本。
- Scroll to highlight。

它最有价值的不是“拿来就接入”，而是它把一整套交互模型做清楚了：

- highlight 数据结构
- 选区创建
- popover 编辑
- viewer 与右侧列表联动

结论：

- 如果未来走 PDF viewer 路线，它是很直接的参考。
- 如果短期仍保留 DOCX viewer，它也很适合借鉴交互和数据模型。

参考：

- [react-pdf-highlighter](https://github.com/agentcooper/react-pdf-highlighter)

### 7.3 `Annotorious`

能提供：

- 图像标注能力。
- annotation create 事件。
- annotation load/save 机制。

适合：

- 把每一页当图片时的标注层。
- 框选区域、图片批注。

不够的地方：

- 它不是 DOCX 文本层批注系统。
- 文本级别锚定能力不如 text-layer 方案自然。

结论：

- 很适合作为“页图 overlay 标注”的参考或可选底座。
- 更适合图片页或截图页，不适合直接承担 DOCX 文本选择批注。

参考：

- [Annotorious](https://github.com/Annotorious/annotorious)

### 7.4 `Fabric.js` / `Konva`

能提供：

- canvas 图层。
- 形状、框、连线、拖拽、缩放、图层管理。

适合：

- 在 viewer 上叠一个 annotation overlay。
- 做矩形标注、连接线、批注框、选中态。

不够的地方：

- 不直接理解 DOCX/PDF 文本层。
- 需要我们自己维护 anchor model、坐标同步、缩放重算。

结论：

- 它们是很好的“标注画布基础设施”。
- 不是开箱即用的审阅系统。

参考：

- [Fabric.js](https://github.com/fabricjs/fabric.js)
- [Konva](https://github.com/konvajs/konva)

### 7.5 `ONLYOFFICE Docs`

能提供：

- DOCX 原生评论、修订、协作。
- 更接近 Word-native。

结论：

- 如果目标改成“像 Word 一样直接批 DOCX”，这是很强的路线。
- 但对当前最小施工审查 MVP 来说，它不是最快路径。
- 当前更适合作为中长期路线备选，而不是立刻切换。

参考：

- [ONLYOFFICE Comments](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/commenting/)
- [ONLYOFFICE Reviewing](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/reviewing/)

## 8. 对当前项目最有价值的推荐路线

## 8.1 不要继续把主要精力放在“优化旧 paragraph 审查 UI”上

原因很简单：

- 这条路线已经和产品目标不一致。
- 再优化也很难变成成熟平台级原页批注体验。
- 容易陷入局部无限优化，例如继续修 paragraph 拆分、修 title 误判、修目录误审，但主交互模式仍不对。

## 8.2 最适合下一阶段的任务组顺序

### 任务组 A：停掉旧 paragraph 主审查流在详情页的干扰

目标：先让产品体验不再左右分裂。

建议内容：

- 隐藏或降级旧 paragraph 文本块主视图。
- 对 `cover/toc` 相关 issue 直接过滤显示。
- viewer 成为详情页中心。
- 保留旧 paragraph 数据仅作调试和回退。

价值：最高，且改动相对可控。

### 任务组 B：建立 viewer 与 issue 的最小可用绑定层

目标：实现“点击 issue -> viewer 正确跳转并可见高亮”。

建议内容：

- 从模糊命中升级到“页 + DOM block + text range”的近似绑定。
- 支持一页内的问题高亮底色。
- 支持 issue 列表和 viewer 的双向联动。

这里先不追求完美坐标级精度，先做到产品上可用。

### 任务组 C：viewer 内新增人工标注

目标：用户能直接在原页里拖选文本或框选区域，新增人工标注。

建议内容：

- 先支持文本层 selection。
- 如果文本层不稳定，再补区域框选。
- 把新建标注落成新的 `viewerAnchor` 数据结构，而不是继续只用旧 paragraph offset。

## 8.3 对 MVP 来说，最现实的技术路径

### 推荐组合

- 继续用 `docx-preview` 做当前 viewer 底座。
- 新增一个 viewer annotation binding 层。
- 视需求引入轻量 overlay 基础设施，如 `Konva` 或纯 DOM overlay。

### 不推荐现在立刻做的事情

- 不建议现在就全面切 Word-native。
- 不建议现在就重做成大型 PDF 审阅系统。
- 不建议继续深挖 paragraph 拆分体验。

## 9. 下一份 OpenSpec 建议

当前 OpenSpec 里已经有：

- `construction-plan-docx-structure-preprocessing`
- `construction-plan-source-faithful-preview-mvp`

但还没有一个专门处理“viewer 内批注绑定”的变更。

建议下一份 change 单独聚焦为类似名称：

- `construction-plan-viewer-annotation-binding-mvp`

建议 scope：

- 不做 Word-native。
- 不做真实 PDF 坐标引擎。
- 不做全面重构。
- 只做 viewer 成为主视图、issue 定位、高亮、viewer 内人工标注最小闭环。

## 10. 最终建议

如果从“最能推进项目、最有价值、最能快速投产”的角度排序，下一阶段不应该继续修局部 paragraph 逻辑，而应该做：

1. 先让详情页彻底转向 viewer 主视图，关掉旧 paragraph 主交互干扰。
2. 再做 issue 和 viewer 的稳定联动与页内高亮。
3. 最后做 viewer 内人工标注。

一句话总结：

**当前最大缺口不是还缺一个更聪明的提示词，而是缺一层真正把 issue 语义锚点绑定到原页 viewer 的 annotation binding 基础设施。**
