import { openAiChatCompletion } from "@/lib/ai/openai";
import type { AskResponse } from "@/lib/ask/answer";
import { buildAskPrompt } from "@/lib/ask/prompt";
import { retrieveRagContext } from "@/lib/rag/retrieval";

export async function ragAnswer(input: {
  query: string;
  lang: "de" | "en";
}): Promise<AskResponse> {
  const ctx = await retrieveRagContext({
    query: input.query,
    lang: input.lang,
    visibilities: ["public", "private"],
  }).catch(() => null);

  if (!ctx || ctx.chunks.length === 0) {
    const answer =
      input.lang === "de"
        ? "Ich kann nur aus diesem Portfolio beantworten. Frag z. B. zu Masterarbeit, Studieninhalten, Zertifikaten oder Projekten."
        : "I can only answer from this portfolio. Try asking about the thesis, degree content, certificates, or projects.";
    return {
      answer,
      citations: [],
      suggested_links: [
        { label: input.lang === "de" ? "Projekte" : "Projects", href: `/${input.lang}/projects` },
        { label: input.lang === "de" ? "Thesis" : "Thesis", href: `/${input.lang}/thesis` },
        { label: input.lang === "de" ? "Kontakt" : "Contact", href: `/${input.lang}/contact` },
      ],
    };
  }

  const yearTokens = Array.from(
    new Set(input.query.match(/\b(?:19|20)\d{2}\b/g) ?? []),
  );
  if (yearTokens.length > 0) {
    const hasYearCoverage = ctx.chunks.some((chunk) =>
      yearTokens.some((year) =>
        `${chunk.title}\n${chunk.section_id}\n${chunk.content}`.includes(year),
      ),
    );
    if (!hasYearCoverage) {
      return {
        answer:
          input.lang === "de"
            ? "Für diese Jahresfrage fehlen im Vector-Index gerade passende Stellen. Bitte erneut fragen oder kurz später versuchen."
            : "For this year-specific question, matching evidence is currently missing in the vector index. Please ask again shortly.",
        citations: [],
        suggested_links: [{ label: "Experience", href: `/${input.lang}/experience` }],
      };
    }
  }

  const prompt = buildAskPrompt({
    lang: input.lang,
    query: input.query,
    sources: ctx.sources,
  });

  const answer = await openAiChatCompletion({
    system: prompt.system,
    user: prompt.user,
    temperature: 0.2,
    maxTokens: Number(process.env.ASK_MAX_TOKENS ?? 450),
  });

  return { answer, citations: ctx.citations, suggested_links: ctx.suggested_links };
}
