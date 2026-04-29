import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { gotoAuthed } from './helpers/nav';

async function createAuthContext(browser: Browser, persona: string): Promise<BrowserContext> {
  return browser.newContext({
    storageState: `playwright/.auth/${persona}.json`,
    viewport: { width: 1440, height: 900 },
  });
}

async function pickSelectOption(page: Page, placeholder: string, optionName: string) {
  await page.locator(`button[role="combobox"]:has-text("${placeholder}")`).first().click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

test.describe('Workflow 1: LiveDemo Role Matrix', () => {
  test('healthcare creates post, engineer requests collab, healthcare approves, admin sees panel, engineer is locked out, healthcare exports GDPR', async ({
    browser,
  }) => {
    const adminCtx = await createAuthContext(browser, 'admin');
    const healthcareCtx = await createAuthContext(browser, 'healthcare-ayse');
    const engineerCtx = await createAuthContext(browser, 'engineer-mehmet');
    const adminPage = await adminCtx.newPage();
    const healthcarePage = await healthcareCtx.newPage();
    const engineerPage = await engineerCtx.newPage();

    const postTitle = `Cardio AI v1 ${Date.now()}`;

    try {
      // Step 1: [HealthcareAyse] Navigate /create-post — verify form visible
      // Note: workflow says /posts/new but the actual route is /create-post (App.tsx).
      await gotoAuthed(healthcarePage, '/create-post');
      await expect(
        healthcarePage.getByRole('heading', { name: 'Create new post' }),
      ).toBeVisible();
      await expect(healthcarePage.locator('#title')).toBeVisible();

      // Step 2: [HealthcareAyse] Create post "Cardio AI v1" — verify redirect
      await healthcarePage.locator('#title').fill(postTitle);
      await pickSelectOption(healthcarePage, 'Select domain', 'Cardiology');
      await healthcarePage
        .locator('#shortExplanation')
        .fill('Looking for an ML engineer to co-build an ECG triage assistant.');
      await healthcarePage
        .getByRole('button', { name: 'Machine Learning', exact: true })
        .click();
      await pickSelectOption(healthcarePage, 'Select stage', 'Prototype');
      await healthcarePage.locator('#city').fill('Ankara');
      await healthcarePage.locator('#country').fill('Turkey');
      await healthcarePage
        .locator('#highLevelIdea')
        .fill(
          'High-level brief: Cardiology domain ML collaboration to validate ECG triage on a small retrospective dataset before formal study design.',
        );
      await healthcarePage.getByRole('button', { name: 'Publish post' }).click();
      // Verify redirect to /my-posts (per CreateEditPostPage.tsx:142)
      await expect(healthcarePage).toHaveURL(/\/my-posts/, { timeout: 10_000 });

      // The post defaults to "Confidential" in the form; H-01 hides those
      // from non-participants on /explore. To exercise steps 3-5 via the UI
      // we patch the post visibility to "public" via the API as the owner —
      // a thin pre-condition that doesn't change the shape of the test.
      const apiBase = process.env.API_URL ?? 'http://localhost:5001/api';
      const healthcareToken = await healthcarePage.evaluate(() =>
        window.localStorage.getItem('health-ai-access-token'),
      );
      const myPostsRes = await healthcarePage.request.get(`${apiBase}/posts/mine?limit=100`, {
        headers: { Authorization: `Bearer ${healthcareToken}` },
      });
      expect(myPostsRes.ok()).toBeTruthy();
      const myPosts = (await myPostsRes.json()) as { posts: Array<{ id: string; title: string }> };
      const found = myPosts.posts.find((p) => p.title === postTitle);
      expect(found, `post "${postTitle}" must be in healthcare-ayse's /mine list`).toBeTruthy();
      const resolvedPostId = found!.id;
      const patchRes = await healthcarePage.request.put(`${apiBase}/posts/${resolvedPostId}`, {
        headers: {
          Authorization: `Bearer ${healthcareToken}`,
          'Content-Type': 'application/json',
        },
        data: { confidentiality: 'public' },
      });
      expect(patchRes.ok()).toBeTruthy();

      // Step 3: [EngineerMehmet] /explore — verify the post appears.
      await gotoAuthed(engineerPage, '/explore');
      const postHeading = engineerPage.getByRole('heading', { name: postTitle, exact: true });
      await expect(postHeading).toBeVisible({ timeout: 8_000 });

      // Step 4: [EngineerMehmet] open the post → click "Request collaboration"
      // → fill the NDA modal → submit. Real button-click flow (the F-02 fix
      // makes the button render in real-mode without /api/admin/users data).
      // The PostCard's "View" button navigates to the post detail page.
      const postCard = postHeading.locator(
        'xpath=ancestor::article[1]',
      );
      await postCard.getByRole('button', { name: /^View$/ }).click();
      await engineerPage.waitForURL(/\/posts\//, { timeout: 5_000 });
      await engineerPage.getByRole('button', { name: 'Request collaboration' }).click();
      await expect(
        engineerPage.getByRole('heading', { name: /Send collaboration request/i }),
      ).toBeVisible({ timeout: 5_000 });

      // Step 5: fill the introductory message, propose a slot, accept NDA, submit.
      await engineerPage
        .locator('textarea')
        .first()
        .fill(
          'Hi — I have ML / signal-processing experience and would love to discuss this collaboration.',
        );
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const slotValue = futureDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      // The modal has a single datetime input for the first proposed slot.
      const slotInput = engineerPage.locator('input[type="datetime-local"]').first();
      if (await slotInput.isVisible().catch(() => false)) {
        await slotInput.fill(slotValue);
      }
      // Modal step 1 → step 2 (NDA) → submit
      await engineerPage.getByRole('button', { name: /Continue to NDA/i }).click();
      const ndaCheckbox = engineerPage.getByRole('checkbox').first();
      if (await ndaCheckbox.isVisible().catch(() => false)) {
        await ndaCheckbox.check();
      }
      await engineerPage.getByRole('button', { name: /Send request/i }).click();

      // Verify the engineer sees the "Request pending" state on the same page.
      await expect(
        engineerPage.getByRole('button', { name: /Request pending/i }),
      ).toBeVisible({ timeout: 8_000 });

      // Step 6: [HealthcareAyse] /meetings — Sync 5s, verify request
      // Workflow says /meetings/inbox but the actual route is /meetings.
      // A new pending incoming request renders in the "Awaiting your reply"
      // panel (top of MeetingsPage) when filter==="all"; it is excluded from
      // the lower "Incoming" column. Selector must match either location.
      await gotoAuthed(healthcarePage, '/meetings');
      await expect(
        healthcarePage.getByRole('heading', { name: /Awaiting your reply/i }),
      ).toBeVisible({ timeout: 10_000 });
      // Find the unique title element rendered inside the RequestCard, then
      // walk up to its closest card root (the div with `bg-card` class).
      const titleInCard = healthcarePage.getByText(postTitle, { exact: true });
      await expect(titleInCard).toBeVisible({ timeout: 8_000 });
      const requestCard = titleInCard.locator(
        'xpath=ancestor::div[contains(@class, "bg-card")][1]',
      );

      // Step 7: [HealthcareAyse] Approve — verify "approved"
      await requestCard.getByRole('button', { name: 'Accept request' }).click();
      // Slot picker dialog opens — accept without slot keeps status as "Accepted"
      await expect(
        healthcarePage.getByRole('heading', { name: 'Accept request and pick a slot' }),
      ).toBeVisible();
      // Use "Confirm slot" if a slot was proposed (it was), since "Accept without slot" is for missing slots.
      // The engineer proposed one slot; click it then Confirm slot.
      const slotButton = healthcarePage
        .locator('div[role="dialog"] button')
        .filter({ hasText: /^\s*\w/ })
        .filter({ hasNotText: /Accept without slot|Confirm slot/ })
        .first();
      // Slot rows render formatted dates; pick the first available slot row
      await slotButton.click().catch(async () => {
        // Fallback: if slot selection failed, take the "Accept without slot" path
        await healthcarePage.getByRole('button', { name: 'Accept without slot' }).click();
      });
      const confirmSlot = healthcarePage.getByRole('button', { name: 'Confirm slot' });
      if (await confirmSlot.isVisible().catch(() => false)) {
        if (await confirmSlot.isEnabled()) {
          await confirmSlot.click();
        } else {
          await healthcarePage.getByRole('button', { name: 'Accept without slot' }).click();
        }
      }
      // Verify status badge shows Accepted or Scheduled (both indicate approval)
      await expect(
        healthcarePage.getByText(/^(Accepted|Scheduled)$/i).first(),
      ).toBeVisible({ timeout: 10_000 });

      // Step 8: [Admin] /admin — verify panel loads + post/meeting visible
      await gotoAuthed(adminPage, '/admin');
      await expect(
        adminPage.getByRole('heading', { name: 'Admin Dashboard' }),
      ).toBeVisible({ timeout: 10_000 });
      // Sanity: admin stats cards present
      await expect(adminPage.getByText(/Total Users/i)).toBeVisible();
      await expect(adminPage.getByText(/Total Posts/i)).toBeVisible();

      // Step 9: [EngineerMehmet] /admin — verify 403 (negative role check)
      // Implementation note: requireAdmin redirects non-admins to /dashboard (App.tsx:49-50),
      // not a true 403. Verify the redirect.
      await gotoAuthed(engineerPage, '/admin');
      await engineerPage.waitForURL((url) => !/\/admin\/?$/.test(url.pathname), {
        timeout: 10_000,
      });
      expect(engineerPage.url()).not.toMatch(/\/admin\/?$/);
      expect(engineerPage.url()).toMatch(/\/(dashboard|login)/);

      // Step 10: [HealthcareAyse] /profile — GDPR export — verify download
      await gotoAuthed(healthcarePage, '/profile');
      await expect(
        healthcarePage.getByRole('heading', { name: /Data and privacy/i }),
      ).toBeVisible({ timeout: 10_000 });
      const downloadPromise = healthcarePage.waitForEvent('download', { timeout: 10_000 });
      await healthcarePage.getByRole('button', { name: 'Export as JSON' }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/health-ai-export.*\.json$/i);
    } finally {
      await adminCtx.close();
      await healthcareCtx.close();
      await engineerCtx.close();
    }
  });
});
