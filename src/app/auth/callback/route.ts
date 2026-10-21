import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

const AUTH_FLOW_COOKIE = "nels_auth_flow";

function safePath(value: string | null): string | null {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteUrl = await getSiteUrl();

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");

  const store = await cookies();
  const flow = store.get(AUTH_FLOW_COOKIE)?.value;

  // A click that Supabase rejected (expired / already used / bad link).
  if (error) {
    const login = new URL(`${siteUrl}/login`);
    login.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(login);
  }

  const resolveNext = (): string => {
    const explicit = safePath(nextParam);
    if (explicit) return explicit;
    if (flow === "recovery" || type === "recovery") return "/reset-password";
    if (flow === "signup" || type === "signup" || type === "email") return "/profile";
    return "/dashboard";
  };

  const supabase = await createClient();
  let verified = false;

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    verified = !exchangeError;
  } else if (tokenHash && type) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    verified = !otpError;
  }

  if (verified) {
    const response = NextResponse.redirect(`${siteUrl}${resolveNext()}`);
    response.cookies.delete(AUTH_FLOW_COOKIE);
    return response;
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth`);
}
