import type { Metadata } from "next";

import { getCaseStudies } from "@/lib/content";
import type { Language } from "@/lib/i18n";
import { alternatesForPath } from "@/lib/seo";

import { ProjectsIndex } from "./projects-index";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "de" ? "Projekte" : "Projects",
    description:
      lang === "de"
        ? "Case Studies, filterbar und suchbar."
        : "Case studies, filterable and searchable.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/projects" }),
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const projects = await getCaseStudies({ publishedOnly: true });

  return <ProjectsIndex lang={lang} projects={projects} />;
}
