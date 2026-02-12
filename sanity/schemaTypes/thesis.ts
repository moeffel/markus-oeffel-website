import { defineField, defineType } from "sanity";

export const thesis = defineType({
  name: "thesis",
  title: "Thesis (assets + summary)",
  type: "document",
  fields: [
    defineField({ name: "title", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "summary", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({
      name: "pdf",
      title: "PDF",
      type: "file",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "notebook",
      title: "Notebook (rendered HTML)",
      type: "file",
    }),
  ],
});

