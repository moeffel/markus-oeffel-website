import { z } from "zod";

import { sanityQuery, type SanityPerspective } from "@/lib/cms/sanity";
import {
  caseStudySchema,
  experienceItemSchema,
  howIWorkPrincipleSchema,
  skillCategorySchema,
  siteSettingsSchema,
  thesisSchema,
  type CaseStudy,
  type ExperienceItem,
  type HowIWorkPrinciple,
  type SkillCategory,
  type SiteSettings,
  type Thesis,
} from "@/lib/content/schemas";

const caseStudyProjection = `{
  "slug": slug.current,
  title,
  subtitle,
  summary,
  "tags": coalesce(tags, []),
  "domains": coalesce(domains, []),
  "highlightMetrics": coalesce(highlightMetrics[]{
    label,
    value
  }, []),
  "stack": coalesce(stack, []),
  "links": coalesce(links[]{ label, url }, []),
  published,
  order,
  date,
  context,
  problem,
  solution,
  constraints,
  architecture,
  yourRole,
  impact,
  learnings,
  confidentialityLevel
}`;

export async function cmsGetCaseStudies(options?: {
  publishedOnly?: boolean;
  perspective?: SanityPerspective;
}): Promise<readonly CaseStudy[]> {
  const publishedOnly = options?.publishedOnly ?? true;

  const query = `*[_type == "caseStudy" && ($publishedOnly == false || published == true)]
    | order(order asc, date desc)
    ${caseStudyProjection}`;

  const result = await sanityQuery<unknown[]>(
    query,
    { publishedOnly },
    {
      perspective: options?.perspective,
      tags: ["cms:case-studies"],
      revalidate: 300,
    },
  );

  return z.array(caseStudySchema).parse(result);
}

export async function cmsGetCaseStudyBySlug(
  slug: string,
  options?: { perspective?: SanityPerspective },
): Promise<CaseStudy | null> {
  const query = `*[_type == "caseStudy" && slug.current == $slug][0]${caseStudyProjection}`;
  const result = await sanityQuery<unknown | null>(
    query,
    { slug },
    {
      perspective: options?.perspective,
      tags: [`cms:case-study:${slug}`],
      revalidate: 300,
    },
  );

  if (!result) return null;
  return caseStudySchema.parse(result);
}

export async function cmsGetThesis(options?: {
  perspective?: SanityPerspective;
}): Promise<Thesis | null> {
  const query = `*[_type == "thesis"][0]{
    title,
    summary,
    "pdfPath": coalesce(pdf.asset->url, pdfPath),
    "notebookPath": coalesce(notebook.asset->url, notebookPath)
  }`;

  const result = await sanityQuery<unknown | null>(query, undefined, {
    perspective: options?.perspective,
    tags: ["cms:thesis"],
    revalidate: 300,
  });

  if (!result) return null;
  return thesisSchema.parse(result);
}

export async function cmsGetExperience(options?: {
  perspective?: SanityPerspective;
}): Promise<readonly ExperienceItem[]> {
  const query = `*[_type == "experienceItem"] | order(period desc){
    role,
    org,
    period,
    outcomes,
    "domains": coalesce(domains, []),
    "tech": coalesce(tech, [])
  }`;

  const result = await sanityQuery<unknown[]>(query, undefined, {
    perspective: options?.perspective,
    tags: ["cms:experience"],
    revalidate: 300,
  });

  return z.array(experienceItemSchema).parse(result);
}

export async function cmsGetSiteSettings(options?: {
  perspective?: SanityPerspective;
}): Promise<SiteSettings | null> {
  const query = `*[_type == "siteSettings"][0]{
    bookCallUrl,
    cvUrl,
    "socialLinks": coalesce(socialLinks[]{ label, url }, []),
    "heroKpis": coalesce(heroKpis[]{ label, value }, [])
  }`;

  const result = await sanityQuery<unknown | null>(query, undefined, {
    perspective: options?.perspective,
    tags: ["cms:site-settings"],
    revalidate: 300,
  });

  if (!result) return null;
  return siteSettingsSchema.parse(result);
}

export async function cmsGetSkillCategories(options?: {
  perspective?: SanityPerspective;
}): Promise<readonly SkillCategory[]> {
  const query = `*[_type == "skillCategory"] | order(order asc){
    title,
    "items": coalesce(items[]{ name, note }, [])
  }`;

  const result = await sanityQuery<unknown[]>(query, undefined, {
    perspective: options?.perspective,
    tags: ["cms:skills"],
    revalidate: 300,
  });

  return z.array(skillCategorySchema).parse(result);
}

export async function cmsGetHowIWorkPrinciples(options?: {
  perspective?: SanityPerspective;
}): Promise<readonly HowIWorkPrinciple[]> {
  const query = `*[_type == "howIWorkPrinciple"] | order(order asc){
    title,
    body
  }`;

  const result = await sanityQuery<unknown[]>(query, undefined, {
    perspective: options?.perspective,
    tags: ["cms:how-i-work"],
    revalidate: 300,
  });

  return z.array(howIWorkPrincipleSchema).parse(result);
}
