import { z } from "zod";

export const domainSchema = z.enum([
  "payments",
  "risk",
  "kyc",
  "ai",
  "data",
  "infra",
  "investment",
  "other",
]);
export type Domain = z.infer<typeof domainSchema>;

export const localizedStringSchema = z.object({
  de: z.string(),
  en: z.string(),
});
export type LocalizedString = z.infer<typeof localizedStringSchema>;

export const localizedStringArraySchema = z.object({
  de: z.array(z.string()),
  en: z.array(z.string()),
});

export const metricSchema = z.object({
  label: localizedStringSchema,
  value: z.string(),
});

export const linkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

export const siteSettingsSchema = z.object({
  bookCallUrl: z.string().url().optional(),
  cvUrl: z.string().url().optional(),
  socialLinks: z.array(linkSchema).default([]),
  heroKpis: z.array(metricSchema).default([]),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const projectSchema = z.object({
  slug: z.string().min(1),
  title: localizedStringSchema,
  subtitle: localizedStringSchema.optional(),
  summary: localizedStringSchema,
  tags: z.array(z.string()).default([]),
  domains: z.array(domainSchema).default([]),
  highlightMetrics: z.array(metricSchema).default([]),
  stack: z.array(z.string()).default([]),
  links: z.array(linkSchema).default([]),
  published: z.boolean(),
  order: z.number().int().optional(),
  date: z.string().optional(),
});
export type Project = z.infer<typeof projectSchema>;

const impactItemSchema = z.object({
  text: z.string().trim().min(1),
  qualitative: z.boolean().optional(),
});

const localizedImpactSchema = z
  .object({
    de: z.array(impactItemSchema).min(3),
    en: z.array(impactItemSchema).min(3),
  })
  .superRefine((impact, ctx) => {
    for (const lang of ["de", "en"] as const) {
      for (const [idx, item] of impact[lang].entries()) {
        const hasNumber = /\d/.test(item.text);
        if (!hasNumber && !item.qualitative) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Impact item without a numeric signal must be marked qualitative.",
            path: [lang, idx, "qualitative"],
          });
        }
      }
    }
  });

const localizedOutcomesSchema = z.object({
  de: z.array(z.string().trim().min(1)).min(2).max(5),
  en: z.array(z.string().trim().min(1)).min(2).max(5),
});

export const caseStudySchema = projectSchema.extend({
  context: localizedStringSchema,
  problem: localizedStringSchema,
  solution: localizedStringArraySchema,
  constraints: localizedStringArraySchema,
  architecture: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("text"), payload: localizedStringSchema }),
      z.object({ type: z.literal("mermaid"), payload: localizedStringSchema }),
      z.object({ type: z.literal("image"), payload: z.string() }),
    ])
    .optional(),
  yourRole: localizedStringArraySchema,
  impact: localizedImpactSchema,
  learnings: localizedStringArraySchema.optional(),
  confidentialityLevel: z.enum(["public", "redacted"]).default("public"),
});
export type CaseStudy = z.infer<typeof caseStudySchema>;

export const thesisSchema = z.object({
  title: localizedStringSchema,
  summary: localizedStringSchema,
  pdfPath: z.string(),
  notebookPath: z.string().optional(),
});
export type Thesis = z.infer<typeof thesisSchema>;

export const experienceItemSchema = z.object({
  role: localizedStringSchema,
  org: z.string().optional(),
  period: z.string(),
  outcomes: localizedOutcomesSchema,
  domains: z.array(domainSchema).default([]),
  tech: z.array(z.string()).default([]),
});
export type ExperienceItem = z.infer<typeof experienceItemSchema>;

export const skillItemSchema = z.object({
  name: z.string().min(1),
  note: localizedStringSchema.optional(),
});
export type SkillItem = z.infer<typeof skillItemSchema>;

export const skillCategorySchema = z.object({
  title: localizedStringSchema,
  items: z.array(skillItemSchema).default([]),
});
export type SkillCategory = z.infer<typeof skillCategorySchema>;

export const howIWorkPrincipleSchema = z.object({
  title: localizedStringSchema,
  body: localizedStringSchema,
});
export type HowIWorkPrinciple = z.infer<typeof howIWorkPrincipleSchema>;
