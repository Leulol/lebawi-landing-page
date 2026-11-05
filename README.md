# Lebawi landing page

A short presentation page for Lebawi International Academy's officials: the problem, six fixes,
grade 7 first, and "One record. Five views." It shows what **Lebawi SMS** does. The app itself
lives in its own repository, `Leulol/lebawi-sms`; this one holds only the page.

It is a plain static site: `index.html`, `pitch.css`, `pitch.js`, the crest, fonts and screenshots.
No build step, no dependencies, nothing loaded from the internet, so it also opens straight from a
folder or a USB stick. Every name and number in it is fictional demo data.

## Open it

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Present it

Press **P** (or **Present** in the top bar): one section per screen. **→**, **Space** or
**Page Down** goes on, **←** goes back, **F** is full screen, **Esc** leaves. A clicker that sends
Page Down and Page Up works too.

## Publish it

- **GitHub Pages:** `.github/workflows/pages.yml` publishes the site on every push to `main`.
  Turn it on once: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The page
  appears at `https://leulol.github.io/<repository-name>/`.
- **Vercel** (optional): import the repository at vercel.com, Framework Preset *Other*, Deploy.
  `vercel.json` and `.vercelignore` are set up for it.

Both publish only the page and what it loads, not `tools/` or these notes.

## How it's built

The page tells its story with the school's crest, five interlocking Ethiopic ለ. On the title the
crest assembles; beside the problem it comes apart; each of the six fixes brings one ለ back; at
the end it slides into "One record. Five views.", where pointing at a group lights its ለ.

- `index.html` holds every word, readable with JavaScript off. One ለ is inlined as
  `<path id="le">`, and the crest is that ለ five times, 72° apart. Each section of the story says
  which ለ are back (`data-home`), which is lit (`data-lit`) and the label under the crest
  (`data-label`).
- `pitch.js` moves the crest, runs present mode and fades sections in. Transform and opacity
  only; with reduced motion nothing moves.
- `pitch.css` is the look: the Research Club website's dark violet as one continuous background
  (ink `#0d0a16`, two soft violet glows, a faint grid), gold `#C5A059` for accents, white Source
  Serif headings. Screenshots keep the app's own light look inside dark window frames.
- `crest.svg` is the crest on its own (also the favicon). It is traced from the school's PNG in
  `Leulol/lebawi-pitch` (`assets/crest/`, `scripts/crest/`). If the school sends a vector, re-trace.

## Retake the screenshots

`tools/take-screenshots.js` drives the running demo app and rewrites `screens/`. It needs Node.js,
Playwright with Chromium, and a checkout of `Leulol/lebawi-sms` next to this one (or set
`SMS_REPO`). In the app's folder:

```bash
DEMO_DATE=2026-11-05 python manage.py seed_demo --reset
```

```bash
DEMO_DATE=2026-11-05 python manage.py runserver
```

Then, from this repository:

```bash
node tools/take-screenshots.js
```

Reseed before every run: the script takes a register, excuses an absence and approves things,
as the demo walkthrough does.

## What the page may claim

Only what the school has told us, as recorded in the app's `docs/ROLLOUT_PLAN.md`,
`docs/BUILD_PROMPT.md` ("Decided after the first build") and `docs/RULES.md`. Anything still open
in its `docs/OPEN_QUESTIONS.md` is tagged **To confirm**, never stated as fact. In short:

- One morning register a day, at 08:15, by each section's homeroom teacher.
- Parents are alerted for absence only, at most once per child per day, in English or Amharic.
- The unit leader follows up, records late arrivals, and excuses with a hospital note or the
  parent's word.
- The director approves whole-school announcements and report-card releases.
- Students have no phones at school; their page is for home.
- The first section to use it would be in grade 7. No dates on the page: they are for the
  conversation.

## Credits

Fonts are self-hosted copies of IBM Plex Sans, Noto Sans Ethiopic and Source Serif 4, all under
the SIL Open Font License. The crest belongs to Lebawi International Academy.
