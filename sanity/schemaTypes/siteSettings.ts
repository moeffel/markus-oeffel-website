import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "bookCallUrl",
      title: "Book a Call URL",
      type: "url",
    }),
    defineField({
      name: "cvUrl",
      title: "CV URL",
      type: "url",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({
      name: "heroKpis",
      title: "Hero KPIs",
      type: "array",
      of: [{ type: "metric" }],
    }),
  ],
});

