const MAX_TEXT_LENGTH = 2000;
const MAX_TITLE_LENGTH = 240;
const MAX_ITEMS = 100;

function reportHtmlText(value, maxLength = MAX_TEXT_LENGTH) {
  const text = typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");
}

function getSeverityLabel(severity) {
  const map = { critical: "重大", high: "高", medium: "中", low: "低" };
  return map[severity] ?? severity ?? "中";
}

function getDecisionLabel(decision) {
  return decision === "accepted" ? "采纳" : decision === "rejected" ? "拒绝" : decision ?? "-";
}

function buildSupervisorReportHtml(asset) {
  if (!asset || asset.type !== "supervisor-report") {
    return null;
  }

  const documentName = reportHtmlText(asset.documentName || "未命名施工方案", MAX_TITLE_LENGTH);
  const projectName = reportHtmlText(asset.projectName || "未指定项目", MAX_TITLE_LENGTH);
  const createdAt = reportHtmlText(asset.createdAt || "", 80);
  const stats = asset.issueStats ?? { total: 0, accepted: 0, rejected: 0, pending: 0, modified: 0 };
  const summary = reportHtmlText(asset.summary || "", 1000);
  const conclusion = reportHtmlText(asset.conclusion || "请由监理工程师结合现场完成最终确认。", 1000);

  const majorRiskItems = Array.isArray(asset.majorRisks)
    ? asset.majorRisks.slice(0, 20).map((risk) => `<li>${reportHtmlText(risk, 500)}</li>`).join("")
    : "";

  const issueRows = Array.isArray(asset.issueOpinions)
    ? asset.issueOpinions
        .slice(0, MAX_ITEMS)
        .map(
          (opinion, index) => `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td>${reportHtmlText(opinion.title, MAX_TITLE_LENGTH)}</td>
          <td style="text-align:center;">${getSeverityLabel(opinion.severity)}</td>
          <td style="text-align:center;">${getDecisionLabel(opinion.decision)}</td>
          <td>${reportHtmlText(opinion.opinion, 600)}</td>
          <td>${reportHtmlText(opinion.basis, 400)}</td>
        </tr>`,
        )
        .join("")
    : "";

  const rectificationItems = Array.isArray(asset.rectificationSuggestions)
    ? asset.rectificationSuggestions
        .slice(0, 50)
        .map((item, index) => `<li>${index + 1}. ${reportHtmlText(item, 600)}</li>`)
        .join("")
    : "";

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>施工方案审查报告 - ${documentName}</title>
    <style>
      body { font-family: "SimSun", "宋体", serif; color: #20242a; font-size: 10pt; line-height: 1.5; margin: 32pt; }
      h1 { text-align: center; font-size: 18pt; margin: 0 0 12pt; }
      h2 { font-size: 13pt; margin: 18pt 0 8pt; border-bottom: 1px solid #c9ced6; padding-bottom: 4pt; }
      p { margin: 4pt 0; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #8c949e; padding: 5pt 6pt; vertical-align: top; word-break: break-word; }
      th { background: #eef1f4; text-align: center; }
      .metric-row td { text-align: center; padding: 8pt 4pt; }
      .metric { font-size: 16pt; font-weight: bold; display: block; }
      .metric-label { font-size: 9pt; color: #536477; }
      .muted { color: #66707d; font-size: 9pt; }
      ul { margin: 4pt 0 8pt 20pt; padding: 0; }
      li { margin-bottom: 3pt; }
    </style>
  </head>
  <body>
    <h1>施工方案审查报告</h1>
    <p><strong>文档：</strong>${documentName}</p>
    <p><strong>项目：</strong>${projectName}</p>
    <p><strong>生成时间：</strong>${createdAt}</p>
    <p class="muted">本报告为平台智能辅助审查意见，不替代监理单位及相关责任人的最终审核责任。</p>

    <h2>一、审查总体情况</h2>
    <p>${summary || "本次审查已完成全部问题处理。"}</p>
    <table>
      <tr class="metric-row">
        <td><span class="metric">${Number(stats.total) || 0}</span><span class="metric-label">审查意见总数</span></td>
        <td><span class="metric">${Number(stats.accepted) || 0}</span><span class="metric-label">已采纳</span></td>
        <td><span class="metric">${Number(stats.rejected) || 0}</span><span class="metric-label">已拒绝</span></td>
        <td><span class="metric">${Number(stats.pending) || 0}</span><span class="metric-label">待处理</span></td>
        <td><span class="metric">${Number(stats.modified) || 0}</span><span class="metric-label">修改接受</span></td>
      </tr>
    </table>

    <h2>二、主要风险项</h2>
    <ul>${majorRiskItems || "<li>本次审查未识别到重大或高风险问题。</li>"}</ul>

    <h2>三、审查意见明细</h2>
    <table>
      <tr>
        <th style="width:5%;">序号</th>
        <th style="width:28%;">问题标题</th>
        <th style="width:8%;">风险</th>
        <th style="width:8%;">处理</th>
        <th style="width:32%;">审查意见</th>
        <th style="width:19%;">依据</th>
      </tr>
      ${issueRows || "<tr><td colspan=\"6\" style=\"text-align:center;\">暂无审查意见明细。</td></tr>"}
    </table>

    <h2>四、整改建议</h2>
    <ul>${rectificationItems || "<li>请按已采纳审查意见完成方案修订并重新报审。</li>"}</ul>

    <h2>五、审查结论</h2>
    <p>${conclusion}</p>
  </body>
</html>`;
}

function buildRevisedPlanSnapshotHtml(asset) {
  if (!asset || asset.type !== "revised-plan-snapshot") {
    return null;
  }

  const documentName = reportHtmlText(asset.documentName || "未命名整改方案", MAX_TITLE_LENGTH);
  const projectName = reportHtmlText(asset.projectName || "未指定项目", MAX_TITLE_LENGTH);
  const createdAt = reportHtmlText(asset.createdAt || "", 80);
  const stats = asset.issueStats ?? { total: 0, accepted: 0, rejected: 0, pending: 0, modified: 0 };
  const processingSummary = reportHtmlText(asset.processingSummary || "", 1000);

  const acceptedRows = Array.isArray(asset.acceptedChanges)
    ? asset.acceptedChanges
        .slice(0, MAX_ITEMS)
        .map(
          (change, index) => `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td>${reportHtmlText(change.issueId, 120)}</td>
          <td>${reportHtmlText(change.originalText, 600)}</td>
          <td>${reportHtmlText(change.revisedText, 600)}</td>
        </tr>`,
        )
        .join("")
    : "";

  const rejectedRows = Array.isArray(asset.rejectedItems)
    ? asset.rejectedItems
        .slice(0, MAX_ITEMS)
        .map(
          (item, index) => `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td>${reportHtmlText(item.issueId, 120)}</td>
          <td>${reportHtmlText(item.title, MAX_TITLE_LENGTH)}</td>
          <td>${reportHtmlText(item.reason, 500)}</td>
        </tr>`,
        )
        .join("")
    : "";

  const paragraphItems = Array.isArray(asset.processedParagraphs)
    ? asset.processedParagraphs
        .slice(0, 120)
        .map(
          (paragraph, index) => `
        <article style="margin-bottom:10pt;">
          <p style="margin:0 0 3pt;"><strong>${index + 1}. ${reportHtmlText(paragraph.section, 240)}</strong></p>
          <p style="margin:0;">${reportHtmlText(paragraph.text, 1600)}</p>
        </article>`,
        )
        .join("")
    : "";

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>整改后方案快照 - ${documentName}</title>
    <style>
      body { font-family: "SimSun", "宋体", serif; color: #20242a; font-size: 10pt; line-height: 1.5; margin: 32pt; }
      h1 { text-align: center; font-size: 18pt; margin: 0 0 12pt; }
      h2 { font-size: 13pt; margin: 18pt 0 8pt; border-bottom: 1px solid #c9ced6; padding-bottom: 4pt; }
      p { margin: 4pt 0; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #8c949e; padding: 5pt 6pt; vertical-align: top; word-break: break-word; }
      th { background: #eef1f4; text-align: center; }
      .metric-row td { text-align: center; padding: 8pt 4pt; }
      .metric { font-size: 16pt; font-weight: bold; display: block; }
      .metric-label { font-size: 9pt; color: #536477; }
      .muted { color: #66707d; font-size: 9pt; }
    </style>
  </head>
  <body>
    <h1>整改后方案快照</h1>
    <p><strong>文档：</strong>${documentName}</p>
    <p><strong>项目：</strong>${projectName}</p>
    <p><strong>生成时间：</strong>${createdAt}</p>
    <p class="muted">本快照用于展示已采纳修改后的方案文本及保留项，不替代正式成文文件。</p>

    <h2>一、处理概况</h2>
    <p>${processingSummary || "整改后方案快照已生成。"}</p>
    <table>
      <tr class="metric-row">
        <td><span class="metric">${Number(stats.total) || 0}</span><span class="metric-label">问题总数</span></td>
        <td><span class="metric">${Number(stats.accepted) || 0}</span><span class="metric-label">已采纳修改</span></td>
        <td><span class="metric">${Number(stats.rejected) || 0}</span><span class="metric-label">保留原文</span></td>
      </tr>
    </table>

    <h2>二、已采纳修改</h2>
    <table>
      <tr>
        <th style="width:6%;">序号</th>
        <th style="width:14%;">问题ID</th>
        <th style="width:40%;">原文</th>
        <th style="width:40%;">整改后</th>
      </tr>
      ${acceptedRows || "<tr><td colspan=\"4\" style=\"text-align:center;\">暂无已采纳修改。</td></tr>"}
    </table>

    <h2>三、保留项</h2>
    <table>
      <tr>
        <th style="width:6%;">序号</th>
        <th style="width:14%;">问题ID</th>
        <th style="width:30%;">问题标题</th>
        <th style="width:50%;">保留原因</th>
      </tr>
      ${rejectedRows || "<tr><td colspan=\"4\" style=\"text-align:center;\">暂无保留项。</td></tr>"}
    </table>

    <h2>四、整改后文本快照</h2>
    ${paragraphItems || "<p>暂无可导出的整改后文本。</p>"}
  </body>
</html>`;
}

export function buildReviewReportHtml(asset) {
  return buildSupervisorReportHtml(asset);
}

export function buildReviewResultHtml(asset) {
  if (!asset) {
    return null;
  }
  if (asset.type === "supervisor-report") {
    return buildSupervisorReportHtml(asset);
  }
  if (asset.type === "revised-plan-snapshot") {
    return buildRevisedPlanSnapshotHtml(asset);
  }
  return null;
}
