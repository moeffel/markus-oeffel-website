import type { ReactNode } from "react";

type LegalInfoItem = {
  label: string;
  value: string;
};

type LegalSection = {
  title: string;
  description?: string;
  paragraphs?: readonly string[];
  listItems?: readonly string[];
  infoItems?: readonly LegalInfoItem[];
};

export function LegalPageTemplate({
  eyebrow,
  title,
  subtitle,
  chips,
  sections,
  note,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  chips: readonly string[];
  sections: readonly LegalSection[];
  note?: ReactNode;
}) {
  return (
    <div className="space-y-8 rise-in">
      <header className="surface-card relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,217,255,0.18),transparent_70%)]" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/35 bg-[rgba(216,178,107,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.15em] text-[var(--finance-gold)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
            {eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-foreground/72">{subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/15 px-3 py-1 text-foreground/75"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="surface-card rounded-3xl p-6">
            <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
            {section.description ? (
              <p className="mt-3 text-sm text-foreground/72">{section.description}</p>
            ) : null}

            {section.infoItems?.length ? (
              <dl className="mt-4 space-y-2">
                {section.infoItems.map((item) => (
                  <div
                    key={`${section.title}:${item.label}`}
                    className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-3"
                  >
                    <dt className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground/92">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {section.paragraphs?.length ? (
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={`${section.title}:${paragraph}`} className="text-sm text-foreground/78">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            {section.listItems?.length ? (
              <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                {section.listItems.map((item) => (
                  <li key={`${section.title}:${item}`} className="flex items-start gap-3">
                    <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-[var(--accent-emerald)] shadow-[0_0_10px_rgba(76,224,179,0.55)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      {note ? (
        <section className="surface-card rounded-3xl p-6">
          <p className="text-sm text-foreground/72">{note}</p>
        </section>
      ) : null}
    </div>
  );
}
