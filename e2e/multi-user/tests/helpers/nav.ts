import type { Page } from '@playwright/test';

// F-01 was a ProtectedRoute loading-race bug: a hard-load with a token in
// localStorage rendered before /api/auth/me resolved and redirected to
// /login. With the loading-state guard in App.tsx the workaround is no
// longer needed — a plain page.goto works for any route.
export async function gotoAuthed(page: Page, path: string) {
  await page.goto(path);

  // Dismiss the cookie consent banner if present (it can intercept clicks
  // in the bottom-right corner of the viewport).
  const acceptBtn = page.getByRole('button', { name: /^Accept all$/ });
  if (await acceptBtn.isVisible().catch(() => false)) {
    await acceptBtn.click().catch(() => undefined);
  }
}
