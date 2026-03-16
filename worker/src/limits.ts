import { Env } from "./types";

export interface PlanLimits {
  sites: number;
  storageMb: number; // total account storage quota in MB
  deploysPerMonth: number;
  viewsPerSite: number;
  emailsPerMonth: number;
  oneTimeLinks: number; // -1 = unlimited
  screenshotOnEveryDeploy: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    sites: 10,
    storageMb: 50,
    deploysPerMonth: 500,
    viewsPerSite: 1000,
    emailsPerMonth: 1000,
    oneTimeLinks: 3,
    screenshotOnEveryDeploy: false,
  },
  pro: {
    sites: 25,
    storageMb: 25,
    deploysPerMonth: 100,
    viewsPerSite: 50000,
    emailsPerMonth: -1,
    oneTimeLinks: -1,
    screenshotOnEveryDeploy: true,
  },
};

export interface UserWithLimits {
  plan: string;
  deploys_this_month: number;
  deploys_reset_at: number | null;
  emails_this_month: number;
}

export async function getLimits(
  env: Env,
  ownerId: string
): Promise<{ limits: PlanLimits; user: UserWithLimits }> {
  const row = await env.DB.prepare(
    "SELECT plan, deploys_this_month, deploys_reset_at, emails_this_month FROM users WHERE id = ?"
  )
    .bind(ownerId)
    .first<UserWithLimits>();

  const plan = row?.plan || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  return {
    limits,
    user: {
      plan,
      deploys_this_month: row?.deploys_this_month ?? 0,
      deploys_reset_at: row?.deploys_reset_at ?? null,
      emails_this_month: row?.emails_this_month ?? 0,
    },
  };
}

/**
 * Check if a monthly counter needs reset (lazy reset on first request of the month).
 * Returns true if the counter was reset.
 */
export function shouldResetMonthly(resetAt: number | null): boolean {
  if (!resetAt) return true;
  const now = new Date();
  const resetDate = new Date(resetAt * 1000);
  return now.getUTCMonth() !== resetDate.getUTCMonth() || now.getUTCFullYear() !== resetDate.getUTCFullYear();
}

export function limitError(limitName: string, current: number, max: number) {
  return {
    error: "Limit reached",
    limit: limitName,
    current,
    max,
    message: "You've reached the free plan limit. Paid plans coming soon!",
  };
}
