import type { ProductPortalId } from "../domain/productPortal";

export type ProductAcceptanceCommand =
  | "pnpm typecheck"
  | "pnpm smoke:opening-condition"
  | "pnpm smoke:opening-condition:http"
  | "pnpm smoke:opening-condition:ui";

export interface ProductMvpContract {
  id: ProductPortalId;
  routeNamespace: string;
  ownedCapabilities: readonly string[];
  excludedCapabilities: readonly string[];
  acceptanceCommands: readonly ProductAcceptanceCommand[];
}

export const sharedPlatformCapabilities = [
  "product launcher and authenticated session shell",
  "semantic theme tokens and shared layout primitives",
  "object-storage and OCR/provider adapter contracts",
  "bounded report/export handoff contracts",
  "bounded activity and diagnostics summaries",
] as const;

export const productMvpContracts: Record<ProductPortalId, ProductMvpContract> = {
  "construction-plan-review": {
    id: "construction-plan-review",
    routeNamespace: "/construction-plan",
    ownedCapabilities: [
      "document intake",
      "OCR and structure preparation",
      "AI/manual issue review",
      "supervisor report result asset",
      "revised-plan snapshot",
    ],
    excludedCapabilities: [
      "opening-condition basis and master-data preflight",
      "opening-condition packet matching",
      "opening-condition rectification runs",
    ],
    acceptanceCommands: ["pnpm typecheck"],
  },
  "opening-condition-review": {
    id: "opening-condition-review",
    routeNamespace: "/opening-condition",
    ownedCapabilities: [
      "workspace context",
      "published basis and master-data preflight",
      "checklist and material packet matching",
      "human review queue",
      "rectification rerun history",
      "report archive and DOCX export",
    ],
    excludedCapabilities: [
      "construction-plan document issue anchors",
      "construction-plan revise snapshots",
      "construction-plan OCR preparation lifecycle",
    ],
    acceptanceCommands: [
      "pnpm typecheck",
      "pnpm smoke:opening-condition",
      "pnpm smoke:opening-condition:http",
      "pnpm smoke:opening-condition:ui",
    ],
  },
};

export function getProductMvpContract(productId: ProductPortalId): ProductMvpContract {
  return productMvpContracts[productId];
}

