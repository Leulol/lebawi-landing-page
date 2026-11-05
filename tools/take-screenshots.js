/*
 * Retakes the landing page's screenshots from the running Lebawi SMS demo app.
 *
 * Owns: the PNG files in screens/. Never touches the app's code. It changes the demo data only
 * the way a person clicking through /demo/ would: it takes 7A's morning register, runs the alert
 * worker, opens one grade sheet, logs one call with an excuse, approves the secretary's
 * conference-days announcement and the 7A report cards, and runs the worker again.
 *
 * Needs Node.js and Playwright with Chromium, and a checkout of the app (Leulol/lebawi-sms),
 * by default next to this repo (../lebawi-sms; set SMS_REPO to point elsewhere). In the app's
 * folder, with a fresh seed each time:
 *   DEMO_DATE=2026-11-05 python manage.py seed_demo --reset
 *   DEMO_DATE=2026-11-05 python manage.py runserver
 * then, from this repo:
 *   node tools/take-screenshots.js        (PYTHON=.venv/bin/python if needed)
 */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://127.0.0.1:8000";
const SMS_REPO = process.env.SMS_REPO || path.resolve(__dirname, "..", "..", "lebawi-sms");
const SCREENS = path.join(__dirname, "..", "screens");
const PYTHON = process.env.PYTHON || "python";
const CONFERENCE = "Parent-teacher conference days";

class SeedMissing extends Error {}

/** Log in through the demo picker as: student, teacher, parent, leadership, unitleader or secretary. */
async function sitIn(page, seat) {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/demo/`);
  await page.locator(`form:has(input[name=role][value=${seat}]) button`).click();
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes("isn't loaded")) {
    throw new SeedMissing("Run: DEMO_DATE=2026-11-05 python manage.py seed_demo --reset");
  }
}

async function shoot(page, name, fullPage = false, clip = undefined) {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: path.join(SCREENS, `${name}.png`), fullPage, clip });
  console.log(`  ${name}.png`);
}

/** What the worker does: sends queued alerts and posts approved whole-school announcements
 *  to the channel. In demo mode it logs each one and marks it sent. */
function runWorker() {
  execFileSync(PYTHON, ["manage.py", "send_notifications"], {
    cwd: SMS_REPO, env: { ...process.env, DEMO_DATE: "2026-11-05" }, stdio: "inherit",
  });
}

async function main() {
  fs.mkdirSync(SCREENS, { recursive: true });
  const browser = await chromium.launch();
  const laptop = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });

  // 1. Teachers: Hanna, 7A's homeroom teacher, takes the one morning register from the keyboard.
  await sitIn(laptop, "teacher");
  await laptop.getByRole("link", { name: "Take morning register" }).first().click();
  await laptop.waitForLoadState("networkidle");
  await laptop.locator("table.roster tbody tr", { hasText: "Abel Tadesse" }).locator("td.name").click();
  await laptop.keyboard.press("a"); // Abel absent; the focus moves to the next row
  await shoot(laptop, "register-abel-absent");
  await laptop.keyboard.press("Enter");
  await laptop.waitForURL((url) => !url.pathname.includes("morning-register"));
  await laptop.waitForLoadState("networkidle");

  // 2. The alert worker sends Tigist the absence alert.
  runWorker();

  // Teachers, grades: Hanna's 7A General Science midterm, one grid, entered from the keyboard.
  await laptop.goto(`${BASE_URL}/teacher/grades/`);
  await laptop.locator(".panel", { hasText: "7A General Science" }).getByRole("link", { name: "Midterm test" }).click();
  await laptop.waitForLoadState("networkidle");
  await shoot(laptop, "grade-entry");

  // 3. Officials: Meron, the middle-school unit leader. Today's absentees, then the family card.
  await sitIn(laptop, "unitleader");
  await shoot(laptop, "unit-leader-today");
  await laptop.keyboard.press("/");
  await laptop.keyboard.type("abe", { delay: 80 });
  await laptop.waitForSelector("#search-results a");
  await laptop.locator("#search-results a").first().click();
  await laptop.waitForLoadState("networkidle");
  // The call is filled in before the shot, so the card shows it being recorded.
  const form = laptop.locator("form:has(input[name=excuse])");
  await form.locator("select[name=student]").selectOption({ label: "Abel Tadesse" });
  await form.locator("input[name=reason]").fill("Absent at the morning register, called his mother");
  await form.locator("input[name=outcome]").fill("Fever, back on Monday");
  await form.locator("input[name=excuse]").check();
  await shoot(laptop, "family-card", true);
  await form.locator("button[type=submit]").click();
  await laptop.waitForLoadState("networkidle");

  // 4. Officials: Dr. Samuel Bekele, the director. The morning glance, then the two approvals.
  await sitIn(laptop, "leadership");
  await shoot(laptop, "morning-glance");
  await laptop.goto(`${BASE_URL}/lead/approvals/`);
  await shoot(laptop, "approvals");
  await laptop.locator("li", { hasText: CONFERENCE }).getByRole("button", { name: "Approve and publish" }).click();
  await laptop.waitForLoadState("networkidle");
  await laptop.locator("li", { hasText: "7A" }).getByRole("button", { name: "Release to families" }).click();
  await laptop.waitForLoadState("networkidle");

  // The worker posts the approved announcement to the school's Telegram channel.
  runWorker();

  // 5. Parents: Tigist on her phone, Abel's absence now excused.
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  await sitIn(phone, "parent");
  await shoot(phone, "parent-home");

  // 6. Parents: Abel's Trimester 1 report card, released by the director in step 4.
  await sitIn(laptop, "parent");
  await laptop.getByRole("link", { name: /Open the report card/ }).first().click();
  await laptop.waitForLoadState("networkidle");
  await shoot(laptop, "report-card");

  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
