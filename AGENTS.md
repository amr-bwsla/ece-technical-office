# AGENTS.md — handoff for agents working on this repo

Read this before changing anything. `README.md` is the product-facing description; this file is the engineering handoff: context, conventions, gotchas, how to verify and deploy, and the history of what was built.

## 1. What this is

- An **interactive, frontend-only sales demo** of a "Technical Office" system (inter-department coordination for an engineering consultancy). There is no backend. All data lives in the browser.
- **Client:** ECE — Elite Consolidated Engineers ([ece-eg.com](https://ece-eg.com/)). This is an MEP-focused consultancy (Cairo since 2009, Riyadh since 2024), now also doing architecture and civil work.
- **Built by:** Digital Bwsla / بوصلة رقمية ([digitalbwsla.com](https://digitalbwsla.com), info@digitalbwsla.com). The developer credit must stay visible (see section 6).
- **Live:** https://amr-bwsla.github.io/ece-technical-office/
- **Repo:** https://github.com/amr-bwsla/ece-technical-office. It is **public**, following the owner's other client previews (`karma-beauty`, `digital-bwsla`). Source is on `main`; the built site is on `gh-pages`.
- **Local path:** `D:\Digitalbwsla Projects\Technical Office\demo` (Windows, PowerShell). The parent folder contains nothing else.

### Working with the owner

- The owner writes in **Egyptian Arabic**. Reply in Egyptian Arabic, with code and identifiers in English.
- They usually say "do whatever is missing, right away" (اعملها ع طول). Make sensible decisions yourself, verify in the browser, and report with screenshots. Don't stop to ask about small choices.
- The dev server at `http://localhost:5173` is usually already running in the owner's terminal. Don't kill it. Use another port, such as `vite preview --port 4173`, for production checks, and stop it when you're done.

## 2. Stack and commands

React 19, TypeScript, Vite 8, Tailwind CSS 4, Zustand 5 (`persist`), React Router 7 (**HashRouter**), Recharts, lucide-react, vite-plugin-pwa, oxlint.

```powershell
npm install
npm run dev        # localhost:5173 (host: true, so it's also on the LAN for phone testing)
npm run build      # tsc -b && vite build. Must pass with 0 errors before you finish
npx oxlint src     # see "known lint warnings" below
powershell -ExecutionPolicy Bypass -File deploy.ps1   # build and publish to GitHub Pages
```

## 3. Code map

```
index.html            lang="en" dir="ltr", OG/Twitter share tags (absolute URLs to the Pages site), iOS meta
vite.config.ts        base './', PWA manifest + workbox config
deploy.ps1            builds, then force-pushes dist/ to gh-pages (uses origin remote and local git identity)
public/               icon.svg (source icon), pwa-192x192.png, pwa-512x512.png, maskable-512x512.png,
                      apple-touch-icon.png, ece-logo.jpg (client logo, 220x100), digitalbwsla.png (dev logo),
                      og-image.jpg (1200x630 share preview), .nojekyll
src/types.ts          all domain types
src/seed.ts           demo data and shared business rules (SLA, statuses, numbering, dueAlerts)
src/content.ts        English translations of every Arabic seed string (see the i18n section)
src/store.ts          zustand store (persisted) and every action; re-exports rules from seed.ts
src/i18n.ts           UI dictionary {ar,en}, useT(), formatDuration, timeAgo
src/files.ts          IndexedDB storage for uploaded files
src/pwa.ts            useInstall() (beforeinstallprompt / iOS hint) and useOnline()
src/components/       Layout (sidebar, header, mobile nav, More sheet, toast, offline banner), ui.tsx (shared
                      UI: Avatar, badges, AttachmentView, FileDropzone, formatMoney…), DevCredit, tables/cards
src/pages/            one file per route, lazy-loaded in App.tsx (Login is eager)
```

Routes (`App.tsx`): `login`, `/`, `projects[/new|/:id]`, `inquiries[/new|/:id]`, `submittals[/new|/:id]`, `contracts[/new|/:id]`, `notifications`, `workflows`, `reports`, and `*` for 404.

## 4. Domain model and rules

- **Departments** (`seed.ts`): `arch` Architecture, `civil` Civil/Structural, `mech` HVAC, `plumb` Plumbing & Fire Fighting, `elec` Electrical & ELV, `mgmt` Technical Management & QA (brand navy).
- **Users:** 14 fixed users with ids like `u-admin` (Eng. Ahmed Fouad, admin, mgmt), `u-pm1` (Hesham Reda, head, mgmt), `u-pm2` (Dina Mostafa, mgmt), `u-mech-1` (Youssef Tarek, HVAC engineer), and so on. Roles are `admin`, `head`, and `engineer`. Login emails are derived from the name (`emailOf` in `Login.tsx`), for example `ahmed.fouad@ece-eg.com`. The password for every account is `123456`.
- **Workflow templates:** `t-mep` (full MEP design: arch backgrounds, HVAC, plumbing & FF, electrical, peer review, tender docs), `t-integrated` (arch, structural, MEP, peer review, approvals), and `t-ve` (design review and value engineering). Each step belongs to one department and has an SLA in hours.
- **Projects:** 16 projects, `p1`–`p16`, coded `ECE-EG-26-xxx` / `ECE-KSA-26-xxx`. The names and clients come from ECE's published portfolio. Progress, people, dates, inquiries, and money are **fictional**.
  - Steps run sequentially. The active department can **complete** a step or **return** the project to an earlier step (a reason is required). Returns are counted per step and logged in `project.log`.
- **Inquiries (RFI):** SLA by priority comes from `SLA_HOURS = {urgent: 4, normal: 24, low: 72}`.
  - Inquiries can be sent to several departments and to specific assignees, can carry attachments, and can be closed or reopened.
- **Submittals:** types are `design` (DD), `shop` (SD), and `material` (MS). They are numbered `<projectCode>/<DD|SD|MS>-<DEPT>-<seq>` via `submittalNumber`.
  - Revisions run Rev 00, Rev 01, and so on. Reviewers (the `mgmt` department) code each revision A/B/C/D within `SUBMITTAL_REVIEW_HOURS = 72`. Code C means the department resubmits a new revision.
- **Contracts:** visible **only** to the `mgmt` department (`canManageContracts`). Only `role === 'admin'` can delete a contract.
  - Kinds are `design` (DC), `supervision` (SC), and `addendum` (AD), numbered `<projectCode>/<DC|SC|AD>-<seq>`.
  - **All money is EGP.** There is no currency field; `formatMoney` renders `n EGP` or `n ج.م`.
  - Each contract has a payment schedule that must total 100% (`paymentPlans` holds the defaults per kind) and tracks paid/unpaid per milestone.
  - Contract status is `active`, `expiring` (≤ `CONTRACT_EXPIRY_DAYS = 30`), or `expired`.
- **Alerts:** `dueAlerts(projects, inquiries, submittals, contracts, now)` in `seed.ts` is the **single source** of delay and escalation alerts. It feeds both the seed notifications and the runtime check: `checkDueAlerts`, run every 30 seconds from `Layout`.
  - Each alert has a stable `key`. Keys already fired are stored in `state.alerted`, so nothing fires twice.
  - The alert cases are: an inquiry past its SLA (with escalation to heads and admin one hour later), a step past its SLA, a project deadline within 3 days or missed, a submittal review over 72 hours, and a contract ending within 30 days.
  - If notification permission is granted, alerts also show as device notifications through the service worker (`store.ts`, `showNotification`).
- **Demo controls:** "Simulate +4 hours" (`fastForward`) shifts every timestamp listed in `TIME_FIELDS` back in time, so SLA breaches happen live during a presentation. "Reset demo data" reseeds the data and clears IndexedDB.

## 5. Conventions and gotchas (important)

### State and persistence

- The store is persisted to localStorage under the key `tech-office-demo`, currently **`version: 8`**. `migrate` simply **reseeds** the data (it sets `lang: 'en'` and logs the user out).
  - **Bump the version whenever you change the seed data or the state shape.** Otherwise existing browsers keep stale data.
- Seed dates are generated **relative to `Date.now()` at seed time**, so the demo always looks "current" after a reset.
- When you add a new timestamp field, add its name to `TIME_FIELDS` in `store.ts`. `fastForward` walks the whole state recursively and shifts only those keys, so a missing name gets left behind.
- **Zustand selectors must not return new arrays or objects.** Selecting `s.items.filter(...)` directly causes an infinite re-render loop. Select a primitive (`.length`), or select the raw array and derive with `useMemo`.
- `seed.ts` must not import from `store.ts`, because that creates a circular import. Shared rules live in `seed.ts` and are re-exported from `store.ts`.

### Language (i18n)

- **English is the default.** The header button labelled "ع" switches to Arabic (RTL), and `Layout` sets `<html lang/dir>`.
- UI text comes from the `dict` in `i18n.ts`, read with `t('key')`. Localized objects such as user and department names use `l(obj)`.
- **Seed content is written in Arabic** in `seed.ts`: project names, clients, locations, inquiry titles and messages, submittal titles, notes and comments, contract titles and scopes, milestone titles, and log notes. It is shown through **`tx(str)`** from `useT()`, which looks the string up in `src/content.ts` (`EN` map keyed by the exact Arabic string).
  - **Whenever you add or change an Arabic seed string, add its English entry in `content.ts`.** Strings typed by users at runtime pass through `tx` unchanged.
  - When you render any of those seed fields, including in search filters and `<option>` labels, wrap them in `tx()`.
  - Notification texts are `Localized`. Inside an `en:` template, wrap embedded seed names with `en(...)` from `content.ts`, for example `` en: `New inquiry: ${en(inq.title)}` ``.
- Check that English mode is clean by evaluating this in the browser on every route: `document.body.innerText.match(/[\u0600-\u06FF]+/g)`. The only expected hit is the "ع" button.
- English plurals: use the `day*` / `days*` key pairs, for example `dayLeft` and `daysLeft`.
- Dates use `Intl.DateTimeFormat(lang, …)`, and numbers use `toLocaleString('en')`, so Arabic mode does not mix in Arabic-Indic digits.

### Files and attachments

- Images are compressed and stored as data URLs inside the persisted state.
- Other files go to IndexedDB (`files.ts`, DB `tech-office-files`) and are referenced as `idb:<key>` URLs. `useFileUrl` in `ui.tsx` resolves them to object URLs.
- If IndexedDB fails, files smaller than 300 KB fall back to data URLs.
- Files stay on the browser that uploaded them, which is expected for a demo with no backend.

### Styling

- **Brand colour:** Tailwind's `teal-*` scale is remapped to ECE navy (`#003164` = `teal-700`) in `src/index.css`, so `teal-*` classes mean "brand". Shared utilities are `btn-primary`, `btn-ghost`, `card`, `input`, and `label`.
- Use logical properties (`ms-`, `pe-`, `start-`) and `rtl:` variants so layouts work in both directions.
- **Grids must always have a base column count** (`grid grid-cols-1 md:grid-cols-2`, not `grid md:grid-cols-2`). Without one, truncated text widens the implicit column on phones and the page scrolls sideways; this bug was found and fixed on the dashboard cards. Check with `document.documentElement.scrollWidth <= innerWidth` at a width of 390.
- Use the `no-scrollbar` utility (in `index.css`) to hide scrollbars.

### Paths and permissions

- **Paths must stay relative.** The app is served from the sub-path `/ece-technical-office/`. Use `./file` in `index.html` and JSX, or `import.meta.env.BASE_URL` (`ICON` and `LOGO` in `store.ts` do this). HashRouter means no server rewrites are needed.
- Permission checks belong in both the nav and the page. For example, the contracts nav item is hidden and the contracts pages render a restriction message for non-`mgmt` users.

## 6. Branding requirements

- **Client branding:** navy theme and the app icon `public/icon.svg`. There are two logos:
  - `public/ece-logo.jpg` (the original, 220×100, low-resolution with compression lines) is used on white backgrounds: the login card and the OG image.
  - `components/EceLogo.tsx` is a vector redraw in white for the dark sidebar. The owner said a white card in the sidebar looked out of place.
  - Replace both if the owner sends a better logo file.
- The dashboard greeting shows the title and first name only ("Good morning, Eng. Ahmed"), as the owner requested.
- **Developer credit** (requested by the owner, do not remove): `src/components/DevCredit.tsx` shows the Digital Bwsla logo, "Developed by Digital Bwsla" / "تطوير وتنفيذ بوصلة رقمية", digitalbwsla.com, and info@digitalbwsla.com.
  - It appears on the Login page, at the bottom of the desktop sidebar, in the mobile More sheet, and in the mobile page footer.
  - It also appears in `index.html` (`meta author`), `package.json` `author`, the README, and `og-image.jpg`.
  - The English name "Digital Bwsla" was chosen by the agent. Change the `devCompany` key in `i18n.ts` if the owner gives an official name.
  - The phone number (+20 128 057 1375) was intentionally **not** added; the owner asked only for the website and email.

## 7. PWA

- Configured in `vite.config.ts`:
  - The manifest is in English (`lang: 'en'`, `dir: 'ltr'`) with 192/512 PNG icons, a maskable icon, and an SVG.
  - Four shortcuts point to hash routes: New inquiry, Inquiries, Submittals, Notifications.
  - Workbox precaches everything except `og-image.jpg`, uses `navigateFallback: 'index.html'`, and caches Google Fonts at runtime.
  - `registerType: 'autoUpdate'`.
- The service worker only exists in **production builds**, not in `npm run dev`. Test with `npm run build` and `npx vite preview --port 4173`.
- **Install UI** (`pwa.ts` together with `Layout`):
  - The "Install app" button appears when `beforeinstallprompt` fires (Android, Chrome, Edge) and opens the native prompt.
  - On iOS it opens a modal with the Safari "Add to Home Screen" steps.
  - It is hidden when the app already runs standalone. `pwa.ts` is imported first thing in `main.tsx` so the event isn't missed.
- **Auto install banner** (`components/InstallBanner.tsx`, rendered in `App.tsx` on every route including login):
  - Appears 1.5 s after opening on a phone (`isMobileDevice`) when the app isn't already installed.
  - With `beforeinstallprompt` (Android/Chrome) it shows an **Install** button for the native prompt. On iOS it shows the Safari Share steps. Otherwise it explains how to install from the browser menu.
  - "Not now" hides it for 3 days (localStorage key `install-banner-dismissed`).
  - To test it, emulate a phone user agent and screen size; Chrome only fires the native prompt on HTTPS production builds.
- An offline banner (`useOnline`) appears under the header.
- **Regenerating icons:** sharp isn't installed. The icons were made by drawing `public/icon.svg` onto a canvas in the browser (CDP `Runtime.evaluate` returning `toDataURL`), then decoding the base64 with Node into `public/`.
  - Maskable icon: full-bleed navy with the logo inset 10%. Apple icon: 180 px with a 6% inset.
  - `og-image.jpg` was drawn on a canvas the same way, then converted from PNG to JPEG (quality 88) with `System.Drawing` in PowerShell.
- **Last verification** (on the live site): service worker active and controlling the page, `Page.getInstallabilityErrors` returned `[]`, and a full reload offline worked.

## 8. Deploying

- **GitHub Pages**, branch `gh-pages`, legacy build. Pages was enabled automatically on the first push.
- `gh` CLI is authenticated as `amr-bwsla` with `repo` scope but **no `workflow` scope**. That is why deployment is a script push instead of a GitHub Actions workflow; pushing `.github/workflows/*` would be rejected.
- Local git identity, set per repo: `amr-bwsla <321912392+amr-bwsla@users.noreply.github.com>`. `core.autocrlf=true`.
- **To release:**
  1. Commit and push `main`.
  2. Run `deploy.ps1`.
  3. Poll until the build finishes: `gh api repos/amr-bwsla/ece-technical-office/pages --jq .status` should return `built`, usually in under a minute.
  4. Open the live URL and verify. `dist/` is gitignored.
- If the repo name or owner changes, update the OG URLs in `index.html`, the URL in `deploy.ps1`, and the README.

## 9. How to verify a change (what previous agents did)

1. Run `npm run build` and confirm 0 TypeScript errors.
2. Run `npx oxlint src` and confirm no *new* warnings (see below).
3. Check in Cursor's browser tab (the `cursor-ide-browser` tools) against `localhost:5173`:
   - Sign in by clicking a demo account on `#/login`; Ahmed Fouad is the admin and sees everything.
   - For permission checks, sign in as `u-mech-1` (Youssef Tarek), who must not see contracts.
   - Scan every route for Arabic text in English mode, as described in section 5.
   - For mobile, set `Emulation.setDeviceMetricsOverride` to a width of 390 with the **current window height** (otherwise screenshots get cropped), and call `clearDeviceMetricsOverride` afterwards.
   - The screenshot tool only accepts plain filenames, not absolute paths. Files are saved under `%APPDATA%\Cursor\browser-screenshots\`.
4. When testing is done, click **Reset demo data** so the owner's browser is left clean.

**Known lint warnings (pre-existing, accepted):**

- `react(purity)` for `Date.now()` during render in several pages. This is intentional: the demo is time-based.
- `only-export-components` in `Login.tsx` and `ui.tsx`.
- `set-state-in-effect` in `Projects.tsx`.

## 10. History (what has been built, in order)

1. **Initial review.** The demo had projects with workflows, inquiries, notifications, and reports in Arabic/English with a basic PWA. Gaps were identified.
2. **Core upgrades:**
   - Runtime delay and escalation alerts (`dueAlerts`, `checkDueAlerts`, "Simulate +4 hours").
   - Returning a workflow step to an earlier one, with a project log.
   - The **Submittals** module (register, revisions, A/B/C/D review, resubmission).
   - Reports: period filter, stage performance with returns, per-engineer response, submittal first-time approval rate, CSV (UTF-8 BOM) export, and a print/PDF layout.
   - General: README, 404 page, lazy routes (main bundle went from 814 KB to about 345 KB), relative paths, confirmation before deleting a template, reopening inquiries, and inquiry search and filters.
3. **ECE customization:**
   - Branding (logo, navy colour, icon, `@ece-eg.com` emails).
   - Six departments, including the new Plumbing & FF.
   - Three workflow templates matching ECE's services.
   - 16 portfolio-based projects, with MEP-realistic inquiries and submittals.
4. **Contracts module:** upload (drag and drop, multiple files), kinds and numbering, payment schedule, expiry alerts, a project-page section, and mgmt-only access.
5. **All money in EGP.** The currency field was removed and the KSA values were converted.
6. **Polish:** IndexedDB file persistence, a contracts & collections panel on the dashboard, a collections-by-project report (included in the CSV), and admin-only contract deletion.
7. **English default and PWA readiness:**
   - `content.ts` translations (185 strings) and `tx()` everywhere seed content is shown.
   - English notification texts.
   - PNG, maskable, and Apple icons; manifest shortcuts; offline caching and banner; install button and iOS hint.
   - Mobile **More** sheet with Contracts, Workflows, demo controls, install, and sign out.
   - Day/days plural fix.
8. **Publishing:**
   - Digital Bwsla credit everywhere listed in section 6.
   - OG share image and tags.
   - Sidebar spacing for short screens.
   - Version 1.0.0.
   - Repo created and deployed to GitHub Pages, then verified live.

9. **Owner feedback after publishing:**
   - Greeting shows the first name only.
   - White vector ECE logo in the sidebar.
   - Automatic mobile install banner.
   - Fixed sideways scrolling on phones by adding `grid-cols-1` to every grid.

## 11. Ideas not done yet (if the owner asks for "more")

- More technical-office modules: Transmittals (incoming and outgoing correspondence), Minutes of Meetings with action items, IR/NCR, and BOQ / Variation Orders.
- A users and departments admin screen, an audit log, and stronger `head` permissions (assigning work, viewing team performance).
- Parallel workflow steps, and step assignment to a specific engineer.
- Global search across inquiries, submittals, and contracts (it currently searches projects only).
- Real `.xlsx` export, which would need a library. The current export is CSV, which Excel opens fine.
- Automated tests (none exist).
- A real backend and authentication, if this ever goes beyond a demo.
