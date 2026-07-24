const riskRules = [
  {
    id: "scaffold-hazard",
    severity: "critical",
    keywords: ["脚手架", "搭设高度", "满堂支架", "悬挑脚手架"],
    pattern: /搭设高度\s*(?:超过|达到|[0-9]+m)/,
    title: "脚手架/支架工程可能涉及危大工程管理",
    reason: "脚手架或支架搭设高度达到危大工程识别条件，应编制专项施工方案并履行审批程序。",
    basis: "《危险性较大的分部分项工程安全管理规定》（住建部令第37号）",
    suggestion: "核实搭设高度是否达到危大工程条件，补充专项方案审批、交底和验收流程。",
  },
  {
    id: "tower-crane-tether",
    severity: "critical",
    keywords: ["铁丝", "临时拉结", "附着", "塔吊"],
    pattern: /铁丝|临时拉结/,
    title: "起重机械附着固定方式可能存在风险",
    reason: "塔吊附着不得采用临时柔性材料替代专用附着装置。",
    basis: "《建筑施工塔式起重机安装、使用、拆卸安全技术规程》JGJ196",
    suggestion: "删除临时拉结表述，补充经计算复核的专用附着装置及安装验收记录。",
  },
  {
    id: "temporary-power",
    severity: "high",
    keywords: ["临时用电", "配电箱", "漏电保护", "防雨", "视现场"],
    pattern: /视.*情况|临时用电|配电箱/,
    title: "临时用电安全措施需要进一步明确",
    reason: "临时用电设施的防雨、防潮和漏电保护不应作为可选措施。",
    basis: "《施工现场临时用电安全技术规范》JGJ46-2005",
    suggestion: "将防雨、防潮、防砸和漏电保护写为明确配置要求。",
  },
  {
    id: "emergency-response",
    severity: "medium",
    keywords: ["应急", "救援", "事故", "演练"],
    pattern: /根据实际情况组织救援|应急处置/,
    title: "应急处置内容需要形成闭环",
    reason: "应急章节应明确组织职责、联络方式、救援路线、资源清单和演练安排。",
    basis: "安全风险管理要求专项方案具备可执行的应急响应和资源保障安排。",
    suggestion: "补充应急组织架构、联系人清单、救援路线、物资清单和演练计划。",
  },
  {
    id: "hoisting-safety",
    severity: "high",
    keywords: ["吊装", "起重", "吊车", "汽车吊", "履带吊"],
    pattern: /吊装|起重|汽车吊|履带吊/,
    title: "吊装作业安全措施需要复核",
    reason: "吊装作业应明确设备选型、作业半径、指挥信号和应急预案。",
    basis: "《建筑施工起重吊装安全技术规范》JGJ276",
    suggestion: "补充吊装设备参数、作业半径限制、指挥信号和应急预案。",
  },
  {
    id: "deep-foundation",
    severity: "high",
    keywords: ["基坑", "开挖深度", "钢板桩", "围护"],
    pattern: /开挖深度|基坑.*开挖|钢板桩/,
    title: "深基坑施工安全措施需要复核",
    reason: "深基坑施工应明确围护结构、降水方案、监测要求和应急预案。",
    basis: "《建筑基坑支护技术规程》JGJ120",
    suggestion: "核实基坑深度是否达到危大工程条件，补充围护、降水、监测和应急措施。",
  },
  {
    id: "acceptance-loop",
    severity: "medium",
    keywords: ["验收", "资料", "归档"],
    pattern: /投入使用前应完成验收|验收资料/,
    title: "验收与资料归档责任需要明确",
    reason: "验收资料不应只停留在原则性描述，需要明确责任主体、复核节点和归档清单。",
    basis: "施工方案应明确验收、复核、整改闭环和资料归档要求。",
    suggestion: "补充验收责任人、复核流程、整改闭环和归档资料清单。",
  },
  {
    id: "safety-education",
    severity: "medium",
    keywords: ["安全教育", "交底", "培训"],
    pattern: /安全教育|技术交底|安全交底/,
    title: "安全教育和交底要求需要具体化",
    reason: "安全教育和交底应明确对象、内容、频次和记录要求。",
    basis: "《建设工程安全生产管理条例》",
    suggestion: "明确安全教育对象、培训内容、交底频次和签字记录要求。",
  },
];

export function runRuleEngine(paragraphs) {
  const findings = [];

  for (const paragraph of paragraphs) {
    for (const rule of riskRules) {
      const keywordMatch = rule.keywords.some((kw) => paragraph.text.includes(kw));
      const patternMatch = rule.pattern ? rule.pattern.test(paragraph.text) : false;

      if (keywordMatch || patternMatch) {
        findings.push({
          ruleId: rule.id,
          paragraphId: paragraph.id,
          section: paragraph.section,
          severity: rule.severity,
          title: rule.title,
          reason: rule.reason,
          basis: rule.basis,
          suggestion: rule.suggestion,
          matchedText: paragraph.text.slice(0, 200),
          matchedKeyword: rule.keywords.find((kw) => paragraph.text.includes(kw)) ?? "",
        });
      }
    }
  }

  return findings;
}

export function summarizeRuleFindings(findings) {
  const byParagraph = new Map();
  for (const finding of findings) {
    const existing = byParagraph.get(finding.paragraphId) ?? [];
    existing.push(finding);
    byParagraph.set(finding.paragraphId, existing);
  }

  return Array.from(byParagraph.entries()).map(([paragraphId, items]) => ({
    paragraphId,
    section: items[0].section,
    riskCount: items.length,
    highestSeverity: items.reduce((highest, item) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[item.severity] ?? 3) < (order[highest] ?? 3) ? item.severity : highest;
    }, "low"),
    titles: [...new Set(items.map((item) => item.title))],
  }));
}
