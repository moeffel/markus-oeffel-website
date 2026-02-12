import { redirect } from "next/navigation";
import { headers } from "next/headers";

import {
  DEFAULT_LANGUAGE,
  pickLanguageFromAcceptLanguageHeader,
} from "@/lib/i18n";

export default async function RootRedirectPage() {
  const requestHeaders = await headers();
  const accept = requestHeaders.get("accept-language");
  const lang =
    pickLanguageFromAcceptLanguageHeader(accept) ?? DEFAULT_LANGUAGE;
  redirect(`/${lang}`);
}
