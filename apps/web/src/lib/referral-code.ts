const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Maximum retry attempts for referral code generation on collision */
export const REFERRAL_CODE_MAX_RETRIES = 3;

export function generateReferralCode(length = 6): string {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => CHARS[v % CHARS.length]).join("");
}

/**
 * Check if a database error is a PostgreSQL unique constraint violation (23505).
 * Used to distinguish unique conflicts from other DB errors.
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code: string }).code === "23505"
  );
}
