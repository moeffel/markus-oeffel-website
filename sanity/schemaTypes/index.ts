import { caseStudy } from "./caseStudy";
import { experienceItem } from "./experienceItem";
import { link } from "./link";
import { localizedString } from "./localizedString";
import { localizedStringArray } from "./localizedStringArray";
import { metric } from "./metric";
import { privateProfile } from "./privateProfile";
import { howIWorkPrinciple } from "./howIWorkPrinciple";
import { skillCategory } from "./skillCategory";
import { siteSettings } from "./siteSettings";
import { thesis } from "./thesis";

export const schemaTypes = [
  localizedString,
  localizedStringArray,
  metric,
  link,
  siteSettings,
  caseStudy,
  thesis,
  experienceItem,
  skillCategory,
  howIWorkPrinciple,
  privateProfile,
];
