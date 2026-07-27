import type {
  OpeningConditionBasisVersion,
  OpeningConditionCheckItem,
  OpeningConditionDifyBridgeOutput,
  OpeningConditionDifyNormalizedOutput,
  OpeningConditionEvidence,
  OpeningConditionHumanReviewItem,
  OpeningConditionKnowledgeBaseRecord,
  OpeningConditionMasterDataRecord,
  OpeningConditionMasterDataType,
  OpeningConditionPacketStage,
  OpeningConditionPreflightReadiness,
  OpeningConditionPublicationGroup,
  OpeningConditionPublicationStatusMeta,
  OpeningConditionPublicationTone,
  OpeningConditionRecordStatus,
  OpeningConditionReviewPacket,
  OpeningConditionReviewObjectType,
  OpeningConditionRiskLevel,
  OpeningConditionRiskSummary,
  OpeningConditionVerdict,
  OpeningConditionVerdictSummary,
  OpeningConditionWorkspace,
  OpeningConditionWorkspaceAssetRegistryRecord,
  OpeningConditionWorkspaceParticipantCatalog,
  OpeningConditionWorkspaceProjectCatalog,
  OpeningConditionWorkspaceReviewObjectCatalog,
} from "./openingConditionReview";
import type { OpeningConditionPilotTask, OpeningConditionPilotTaskState } from "./openingConditionPilot";

export type {
  OpeningConditionBasisVersion,
  OpeningConditionCheckItem,
  OpeningConditionDifyBridgeOutput,
  OpeningConditionDifyNormalizedOutput,
  OpeningConditionEvidence,
  OpeningConditionHumanReviewItem,
  OpeningConditionKnowledgeBaseRecord,
  OpeningConditionMasterDataRecord,
  OpeningConditionMasterDataType,
  OpeningConditionPacketStage,
  OpeningConditionPreflightReadiness,
  OpeningConditionPublicationGroup,
  OpeningConditionPublicationStatusMeta,
  OpeningConditionPublicationTone,
  OpeningConditionRecordStatus,
  OpeningConditionReviewPacket,
  OpeningConditionReviewObjectType,
  OpeningConditionRiskLevel,
  OpeningConditionRiskSummary,
  OpeningConditionVerdict,
  OpeningConditionVerdictSummary,
  OpeningConditionWorkspace,
  OpeningConditionWorkspaceAssetRegistryRecord,
  OpeningConditionWorkspaceParticipantCatalog,
  OpeningConditionWorkspaceProjectCatalog,
  OpeningConditionWorkspaceReviewObjectCatalog,
};

export const openingConditionStageLabels: Record<OpeningConditionPacketStage, string> = {
  "basis-confirmation": "判定依据确认",
  "master-data-initialization": "项目主数据初始化",
  "material-review": "开工条件资料核查",
  "human-review": "平台人工复核",
  "report-ready": "辅助报告归档",
};

export const openingConditionVerdictLabels: Record<OpeningConditionVerdict, string> = {
  pass: "符合",
  fail: "不符合",
  warning: "需关注",
  "needs-human-review": "待人工复核",
};

export const openingConditionRiskLabels: Record<OpeningConditionRiskLevel, string> = {
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
};

export const openingConditionRecordStatusLabels: Record<OpeningConditionRecordStatus, string> = {
  provisional: "待确认",
  confirmed: "已确认",
  published: "已发布",
  human_approved: "当前 run 已确认",
  "pending-human-review": "待人工复核",
  rejected: "已驳回",
  invalid: "无效",
  expired: "已过期",
};

export const openingConditionBasisComponentTypeLabels: Record<string, string> = {
  contract: "合同依据",
  "supplemental-agreement": "补充协议",
  "checklist-template": "核查表模板",
  regulation: "法规规范",
  "project-rule": "项目制度",
  "project-specific-requirement": "项目专项要求",
};

export const openingConditionMasterDataTypeLabels: Record<string, string> = {
  personnel: "人员",
  equipment: "设备器具",
  certificate: "证照",
  company: "单位资质",
  "system-document": "制度资料",
};

export function getOpeningConditionBasisPublicationStatusMeta(status?: string): OpeningConditionPublicationStatusMeta {
  switch (status) {
    case "pending_confirmation":
      return {
        label: "待人工确认",
        description: "识别结果已形成候选依据，但还不能作为正式核查依据使用。",
        tone: "warning",
        group: "pending_confirmation",
      };
    case "confirmed":
      return {
        label: "待发布",
        description: "人工已确认依据内容，等待正式发布后供 run 绑定。",
        tone: "info",
        group: "ready_to_publish",
      };
    case "published":
      return {
        label: "已发布",
        description: "该依据版本已可供当前或后续正式核查使用。",
        tone: "success",
        group: "published",
      };
    case "rejected":
      return {
        label: "已驳回",
        description: "该依据候选未通过人工确认，不参与正式核查。",
        tone: "danger",
        group: "exception",
      };
    default:
      return {
        label: "草稿",
        description: "该依据仍处于草稿或初始化状态，尚未进入正式确认。",
        tone: "muted",
        group: "pending_confirmation",
      };
  }
}

export function getOpeningConditionMasterDataPublicationStatusMeta(status?: string): OpeningConditionPublicationStatusMeta {
  switch (status) {
    case "confirmed":
      return {
        label: "待发布",
        description: "主数据字段已确认，可进一步发布为正式复用事实。",
        tone: "info",
        group: "ready_to_publish",
      };
    case "human_approved":
      return {
        label: "当前 run 已确认",
        description: "该主数据已被人工确认，可用于当前试点 run。",
        tone: "success",
        group: "current_run_confirmed",
      };
    case "published":
      return {
        label: "已发布",
        description: "该主数据已进入正式目录，可被后续核查稳定引用。",
        tone: "success",
        group: "published",
      };
    case "rejected":
      return {
        label: "已驳回",
        description: "该主数据候选未通过人工确认，不参与正式核查。",
        tone: "danger",
        group: "exception",
      };
    default:
      return {
        label: "待人工确认",
        description: "该主数据仍为候选识别结果，不能直接作为正式核查事实。",
        tone: "warning",
        group: "pending_confirmation",
      };
  }
}

const cleanOpeningWorkspace: OpeningConditionWorkspace = {
  id: "oc-ws-current-project",
  tenantName: "开工条件核查试点租户",
  projectId: "project-opening-condition-pilot",
  projectCode: "OC-PILOT-01",
  projectName: "8标主线预制下部结构",
  reviewObjectId: "opening-condition-material-review",
  reviewObjectName: "开工材料核查",
  reviewObjectType: "material-review-topic",
  contractPackage: "8标主线预制下部结构",
  participantEntityId: "opening-condition-project-team",
  participantEntityName: "当前项目施工单位",
  participatingOrganization: "当前项目施工单位",
  organizationRole: "construction-unit",
  purpose: "开工条件资料完整性与合规性核查",
  roleContext: "supervisor-assisted-review",
};

export const openingConditionWorkspaces: OpeningConditionWorkspace[] = [cleanOpeningWorkspace];

const emptyReadiness: OpeningConditionPreflightReadiness = {
  status: "blocked",
  basis: "missing",
  masterData: "missing",
  knowledgeBase: "missing",
  materialPacket: "missing",
  blockingReasons: ["material_packet_required"],
  nextAction: "上传合同/资质依据、资料核查表和核查资料包后开始解析。",
};

export const openingConditionReviewPacket: OpeningConditionReviewPacket = {
  id: "ocr-open-cond-empty",
  workspaceId: cleanOpeningWorkspace.id,
  workspaceContext: cleanOpeningWorkspace,
  projectName: cleanOpeningWorkspace.projectName,
  reviewTarget: cleanOpeningWorkspace.purpose,
  serviceScenario: "supervisor-assisted-review",
  stage: "material-review",
  difyWorkflowName: "平台内可控工作流",
  basisVersions: [],
  evidence: [],
  masterData: [],
  masterDataReadiness: {
    published: 0,
    currentRunConfirmed: 0,
    provisional: 0,
    rejected: 0,
    reviewNeeded: 0,
  },
  knowledgeBase: undefined,
  preflightReadiness: emptyReadiness,
  humanReviewQueue: [],
  checkItems: [],
  reportSummary: {
    title: "开工条件核查报告",
    conclusion: "尚未创建开工条件核查任务，当前没有可展示的核查结论。",
    nextAction: "上传三类审核资料后开始解析。",
    disclaimer: "本结果为平台智能辅助审查意见，不替代施工单位、监理单位及相关责任人的最终审核责任。",
  },
};

export function getOpeningConditionWorkspacePacket(workspaceId: string): OpeningConditionReviewPacket {
  const workspace = openingConditionWorkspaces.find((item) => item.id === workspaceId) ?? cleanOpeningWorkspace;
  return {
    ...openingConditionReviewPacket,
    id: `ocr-open-cond-${workspace.id}`,
    workspaceId: workspace.id,
    workspaceContext: workspace,
    projectName: workspace.projectName,
    reviewTarget: workspace.purpose,
    serviceScenario:
      workspace.roleContext === "construction-unit-self-check"
        ? "contractor-self-check"
        : "supervisor-assisted-review",
    preflightReadiness: {
      ...emptyReadiness,
      nextAction: "上传合同/资质依据、资料核查表和核查资料包后开始解析。",
    },
  };
}

export function buildOpeningConditionWorkspaceCatalog(
  workspaces: OpeningConditionWorkspace[],
): OpeningConditionWorkspaceProjectCatalog[] {
  const projectMap = new Map<string, OpeningConditionWorkspaceProjectCatalog>();

  for (const workspace of workspaces) {
    const project = projectMap.get(workspace.projectId) ?? {
      projectId: workspace.projectId,
      projectCode: workspace.projectCode,
      projectName: workspace.projectName,
      workspaces: [],
      reviewObjects: [],
    };
    project.workspaces.push(workspace);
    let reviewObject = project.reviewObjects.find((item) => item.reviewObjectId === workspace.reviewObjectId);
    if (!reviewObject) {
      reviewObject = {
        reviewObjectId: workspace.reviewObjectId,
        reviewObjectName: workspace.reviewObjectName,
        reviewObjectType: workspace.reviewObjectType,
        workspaces: [],
        participants: [],
      };
      project.reviewObjects.push(reviewObject);
    }
    reviewObject.workspaces.push(workspace);
    let participant = reviewObject.participants.find(
      (item) => item.participantEntityId === workspace.participantEntityId,
    );
    if (!participant) {
      participant = {
        participantEntityId: workspace.participantEntityId,
        participantEntityName: workspace.participantEntityName,
        organizationRole: workspace.organizationRole,
        workspaces: [],
      };
      reviewObject.participants.push(participant);
    }
    participant.workspaces.push(workspace);
    projectMap.set(workspace.projectId, project);
  }

  return [...projectMap.values()];
}

export function buildOpeningConditionWorkspaceAssetRegistry(
  workspaces: OpeningConditionWorkspace[],
  tasks: OpeningConditionPilotTask[] = [],
): OpeningConditionWorkspaceAssetRegistryRecord[] {
  return workspaces.map((workspace) => {
    const workspaceTasks = tasks.filter((task) => task.context.workspaceId === workspace.id);
    const latestTask = [...workspaceTasks].sort((left, right) =>
      `${right.updatedAt}|${right.createdAt}`.localeCompare(`${left.updatedAt}|${left.createdAt}`),
    )[0];
    return {
      workspaceId: workspace.id,
      workspace,
      basis: { total: 0, published: 0, provisional: 0, status: "attention" },
      masterData: {
        total: 0,
        published: 0,
        provisional: 0,
        currentRunConfirmed: 0,
        reviewNeeded: 0,
        rejected: 0,
        status: "attention",
      },
      knowledgeBase: {
        present: false,
        status: "missing",
        label: workspace.participatingOrganization,
      },
      runHistory: {
        total: workspaceTasks.length,
        active: workspaceTasks.filter((task) => task.state !== "archived").length,
        archived: workspaceTasks.filter((task) => task.state === "archived").length,
        latestTaskId: latestTask?.id,
        latestTaskState: latestTask?.state,
        latestUpdatedAt: latestTask?.updatedAt,
        hasHistory: workspaceTasks.length > 0,
      },
      readiness: getOpeningConditionWorkspacePacket(workspace.id).preflightReadiness,
    };
  });
}

export function findOpeningConditionWorkspaceAssetRegistryRecord(
  registry: OpeningConditionWorkspaceAssetRegistryRecord[],
  workspaceId: string,
) {
  return registry.find((record) => record.workspaceId === workspaceId) ?? null;
}

export function getOpeningConditionMasterDataReadiness(records: OpeningConditionMasterDataRecord[]) {
  return records.reduce(
    (summary, record) => {
      if (record.status === "published") summary.published += 1;
      if (record.status === "human_approved") summary.currentRunConfirmed += 1;
      if (record.status === "provisional" || record.status === "confirmed") summary.provisional += 1;
      if (record.status === "rejected") summary.rejected += 1;
      if (record.status === "pending-human-review") summary.reviewNeeded += 1;
      return summary;
    },
    { published: 0, currentRunConfirmed: 0, provisional: 0, rejected: 0, reviewNeeded: 0 },
  );
}

export function normalizeOpeningConditionDifyOutput(
  output: OpeningConditionDifyBridgeOutput,
): OpeningConditionDifyNormalizedOutput {
  const unsafeKeys = Object.keys(output.unsafe ?? {});
  const diagnosticKeys = Object.keys(output.diagnostics ?? {}).filter((key) =>
    /secret|token|privateUrl|providerTrace|rawText/i.test(key),
  );
  return {
    run: { ...output.run, safeMessage: output.run.safeMessage || "外部工作流状态已同步。" },
    basisCandidates: output.basisCandidates ?? [],
    masterDataCandidates: output.masterDataCandidates ?? [],
    checkItems: output.checkItems ?? [],
    humanReviewQueue: output.humanInputItems ?? [],
    reportDraft: output.reportDraft ? { ...output.reportDraft, status: "draft" } : undefined,
    safeDiagnostics: {
      status: output.run.status,
      message: output.run.safeMessage || "外部工作流状态已同步。",
      redactedFields: Array.from(new Set([...unsafeKeys, ...diagnosticKeys])),
    },
  };
}

export function getOpeningConditionVerdictSummary(
  packet: OpeningConditionReviewPacket,
): OpeningConditionVerdictSummary {
  return packet.checkItems.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.verdict === "pass") summary.passed += 1;
      if (item.verdict === "fail") summary.failed += 1;
      if (item.verdict === "warning") summary.warning += 1;
      if (item.verdict === "needs-human-review") summary.needsHumanReview += 1;
      if (item.mandatory && item.verdict === "fail") summary.mandatoryFailures += 1;
      return summary;
    },
    { total: 0, passed: 0, failed: 0, warning: 0, needsHumanReview: 0, mandatoryFailures: 0 },
  );
}

export function getOpeningConditionRiskSummary(packet: OpeningConditionReviewPacket): OpeningConditionRiskSummary {
  return packet.checkItems.reduce(
    (summary, item) => {
      summary[item.riskLevel] += 1;
      return summary;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
}

export function getOpeningConditionHumanReviewItems(packet: OpeningConditionReviewPacket) {
  return packet.humanReviewQueue.map((item) => {
    const checkItem = packet.checkItems.find((candidate) => candidate.id === item.targetId);
    const basis = packet.basisVersions.find((candidate) => candidate.id === item.targetId);
    const masterData = packet.masterData.find((candidate) => candidate.id === item.targetId);
    return {
      ...item,
      targetLabel: checkItem?.content ?? basis?.title ?? masterData?.label ?? item.targetId,
    };
  });
}
