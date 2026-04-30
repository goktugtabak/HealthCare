// FR-46: profileCompleteness is recomputed every time a user record changes
// so the admin dashboard never displays the schema default of 0 for real
// registrations. The formula mirrors the frontend
// `calculateProfileCompleteness` in PlatformDataContext.tsx so admin reads
// stay consistent with what the user sees in their own profile UI.
const calculateProfileCompleteness = (user) => {
  let score = 25;
  if (user.institution?.trim()) score += 15;
  if (user.city?.trim() && user.country?.trim()) score += 15;
  if (user.bio?.trim()) score += 10;
  if (user.preferredContactValue?.trim()) score += 10;
  if (user.role === 'healthcare') {
    if ((user.interestTags?.length ?? 0) >= 3) score += 25;
  } else if (user.role === 'engineer') {
    if ((user.expertiseTags?.length ?? 0) >= 3) score += 15;
    if (user.portfolioSummary?.trim()) score += 10;
    if ((user.portfolioLinks?.length ?? 0) > 0) score += 10;
  } else {
    score = 100;
  }
  if (user.onboardingCompleted) score += 5;
  return Math.min(score, 100);
};

module.exports = { calculateProfileCompleteness };
