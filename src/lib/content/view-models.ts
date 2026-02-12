import type { CaseStudy, Thesis } from "@/lib/content/schemas";
import {
  pickLocalizedArray,
  pickLocalizedString,
  type Language,
  type LocalizedSelection,
} from "@/lib/i18n";

type CaseStudyImpactItem = CaseStudy["impact"]["de"][number];

export type LocalizedCaseStudyViewModel = {
  title: string;
  summary: string;
  context: string;
  problem: string;
  solution: readonly string[];
  constraints: readonly string[];
  yourRole: readonly string[];
  impact: readonly CaseStudyImpactItem[];
  learnings: readonly string[];
  architectureText: string | null;
  fallbackFrom: Language | null;
};

export type LocalizedThesisViewModel = {
  title: string;
  summary: string;
  executiveSummary: string;
  method: readonly string[];
  results: readonly CaseStudyImpactItem[];
  architectureKind: "text" | "mermaid" | "image" | null;
  architectureText: string | null;
  architectureImage: string | null;
  fallbackFrom: Language | null;
};

function firstFallback(
  selections: ReadonlyArray<LocalizedSelection<unknown> | null | undefined>,
): Language | null {
  for (const selection of selections) {
    if (selection?.usedFallback && selection.fallbackFrom) {
      return selection.fallbackFrom;
    }
  }
  return null;
}

export function createCaseStudyViewModel(
  caseStudy: CaseStudy,
  lang: Language,
): LocalizedCaseStudyViewModel {
  const title = pickLocalizedString(caseStudy.title, lang);
  const summary = pickLocalizedString(caseStudy.summary, lang);
  const context = pickLocalizedString(caseStudy.context, lang);
  const problem = pickLocalizedString(caseStudy.problem, lang);
  const solution = pickLocalizedArray(caseStudy.solution, lang);
  const constraints = pickLocalizedArray(caseStudy.constraints, lang);
  const yourRole = pickLocalizedArray(caseStudy.yourRole, lang);
  const impact = pickLocalizedArray(caseStudy.impact, lang);
  const learnings = caseStudy.learnings
    ? pickLocalizedArray(caseStudy.learnings, lang)
    : null;

  const architectureText =
    caseStudy.architecture &&
    (caseStudy.architecture.type === "text" ||
      caseStudy.architecture.type === "mermaid")
      ? pickLocalizedString(caseStudy.architecture.payload, lang)
      : null;

  return {
    title: title.value,
    summary: summary.value,
    context: context.value,
    problem: problem.value,
    solution: solution.value,
    constraints: constraints.value,
    yourRole: yourRole.value,
    impact: impact.value,
    learnings: learnings?.value ?? [],
    architectureText: architectureText?.value ?? null,
    fallbackFrom: firstFallback([
      title,
      summary,
      context,
      problem,
      solution,
      constraints,
      yourRole,
      impact,
      learnings,
      architectureText,
    ]),
  };
}

export function createThesisViewModel(input: {
  thesis: Thesis;
  thesisCaseStudy: CaseStudy | null;
  lang: Language;
}): LocalizedThesisViewModel {
  const title = pickLocalizedString(input.thesis.title, input.lang);
  const executiveSummary = pickLocalizedString(input.thesis.summary, input.lang);
  const summary = input.thesisCaseStudy
    ? pickLocalizedString(input.thesisCaseStudy.summary, input.lang)
    : executiveSummary;
  const method = input.thesisCaseStudy
    ? pickLocalizedArray(input.thesisCaseStudy.solution, input.lang)
    : null;
  const results = input.thesisCaseStudy
    ? pickLocalizedArray(input.thesisCaseStudy.impact, input.lang)
    : null;

  let architectureKind: LocalizedThesisViewModel["architectureKind"] = null;
  let architectureImage: string | null = null;
  let architectureText: string | null = null;
  let architectureTextSelection: LocalizedSelection<string> | null = null;

  const architecture = input.thesisCaseStudy?.architecture;
  if (architecture?.type === "image") {
    architectureKind = "image";
    architectureImage = architecture.payload;
  } else if (
    architecture?.type === "text" ||
    architecture?.type === "mermaid"
  ) {
    architectureKind = architecture.type;
    architectureTextSelection = pickLocalizedString(architecture.payload, input.lang);
    architectureText = architectureTextSelection.value;
  }

  return {
    title: title.value,
    summary: summary.value,
    executiveSummary: executiveSummary.value,
    method: method?.value ?? [],
    results: results?.value ?? [],
    architectureKind,
    architectureText,
    architectureImage,
    fallbackFrom: firstFallback([
      title,
      summary,
      executiveSummary,
      method,
      results,
      architectureTextSelection,
    ]),
  };
}
