import { defineField, defineType } from "sanity";

export const experienceItem = defineType({
  name: "experienceItem",
  title: "Experience Item",
  type: "document",
  fields: [
    defineField({ name: "role", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "org", type: "string" }),
    defineField({ name: "period", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "outcomes", type: "localizedStringArray", validation: (Rule) => Rule.required() }),
    defineField({ name: "domains", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "tech", type: "array", of: [{ type: "string" }] }),
  ],
});

