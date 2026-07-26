# 施工方案 DOCX 结构恢复与原文批注调研

更新时间：2026-07-26

## 1. 这份文档回答什么

围绕当前施工方案审查线的两个核心问题做调研和对齐：

1. 为什么现在封面、目录、标题被切得很碎，还被当成正文送审？
2. 成熟的资料审核/论文批注平台，通常如何保留原文格式、按页或近似按页定位、并把批注挂回原文？

本文同时给出适配当前仓库的修复路线，帮助后续 OpenSpec 和实现对齐。

## 2. 先给结论

### 2.1 你看到的问题，不是单一提示词问题

当前效果差，根因不在“大模型不够聪明”，而在更前面的“结构恢复层”：

- 我们现在先把 `word/document.xml` 里的 `<w:p>` 粗暴扫出来，再用很少的样式规则猜标题。
- 目录行、封面行、正文行、表格行，几乎都被降维成同一种 `paragraph.text`。
- 然后规则引擎和 LLM 再去审核这些“已经失真”的块，自然会把目录标题、页码、封面信息误当成正文语义。

所以这件事的主修复方向应该是：

`DOCX 结构预处理 -> 正文候选块筛选 -> 审核 -> 原文定位`

而不是先继续堆提示词。

### 2.2 DOCX 不是天然“按页存储”的格式

DOCX/WordprocessingML 天然稳定的是结构对象，比如：

- paragraph
- run
- table / cell
- style
- section
- field
- comment range

“第几页”通常是渲染排版后的结果，不是文档语义主键。

官方资料能直接支撑这一点：

- Microsoft Open XML 的 `w:lastRenderedPageBreak` 表示“上次由会分页的应用保存时，该位置是页尾”。这说明页边界是渲染后的结果，而不是正文基础语义。
  来源：
  [Microsoft Learn - LastRenderedPageBreak](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.lastrenderedpagebreak?view=openxml-3.0.1)
- Aspose.Words 的 `Document.page_count` 文档明确写着，页数是“由最近一次 page layout operation 计算得到”。
  来源：
  [Aspose.Words Document.page_count](https://reference.aspose.com/words/python-net/aspose.words/document/page_count/)

所以，成熟平台通常不是“直接按页解析 DOCX 正文”，而是：

- 先按结构抽取正文候选块
- 再用渲染引擎把块定位到页/视图里

这是“语义分块 + 渲染定位”的路线。

### 2.3 目录、封面不应该直接送审

像 `4.3.1 基坑开挖技术措施    43` 这种目录项，本质上是展示层内容，不是正文句子。

而且官方资料也能说明，DOCX 里这类排版并不只是普通字符串：

- `python-docx` 文档说明，tab stop 决定了 tab 字符后面的文本从哪里开始、如何对齐、是否使用点线 leader。
  来源：
  [python-docx - Tab stops](https://python-docx.readthedocs.io/en/latest/user/text.html#tab-stops)
- `python-docx` 文档说明，Word 内置样式包含 `TOCHeading`、`Title`、`Subtitle` 等，这些样式天然可以帮助我们区分目录/封面/标题角色。
  来源：
  [python-docx - Understanding Styles](https://python-docx.readthedocs.io/en/stable/user/styles-understanding.html)

这意味着目录过滤至少要看：

- TOC/标题相关样式
- field / TOC 结构
- tab stop / leader / 右对齐页码
- front matter（封面、审批页、编制信息页）位置特征

而不是只看是否包含“基坑”这种关键词。

## 3. 当前仓库里为什么会出这种效果

### 3.1 当前解析器把 `<w:p>` 基本当成最终段落

当前 [server/docxParser.mjs](C:/project/nanjin/AI-assisted-review-platform/server/docxParser.mjs) 的问题很集中：

- 只识别非常少的标题样式：`1/2/3/4/5`
- 只提取 `<w:t>` 文本
- 没有认真处理 field、tab stop、front matter、页眉页脚、目录样式
- 对目录页码只做了很轻的“去掉末尾数字”处理，而且只在 heading 判定链路里使用

直接后果：

- 封面页里每个换行段都可能被当成一个正文 paragraph
- 目录项里的 tab 对齐丢失，`技术措施    43` 被压成 `技术措施43`
- TOC/封面/正文在下游审核里不再可区分

### 3.2 当前规则引擎是“命中即报”，没有 block type 门禁

当前 [server/reviewRuleEngine.mjs](C:/project/nanjin/AI-assisted-review-platform/server/reviewRuleEngine.mjs) 会对每个 paragraph 做关键词/正则命中。

这意味着：

- 目录项如果包含 `基坑`
- 并且已经被上游错误地当成正文块

就会直接命中 `deep-foundation` 风险规则。

所以你看到的那条误报，不是某个高深推理错误，而是：

1. 上游把目录错当正文
2. 下游规则没有“目录/封面/页眉页脚禁止送审”的 block gate

### 3.3 当前 LLM 也是按 section 拼纯文本审核

当前 [server/reviewLlmGenerator.mjs](C:/project/nanjin/AI-assisted-review-platform/server/reviewLlmGenerator.mjs) 做法是：

- 按 section.title 聚合 paragraph
- 把 section 文本拼成一大段 prompt
- 再让 LLM 返回 issue

只要上游 section/paragraph 已经失真，LLM 就会继承错误输入。

所以现在真正的问题顺序是：

`结构恢复错 -> 分块错 -> 规则/LLM 输入错 -> 审核结果错`

而不是：

`提示词错 -> 审核结果错`

## 4. 成熟平台通常怎么做

### 4.1 不是“纯文本审阅”，而是“结构层 + 呈现层”分离

更合理的平台做法通常分两层：

#### A. 结构层

抽取可审核对象：

- heading tree
- paragraph
- table/cell
- figure caption
- field / TOC
- comment range
- bookmark / range anchor
- header / footer / footnote

并给每个块打 `blockType`，例如：

- `cover`
- `toc`
- `header_footer`
- `body_heading`
- `body_paragraph`
- `table_cell`
- `appendix`

#### B. 呈现层

把结构层锚点重新定位到接近原文的视图上：

- PDF 页面
- 近似 Word 的 HTML 渲染页面
- Office 宿主中的 Range/Comment

审核系统最终看到的，往往不是“重新拼装后的纯文本文章”，而是“原文视图 + 结构锚点 + 批注覆盖层”。

### 4.2 为什么很多成熟平台看起来“按页定位很准”

因为它们通常不是把页当作抽取主键，而是用渲染器反推页面位置。

官方资料里最接近这个能力的例子：

- Aspose.Words 的 `LayoutCollector` 可以把 `run / paragraph / table cell` 映射到开始页、结束页和跨页范围。
  来源：
  [Aspose.Words LayoutCollector](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/)
  [Aspose.Words LayoutCollector.get_start_page_index](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/get_start_page_index/)

这类能力说明：

- 正确姿势不是“先按页切，再找内容”
- 而是“先有结构节点，再问这个节点落在哪一页”

### 4.3 为什么只靠 Mammoth 这类库不够

Mammoth 官方 README 写得非常直接：

- 它的目标是基于语义信息生成简洁 HTML
- 会忽略很多视觉格式细节
- 复杂文档不保证完美

来源：
[python-mammoth README](https://github.com/mwilliamson/python-mammoth/blob/master/README.md)

这类库很适合：

- 语义抽取
- 样式到 HTML 的映射
- 快速结构化预览

但不适合直接承担：

- 和 Word 接近的版式保真
- 高精度分页定位
- 工程级原文批注定位

### 4.4 前端 HTML 渲染库能帮什么，帮不到什么

`docx-preview / docxjs` 这种前端库能把 DOCX 渲染成 HTML，并支持一些分页/批注实验能力：

- `breakPages`
- `renderComments`
- `tab stops calculation`（实验）
- 可选使用 `lastRenderedPageBreak`

来源：
[docxjs README](https://github.com/VolodymyrBaydalka/docxjs)

但官方 README 同时也明确说了：

- 它的目标是尽量保持 HTML 语义
- 实时分页不实现
- TOC 支持有限
- 内部解析和渲染实现还可能变

所以它更像：

- 一个很好的“前端近似原文预览层”

而不是：

- 一个足够可靠的“服务端结构恢复与分页真相来源”

## 5. “像成熟论文/AIGC 审查平台”通常靠什么

这里给一个工程判断，需要明确说明：这是基于官方库能力做的实现推断，不是对某家商业产品内部架构的直接证据。

### 5.1 最常见的成熟路线

大概率是下面两层组合：

1. 结构解析
   - OOXML 解析库
   - 样式/字段/批注范围/表格/标题树提取
2. 高保真渲染或宿主定位
   - Word / Aspose / Office 宿主 / 近似 HTML 渲染器
   - 再把审核问题锚到 range / node / page overlay

### 5.2 原文批注为什么能“贴得准”

因为 Word 生态本身就支持“评论锚点是范围，不是整段文本”。

`python-docx` 的评论文档说明：

- comment reference 是一个 range
- range 需要落在 run 边界上
- 可能需要为了评论而拆 run

来源：
[python-docx - Working with Comments](https://python-docx.readthedocs.io/en/latest/user/comments.html)

这和我们当前只保存：

- `paragraphId`
- `startOffset`
- `endOffset`
- `text`

相比，已经接近成熟系统要做的第一步了。  
但我们现在缺的是：

- 更可信的 run/range 边界
- 更可信的 blockType
- 更可信的渲染定位

## 6. 适配当前仓库的 3 条实施路线

### 方案 A：最小修补版

适合：先把误报和目录/封面混乱快速压住，不追求页级高保真。

做法：

1. 重写 `docxParser.mjs` 的结构预处理层
2. 新增 `blockType`
3. 过滤 `cover / toc / header_footer`
4. 保留 tab / leader / paragraph alignment 的最小元数据
5. 规则和 LLM 只吃 `reviewEligible === true` 的块

优点：

- 改动小
- 可以较快消灭你现在看到的目录误报
- 不引入重渲染依赖

缺点：

- 还是 paragraph-based 视图
- 很难做到“像成熟平台一样贴页批注”

推荐程度：

- 可作为第一阶段止血

### 方案 B：语义抽取 + 前端近似原文预览

适合：希望明显提升视觉保真和定位体验，但暂时不引入商业库。

做法：

1. 服务端结构层改造，输出 block tree
2. 前端引入 `docx-preview/docxjs` 做近似原文 HTML 预览
3. issue 锚点从 `paragraphId` 升级到 `nodePath / runRange / blockId`
4. 在前端 HTML 视图上叠加批注与高亮

优点：

- 用户体验比纯文本工作台强很多
- 目录、标题、页眉页脚能更接近原文呈现
- 保持 JS 技术栈一致

缺点：

- 分页精度不是 Word 真相
- TOC、tab、comments、breaks 仍有不少边界情况
- 预览层会比现在复杂不少

推荐程度：

- 适合作为第二阶段

### 方案 C：结构抽取 + 商业级版式/页面定位

适合：目标就是做成接近成熟审查平台的“原文定位 + 批注”体验。

做法：

1. 引入具备 page layout / node-to-page mapping 能力的库
2. 用结构节点做审核锚点
3. 用 layout collector / page mapping 做页级定位
4. 再决定是输出 PDF 页视图还是高保真 HTML 页视图

当前候选里，官方资料最完整的是：

- Aspose.Words for Python via .NET

优点：

- 路线最接近成熟平台
- 对“节点在哪一页”这类问题支持最直接
- 便于后续做批注、导出、整改回写

缺点：

- 商业授权成本
- 引入 Python/.NET 运行时复杂度
- 要设计和现有 Node 服务的边界

推荐程度：

- 如果你们把“贴原文批注”作为平台核心竞争力，这是最值得认真评估的路线

## 7. 我对当前项目的推荐顺序

### 第一步：先止血

目标：先消灭你现在最明显的错误体验。

建议任务：

1. `docxParser` 新增 block classifier
2. 明确过滤：
   - cover
   - toc
   - header/footer
   - empty/ornamental paragraph
3. 目录项保留显示，但禁止送审
4. 规则引擎增加 `reviewEligible` 门禁
5. LLM prompt 不再直接吃整个 section 的纯拼文本，而是只吃正文候选块

### 第二步：再做原文保真预览

目标：让用户看到的不是“洗平后的纯文本工作台”，而是更接近原文的结构视图。

建议任务：

1. 评估 `docx-preview/docxjs` 前端预览
2. 评估 block tree 到 DOM node 的映射
3. 让 `issue.anchor` 支持更细粒度结构锚点

### 第三步：决定是否投入页级真定位

目标：判断是否值得为“成熟平台级批注体验”投入更重型能力。

建议决策点：

- 如果你们只要“资料审核够准”，方案 A + B 就可能够用
- 如果你们要“像论文/AIGC 平台一样原页批注”，应认真评估方案 C

## 8. 这次对齐后，后续 spec 应该怎么写

下一份正式 OpenSpec，我建议不要再写成“优化提示词”。

更好的 change 名称应该类似：

- `construction-plan-docx-structure-preprocessing`
- `construction-plan-review-eligible-block-gating`
- `construction-plan-source-faithful-preview`

也就是说，把问题拆成三层：

1. 结构恢复
2. 审核门禁
3. 原文定位/预览

## 9. 我给你的推荐答案

如果你问我“我现在打算如何着手修复”，我的推荐是：

1. 先不要把主要精力放在提示词
2. 先修 `docxParser + blockType + review gate`
3. 再决定是否上 `docx-preview` 作为近似原文视图
4. 如果产品目标是成熟平台级原页批注，再单独评估 Aspose 路线

一句话总结：

**你们现在的问题主要不是 AI 审核太弱，而是 DOCX 结构恢复还停留在“把 OOXML 洗成粗段落文本”的阶段。先把结构层做对，审核效果才会真正上台阶。**

## 10. 参考来源

- Microsoft Learn:
  [LastRenderedPageBreak](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.lastrenderedpagebreak?view=openxml-3.0.1)
- python-docx:
  [Working with Comments](https://python-docx.readthedocs.io/en/latest/user/comments.html)
  [Working with Text / Tab stops](https://python-docx.readthedocs.io/en/latest/user/text.html#tab-stops)
  [Understanding Styles](https://python-docx.readthedocs.io/en/stable/user/styles-understanding.html)
- Mammoth:
  [python-mammoth README](https://github.com/mwilliamson/python-mammoth/blob/master/README.md)
- Aspose.Words:
  [Document.page_count](https://reference.aspose.com/words/python-net/aspose.words/document/page_count/)
  [LayoutCollector](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/)
  [LayoutCollector.get_start_page_index](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/get_start_page_index/)
  [FieldToc](https://reference.aspose.com/words/python-net/aspose.words.fields/fieldtoc/entry_identifier/)
  [FieldTC](https://reference.aspose.com/words/python-net/aspose.words.fields/fieldtc/)
- docx-preview / docxjs:
  [docxjs README](https://github.com/VolodymyrBaydalka/docxjs)
