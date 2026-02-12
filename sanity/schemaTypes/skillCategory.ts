import { defineField, defineType } from "sanity";

export const skillCategory = defineType({
  name: "skillCategory",
  title: "Skill Category",
  type: "document",
  fields: [
    defineField({ name: "order", type: "number" }),
    defineField({ name: "title", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({
      name: "items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "name", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "note", type: "localizedString" }),
          ],
        },
      ],
    }),
  ],
});

