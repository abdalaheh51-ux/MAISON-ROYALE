# Worklog — Luxury Watch Customizer (متجر ساعات فاخرة وتخصيص)

Project: Dark-theme luxury watch store with interactive SVG configurator + ERP inventory mini-system.
Stack: Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Framer Motion, Prisma (SQLite), z-ai-web-dev-sdk for image gen.

---
Task ID: 0
Agent: orchestrator
Task: Bootstrap project plan and worklog.

Work Log:
- Inspected existing scaffold (Next.js 16, shadcn/ui New York, Prisma SQLite, Tailwind v4).
- Decided architecture: SVG-based parameterized watch renderer for true real-time configurator + AI-generated hero/marketing imagery.
- Defined 7-step plan (DB, images, API, configurator, ERP, page assembly, browser verification).

Stage Summary:
- Plan locked. Next: parallel execution of DB schema (Task 1) and image generation (Task 2).

---
Task ID: 2
Agent: image-gen
Task: Generate 5 luxury watch marketing/hero PNG images via z-ai-web-dev-sdk into public/images/.

Work Log:
- Read prior worklog (Task 0) and confirmed SDK (`z-ai-web-dev-sdk@0.0.18`) installed; config present at `/etc/.z-ai-config`.
- Verified SDK surface from `node_modules/z-ai-web-dev-sdk/dist/index.d.ts`: `ZAI.create()` then `zai.images.generations.create({ prompt, size })` returns `{ data: [{ base64 }] }`.
- Created `scripts/gen-images.ts` with the 5 required jobs (sequential, try/catch per image, 3 retries each, `Buffer.from(base64,'base64')` → `fs.writeFileSync`).
- Created `public/images/` and `scripts/` directories.
- First run (timed out by tool deadline mid-way) successfully produced `collection-1.png`, `collection-2.png`, `collection-3.png`.
- Created `scripts/gen-images-remaining.ts` (skips already-generated, valid files) to finish the remaining 2 images.
- `atelier.png` (1344x768) generated successfully on this run.
- `hero.png` initially failed with HTTP 400 / API error code `1214`: "size的长宽均需满足512px-2880px之间,且为32整数倍..." — i.e. `720` is **not** a multiple of 32, so the requested `1440x720` is rejected by the upstream API despite being listed in the SDK type union. Switched hero to the closest valid wide aspect ratio `1344x768` (both dims divisible by 32, ~1.75:1 ≈ 16:9). Frontend will crop/scale via `object-fit: cover`.
- Re-ran: `hero.png` (1344x768) generated successfully.
- Verified all 5 files exist and are non-empty (>50KB each); `file` confirms each is a valid baseline JPEG (1344x768 or 1024x1024) — the SDK returns JPEG bytes for the `base64` field, but files are named `.png` per task spec; browsers content-sniff fine inside `<img>`.
- Did NOT touch any Next.js app code or other project files — only created `scripts/gen-images.ts`, `scripts/gen-images-remaining.ts`, and the 5 PNGs under `public/images/`.

Stage Summary:
Final generated files (all valid, all >50KB):
- `/home/z/my-project/public/images/hero.png` — 103,450 bytes (effective size 1344x768; spec'd 1440x720 rejected by API — see Work Log)
- `/home/z/my-project/public/images/collection-1.png` — 213,797 bytes (1024x1024)
- `/home/z/my-project/public/images/collection-2.png` — 86,964 bytes (1024x1024)
- `/home/z/my-project/public/images/collection-3.png` — 110,923 bytes (1024x1024)
- `/home/z/my-project/public/images/atelier.png` — 113,033 bytes (1344x768)

Scripts created:
- `/home/z/my-project/scripts/gen-images.ts` (full 5-image generator)
- `/home/z/my-project/scripts/gen-images-remaining.ts` (idempotent continuation w/ skip-existing + hero size fix)

Known caveat: hero dimensions are 1344x768 instead of the requested 1440x720 due to upstream API constraint (both dimensions must be multiples of 32). Hero still renders as a wide cinematic banner; consumer should use `object-fit: cover` rather than assuming exact 2:1.

Next: image assets are ready for the page builder (Task 5+) to wire into hero + collection grid sections.

---
Task ID: 1,3,4,5,6,7
Agent: orchestrator (fullstack)
Task: Build DB+API, SVG watch configurator, ERP panel, page assembly, browser verification.

Work Log:
- Task 1: Wrote prisma/schema.prisma (WatchModel, Component, Order, OrderItem). Pushed schema. Seeded 1 model (Chronograph Royale, $4,200) + 18 components across dial/strap/hands/case with deliberate sold-out (Champagne Ivory, Racing Rubber, Leaf Rose Gold hands) and low-stock items (Emerald, Rose Gold case/bracelet, Black DLC).
- Task 3: API routes — /api/catalog (model + grouped components), /api/inventory (ERP list + KPI stats + PATCH restock), /api/orders (atomic tx: validates stock, decrements 4 components, creates order + items). All verified via curl.
- Task 4: src/components/watch/watch-svg.tsx — parameterized SVG renderer (360x520). Renders case (4 metal gradients), bezel with 120 engraved ticks, crown + chrono pushers, dial (sunburst/guilloche/matte finishes), hour markers + minute ticks, 3 sub-dials, date window, MAISON ROYALE branding, 4 hand styles (dauphine/sword/baton/leaf) at 10:10, sapphire crystal highlight. Real-time, zero image assets.
- Task 4: src/components/watch/configurator.tsx — loads catalog, filters sold-out (stock===0) live, 4 category tabs with "N out" badges, swatch selectors per type, real-time totalCents via useMemo, Framer Motion transitions on watch + price, price breakdown, Confirm Configuration → POST /api/orders, Reset, order confirmation card. Shows "hidden from configurator (sold out)" callout.
- Task 5: src/components/watch/erp-panel.tsx — KPI cards (total units, SKUs, low stock, sold out), sortable inventory table with stock badges, per-row Consume(-1)/+5/Restock(+1) controls (Consume disabled when sold out), motion stock counter, inventory value footer, ERP integrity note.
- Task 6: src/components/sections/atelier-shell.tsx (client) — tabs Atelier/ERP, holds shared catalog state, refreshCatalog() re-fetches on order or inventory change. src/app/page.tsx (server) — fetches catalog via db, renders sticky header, full-bleed dark hero with hero.png bg + grain overlay, manifesto, atelier, pillars, collection (3 cards), craft section with atelier.png, ERP note, sticky footer (min-h-screen flex flex-col + mt-auto). globals.css: forced luxury dark theme (warm near-black + champagne gold OKLCH), Playfair Display + Cormorant Garamond serif fonts, gold-gradient text, custom scrollbar, grain overlay, fadeUp keyframe.
- Task 7: Agent Browser verification —
  * Hero renders, no console/hydration errors.
  * Sold-out Champagne Ivory dial hidden from configurator; Emerald Green shows "3 left".
  * Real-time pricing: $4,200 → $4,550 (Emerald +$350) → $6,350 (Rose Gold bracelet +$1,800). Multi-axis correct.
  * Placed order LWC-TFB1F — confirmed, stock decremented (Emerald 3→2, Rose Gold 2→1).
  * ERP tab: KPIs + table render, Champagne "Sold out" badge, Consume disabled for it, +5/Restock work.
  * Restocked Champagne Ivory ×3 via ERP → switched to Atelier → Champagne Ivory REAPPEARED in dial options (live ERP→configurator sync proven). Emerald now "2 left".
  * Strap tab: Racing Rubber (sold out) hidden; low-stock warnings on Steel/Rose Gold bracelets.
  * Sticky footer: gapBelow = 0 (footer flush at document bottom). Mobile 390x844 responsive.
  * 14 SVGs render; hero background present. Final `bun run lint` clean (0 errors, 0 warnings).

Stage Summary:
- Production-ready luxury watch customizer delivered. Dark serif theme, interactive SVG configurator with live pricing across 4 axes, full ERP mini-system with bidirectional stock sync (orders decrement, restock re-opens options, sold-out auto-hides). All 7 todos complete and browser-verified.

---
Task ID: 8
Agent: orchestrator (3D + animations)
Task: Add 3D watch model with manufacturing details + scroll animations, preserve layout.

Work Log:
- Installed three@0.184.0, @react-three/fiber@9.6.1, @react-three/drei@10.7.7.
- Built src/components/watch/watch-3d-model.tsx — procedural R3F luxury chronograph: skeletonised dial ring, visible movement plate with perlage, 4 rotating gears (gear train) with jewel centers, mainspring barrel, TOURBILLON cage at 6 o'clock (rotating balance wheel + spokes + jewel), 12 hour markers, 3 live-rotating hands (hour/minute/seconds), engraved bezel (60 ticks), case ring, 4 lugs, crown + 2 chrono pushers, sapphire crystal (transmission material), 7 ruby jewels. All geometry generated in-code (no GLTF) — tiny bundle.
- Built src/components/watch/watch-3d-scene.tsx — Canvas wrapper: warm key + cool fill + gold point light + spot rig, Environment preset=studio, ContactShadows, Float (subtle bob), OrbitControls (auto-rotate 0.6, damping, zoom 3.2–7, pan disabled). 4 manufacturing-detail HOTSPOTS (Tourbillon Cage, Mainspring Barrel, Gear Train, Dauphine Hands) using drei <Html occlude> with animated popover.
- Built src/components/watch/watch-3d-loader.tsx — dynamic import with ssr:false (WebGL can't SSR), loading spinner "Forging the movement…".
- Built src/components/sections/movement-3d-section.tsx — new "The Movement · 3D Atelier" section: heading with WordReveal, 3D canvas in rounded card with radial vignette, 4 spec cards with animated CountUp (327 components, 41 jewels, 432 hours, 28800 vph), parallax spec strip via useScroll/useTransform, ambient gold glow.
- Built src/components/sections/motion-primitives.tsx — Reveal (fade-up on scroll), StaggerGroup/StaggerItem (staggered children), WordReveal (word-by-word blur-in). Reusable across page.
- Built src/components/sections/hero-parallax.tsx — parallax hero (scroll-driven y translate + scale on bg image + fading overlay).
- Updated src/app/page.tsx: swapped hero to <HeroParallax>, added WordReveal to h1, wrapped Manifesto/Atelier/Pillars/Collection/Craft/ERP sections in Reveal/StaggerGroup (staggered pillar + collection card reveals, hover lift on collection cards), inserted <Movement3DSection /> between Collection and Craft, added "3D Movement" nav link, changed hero secondary CTA to "Explore the 3D movement" → #movement.
- Browser verification (Agent Browser):
  * Page compiles HTTP 200, no console errors. Only 3 harmless warnings (R3F container position [fixed with inline style], THREE.Clock + WebGLShadowMap deprecation notices from three.js internals).
  * 3D canvas renders at 766×766, 4 hotspots present, section visible.
  * Clicked Tourbillon hotspot → detail popover opened ("A rotating cage that houses the escapement…").
  * OrbitControls drag verified — canvas alive after mouse drag.
  * All 6 sections present after full scroll: hero, atelier, movement, craft, erp, footer.
  * Existing SVG configurator intact (13 buttons), ERP tab intact (Component inventory table renders).
  * Sticky footer: gapBelow = 0 (flush at doc bottom).
  * Final `bun run lint` clean (0 errors, 0 warnings). dev.log clean.

Stage Summary:
- 3D luxury watch model (procedural R3F) with exposed movement + tourbillon + manufacturing-detail hotspots added as new "The Movement" section. Scroll animations (parallax hero, word-reveal headings, staggered section reveals, animated stat counters) layered across all existing sections WITHOUT changing layout. Existing SVG configurator + ERP system fully preserved and verified working.

---
Task ID: 9
Agent: orchestrator (AP [Re]master01 3D experience)
Task: Add dedicated realistic 3D model of AP [Re]master01 (ref 75150PT.OO.01) with disassembly/assembly animation, in its own dedicated overlay experience (not the main page).

Work Log:
- Studied AP [Re]master01 specs (web-reader couldn't render AP's JS-heavy page; used accurate reference knowledge): 40mm 950 platinum case, domed bezel, two-tone dial (silvered opaline + salmon opaline counters), two-counter flyback chronograph (small seconds @9, 30-min @3), tachymeter flange, applied pink-gold hour markers + leaf hands, crown + 2 pushers, brown alligator strap with platinum pin buckle, sapphire display caseback, Calibre 4404 (70h reserve, 37 jewels, 28800 vph).
- Installed @react-three/postprocessing + postprocessing (later removed EffectComposer to keep frameloop light enough for stable rendering — ACES tone mapping kept via gl prop, gold emissive materials provide natural glow).
- Built src/components/remaster01/remaster01-model.tsx — procedural high-realism R3F model. 13 separate <Part> groups, each lerps between assembled/exploded positions driven by an explodeRef (read in useFrame, NO per-frame React re-renders). Parts: sapphire crystal (domed, transmission material), domed platinum bezel (clearcoat), leaf hands (pink gold + lume tips), chronograph hand (spinning), applied hour markers, two-tone dial (silvered + salmon counters + tachymeter ticks + AP branding), case middle (platinum, brushed mid-band), 4 lugs, winding crown (platinum + pink gold + AP cap), 2 chrono pushers, Calibre 4404 movement (perlage plate, 4 spinning gears with ruby jewels, balance wheel, 8 jewels, engraved branding), oscillating rotor (pink gold, oscillating), display caseback (sapphire window + engraving ring), alligator strap (5 segments + stitching + platinum pin buckle).
- Built src/components/remaster01/remaster01-scene.tsx — Canvas with ACESFilmic tone mapping, 4-light luxury rig (warm key + cool fill + gold point + spot), Environment preset=studio, ContactShadows (1024), Float, OrbitControls (auto-rotate, damping, zoom 4–11). ExplodeDriver damps explodeRef toward target each frame (k=1-exp(-dt*6)). dpr [1,1.5], shadow-mapSize 1024 for performance.
- Built src/components/remaster01/remaster01-experience.tsx — full-screen fixed overlay (z-100, its own space). Header (AP [Re]master01 + ref badge), 3-column body: LEFT part explorer (13 parts grouped Front/Case/Movement/Back/Wearing, click → detail popover), CENTER 3D canvas + drag hint + explode progress bar + highlighted-part popover, RIGHT controls (Disassemble/Assemble toggle, manual step slider 0-1, Reset, Pause/Auto-turn) + specs sidebar (10 specs) + crafted-by-hand note. Esc to close, body scroll lock. explodeDisplay mirrored at ~12fps via rAF for UI (light). Dispatches window 'remaster01:overlay' event on open/close.
- Built src/components/sections/featured-timepiece.tsx — entry card on main page (between Movement and Craft sections) with hero image, "Interactive 3D" badge, 4 stat tiles, opens the overlay on click.
- Performance fix: Movement3DSection canvas now gated by IntersectionObserver (rootMargin -150px) + listens for 'remaster01:overlay' event → unmounts its canvas when overlay opens. Ensures only ONE WebGL canvas renders at a time (verified: 0 canvases at #featured, 1 after overlay opens).
- Browser verification (Agent Browser):
  * Page HTTP 200, no console errors (only harmless THREE.Clock/WebGLShadowMap deprecation warnings).
  * Featured entry card renders at #featured. Clicking opens full-screen overlay.
  * Overlay: heading "[Re]master01 — Selfwinding Chronograph", Disassemble button, manual slider, 13 part-explorer buttons, 10 specs — all present.
  * Disassemble click → slider value 0→1 (fully exploded, damped animation). Assemble click → 1→0 (reassembled). Animation realistic (easeInOutCubic + damped follow).
  * Part explorer: clicking "Calibre 4404" opens detail popover ("Integrated flyback chronograph...").
  * Screenshot captured (verify-remaster01.png).
  * Close button (aria-label "Close experience") closes overlay; main page intact (hero, atelier, movement, featured, footer all present).
  * Regression: SVG configurator intact (13 buttons), ERP preserved.
  * Mobile 390x844 responsive.
  * Final `bun run lint` clean (0 errors, 0 warnings).

Stage Summary:
- Dedicated, realistic 3D experience for the AP [Re]master01 added as a full-screen overlay (its own space, not mixed into main page). 13-component procedural platinum model with salmon two-tone dial, visible Calibre 4404 movement, and smooth disassembly/assembly animation (crystal→bezel→hands→markers→dial→movement→rotor→caseback + strap/crown/pushers outward). Opened from a "Featured Timepiece" card on the main page. Existing configurator/ERP/3D-movement sections fully preserved.

---
Task ID: 10
Agent: orchestrator (AP 150 Heritage Ultra-complication Universal Calendar 3D)
Task: Add realistic 3D model of the AP 150 Heritage "Ultra-complication Universal Calendar" with disassembly/assembly animation, in its own dedicated overlay experience.

Work Log:
- Analyzed the uploaded reference image with VLM (z-ai vision): extracted exact design — 50mm polished stainless-steel case, double-step guilloche bezel, deep-blue sunburst dial (gradient darker centre → lighter edge), 4 sub-dials (date@12 white, day@9 white, month@3 white, tourbillon@6 transparent with gold mechanism), Roman numerals (white, serif), Breguet-style open-circle rose-gold hands + baton sub-dial hands, onion-shaped guilloche crown @ 3 o'clock, two corrector pushers @ 2 & 4, polished stainless-steel bracelet (oval interlocking links), sapphire display caseback, "AUDEMARS PIGUET" branding below 12, "SWISS MADE" above 6.
- Built src/components/universal-calendar/uc-model.tsx — procedural high-realism R3F model. 16 separate <Part> groups, each lerps between assembled/exploded positions via explodeRef (read in useFrame, NO per-frame React re-renders). Parts: sapphire crystal (domed, transmission), double-step bezel (clearcoat + 96 guilloche ticks), Breguet hands (rose gold, open circle + moon tip) + spinning seconds hand, Roman numerals (white raised plates, skipping 12/3/6/9 where sub-dials sit), blue sunburst dial (180 radial rays + gradient + minute track), 4 sub-dials (date@12 with 31 ticks + hand, day@9 with 7 ticks, month@3 with 12 ticks, tourbillon@6 transparent window), rotating tourbillon cage (gold ring + balance wheel + spokes + ruby jewel), case middle (steel, brushed band), onion crown (guilloche knurled + AP cap), 2 pushers @ 2/4, 4 lugs, Calibre UC-150 movement (perlage plate, 4 spinning gears, balance wheel, 10 jewels), gold rotor, display caseback (sapphire window + engraving ring), steel bracelet (12 oval interlocking links + end caps).
- Built src/components/universal-calendar/uc-scene.tsx — Canvas with ACESFilmic tone mapping, 4-light luxury rig, Environment preset=studio, ContactShadows, Float, OrbitControls. ExplodeDriver damps explodeRef toward target (k=1-exp(-dt*6)). dpr [1,1.5], shadow-mapSize 1024.
- Refactored the experience overlay into a REUSABLE src/components/shared/watch-experience-3d.tsx (WatchExperience3D + lazyScene helper). Accepts config (eventId, eyebrow, title, titleAccent, reference, parts[], specs[], craftNote, scene, partGroups[]). Drives animation via refs (no per-frame re-renders), throttled rAF mirrors explode value at ~12fps for UI. Both watches now share this component.
- Slimmed Remaster01 experience to use the shared component (config-only, ~50 lines).
- Built UC experience (universal-calendar/uc-experience.tsx) using the shared component with UC-specific config: 16 parts (Front/Case/Movement/Back/Wearing groups), 10 specs (ref 26600TI, 50mm steel, Calibre UC-150, perpetual calendar + tourbillon + repeater, 72h, 21600 vph, 47 jewels), craft note about the 150th anniversary grande complication.
- Updated src/components/sections/featured-timepiece.tsx — now hosts TWO watch cards ([Re]master01 + Ultra-complication Universal Calendar), each opens its dedicated overlay. UC card uses the uploaded reference image (/images/uc-watch.png). Staggered reveal, hover lift, per-card stats tiles.
- Movement3DSection now listens for BOTH 'remaster01:overlay' AND 'uc:overlay' window events → unmounts its canvas when either overlay opens. Verified only ONE canvas renders at a time.
- Copied uploaded image to /home/z/my-project/public/images/uc-watch.png.
- Browser verification (Agent Browser):
  * Page HTTP 200, no console errors.
  * Two featured cards render ([Re]master01 + Ultra-complication Universal Calendar).
  * UC card click → overlay opens with "Ultra-complication — Universal Calendar" heading, 16 part-explorer buttons (Sapphire crystal, Double-step bezel, Breguet hands, Roman numerals, Blue sunburst dial, Date sub-dial @12, Day sub-dial @9, Month sub-dial @3, Tourbillon @6, etc.), 10 specs, Disassemble button, slider.
  * Disassemble click → slider 0→1 (16 components explode). Assemble click → 1→0 (reassembled). Realistic eased animation.
  * Part explorer: clicking "Tourbillon @6" opens popover ("Flying tourbillon cage, one revolution per minute...").
  * Only 1 canvas renders during overlay (main #movement canvas correctly unmounted via uc:overlay event).
  * Close button closes overlay; main page fully intact (hero, atelier, movement, featured, footer, configurator SVG all present).
  * Regression: [Re]master01 card still opens its own overlay correctly.
  * Mobile 390x844: both cards render.
  * Final `bun run lint` clean (0 errors, 0 warnings). dev.log clean.

Stage Summary:
- Dedicated, realistic 3D experience for the AP 150 Heritage "Ultra-complication Universal Calendar" added as a second full-screen overlay. 16-component procedural stainless-steel model with deep-blue sunburst dial, 4 sub-dials (date/day/month + rotating tourbillon @6), Roman numerals, Breguet rose-gold hands, onion crown, steel bracelet, visible Calibre UC-150 movement. Disassemble/assemble animation realistic (easeInOutCubic + damped follow). Experience overlay refactored into a reusable component shared with [Re]master01. Main page, configurator, ERP, and existing 3D Movement section all preserved and verified.

---
Task ID: 11
Agent: orchestrator (fix overlap + horizontal orientation)
Task: Ensure all exploded parts are non-overlapping with clear air gaps, and the assembled/exploded models are oriented horizontally (wider than tall), not vertically.

Work Log:
- Used VLM (z-ai vision) to visually inspect both models in assembled + exploded states via screenshots. Iteratively diagnosed and fixed:
  1. ChronoHand z=0.36 was intersecting the Crystal z=0.34 in assembled state → moved ChronoHand z to 0.04 (above hour hand group, below crystal).
  2. Dial exploded-z was in FRONT of hands/markers (wrong physical order) → reordered so exploded z increases front-to-back: dial(0.15) < tourbillon(0.2) < hands(0.5) < bezel(0.7) < crystal(0.9).
  3. CaseMid was a SOLID cylinder → internal parts (dial/bezel/crystal/movement) intersected it. Converted to an open-ended tube (cylinderGeometry with openEnded=true) + inner wall + thin bottom plate, so parts sit cleanly INSIDE the case ring.
  4. Movement plate radius was larger than case inner wall → geometric intersection. Reduced: UC movement 1.42→1.28, caseback 1.58→1.55; RM movement 1.28→1.18, caseback 1.42→1.39.
  5. Bezel assembled-z was inside case height → looked like bezel intersected case. Pushed bezel forward: both models bezel z 0.2→0.28, crystal z 0.44→0.5, hands z 0.26→0.32, dial z 0.14→0.2/0.24.
  6. Exploded z-distances compressed (was making the watch tall/vertical when exploded) → reduced all exploded z offsets so the exploded silhouette stays horizontal (wider than tall, ~1.5:1).
  7. Tilt reduced: both models group rotation -π/2+0.4 → -π/2+0.3 (flatter, more horizontal presentation).
- Applied fixes to BOTH UC (universal-calendar/uc-model.tsx) and RM (remaster01/remaster01-model.tsx) for consistency.
- VLM-verified all 4 states after fixes:
  * UC assembled: CLEAN (no wrong intersections)
  * UC exploded: clear air gaps, horizontal (wider than tall)
  * RM assembled: CLEAN
  * RM exploded: clear air gaps, horizontal
- Functional regression: Disassemble (slider 0→1) + Assemble (1→0) cycle works; part explorer popover opens (Calibre 4404); close returns to intact main page (hero, atelier, featured, footer all present).
- Final `bun run lint` clean (0 errors, 0 warnings). No console errors.

Stage Summary:
- Both 3D watch models (AP [Re]master01 + AP 150 Heritage Ultra-complication Universal Calendar) now: (1) oriented horizontally in both assembled and exploded states, (2) have NO geometric intersections in assembled state (case is a hollow ring, movement/caseback radii fit inside), (3) exploded layers are clearly separated with visible air gaps and stay horizontal. Verified by VLM visual inspection + functional browser tests.

---
Task ID: 12
Agent: orchestrator (remove all 3D models)
Task: Remove ALL 3D models (AP [Re]master01 + AP Universal Calendar + 3D Movement section) and their dependencies, preserving the SVG configurator + ERP system.

Work Log:
- Removed 3D component directories: src/components/remaster01/, src/components/universal-calendar/, src/components/shared/.
- Removed 3D component files: src/components/sections/movement-3d-section.tsx, src/components/sections/featured-timepiece.tsx, src/components/watch/watch-3d-model.tsx, src/components/watch/watch-3d-scene.tsx, src/components/watch/watch-3d-loader.tsx.
- Updated src/app/page.tsx: removed Movement3DSection + FeaturedTimepiece imports and usages, removed "3D Movement" and "[Re]master01" nav links, changed hero secondary CTA from "Explore the 3D movement" → "View the collection" (#collection).
- Uninstalled 3D packages: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, postprocessing.
- Verified no 3D references remain in src/ (grep for watch-3d/remaster01/universal-calendar/WatchExperience3D/Movement3DSection/FeaturedTimepiece/three/fiber/@react-three/overlay events = empty).
- Browser verification:
  * Page HTTP 200, no console errors, no WebGL/canvas (canvas count = 0).
  * SVG configurator intact (13 buttons, price $4,200 displays).
  * ERP tab works (table + 5 KPI cards render).
  * #movement and #featured sections removed (false); hero, atelier, collection, craft, erp, footer all present (true).
  * Sticky footer intact (gapBelow = 0).
  * Final `bun run lint` clean (0 errors, 0 warnings).

Stage Summary:
- ALL 3D models removed: the AP [Re]master01 experience, the AP 150 Heritage Ultra-complication Universal Calendar experience, the 3D Movement section, and the shared WatchExperience3D overlay. All three/fiber/drei/postprocessing packages uninstalled. Project now contains ONLY the SVG-based interactive watch configurator + ERP mini-system + dark luxury landing page (hero, manifesto, atelier, pillars, collection, craft, ERP note, footer). Page renders cleanly with no 3D/WebGL, no console errors, lint clean.
