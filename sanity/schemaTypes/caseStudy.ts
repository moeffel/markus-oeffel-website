import { defineField, defineType } from "sanity";

const domainValues = [
  { title: "Payments", value: "payments" },
  { title: "Risk/Fraud", value: "risk" },
  { title: "KYC/AML", value: "kyc" },
  { title: "AI", value: "ai" },
  { title: "Data", value: "data" },
  { title: "Infra", value: "infra" },
  { title: "Investment", value: "investment" },
  { title: "Other", value: "other" },
];

export const caseStudy = defineType({
  name: "caseStudy",
  title: "Case Study",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      type: "slug",
      options: { source: (doc: any) => doc?.title?.en ?? doc?.title?.de ?? "case-study" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "title", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "subtitle", type: "localizedString" }),
    defineField({ name: "summary", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "published", type: "boolean", initialValue: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "order", type: "number" }),
    defineField({ name: "date", type: "date" }),
    defineField({ name: "tags", type: "array", of: [{ type: "string" }] }),
    defineField({
      name: "domains",
      type: "array",
      of: [{ type: "string", options: { list: domainValues } }],
    }),
    defineField({ name: "highlightMetrics", type: "array", of: [{ type: "metric" }] }),
    defineField({ name: "stack", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "links", type: "array", of: [{ type: "link" }] }),

    defineField({ name: "context", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "problem", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "solution", type: "localizedStringArray", validation: (Rule) => Rule.required() }),
    defineField({ name: "constraints", type: "localizedStringArray", validation: (Rule) => Rule.required() }),

    defineField({
      name: "architecture",
      type: "object",
      fields: [
        defineField({
          name: "type",
          type: "string",
          options: { list: ["text", "mermaid", "image"] },
        }),
        defineField({ name: "payload", type: "localizedString" }),
      ],
    }),

    defineField({ name: "yourRole", type: "localizedStringArray", validation: (Rule) => Rule.required() }),
    defineField({
      name: "impact",
      type: "object",
      fields: [
        defineField({
          name: "de",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "text", type: "string", validation: (Rule) => Rule.required() }),
                defineField({ name: "qualitative", type: "boolean" }),
              ],
            },
          ],
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "en",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "text", type: "string", validation: (Rule) => Rule.required() }),
                defineField({ name: "qualitative", type: "boolean" }),
              ],
            },
          ],
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({ name: "learnings", type: "localizedStringArray" }),
    defineField({
      name: "confidentialityLevel",
      type: "string",
      options: { list: ["public", "redacted"] },
      initialValue: "public",
    }),
  ],
});

