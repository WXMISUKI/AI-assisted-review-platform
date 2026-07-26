## 1. 规格

- [x] 1.1 建立 `revised-plan-snapshot` 导出闭环变更
- [x] 1.2 明确本次只补 DOCX 与 HTML fallback，不扩展 PDF

## 2. 实现

- [x] 2.1 后端新增 `revised-plan-snapshot` HTML builder 并接入统一导出路由
- [x] 2.2 前端结果页支持 `revised-plan-snapshot` 导出按钮与 HTML fallback
- [x] 2.3 保持 `supervisor-report` 现有导出能力不回退

## 3. 验证

- [ ] 3.1 `pnpm typecheck`
  - 当前被既有无关类型错误阻断：
  - `src/App.tsx` 的 `OpeningConditionPilotMasterDataRecord.evidenceRefs`
  - `src/productWorkspacePages.tsx` 的 `onIngestPilotMasterDataProviderPreview` / `onIngestMasterDataProviderPreview`
- [x] 3.2 `node --test server/reviewReportExportSmoke.test.mjs`
- [x] 3.3 `pnpm smoke:review`

## 4. 归档

- [x] 4.1 回写任务状态
- [ ] 4.2 明确下一步才回到真实 provider 联调，不继续在本地导出层过度打磨
