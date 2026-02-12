type EmbeddingResponse = {
  data: Array<{ embedding: number[] }>;
};

type ChatCompletionResponse = {
  choices: Array<{ message: { content: string | null } }>;
};

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getChatModel(): string {
  return process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
}

function getEmbeddingModel(): string {
  return process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
}

export async function openAiEmbedding(input: {
  text: string;
}): Promise<number[]> {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: getEmbeddingModel(),
      input: input.text,
    }),
  }).catch(() => null);

  if (!res) throw new Error("OpenAI embeddings: network_error");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings: http_error ${res.status} ${text}`);
  }

  const json = (await res.json().catch(() => null)) as EmbeddingResponse | null;
  const embedding = json?.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("OpenAI embeddings: invalid_response");
  }

  return embedding;
}

export async function openAiChatCompletion(input: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: getChatModel(),
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 450,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  }).catch(() => null);

  if (!res) throw new Error("OpenAI chat: network_error");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI chat: http_error ${res.status} ${text}`);
  }

  const json = (await res.json().catch(() => null)) as ChatCompletionResponse | null;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI chat: empty_response");

  return content;
}

