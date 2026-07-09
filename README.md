# AI-assisted-review-platform

AI 辅助施工方案审查平台。

当前阶段是交互 MVP：使用 mock 施工方案和 mock AI 审查结果，验证“原文标注 + 右侧审查意见 + 接受/拒绝/修改后接受 + 处理后方案预览”的核心产品体验。

## 本地运行

```bash
npm install
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:5173/
```

## 轻量验证

```bash
npm run typecheck
```

## 当前边界

- 未接入真实 AI、Dify、LangGraph 或规范知识库。
- 未接入真实 PDF/DOCX 解析。
- 未接入数据库、权限、上传、报告导出。
- 当前重点是验证审查工作台交互和结构化问题模型。
