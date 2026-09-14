import { env } from '../config/env.js';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export type VerifyResult =
  | { success: true }
  | { success: false; errorCodes: string[] };

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<VerifyResult> {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = (await res.json()) as TurnstileResponse;

    if (data.success) return { success: true };

    return {
      success: false,
      errorCodes: data['error-codes'] ?? ['unknown-error'],
    };
  } catch {
    return { success: false, errorCodes: ['network-error'] };
  }
}