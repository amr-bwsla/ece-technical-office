# ECE — Technical Office Demo (المكتب الفني)

نسخة عرض تفاعلية مُعدّة لشركة **Elite Consolidated Engineers (ECE)** — [ece-eg.com](https://ece-eg.com/) — لنظام تنسيق العمل بين الأقسام الهندسية: المشاريع ومسارات العمل، الاستفسارات الفنية (RFI)، التقديمات والاعتمادات (Submittals)، الإشعارات والتصعيد، والتقارير.

An interactive, frontend-only demo tailored for ECE (MEP / integrated design consultancy, Cairo & Riyadh). All data lives in the browser (`localStorage`); there is no backend.

**Live demo:** https://amr-bwsla.github.io/ece-technical-office/ — sign in with any demo account (password `123456`).

Developed by **[Digital Bwsla — بوصلة رقمية](https://digitalbwsla.com)** · [info@digitalbwsla.com](mailto:info@digitalbwsla.com)

### Tailored to ECE

- **Branding**: ECE logo (`public/ece-logo.jpg`), navy `#003164` primary colour (remapped from Tailwind `teal-*` in `src/index.css`), new app icon.
- **Departments**: Architecture, Civil/Structural, HVAC, Plumbing & Fire Fighting, Electrical & ELV, Technical Management & QA.
- **Workflow templates** matching ECE's services: MEP full design & supervision (with Peer Review and tender documents), integrated ARCH-CIVIL-MEP design (with statutory approvals), and design review & value engineering.
- **Projects** based on ECE's published portfolio (Elsewedy Dammam, VOCO Riyadh, Mondelez, Snow City, The Curve, Aswan Heart Center, JW Marriott, Tamer & Sadr Logistics KSA…). Project codes use `ECE-EG-` / `ECE-KSA-`. Progress, inquiries, people and dates are fictional demo data.

## Run

```bash
npm install
npm run dev       # http://localhost:5173 (also exposed on LAN for mobile testing)
npm run build     # type-check + production build into dist/
npm run preview   # serve dist/
```

Deploy to GitHub Pages (builds and force-pushes `dist/` to the `gh-pages` branch):

```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

`dist/` is fully static and uses relative paths + hash routing, so it can be hosted under any sub-path (Netlify, GitHub Pages, IIS, S3…).

### Language

English is the default; the header button switches to Arabic (RTL). Seed content is written in Arabic in `seed.ts` and translated for English in `src/content.ts` — add an entry there for any new seed string.

### Mobile app (PWA)

The production build is an installable PWA (Chrome reports no installability errors):

- Manifest with 192/512 PNG icons, a maskable icon, Apple touch icon, and shortcuts (New inquiry, Inquiries, Submittals, Notifications).
- Service worker precaches the whole app; the Google font is cached at runtime. The app opens and works fully offline, with an offline banner. New versions are picked up automatically.
- **Install app** button (sidebar on desktop, **More** menu on mobile) uses the native prompt on Android/Chrome/Edge; on iPhone it shows the Safari "Add to Home Screen" steps.
- The mobile **More** menu also holds Contracts, Workflows and the demo controls.

Publishing requirements: serve over **HTTPS** (required for service workers and install), and don't cache `sw.js` / `index.html` aggressively on the server. Icons are generated from `public/icon.svg`.

## Demo accounts

Any account from the login screen, password `123456`. Useful roles to switch between:

| Account | Role | Good for showing |
| --- | --- | --- |
| Eng. Ahmed Fouad | Admin (Technical Management) | Workflow templates, reviewing submittals, escalations |
| Eng. Hesham Reda | Dept. head (Technical Management) | Submittal reviews, project manager alerts |
| Eng. Tarek El-Shafei | Dept. head (Plumbing & FF) | Returning a workflow step, value-engineering inquiries |
| Eng. Khaled Adel | Dept. head (HVAC) | Submittals awaiting resubmission, inquiry escalations |
| Eng. Youssef Tarek | Engineer (HVAC) | Day-to-day inquiries and shop drawings |

Sidebar demo controls:
- **محاكاة مرور 4 ساعات / Simulate +4 hours** — shifts every timestamp back 4 hours so SLA breaches, delay alerts and escalations fire live during a presentation.
- **إعادة ضبط بيانات العرض / Reset demo data** — restores the seed data.

## Modules

- **Dashboard** — KPIs, project status, department workload, upcoming deadlines, my tasks, recent activity.
- **Projects & workflows** — projects follow a workflow template of department steps, each with an SLA. The active department can complete its step or **return the project to an earlier step** with a reason; returns are counted per step and recorded in the project log.
- **Inquiries (RFI)** — cross-department questions with priority-based SLA (4h / 24h / 72h), assignees, attachments, close/reopen, search and filters.
- **Submittals** — design drawings, shop drawings and material submittals with numbered register (`<project>/<type>-<dept>-<seq>`), revisions (Rev 00, 01…), review by Technical Management within 72h, and approval codes:
  - **A** Approved · **B** Approved as noted · **C** Revise & resubmit · **D** Rejected
- **Contracts** — visible to Technical Management only. Upload signed contracts (drag & drop, multiple files) per project as design, supervision or addendum, numbered `<project>/<DC|SC|AD>-<seq>`. Each contract has a value in Egyptian pounds (EGP), signing and end dates, scope, and a payment schedule (must total 100%) where collections are recorded. The list shows total value, collected and outstanding; contracts ending within 30 days are flagged and raise an alert. Technical Management also sees a contracts & collections panel on the dashboard and a collections-by-project table in Reports (included in the Excel export). Only the admin can delete a contract.
- **Notifications** — in-app + device push (PWA). Delay alerts and escalations are generated at runtime every 30 seconds:
  - inquiry not answered within SLA → recipients and sender; +1h → department heads and admin
  - workflow step over SLA → department, project manager, admin
  - project deadline within 3 days / missed
  - submittal review over 72h → reviewers and submitter
  - contract ending within 30 days → Technical Management and project manager
- **Reports** — period filter (7/30/90 days/all), inquiry SLA compliance per department, workflow stage performance and returns, engineer response performance, submittal first-time approval rate. Export to **Excel (CSV, UTF-8)** and **Print / PDF** with a print-optimised layout.

## Project structure

```
src/
  types.ts        domain types
  seed.ts         demo data + shared rules (SLA, submittal status, dueAlerts)
  store.ts        zustand store (persisted to localStorage) and all actions
  i18n.ts         Arabic / English dictionary and formatters
  content.ts      English translations of the Arabic seed content
  files.ts        IndexedDB storage for uploaded files
  pwa.ts          install prompt and online/offline hooks
  components/     Layout, shared UI, tables and cards
  pages/          one file per route (lazy-loaded)
```

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, React Router (hash), Recharts, lucide-react, vite-plugin-pwa.

## Demo limitations

- No backend or real authentication; users and departments are fixed in `seed.ts`.
- Uploaded files are kept in the browser's IndexedDB (`src/files.ts`), so they survive reloads but stay on that browser only. Images are compressed and stored with the rest of the data in `localStorage`. "Reset demo data" also clears stored files.
- Alerts are only generated while the app is open in a browser.
