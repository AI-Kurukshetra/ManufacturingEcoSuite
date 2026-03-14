import "server-only";

import { createHash } from "crypto";

import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "ecosuite_admin_session";

function getConfiguredUsername() {
  return process.env.ADMIN_USERNAME ?? "";
}

function getConfiguredPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getSessionToken() {
  return createHash("sha256")
    .update(`${getConfiguredUsername()}:${getConfiguredPassword()}:ecosuite-admin`)
    .digest("hex");
}

export function isAdminAuthConfigured() {
  return Boolean(getConfiguredUsername() && getConfiguredPassword());
}

export function validateAdminCredentials(username: string, password: string) {
  if (!isAdminAuthConfigured()) {
    return true;
  }

  return username === getConfiguredUsername() && password === getConfiguredPassword();
}

export async function hasAdminSession() {
  if (!isAdminAuthConfigured()) {
    return true;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === getSessionToken();
}

export function getAdminSessionToken() {
  return getSessionToken();
}
