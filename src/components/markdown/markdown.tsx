import type { ReactNode } from "react";

type InlineNode = ReactNode;

function parseInline(text: string): InlineNode[] {
  const out: InlineNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index));
    }

    const token = match[0] ?? "";
    if (token.startsWith("**") && token.endsWith("**")) {
      out.push(<strong key={`b:${match.index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      out.push(
        <code
          key={`c:${match.index}`}
          className="rounded bg-white/5 px-1 py-0.5 font-mono text-[0.92em] text-foreground/90"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      out.push(
        <a
          key={`a:${match.index}`}
          href={href}
          rel="noreferrer"
          className="underline decoration-white/25 underline-offset-2 hover:decoration-[var(--accent-cyan)]"
        >
          {label}
        </a>,
      );
    } else {
      out.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}

type Block =
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "code"; text: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim().startsWith("```")) {
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push({ kind: "code", text: codeLines.join("\n") });
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1]!.length as 1 | 2 | 3;
      blocks.push({ kind: "h", level, text: headingMatch[2]!.trim() });
      i += 1;
      continue;
    }

    const bulletMatch = /^[-*]\s+(.+)$/.exec(line.trim());
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^[-*]\s+(.+)$/.exec((lines[i] ?? "").trim());
        if (!m) break;
        items.push(m[1]!.trim());
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim()) {
      const l = lines[i] ?? "";
      if (l.trim().startsWith("```")) break;
      if (/^(#{1,3})\s+/.test(l.trim())) break;
      if (/^[-*]\s+/.test(l.trim())) break;
      paraLines.push(l.trim());
      i += 1;
    }
    blocks.push({ kind: "p", text: paraLines.join(" ") });
  }

  return blocks;
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text ?? "");

  return (
    <div className="space-y-3 text-sm text-foreground/85">
      {blocks.map((b, idx) => {
        if (b.kind === "h") {
          const Tag = b.level === 1 ? "h3" : b.level === 2 ? "h4" : "h5";
          return (
            <Tag
              key={`h:${idx}`}
              className="text-base font-semibold tracking-tight text-foreground"
            >
              {parseInline(b.text)}
            </Tag>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={`ul:${idx}`} className="space-y-1.5 pl-5">
              {b.items.map((item) => (
                <li key={item} className="list-disc marker:text-[var(--accent-cyan)]">
                  {parseInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        if (b.kind === "code") {
          return (
            <pre
              key={`code:${idx}`}
              className="overflow-x-auto rounded-2xl border border-white/10 bg-[rgba(8,16,28,0.6)] p-4 text-xs text-foreground/85"
            >
              <code className="font-mono">{b.text}</code>
            </pre>
          );
        }
        return (
          <p key={`p:${idx}`} className="leading-relaxed">
            {parseInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}
