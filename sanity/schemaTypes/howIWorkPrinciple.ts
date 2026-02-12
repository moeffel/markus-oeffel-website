import { defineField, defineType } from "sanity";

export const howIWorkPrinciple = defineType({
  name: "howIWorkPrinciple",
  title: "How I Work Principle",
  type: "document",
  fields: [
    defineField({ name: "order", type: "number" }),
    defineField({ name: "title", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "body", type: "localizedString", validation: (Rule) => Rule.required() }),
  ],
});

