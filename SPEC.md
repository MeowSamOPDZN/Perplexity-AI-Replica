# Perplexity — FULL REPLICA — BUILD SPEC

1. **One-line summary:** A pixel-faithful, fully interactive replica of https://www.perplexity.ai as audited live on Oct 21 2026 (logged-out state) — 240px collapsible sidebar, serif hero, rotating-placeholder composer with every dropdown working, Discover feed with right rail, story/answer pages, Computer / Automations / Artifacts / Connectors pages, plans dialog, login modal variants, incognito mode, command palette and cookie banner. Every button, dropdown, menu, toggle and modal functions locally.

2. **Stack:** Single-file `index.html` (HTML + one `<style>` in head + one `<script>` at end of body), vanilla CSS/JS, no framework, no build step. Google Fonts via CDN. State in `localStorage` (key `pplx_replica_v1`). Deployed as a static site on Vercel from GitHub.

3. **Exact assets:**
   - Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap`
   - Story card images: `https://picsum.photos/seed/<seed>/900/560` (photographic placeholders standing in for news photography)
   - Logo: inline SVG Perplexity-style asterisk mark (stroke geometry drawn in-file, no external asset)
   - Favicons in source cards: letter tiles with per-outlet background colors (no external favicon requests)
   - Sparklines: inline SVG polylines (no external asset)

4. **Fonts:**
   - `--font-body: "Inter", -apple-system, "Segoe UI", sans-serif;` — all UI text, nav, buttons, composer, cards, menus, modals.
   - `--font-display: "Newsreader", Georgia, "Times New Roman", serif;` — hero H1, Discover headlines, story/answer headlines, section headings in answers.
   - Element mapping: hero H1 40px/500 serif; story H2 30px/500 serif; card headlines 15–17px/500 serif (lead card 28px); UI labels 13–14px/500 sans; small meta 12px sans.

5. **Color theme (exact HSL CSS variables):**
   - `--bg: hsl(50, 20%, 99%)` main area near-white warm
   - `--sidebar-bg: hsl(55, 14%, 96%)` very light warm gray sidebar
   - `--surface: hsl(0, 0%, 100%)` cards, composer, menus, modals
   - `--ink: hsl(195, 15%, 11%)` primary text (dark ink-navy)
   - `--ink-2: hsl(200, 8%, 38%)` secondary text
   - `--ink-3: hsl(200, 6%, 58%)` tertiary / placeholder text
   - `--line: hsl(50, 10%, 88%)` hairline borders
   - `--hover: hsl(55, 12%, 93%)` hover fills in sidebar/menus
   - `--teal: hsl(187, 65%, 34%)` Perplexity teal accent (Sign In icon, NEW badges, links, submit)
   - `--teal-dark: hsl(188, 96%, 23%)`
   - `--teal-soft: hsl(187, 45%, 93%)` teal tint fills
   - `--black-btn: hsl(195, 15%, 11%)` primary black buttons (white text)
   - `--badge-max: hsl(260, 30%, 92%)` Max badge bg; `--gold: hsl(38, 70%, 42%)` Limited-time text
   - Radius tokens: `--r-composer: 24px; --r-card: 16px; --r-menu: 14px; --r-btn: 999px`

6. **Global layout:**
   - Full-height app: fixed left sidebar 240px + fluid main; `[hidden]{display:none !important}` shipped in base CSS.
   - Sidebar collapses to a 56px icon rail (class on body), tooltips appear on rail hover.
   - Main scrolls independently; home content column max-width 768px centered; Discover max-width 1200px with 300px right rail.
   - Scripts LAST in `<body>`; all dropdowns are one singleton menu element, positioned under its trigger, closed by outside click / Esc.

7. **Sidebar (top → bottom, verbatim from audit):**
   - Row: "Perplexity" logo link (asterisk mark 24px + serif wordmark) left; right side icon buttons: "Search sessions" (magnifier) and "Collapse sidebar" (panel icon).
   - Nav (icon + label, 14px/500, 36px rows, 10px radius, hover `--hover`): "New" (plus-in-square), "Computer" (monitor) → tasks view, "Automations" (circular arrows) → automations view, "Artifacts" (cube) → artifacts view, "Customize" (hexagon) → connectors view.
   - "Projects" section row: chevron (collapse), label, "+" (Create project) and filter icon (Filter projects) on hover; body text "No projects" in `--ink-3` when empty; created projects list here when signed in.
   - "Recents" section row: chevron (collapse); body "No recent sessions" when empty; submitted queries append here and reopen their answer on click. In incognito the Recents chevron disappears and nothing is saved.
   - Bottom block: "View plans" pill button (full-width, outlined) → plans dialog; "Sign In" row (teal person-circle icon + label + right chevron) → login modal. After demo sign-in this becomes an avatar + name row opening a user menu (plan line, "Upgrade to Pro", "Sign out").
   - Collapsed rail (56px): same icons in same order, labels hidden; bottom shows expand icon, View plans icon, Sign In icon.

8. **Top-right of main (home):** Two icon buttons only — incognito toggle (sunglasses icon; tooltip "Use incognito…" with shortcut Ctrl+;) and hamburger ("Apps and more"). NO Sign In/Sign Up buttons, NO settings gear, NO language selector, NO theme toggle, NO Help menu (none exist logged out — do not invent them). "Apps and more" menu items: Discover, Finance, Health, Academic, Patents (each with icon) — each opens its topic view.

9. **Hero (home):** Small gray mode label "Search" above a centered 40px asterisk logo; H1 verbatim: "What do you want to know?" (serif, 40px). Incognito state swaps H1 to "You're incognito", shows subtext "Sessions you create won't save to your history and expire after 24 hours", dashes the composer border, hides suggestion cards.

10. **Composer (the core component, identical instance reused on Home, Answer follow-up, Computer):**
    - Card: white, 1px `--line` border, 24px radius, soft shadow; textarea auto-grows 1–6 rows, 16px text.
    - Placeholder rotates every 3s between: "Ask anything…", "Type / for search modes", "Type @ for connectors". Typing "/" opens the search-modes menu; typing "@" opens the connectors panel.
    - Bottom row left → right: "+" button ("Add files or tools"); "Search" mode dropdown button (label follows selection); "Computer" toggle button (pressed state = teal-soft fill).
    - "+" menu: "Upload files or images" (lock when logged out → login modal; real file picker + attachment chips when signed in); "Connectors" → submenu panel ("Upgrade to connect more sources →", "Web" checkbox CHECKED, "Academic" checkbox, "Add files from cloud" lock); "Projects" → submenu panel ("Create new project" disabled logged-out, "No projects found" / project list).
    - Search-mode menu: "Search" (✓ selected), "Deep research" (lock), "Model council" + "Max" badge (lock), "Learn step by step" (lock). Locked items open the login modal logged-out, the plans dialog signed-in-free.
    - Bottom row right: "Model" dropdown button; mic button ("Dictation" tooltip — uses SpeechRecognition when available, else a listening pulse state); black circular voice button ("Use voice mode") → login modal (voice variant) logged-out, voice overlay signed-in. When the composer has text, a circular submit arrow replaces the voice button.
    - Model menu: header row "Access the top AI models →" (→ plans dialog), then 11 rows each with lock icon: GPT-6.1 Sol; GPT-6 Astra [Max]; Gemini 4 Argon [New]; Gemini 3.8 Flash; Claude Sonnet 5.5; Claude Opus 5.5 [Max]; Claude Fable 5.1 [Max]; Kimi K3; GLM 5.3; Grok 4.7; Nemotron 3.5 Super VL. After demo sign-in, Gemini 3.8 Flash / Kimi K3 / GLM 5.3 become selectable; Pro/Max rows open plans.
    - Enter submits (Shift+Enter = newline). Submitting routes to the Answer view and appends to Recents (unless incognito).

11. **Suggestion cards (home, below composer, 2 side-by-side):**
    - Card 1: magnifier icon, title "Search anything", text "Get fast and accurate answers from the most trusted sources." → education modal: headline about accurate answers from top AI models, one line on web search with cited sources (original wording), mini composer mock, horizontal model chips (the 11 model names + badges), black button "Login or sign up for free", X close.
    - Card 2: monitor icon, title "Get work done with Computer" + teal "NEW" badge, text "Hand off your projects to get polished, reliable deliverables around the clock." → education modal: task-list preview (3 sample tasks), panels "Works inside your stack" (Gmail, GitHub, Slack, Notion tiles) and "Set it and forget it" (weekly brief schedule mock), black login button, X close.

12. **Discover view:** Header "Discover"; tabs "Top" (selected, underlined) + "Topics" dropdown (Tech & Science, Business, Arts & Culture, Sports, Entertainment — filters the feed); "Share" button → menu "Share this Page" + "Copy link" (copies + toast); hamburger (Apps and more). Lead story: serif headline, "Published X hours ago", summary, favicon stack + "N sources", heart "Like" toggle, "…" article-actions menu with single item "Dislike" (removes story + toast). Then a 3-column card row, then alternating wide stories; ~12 stories, each card clickable → story view. Right rail: "Make it yours" card (topic chips, disabled "Save Interests" until a chip is picked, X dismisses); weather widget (19°, °F/°C toggle buttons that convert all temps, "Clouds and sun", "Mendoza", "H: 21° L: 13°", Wed–Sun forecast row); "Market Outlook >" with 4 sparkline cards (S&P 500 ETF, NASDAQ, VIX, Bitcoin with % and price deltas); "Trending Companies >" rows (Tesla, Meta, Netflix, Capital One, Super Micro with ticker, price, %).

13. **Story / Answer view:** Sticky top bar: "← Back to Discover" (or Back) left, centered title, "Share" + hamburger right. Body: serif headline, lead paragraph with inline citation chips (outlet name, "+1" style), source-cards row (favicon tile + outlet + headline), hero image with outlet credit, H2 sections, per-section pill "N sources" + copy-link icon + copy-content icon, hover actions "Copy link to section" / "Copy section content" (both copy + toast). Answer variant (from a submitted query): sources row first, generated answer in 3 sections with citation chips, follow-up chips (3 related questions, click = new answer), "Discover more" 4 cards, sticky bottom "Ask follow-up" composer (full composer component).

14. **Computer tasks view (/computer/tasks):** H1 "Delegate work to Computer", sub "Hand off your projects to get polished, reliable deliverables around the clock.", "Sign in" button (logged out), "Start a session" composer (Computer mode pressed) with "Standard" dropdown (Standard / Advanced-lock). Submitting creates a session card: spinner "Working…" → after ~2.5s "Completed" with a short deliverable summary.

15. **Automations view:** H1 "Automate anything with Computer", sub about scheduled/conditional workflows, "Create" button → create-automation modal (name, prompt, schedule dropdown: Every day / Weekdays / Every Monday / Custom, time input) → adds an automation card with pause/play toggle and delete. "Suggested for you" template cards (Morning stock brief, Weekly competitor digest, Inbox summarizer, Price watch) — click pre-fills the modal. Plus an "Or type what you want your automation to do" composer with disabled Submit until text is typed.

16. **Artifacts view:** Toolbar: "Search artifacts" input, "Grid view"/"List view" toggle (Grid pressed), filter tabs All / Created by you / Uploaded by you / Shared with you, "Filter by type" dropdown (All types, Documents, Images, Reports, Apps, Presentations). Empty state: "No artifacts yet" + explanatory line + "Create an artifact" button → login modal (artifacts variant) logged-out; signed-in opens create-artifact modal (type dropdown + prompt) which adds a real artifact card that the tabs/search/type filter all respect.

17. **Customize / Connectors view:** Tabs "Connectors" / "Skills" (Skills shows its own searchable card list). Header line about connecting services so Perplexity can access your data. "Search all connectors" input (live filter), "Discover" and "All" segmented buttons, "All categories" dropdown (Productivity, Developer tools, Communication, Storage, Finance). Connector cards: Gmail, Google Drive, Google Calendar, GitHub, Slack, Notion, Linear, Outlook — each with "Connect" button → login modal logged-out; signed-in toggles to "Connected" state.

18. **Login modal (variants share one shell):** Default: title "Login or sign up for free", sub "Save and sync your searches". Voice variant: "Sign in to use voice mode" + spoken-answers sub. Artifacts variant: "Sign in to create Artifacts" + artifacts sub. Centered variants add a "Close" text button at bottom. Buttons: black "Continue with Google" (G mark), light "Continue with Apple" (apple glyph), email field "Enter your email", "Continue with email" (disabled until a valid email), "Single sign-on (SSO)" link (→ SSO field state). Any successful path performs a local demo sign-in (no real credentials leave the page): sidebar swaps to the user row, locks for basic features lift, toast "Signed in".

19. **Plans dialog ("View plans"):** Title "Select your plan", subtitle "Upgrade for a broader search experience and premium AI models." Radio group: Personal (checked) / Education / Business. Three cards: **Free** "$0" — checks: "Good for limited daily usage", "Better for simple questions", "Citations in every answer", "Access to basic AI models"; button "Continue with free". **Pro** ("Popular" badge, "+$40 free Computer credits", "LIMITED TIME") "$17 /month or equivalent, when billed annually" — "Everything in Free and:" + Expanded Computer access, 4,000 bonus credits, Deep research, Access to top AI models, Select between AI models, Create polished documents & apps, More usage limits and memory; black button "Get Pro". **Max** ("+$450 free Computer credits", "LIMITED TIME") "$167 /month or equivalent, when billed annually" — "Everything in Pro and:" + Maximum Computer usage, 35,000 bonus credits, 10,000 monthly credits, Expert level research, Frontier AI models, Highest usage limits and memory, Priority access to new features; black button "Get Max". Footer: personal-use/billing line with "policies" and "billing" links (toast). X close. Choosing a paid plan signed-in sets the local plan and unlocks its models (demo, no payment).

20. **Command palette ("Search sessions"):** Dialog titled "Search Projects, sessions, and commands", input placeholder "Type a command or search", "Commands" section: "Search with Perplexity", "Start a Computer session", "Create a new Project" (+ Recents/Projects appear when they exist). Live filter, ↑/↓ + Enter, Esc closes. Opens via sidebar magnifier or Ctrl+K.

21. **Cookie banner:** Bottom-left card: "Cookie Policy" heading + one short original line explaining cookies/pixels/SDKs are used to measure performance and improve services (paraphrased, not lifted copy); buttons "Decline optional" and "Got it"; choice persists, banner never reappears.

22. **Incognito:** Ctrl+; or the top-right icon toggles. On: H1 swap, dashed composer, suggestion cards hidden, Recents chevron removed, icon becomes exit-incognito ("Exit incognito" tooltip). Off: everything restores.

23. **Animations:** `fadeUp` keyframes (opacity 0→1, translateY 6px→0, .35s ease) staggered on view entry via `.anim-in` with `--d` delay custom property; menu pop `.18s` scale .98→1; modal fade/scale .2s; voice overlay pulsing rings (scale/opacity keyframes 1.6s infinite); skeleton shimmer on answer "Searching…" state (1.2s linear infinite); sparkline draw on Discover entry. No layout shift from animations.

24. **Explicit negatives:** NO footer anywhere. NO top-right Sign In/Sign Up buttons. NO settings gear, language selector, theme toggle or Help menu (absent on the real logged-out site). NO separate file-attachment cards. NO React/framework. NO invented nav items beyond the audited set (New, Computer, Automations, Artifacts, Customize, Projects, Recents, View plans, Sign In). NO lorem ipsum — all copy is either the audited UI strings or original summaries written for this replica. Scripts never before the markup they touch.

25. **Addendum (Oct 21 2026, later):** (a) Real AI: `api/chat.js` Vercel serverless proxy → xKiro chat completions, model fixed server-side to `mistralai/mistral-large-4-0`, Chrome UA header (xKiro 403s non-browser UAs), key ONLY in `XKIRO_API_KEY` env var (sensitive). Client streams SSE and renders markdown (js/ai.js); follow-ups send full history. (b) Model switcher: ALL previous models removed; single entry "Mistral Large" with the real Mistral pixel logo (inline SVG symbol `i-mistral`, brand colors #000/#F7D046/#FF8205/#FA520F/#E10500), always selected, no locks. Composer model button shows logo + "Mistral Large" by default. (c) File organization: split into `css/main.css`, `css/phone.css`, `js/core.js`, `js/ai.js`, `js/app.js`, `api/chat.js`, `package.json` (type: module). (d) Phone CSS (css/phone.css, link media max-width 860px): Perplexity-app layout — sidebar hidden; fixed top app bar (logo, search-sessions, incognito, apps, Sign In/avatar); fixed bottom tab bar (Home, Discover, raised teal center New button, Computer, Artifacts, safe-area padding); menus and dialogs become bottom sheets; single-column Discover with rail stacked; sticky follow-up composer above the tab bar; 16px composer text (no iOS zoom); tooltips disabled on touch.
