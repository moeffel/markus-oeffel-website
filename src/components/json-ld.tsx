import { headers } from "next/headers";

export async function JsonLd(props: { data: unknown }) {
  const h = await headers();
  const nonce = h.get("x-nonce") ?? undefined;

  const json = JSON.stringify(props.data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

