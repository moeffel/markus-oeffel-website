import { openAiChatCompletion } from "@/lib/ai/openai";
import type { AskResponse } from "@/lib/ask/answer";
import { noEvidenceResult } from "@/lib/ask/answer";
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
    return noEvidenceResult(input.lang);
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
      return noEvidenceResult(input.lang);
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
