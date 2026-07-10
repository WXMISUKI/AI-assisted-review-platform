# AI-assisted-review-platform DESIGN.md

## 1. Visual Theme & Atmosphere

本项目是面向监理、施工方和平台管理员的企业级 AI 施工方案审查平台。界面应当像专业审阅工作台，而不是营销页或消费级聊天产品。

设计关键词：

- 专业、克制、可信、可审计。
- 高信息密度，但层级清晰。
- 白色/浅灰为主，深色仅用于登录页强调、状态栏或局部工具面板。
- 以文档、问题、证据、状态为核心，不做装饰性大图和宣传式 hero。

参考提炼：

- IBM Carbon：企业级、低装饰、明确边界、蓝色作为可信主色。
- Linear：高密度工作台、细边框、状态清晰、少量强调色。
- Cohere：AI 平台感，但保留白色编辑与数据工作区。
- 当前 MVP：保留红/绿/灰状态、右侧审查卡片和文档锚点风格。

## 2. Color Palette & Roles

### Core

- Canvas: `#f4f7fa` 页面底色。
- Surface: `#ffffff` 主面板、卡片、表单。
- Surface Muted: `#f8fafc` 次级面板、空状态、工具条。
- Border: `#d8e0e6` 常规边框。
- Border Soft: `#e7edf2` 分割线。
- Ink: `#1b2430` 主文本。
- Ink Muted: `#536477` 次级文本。
- Ink Subtle: `#7a8998` 弱文本。

### Brand / Action

- Primary: `#0f766e` 主操作、焦点、当前定位。
- Primary Hover: `#0b5f59`。
- Primary Soft: `#e8f7f3` 选中背景。
- Info Blue: `#175cd3` 信息状态、链接。

### Review Semantics

- Issue Critical: `#b42318` 重大风险、删除危险。
- Issue Warning: `#b45f06` 高风险/待处理。
- Accepted: `#177245` 已接受、处理通过。
- Rejected: `#7b8794` 已拒绝、作废/保留原文。
- Manual: `#714300` 人工标注提示。

## 3. Typography Rules

使用系统字体优先：

```css
Inter, "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

字号层级：

- Page Title: 24px / 700 / line-height 1.3。
- Section Title: 17px / 700 / line-height 1.35。
- Card Title: 15px / 700 / line-height 1.45。
- Body: 14px-16px / 400 / line-height 1.6-1.9。
- Caption: 12px-13px / 600 / line-height 1.4。
- Mono ID: 12px-13px / ui-monospace，用于任务 ID、文档编号、Agent 编号。

规则：

- 不使用超大营销标题。
- 工具页标题控制在 24px 内。
- 文档正文可用 16px、line-height 1.9，保证长文阅读。
- 按钮与状态标签不使用负字距。

## 4. Component Stylings

### App Shell

- 左侧主导航：固定宽度 240-280px，可折叠。
- 主内容区：文档库、知识库、数据资产、审查详情页。
- 顶部工具条：当前项目、角色、通知、用户菜单。
- 详情页保留三栏：目录/文档/意见卡片。

### Buttons

- Primary: `#0f766e` 背景，白字，8px radius。
- Secondary: 白底，边框 `#c9d7df`，深色文字。
- Danger: `#b42318` 背景或红色边框。
- Icon Button: 32-36px 固定尺寸，必须有 tooltip 或 aria-label。

### Cards

- radius 不超过 8px。
- 单层卡片，不嵌套卡片。
- 使用 1px 边框区分层级，少用大阴影。
- 重复列表项可用卡片；页面大区域不要都做成悬浮卡片。

### Tables / Lists

- 文档库和任务历史优先用列表/表格，而不是营销卡片网格。
- 每行展示：文档名、项目、状态、上传人、角色、审查模式、最后更新时间、操作。

### Review Markers

- AI 标注：红色波浪线或浅红背景。
- 人工标注：黄色/琥珀背景。
- 已接受：绿色波浪线或浅绿背景。
- 已拒绝：灰色弱化。
- 当前定位：青绿色 outline。

## 5. Layout Principles

- 默认进入文档库工作台，不进入营销首页。
- 文档上传区允许拖拽上传，但上传后应进入任务状态流。
- 审查详情页是最高复杂度页面，优先保证效率：
  - 左：章节目录/页码。
  - 中：文档视图。
  - 右：问题卡片与处理动作。
  - 底部或独立页：报告/预览。

## 6. Depth & Elevation

- Level 0: 页面背景 `#f4f7fa`。
- Level 1: 白色面板 + 1px 边框。
- Level 2: 弹窗/浮层 + 边框 + 柔和阴影。
- Level 3: 模态确认框 + 半透明遮罩。

不要使用大面积渐变、装饰光斑、营销插画背景。

## 7. Do's and Don'ts

### Do

- 让用户一眼看到文档、状态、问题数量、下一步动作。
- 让所有 AI 输出都有来源、依据、置信度或风险等级。
- 让接受/拒绝可撤销，生产版再通过日志追踪。
- 把审查模式和审查修改模式分离。
- 对长文档使用连续阅读/分页/对比视图，不用大量段落卡片堆叠。

### Don't

- 不做登录后的欢迎大屏。
- 不用聊天作为主界面承载施工方案审查。
- 不让 AI 直接覆盖用户原文。
- 不在没有确认的情况下删除标注或结束审核。
- 不用紫色/蓝紫渐变作为主视觉。

## 8. Responsive Behavior

本项目第一优先级是桌面端，建议最低宽度 1280px。

- 1440px 以上：三栏工作台完整展示。
- 1280px-1439px：左侧目录可折叠。
- 1024px-1279px：右侧意见面板可抽屉化。
- 移动端只支持查看状态和报告，不作为主要审查端。

## 9. Agent Prompt Guide

构建页面时遵守：

- “企业级审查工作台”，不是“AI 聊天产品”。
- 首页就是文档库，不要 landing page。
- 用图标表达上传、审查、报告、知识库、智能体、提示词资产。
- 使用高密度但有边界的列表、表格、面板和状态标签。
- AI 相关页面强调“可配置、可追溯、可审计”。

## 10. External Design Reference Library

本项目的样式开发参考 `D:\work\tools\awesome-design-md` 这套 DESIGN.md 设计库。它的根目录 README 说明了整套资料的组织方式：每个样式文件通常包含视觉主题、颜色角色、排版、组件、布局、层级、守则和响应式指引。我们在做样式决策时，不是照抄某个品牌，而是从中提炼适合企业审查工作台的表达方式。

使用原则：

- 先看根目录 README，再看与当前问题最接近的风格参考文件。
- 重点借鉴结构和语义，不复制品牌标识、商标色和营销视觉。
- 登录页、壳层、按钮、弹窗、空状态和深浅主题切换，优先参考这类资料。
- 当需要稳定的企业级工作台感时，优先看 `IBM`、`Linear`、`Cohere`、`Claude` 这类参考；当需要阅读感和克制感时，也可参考 `Mintlify`、`Vercel` 一类的样式语言。

落地要求：

- 参考资料只能帮助我们确定语义、层级、密度和动效节奏，最终仍要回到本项目的 token 系统。
- 所有颜色、边框、阴影、按钮和浮层都必须最终映射到 `src/styles.css` 的语义变量。
- 如果外部参考与本项目目标冲突，以“企业级审查工作台”的可读性、可审计性和稳定性为准。
