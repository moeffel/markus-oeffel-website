import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

function safeRedirectPath(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  const expected = process.env.DRAFT_MODE_SECRET;
  if (!expected || secret !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dm = await draftMode();
  dm.enable();

  const redirectTo = safeRedirectPath(url.searchParams.get("redirect"));
  return NextResponse.redirect(new URL(redirectTo, url.origin));
}

