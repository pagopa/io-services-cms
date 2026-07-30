/**
 * Conservative age defaults applied to services without an explicit age range,
 * kept consistent across the AI Search index and the in-memory filters so a
 * service with no anagraphic info is treated as adults-only.
 */
export const CONSERVATIVE_AGE_MIN = 18;
export const CONSERVATIVE_AGE_MAX = 999;

/**
 * Computes the user's age (in completed years) from a date of birth.
 *
 * The comparison is done in UTC to be consistent with how `date_of_birth` is
 * parsed from the `x-user` header (see `utils/x-user-token.ts`).
 *
 * @param dateOfBirth - the user's date of birth
 * @param now - reference date (defaults to the current date); injectable to
 *   keep the computation deterministic in tests
 * @returns the age in completed years
 */
export const computeAgeFromDateOfBirth = (
  dateOfBirth: Date,
  now: Date = new Date(),
): number => {
  const age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const hasNotHadBirthdayThisYear =
    now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
    (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
      now.getUTCDate() < dateOfBirth.getUTCDate());

  return hasNotHadBirthdayThisYear ? age - 1 : age;
};
