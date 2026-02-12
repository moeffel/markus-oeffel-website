import { defineField, defineType } from "sanity";

export const privateProfile = defineType({
  name: "privateProfile",
  title: "Private Profile (RAG only)",
  type: "document",
  fields: [
    defineField({
      name: "content",
      title: "Content",
      type: "localizedString",
      validation: (Rule) => Rule.required(),
    }),
  ],
});

