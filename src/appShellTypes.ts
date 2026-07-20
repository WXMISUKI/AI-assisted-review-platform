import type { ReviewMode, ReviewStreamingStage, ReviewTask } from "./domain/reviewTypes";

export type Role = "super_admin" | "supervisor" | "contractor";

export type ShellPage =
  | "documents"
  | "knowledge-base"
  | "data-assets"
  | "review-loading"
  | "review-detail"
  | "review-result";

export type OpeningConditionPortalPage =
  | "workspace-context"
  | "material-intake"
  | "basis-sets"
  | "master-data"
  | "check-tasks"
  | "human-review"
  | "reports";

export interface Session {
  username: string;
  role: Role;
}

export type LibraryDocument = ReviewTask;

export interface UploadDraft {
  name: string;
  project: string;
}

export type ThemeMode = "light" | "dark";

export type StreamingStage = ReviewStreamingStage;

export const roleLabels: Record<Role, string> = {
  super_admin: "超管",
  supervisor: "监理",
  contractor: "施工方",
};

export const roleModes: Record<Role, ReviewMode[]> = {
  super_admin: ["review", "revise"],
  supervisor: ["review"],
  contractor: ["revise"],
};
