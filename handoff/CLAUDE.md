# Halal Living — project guide

Halal Living is a city guide to halal restaurants and masjids in **Chennai, Mumbai, Bangalore and Hyderabad**. It is a subdomain of Living Collective (livingcollective.net) and is client work. The store lives at livingcollective.store.

**Status:** this is a polished, fully working **prototype**. It is the visual and interaction spec for the live site, not production code (see "Before going live").

**Mobile comes first.** Most visitors are on phones, so the mobile experience wins any trade-off. Desktop comes second.

---

## Files

```
index.html             The whole app in one file (~1.7 MB).
pwa/                   Files needed to install it as an app. Put them next to index.html on the server.
  manifest.webmanifest   App name, theme colour #B94421, opens full screen
  sw.js                  Offline helper (caches the app shell)
  icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
tools/                 Test and edit helpers (Python and Playwright), see "Checking changes"
CLAUDE.md              This file
```

When hosting, serve `index.html` and everything in `pwa/` from the **same folder** over HTTPS (manifest, sw.js and icons go at the same level as the page).

---

## How index.html is built

- **Runtime.** A small custom "dc" runtime renders templates with React 18.3.1. React and Babel are loaded from unpkg at runtime, so there is no build step.
- **Main page.** One `<template data-dc-src><x-dc>…</x-dc></template>` holds the markup. Its logic is the `<script type="text/x-dc" data-dc-script>` block, a `class Component extends DCLogic` whose `renderVals()` returns every `{{ value }}` the template uses.
- **Template syntax:**
  - `{{ x }}` inserts a value
  - `<sc-if value="{{ cond }}">` shows something conditionally
  - `<sc-for list="{{ arr }}" as="item">` repeats something
  - `sc-camel-on-click="{{ fn }}"` attaches an event
  - `style-hover="…"` and `style-active="…"` set hover and pressed styles
  - `<sc-raw-select>` is a native select
- **Detail pages.** The restaurant and masjid pages are **separate dc pages stored as base64** in `window.__resources` under the keys `"./Restaurant%20Detail.dc.html"` and `"./Masjid%20Detail.dc.html"`. To edit one:
  ```
  python3 tools/detail_pages.py unpack   # gives you detail/Restaurant.dc.html and detail/Masjid.dc.html
  # edit them
  python3 tools/detail_pages.py pack     # puts them back (keeps index.html.bak)
  ```
- **Two layouts per screen.** Mobile and desktop are separate templates in the same file. The switch is at **1100px**: below it `isMob` is true and the phone layout shows, including on tablets. A change to one layout usually needs the same change in the other.
- **Clickable divs and spans.** These automatically become accessible buttons (the `installA11y` wrapper adds `role="button"`, `tabindex` and Enter/Space). Setting your own `role` or `tabIndex` turns this off.
- **Plain-JS add-ons near the end of the file:**
  - `#hl-pwa`: the install sheet, the service-worker registration and `window.hlInstall()`
  - `#hl-appcard`: CSS for the animated install card
  - `#hl-gutter`: page gutters and the glass card styles

### Pages and links

The address after `#` decides the page.

| Address | Page |
|---|---|
| `#/chennai` | City home page |
| `#/chennai/restaurants`, `#/chennai/masjids` | Lists (search, area filter, sort, women's-area switch on masjids) |
| `#/chennai/restaurants/<slug>`, `#/chennai/masjids/<slug>` | Detail pages (slug = lower-case name with dashes) |
| anything else | "Page not found" page with a city picker |

The same pattern works for `mumbai`, `bangalore` and `hyderabad`.

---

## Design system

- **Font:** Figtree (embedded), weights 400–900. Headings 800–900 with tight letter-spacing.
- **City themes** (`Component.THEMES`); every accent follows the selected city:

  | City | Brand colour (`btn`) | `tint` | `soft` |
  |---|---|---|---|
  | Chennai | `#B94421` | `#FAEDE8` | `#F0CFC2` |
  | Mumbai | `#5A2FAC` | `#EFEAF8` | `#D6CBEE` |
  | Bangalore | `#45A34D` | `#ECF6ED` | `#CBE7CE` |
  | Hyderabad | `#09AAAC` | `#E5F6F6` | `#BDE8E8` |

  Neutrals: ink `#1C1C1C`, muted text `#696F6A`, lines `#E2E2DE` / `#ECECEA`, "verified" green `#1F6B12`.
- **Shapes:** pills (`border-radius:999px`) for buttons and chips; cards use 18–30px radius; mobile sheets use 26–28px top corners.
- **Patterns already in place:**
  - **Hero areas:** the theme colour with a star pattern at low opacity (detail pages have their own pattern).
  - **Community cards:** glass (`.hl-glass`), faint at rest and frosted on hover.
  - **Restaurant verification:** the "Halal Living Verified" seal, a scalloped badge with spinning ring text on desktop and a compact pill on mobile.
  - **Mobile detail pages (restaurant and masjid):**
    - The reel fills the screen and stays in place.
    - A white drawer peeks up with the name and key facts.
    - Swipe up, or tap the handle, to pull the drawer over the reel.
  - **Desktop masjid page:** a grid of hero card (amenities as chips) | reel; a full-width map under the hero; the photos card under the reel (3×2 square photos). The reel is exactly the same height as on the restaurant page.
  - **Mobile bottom bar:** Home · Food · Masjids · **Masjid locator** (a pill-shaped button in the theme colour, on the right).
  - **Mobile list filters:** one row with the area dropdown, the "Women's area" switch (masjids only) and sort as an icon button.
  - **Install:**
    - "Get the app" button in the desktop top bar.
    - Animated install card on the mobile home page: the icon drops onto a phone, then the animation rests for 5 seconds before replaying.
    - Install sheet: one tap hands over to the browser's install on Android and desktop; iPhone gets numbered steps.
- **Accessibility:** every pop-up closes with Escape, all controls have accessible names, and place cards use `role="article"` with the place name as the keyboard target. axe-core (WCAG A/AA) passes except for white text on the Bangalore green and Hyderabad teal, which the client chose to keep.

---

## Data and privacy (prototype)

The forms save to **claude.ai's storage**, which only exists inside the claude.ai preview.

| Collection | Contents | Who can read it |
|---|---|---|
| `community/{user}` | Masjids people added (name, area, map link, facilities). **No personal data.** | Anyone viewing |
| `contacts/{user}` | The name and email sent with each suggestion | Only that person and the site owner |
| `subscribers/{user}` | Email sign-ups (name, email, city, restaurants/masjids) | Only that person and the site owner |

Suggestions are limited to 5 per person per day. Emails are checked with a regex. Inputs are trimmed and length-capped.

---

## Decisions already made by the client

- Email updates: **Resend**, a **monthly digest per city** with topics New restaurants / New masjids. The sender address is still to come from the client.
- Ad enquiry form: stays a demo until the live build; it saves nothing.
- City colours stay as they are, even though Bangalore and Hyderabad fail contrast checks.
- The floating "Stay updated" button on desktop stays as it is.
- The list pages have no subtitle under the heading.
- The background pattern stays on all hero areas (removing it was tried and reverted).

---

## Before going live

1. **Real data:** listings, ratings, reviews, hours, photos, reels, visit counts, store products. Add an "added on" date for the monthly digest.
2. **Backend:** replace the claude.ai storage (`window.claude` db) with a real database or API for suggestions and sign-ups. Add a server step that sends sign-ups to Resend, plus a scheduled monthly send.
3. **Real links:** Google Maps, phone numbers, review links, ads, social links, and the Privacy and Terms text.
4. **Hosting:** HTTPS on the Halal Living subdomain with the `pwa/` files next to the page.
5. **Search and sharing:** page titles and descriptions, and share images.
6. **Analytics.**
7. **Test on real phones:** iPhone and Android, especially the drawer swipe and installing the app.

**Recommended:** rebuild in a standard stack (e.g. Next.js or Vite + React) using this file as the visual spec. That gives real components and a shared style system, proper page addresses per place (indexable by Google), no in-browser Babel, data loaded from an API, and tests. Vercel is available for deployment.

---

## Checking changes

Needs Python 3, `pip install playwright`, Chromium (`python -m playwright install chromium`), and for the accessibility check `npm i axe-core@4.10.2`. Run the tools from the project folder; screenshots go to `audit-out/`.

```
python3 tools/one.py '#/chennai/masjids/masjid-rahmaniya' 390 844 audit-out/x.png   # one screenshot
python3 tools/sweep.py        # home page at 9 sizes: console errors and sideways scrolling
python3 tools/flows.py "['chennai','mumbai','bangalore','hyderabad']" "[(390,844),(1366,900)]" RUN
python3 tools/inter.py 390 844 m     # clicks through the mobile flows (search, city switch, map, reels, forms, install, bottom bar, back)
python3 tools/inter.py 1366 900 d    # the same on desktop
AXE_JS=node_modules/axe-core/axe.min.js python3 tools/axe.py   # WCAG A/AA check
```

Before publishing, test at these sizes: **360, 390 (phones), 844×390 (phone landscape), 768, 1024 (tablets), 1100 (the switch-over), 1366, 1440, 1920.** Expect no console errors and no sideways scrolling, and check all four cities.
