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
