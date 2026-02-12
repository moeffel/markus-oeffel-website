import { defineField, defineType } from "sanity";

export const localizedString = defineType({
  name: "localizedString",
  title: "Localized string (DE/EN)",
  type: "object",
  fields: [
    defineField({ name: "de", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "en", type: "string", validation: (Rule) => Rule.required() }),
  ],
});

