import { z } from "zod";

/** Persisted server-side and mirrored in localStorage; keep in sync with `onboarding/page.tsx` */
export const OnboardingStateSchema = z
  .object({
  completed: z.boolean(),
  skipped: z.boolean().optional(),
  step: z.number().int().min(1).max(20),
  department: z.string().nullable(),
  markets: z.array(z.string()),
  dataResidencyAck: z.boolean(),
  auditLoggingEnabled: z.boolean(),
  connectSso: z.boolean(),
  connectMessaging: z.boolean(),
  connectHris: z.boolean(),
  connectCrm: z.boolean(),
  connectWhatsapp: z.boolean(),
  connectApi: z.boolean(),
  deployApprovalRequired: z.boolean(),
  approverScope: z.enum(["owner", "admin", "security", "compliance"]),
  hitlHighRisk: z.boolean(),
  appType: z.string().nullable(),
  appUrl: z.string(),
  selectedAgent: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export type OnboardingStateV2 = z.infer<typeof OnboardingStateSchema>;

export const defaultOnboardingStateV2 = (): OnboardingStateV2 => ({
  completed: false,
  step: 1,
  department: null,
  markets: ["za"],
  dataResidencyAck: false,
  auditLoggingEnabled: true,
  connectSso: false,
  connectMessaging: false,
  connectHris: false,
  connectCrm: false,
  connectWhatsapp: false,
  connectApi: false,
  deployApprovalRequired: true,
  approverScope: "admin",
  hitlHighRisk: true,
  appType: null,
  appUrl: "",
  selectedAgent: null,
  completedAt: null,
});
