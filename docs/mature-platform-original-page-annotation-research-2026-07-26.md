# 成熟平台级原页批注调研

更新时间：2026-07-26

## 1. 这次调研要回答什么

目标不是泛泛地看“别人也能批注”，而是明确：

1. 成熟平台做“原页批注”到底走哪条技术路线？
2. 这些路线是直接批注 DOCX 原文，还是先变成渲染页/PDF 再批注？
3. 如果我们要做“成熟平台级原页批注”，最接近现实的工程方案是什么？

## 2. 先给结论

### 2.1 市面上主流有两条路线

#### 路线 A：Word-native 批注

代表：

- Microsoft Word / Office.js
- ONLYOFFICE Docs

核心特征：

- 批注锚点直接挂在 DOCX 文档内部的文本范围（range/run/comment range）上
- 看到的页面就是 Word 编辑器自己的渲染结果
- 接受/拒绝、批注、修订，都是原生文档模型的一部分

这类路线最像“真正的 DOCX 原页批注”。

#### 路线 B：页面视图批注

代表：

- Adobe Acrobat / PDF Embed API
- Bluebeam Revu
- Procore（Submittal PDF / Drawings）
- Autodesk Reviews / Viewer Markups

核心特征：

- 批注不直接挂在 DOCX 文档对象模型上
- 先在渲染后的页面视图上批注
- 实际锚点通常是页号 + 页面坐标 + 标注对象
- 很多平台的最终批注载体其实是 PDF 页面，而不是 DOCX 内部 range

这类路线最像“工程资料审图平台”的做法。

### 2.2 如果你说的“成熟平台级原页批注”是工程行业里常见的那种体验

那它更接近：

**先获得稳定页面视图，再在页坐标系上批注**

而不是：

**直接把 DOCX XML 解析成纯文本，再在纯文本上审核**

### 2.3 如果你要求“既保留 DOCX 原始格式，又能像 Word 一样对选中文本做评论”

那最接近真实答案的是：

- 直接接入 Word-native 编辑/协作器
- 或使用具备完整文档模型和评论能力的文档编辑器（如 ONLYOFFICE）

如果不走这条路，而是自己搭：

- 你至少需要“结构锚点 + 版式引擎 + 视图层批注”

单靠我们现在的 `docxParser.mjs + rules + LLM` 是完全不够的。

## 3. 官方资料能证明什么

## 3.1 Word-native 路线：批注锚点来自文档 Range

### Microsoft Word / Office.js

官方 API 直接暴露：

- `Word.Comment.getRange()`
- `Word.Range`

这说明评论对象不是挂在“页坐标”上，而是挂在 Word 文档内部的连续内容范围上。

来源：

- [Word.Comment class - Microsoft Learn](https://learn.microsoft.com/en-us/javascript/api/word/word.comment?view=word-js-preview)
- [Word.Range class - Microsoft Learn](https://learn.microsoft.com/en-us/javascript/api/word/word.range?view=word-js-preview)

含义：

- Word-native 平台之所以“批得准”，不是因为先按页切对了
- 而是因为它本来就运行在 Word 文档模型里，range 是一等公民

### python-docx

`python-docx` 官方文档说明：

- comment 依附于文本范围
- 评论锚点需要落在 run 边界上

来源：

- [python-docx - Working with Comments](https://python-docx.readthedocs.io/en/latest/user/comments.html)

含义：

- 如果要做 DOCX 内生批注，底层锚点应该是 run/range，而不是单纯 `paragraphId + offset`

### ONLYOFFICE

ONLYOFFICE 官方文档说明：

- 支持文档评论、review、tracked changes
- Automation API 可以从外部 UI 管理文档 comments
- 可以对文本片段和段落添加 comment

来源：

- [ONLYOFFICE - Working with comments](https://api.onlyoffice.com/docs/docs-api/samples/automation-api/working-with-comments/)
- [ONLYOFFICE - Commenting](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/commenting/)
- [ONLYOFFICE - Reviewing](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/reviewing/)
- [ONLYOFFICE - Creating document with comments](https://api.onlyoffice.com/docs/office-api/samples/document-editor/creating-document-with-comments/)

含义：

- 这类平台本质上是“把一个完整的文档编辑器嵌进你的系统”
- 它不是“先提取文本再回贴评论”，而是原生文档协作

## 3.2 页面视图路线：批注锚点来自页号/坐标/标注对象

### Adobe Acrobat / PDF Embed API

官方文档说明：

- PDF Embed API 支持 comments and markup
- 支持 text comment、sticky note、highlight、strikethrough、underline、drawing 等
- 说明里直接提到 PDF page coordinates

来源：

- [Adobe PDF Embed API - Comments and Markup](https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/howtos-comments)
- [Adobe Acrobat SDK - Review, Markup, and Approval](https://opensource.adobe.com/dc-acrobat-sdk-docs/library/jsdevguide/JS_Dev_RMA.html?highlight=annotation)
- [Adobe Acrobat SDK - About page coordinates](https://opensource.adobe.com/dc-acrobat-sdk-docs/library/plugin/Plugins_Pages.html)

含义：

- Adobe 这条线的“原页批注”根基是 PDF 的页面坐标系
- 这也是为什么它在页级定位和评论展示上很稳定

### Bluebeam

Bluebeam 官方资料说明：

- Markup 是 PDF 工作流的核心对象
- 工具菜单里大量 annotation / markup 工具都针对 PDF
- MCP 相关资料也说明它能访问 PDF text、markups、page labels 等

来源：

- [Bluebeam Tools menu](https://support.bluebeam.com/user-manual/menus/tools/tools-menu.html)
- [Bluebeam Revu and MCP](https://support.bluebeam.com/revu/resources/revu-mcp.html)

含义：

- Bluebeam 的成熟体验来自“PDF 页面是最终审阅真相”
- 它并不是以 DOCX 原生 range 为基础

### Procore

官方资料说明：

- Submittal review 里是 `Review Submittal PDF Attachments`
- Drawings 工具上传要求就是 PDF
- 在 drawing / submittal PDF 上做 markups

来源：

- [Procore - Review Submittal PDF Attachments](https://v2.support.procore.com/product-manuals/submittals-project/tutorials/review-submittal-pdf-attachments)
- [Procore - Upload Drawings](https://v2.support.procore.com/product-manuals/drawings-project/tutorials/upload-drawings)
- [Procore - Link Items on a Drawing](https://v2.support.procore.com/product-manuals/drawings-project/tutorials/link-items-on-a-drawing)

含义：

- 工程平台里很成熟的一种做法就是：
  - 文档流转可以是多格式
  - 真正进入审阅视图时，批注对象是 PDF/图纸页面

### Autodesk Reviews

官方资料说明：

- Reviews 里可以 add markups
- markup 可 private / publish
- 部分官方 viewer 说明也直接提到 PDF markups / sync markups

来源：

- [Autodesk - Review and Approve Files](https://help.autodesk.com/view/DOCS/ENU/?guid=Reviews_Review_and_Approve)
- [Autodesk - Reviews FAQ and Review File Statuses](https://help.autodesk.com/view/DOCS/ENU/?guid=BIM360D_Document_Management_About_Reviews_Reviews_FAQs_Reference_html)
- [Autodesk Viewer more menu / PDF markups](https://help.autodesk.com/view/DOCS/DAN/?guid=More_Menu_Viewer_Files&l=ENU)

含义：

- Autodesk 这种“工程文件审批体验”更接近 viewer markup 模式
- 它强调 review workflow + published markup，而不是 DOCX 内部文本 range

## 3.3 结构到页的桥梁：不是平台，而是文档引擎

如果我们不直接嵌 Word/ONLYOFFICE，又不满足于“转纯文本工作台”，那中间最关键的桥梁就是：

**文档结构节点如何映射到页面布局**

### Aspose.Words

官方资料说明：

- `Document.page_count` 来自 page layout operation
- `LayoutCollector` 会记录 document nodes 到 layout objects 的映射
- `get_start_page_index()` / `get_end_page_index()` 能查询节点位于哪些页

来源：

- [Aspose.Words Document.page_count](https://reference.aspose.com/words/python-net/aspose.words/document/page_count/)
- [Aspose.Words LayoutCollector](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/)
- [Aspose.Words LayoutCollector.get_start_page_index](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/get_start_page_index/)

含义：

- 这是“自己搭成熟平台级原页批注”最关键的一类能力
- 它让你可以先拿到 paragraph/run/table cell 等结构节点，再问“它在第几页”

## 3.4 纯前端 DOCX 渲染器能做什么

### docxjs / docx-preview

官方 README 表达得很清楚：

- 目标是把 DOCX 渲染/转换成 HTML
- 尽量保留 HTML semantic
- 受 HTML 能力限制
- 支持 `renderComments`、`breakPages`、`ignoreLastRenderedPageBreak`
- 但也明确说：
  - 不实现实时分页
  - TOC 有局限
  - comments 仅实验支持

来源：

- [docxjs README](https://github.com/VolodymyrBaydalka/docxjs)

含义：

- 它适合做“近似原文 HTML 预览层”
- 但不等于“成熟平台级文档真排版引擎”

## 4. 成熟平台为什么看起来“批得很准”

把上面几类产品放在一起，其实规律很明确：

### 类型 1：原生文档编辑器

比如 Word、ONLYOFFICE。

它们之所以批得准，是因为：

- 批注直接锚在文档内容范围
- 页面就是编辑器自己渲染出来的

不是因为它们先把 docx 转成纯文本。

### 类型 2：工程/审图/审批平台

比如 Procore、Bluebeam、Adobe、Autodesk Reviews。

它们之所以批得准，是因为：

- 审阅对象通常是 PDF 或稳定 viewer 页面
- 批注锚在页坐标和标注对象上

不是因为它们在服务端“完美理解了 DOCX XML 的每个换行”。

### 类型 3：自建混合方案

如果平台既想保留 DOCX 结构，又想要页级批注体验，一般就要补一层：

- 结构抽取
- 页面布局映射
- 视图层高亮/评论

这一步最贵，也最容易变成长期基础设施。

## 5. 对我们当前仓库的真正启发

## 5.1 我们现在离成熟平台差的不是“规则还不够多”

而是三层基础设施都没建起来：

1. 结构层
   - 没有稳定识别 cover/toc/body/header/footer/appendix
   - 没有 run/range 级锚点
2. 布局层
   - 没有 document node -> page 的映射能力
3. 视图层
   - 还是“洗平文本工作台”，不是原文视图 + 批注覆盖层

## 5.2 如果要做“成熟平台级原页批注”，最现实的 3 条路

### 路线 1：嵌入成熟 Word-native 编辑器

候选：

- ONLYOFFICE Docs
- Office / Word 宿主能力（更偏 Microsoft 生态）

适合：

- 你真的想让用户在 DOCX 原生语义上批注
- 接受引入完整编辑器

优点：

- 最近似“真正的 DOCX 原页批注”
- 评论、修订、接受/拒绝都是成熟能力

缺点：

- 平台会变成“嵌入式文档编辑器产品”
- 自定义审查工作台逻辑要围着编辑器能力设计

### 路线 2：DOCX 转 PDF / 页面视图后审阅

候选：

- 服务端将 DOCX 转为 PDF
- 前端用 PDF viewer 做页级标注

适合：

- 审图/工程资料审批为主
- 要稳定页定位和成熟批注 UX

优点：

- 和 Procore / Bluebeam / Adobe 这类工程审阅体验最接近
- 页级坐标天然稳定

缺点：

- 批注不再是 DOCX 原生 comment
- 如果要把批注再写回 DOCX，需要额外映射层

### 路线 3：自己搭“结构锚点 + 版式引擎 + 页面视图批注”

候选：

- 结构层继续自己做
- 布局层引入 Aspose.Words 这类能力
- 视图层自己做 overlay

适合：

- 想保留自定义工作流
- 同时想要接近成熟平台的页面体验

优点：

- 自主可控
- 能深度结合你们审查域模型

缺点：

- 成本最高
- 风险最大
- 要长期维护

## 6. 我的推荐

如果你的目标是“成熟平台级原页批注”，我推荐优先按下面顺序思考，而不是先改提示词：

### 第一决策：你要的是哪种“成熟”

#### A. 更像 Word / 论文协作平台

特征：

- 以文本范围批注为中心
- 接受/拒绝修订
- 评论直接属于 DOCX

推荐路线：

- `ONLYOFFICE / Word-native`

#### B. 更像工程审图 / 资料审批平台

特征：

- 以页视图批注为中心
- 云线、框选、评论、状态流转
- 原页定位稳定优先

推荐路线：

- `DOCX -> 页面视图/PDF -> 页级批注`

### 第二决策：你是否接受引入重型依赖

如果接受：

- 最现实的是评估 `ONLYOFFICE` 或 `Aspose`

如果不接受：

- 就只能先做“结构止血 + 近似预览”
- 很难一步到位达到成熟平台级体验

## 7. 对当前项目的推荐下一步

如果我们继续往下走，我建议不要直接说“开始做原页批注”，而是把 spec 拆成两个阶段：

### Phase 1：路线调研后的架构定型

目标：

- 在仓库里明确选 `Word-native` 还是 `page-view`

### Phase 2：技术试点

二选一：

1. `ONLYOFFICE / Word-native POC`
2. `DOCX -> PDF / Aspose-layout -> page annotation POC`

## 8. 我的当前判断

结合你们这个项目的业务类型，我更倾向于：

**工程资料审核平台的“成熟平台级原页批注”，更应该优先靠“稳定页面视图批注”来实现，而不是先追求 DOCX 内生评论。**

原因：

- 工程平台里成熟案例多数走页面视图审阅
- 你们还要做规则审查、问题清单、整改闭环、报告导出
- 页面视图更容易和“审查问题 -> 页内定位 -> 复核 -> 报告”这条链路对齐

如果你接受这个方向，下一步最值得做的不是先写代码，而是：

**出一份正式架构对比 spec：`Word-native` vs `page-view annotation`，然后你拍板选路。**

## 9. 参考来源

- Microsoft Word / Office.js
  - [Word.Comment](https://learn.microsoft.com/en-us/javascript/api/word/word.comment?view=word-js-preview)
  - [Word.Range](https://learn.microsoft.com/en-us/javascript/api/word/word.range?view=word-js-preview)
- python-docx
  - [Working with Comments](https://python-docx.readthedocs.io/en/latest/user/comments.html)
- ONLYOFFICE
  - [Working with comments](https://api.onlyoffice.com/docs/docs-api/samples/automation-api/working-with-comments/)
  - [Commenting](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/commenting/)
  - [Reviewing](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/reviewing/)
  - [Creating document with comments](https://api.onlyoffice.com/docs/office-api/samples/document-editor/creating-document-with-comments/)
- Adobe
  - [PDF Embed API - Comments and Markup](https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/howtos-comments)
  - [Acrobat SDK - Review, Markup, and Approval](https://opensource.adobe.com/dc-acrobat-sdk-docs/library/jsdevguide/JS_Dev_RMA.html?highlight=annotation)
  - [Acrobat SDK - About page coordinates](https://opensource.adobe.com/dc-acrobat-sdk-docs/library/plugin/Plugins_Pages.html)
- Bluebeam
  - [Tools menu](https://support.bluebeam.com/user-manual/menus/tools/tools-menu.html)
  - [Revu and MCP](https://support.bluebeam.com/revu/resources/revu-mcp.html)
- Procore
  - [Review Submittal PDF Attachments](https://v2.support.procore.com/product-manuals/submittals-project/tutorials/review-submittal-pdf-attachments)
  - [Upload Drawings](https://v2.support.procore.com/product-manuals/drawings-project/tutorials/upload-drawings)
  - [Link Items on a Drawing](https://v2.support.procore.com/product-manuals/drawings-project/tutorials/link-items-on-a-drawing)
- Autodesk
  - [Review and Approve Files](https://help.autodesk.com/view/DOCS/ENU/?guid=Reviews_Review_and_Approve)
  - [Reviews FAQ and Review File Statuses](https://help.autodesk.com/view/DOCS/ENU/?guid=BIM360D_Document_Management_About_Reviews_Reviews_FAQs_Reference_html)
  - [Viewer more menu / PDF markups](https://help.autodesk.com/view/DOCS/DAN/?guid=More_Menu_Viewer_Files&l=ENU)
- Aspose.Words
  - [Document.page_count](https://reference.aspose.com/words/python-net/aspose.words/document/page_count/)
  - [LayoutCollector](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/)
  - [LayoutCollector.get_start_page_index](https://reference.aspose.com/words/python-net/aspose.words.layout/layoutcollector/get_start_page_index/)
- docxjs
  - [docxjs README](https://github.com/VolodymyrBaydalka/docxjs)
