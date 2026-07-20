import type { Role } from "../appShellTypes";

export type ProductPortalId = "construction-plan-review" | "opening-condition-review";

export interface ProductAccess {
  productId: ProductPortalId;
  roleScope: Role[];
  enabled: boolean;
}

export interface ProductLauncherEntry {
  id: ProductPortalId;
  name: string;
  eyebrow: string;
  summary: string;
  routeNamespace: string;
  primaryActionLabel: string;
  sharedServices: string[];
}

export interface ActiveProductContext {
  productId: ProductPortalId;
  routeNamespace: string;
}

export const productLauncherEntries: ProductLauncherEntry[] = [
  {
    id: "construction-plan-review",
    name: "施工方案审查",
    eyebrow: "Construction plan review",
    summary: "面向施工方案文档的 OCR 接入、智能审查、人工决策和报告归档工作台。",
    routeNamespace: "/construction-plan",
    primaryActionLabel: "进入施工方案审查",
    sharedServices: ["统一登录", "MinIO 文档接入", "OCR 结构恢复", "智能体审查", "报告资产"],
  },
  {
    id: "opening-condition-review",
    name: "开工条件核查",
    eyebrow: "Opening condition review",
    summary: "面向项目、标段、机构和资料包的依据确认、主数据发布、资料完整性与有效性辅助核查。",
    routeNamespace: "/opening-condition",
    primaryActionLabel: "进入开工条件核查",
    sharedServices: ["统一登录", "OCR/对象存储", "MaxKB 检索支撑", "人工复核", "审计留痕"],
  },
];

export const mockProductAccess: ProductAccess[] = [
  {
    productId: "construction-plan-review",
    roleScope: ["super_admin", "supervisor", "contractor"],
    enabled: true,
  },
  {
    productId: "opening-condition-review",
    roleScope: ["super_admin", "supervisor", "contractor"],
    enabled: true,
  },
];

export function getAccessibleProductPortals(role: Role) {
  const access = mockProductAccess.filter((item) => item.enabled && item.roleScope.includes(role));

  return productLauncherEntries.filter((entry) => access.some((item) => item.productId === entry.id));
}

export function createActiveProductContext(productId: ProductPortalId): ActiveProductContext {
  const entry = productLauncherEntries.find((item) => item.id === productId);

  return {
    productId,
    routeNamespace: entry?.routeNamespace ?? "/",
  };
}
