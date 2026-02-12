import { defineField, defineType } from "sanity";

export const localizedStringArray = defineType({
  name: "localizedStringArray",
  title: "Localized string array (DE/EN)",
  type: "object",
  fields: [
    defineField({
      name: "de",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "en",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});

