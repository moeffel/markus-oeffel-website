import { draftMode } from "next/headers";

import { hasSanityConfig } from "@/lib/cms/sanity";
import {
  cmsGetCaseStudies,
  cmsGetCaseStudyBySlug,
  cmsGetExperience,
  cmsGetHowIWorkPrinciples,
  cmsGetSiteSettings,
  cmsGetSkillCategories,
  cmsGetThesis,
} from "@/lib/content/cms";
import {
  EXPERIENCE as LOCAL_EXPERIENCE,
  HOW_I_WORK as LOCAL_HOW_I_WORK,
  SKILL_CATEGORIES as LOCAL_SKILL_CATEGORIES,
  SITE_SETTINGS as LOCAL_SITE_SETTINGS,
  THESIS as LOCAL_THESIS,
  getCaseStudies as localGetCaseStudies,
  getCaseStudyBySlug as localGetCaseStudyBySlug,
  getHowIWorkPrinciples as localGetHowIWorkPrinciples,
  getSkillCategories as localGetSkillCategories,
  getSiteSettings as localGetSiteSettings,
} from "@/lib/content/data";
import type {
  CaseStudy,
  ExperienceItem,
  HowIWorkPrinciple,
  SkillCategory,
  SiteSettings,
  Thesis,
} from "@/lib/content/schemas";

async function getPerspective(): Promise<"published" | "previewDrafts"> {
  const dm = await draftMode();
  return dm.isEnabled ? "previewDrafts" : "published";
}

function cmsEnabled(): boolean {
  return hasSanityConfig() && Boolean(process.env.SANITY_API_TOKEN);
}

export async function getCaseStudies(options?: {
  publishedOnly?: boolean;
}): Promise<readonly CaseStudy[]> {
  if (!cmsEnabled()) return localGetCaseStudies(options);

  const perspective = await getPerspective();
  try {
    return await cmsGetCaseStudies({
      publishedOnly: options?.publishedOnly,
      perspective,
    });
  } catch (err) {
    console.error("[cms] getCaseStudies failed; falling back to local data.", err);
    return localGetCaseStudies(options);
  }
}

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  if (!cmsEnabled()) return localGetCaseStudyBySlug(slug);

  const perspective = await getPerspective();
  try {
    return await cmsGetCaseStudyBySlug(slug, { perspective });
  } catch (err) {
    console.error(
      "[cms] getCaseStudyBySlug failed; falling back to local data.",
      err,
    );
    return localGetCaseStudyBySlug(slug);
  }
}

export async function getThesis(): Promise<Thesis> {
  if (!cmsEnabled()) return LOCAL_THESIS;

  const perspective = await getPerspective();
  try {
    const thesis = await cmsGetThesis({ perspective });
    if (!thesis) return LOCAL_THESIS;
    return thesis;
  } catch (err) {
    console.error("[cms] getThesis failed; falling back to local data.", err);
    return LOCAL_THESIS;
  }
}

export async function getExperience(): Promise<readonly ExperienceItem[]> {
  if (!cmsEnabled()) return LOCAL_EXPERIENCE;

  const perspective = await getPerspective();
  try {
    return await cmsGetExperience({ perspective });
  } catch (err) {
    console.error("[cms] getExperience failed; falling back to local data.", err);
    return LOCAL_EXPERIENCE;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!cmsEnabled()) return localGetSiteSettings();

  const perspective = await getPerspective();
  try {
    const settings = await cmsGetSiteSettings({ perspective });
    if (!settings) return LOCAL_SITE_SETTINGS;
    return settings;
  } catch (err) {
    console.error(
      "[cms] getSiteSettings failed; falling back to local data.",
      err,
    );
    return LOCAL_SITE_SETTINGS;
  }
}

export async function getSkillCategories(): Promise<readonly SkillCategory[]> {
  if (!cmsEnabled()) return localGetSkillCategories();

  const perspective = await getPerspective();
  try {
    return await cmsGetSkillCategories({ perspective });
  } catch (err) {
    console.error(
      "[cms] getSkillCategories failed; falling back to local data.",
      err,
    );
    return LOCAL_SKILL_CATEGORIES;
  }
}

export async function getHowIWorkPrinciples(): Promise<
  readonly HowIWorkPrinciple[]
> {
  if (!cmsEnabled()) return localGetHowIWorkPrinciples();

  const perspective = await getPerspective();
  try {
    return await cmsGetHowIWorkPrinciples({ perspective });
  } catch (err) {
    console.error(
      "[cms] getHowIWorkPrinciples failed; falling back to local data.",
      err,
    );
    return LOCAL_HOW_I_WORK;
  }
}
