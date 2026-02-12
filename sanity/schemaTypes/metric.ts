import { defineField, defineType } from "sanity";

export const metric = defineType({
  name: "metric",
  title: "Metric",
  type: "object",
  fields: [
    defineField({ name: "label", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "value", type: "string", validation: (Rule) => Rule.required() }),
  ],
});

