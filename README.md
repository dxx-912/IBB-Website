# IBB — website rebuild (draft one)

A static site for **International Business for Bruins** at UCLA. No build step, no
dependencies, no framework: open `index.html` in a browser and it runs.

```
index.html      Home
team.html       Team — executive, directors, general members
clients.html    Work With Us — skills, project timeline, testimonial
join.html       Join Us — recruitment timeline, FAQ
contact.html    Contact — audience split, form

css/tokens.css      every colour, size, spacing and motion value
css/base.css        reset, typography, layout primitives, the logo mark, reveal primitives
css/components.css  nav, buttons, cards, stats, logo strip, quote, steppers, FAQ, form, footer
css/pages.css       page-level compositions built only from the above

js/main.js          nav, scroll reveals, counters, accordion, team filter, form
assets/             logo (SVG), photography, client logos, favicons, social image
```

## Running it

Double-clicking `index.html` works. To serve it locally instead:

```
python3 -m http.server 8765     # then open http://localhost:8765
```

To deploy: upload the whole folder. It is a plain static site, so Netlify, Vercel,
GitHub Pages, Cloudflare Pages or any web host will serve it as-is.

---

## Design decisions

Taken from the options in the brief.

**Colour — Direction A, Deep Navy & Warm Gold.** It is closest to the new logo's navy,
and gold was already present on the old site (the Send button, the timeline icons, the
rule inside the logo itself). Every value is a token in `css/tokens.css`; nothing
downstream hard-codes a hex.

**Type — Option 1, Fraunces + Inter.** Fraunces for H1/H2 and pull quotes, Inter for
everything else. A strict five-step scale (`--fs-display` → `--fs-xs`) is enforced
everywhere, so a page hero can never be confused with a section label.

**Spacing** is an 8px scale (`--s-1` … `--s-16`); content maxes out at 1280px
(1440px for the nav and the logo strip).

**Section rhythm** alternates white → light → navy → white → blue so no two adjacent
sections share a ground and no divider rules are needed. The last band before the
footer is never ink-navy, so the footer stays a distinct block.

**Photography** runs full-bleed in exactly two places — the homepage hero and the
"Who we are" group photo. Everywhere else is flat brand colour, which is what makes
those two moments read as deliberate.

**Motion** is scroll reveals (fade + 20px rise, staggered per row), counting stats, a
nav that solidifies on scroll, hover lifts on cards, and a wipe-in of the logo mark in
the hero. All of it is disabled under `prefers-reduced-motion`, and reveal states only
apply when JavaScript is running — if `main.js` fails to load, every page is still
complete and readable.

---

## The logo

The supplied file is white line art on a navy field, which only works on dark grounds.
Rather than ship two PNGs, the mark was **traced into SVG** and is painted with a CSS
mask, so it inherits `currentColor` and can be any brand colour at any size:

- `assets/logo/bear.svg` — full mark, continent detail intact. Used at 48px and above.
- `assets/logo/bear-simple.svg` — silhouette outlines only. Used in the nav and favicon,
  where the continent line work would disappear.
- `assets/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png` — all
  generated from the same mark.

The wordmark is **live text**, not part of the image, so it stays sharp at every size
(`.lockup` in `css/base.css`).

---

## Where the content came from

Everything factual is taken from the supplied screenshots. Names, titles, countries,
client names, testimonial text and the stats (30+ countries, 20+ majors, 100+ alumni,
50+ members, 8-week projects) are unchanged. Phrasing around them was tightened.

Photographs, client logos and the OneTrack mark were extracted from the screenshots and
standardised: every headshot is cropped to the same 4:5 frame with the face at the same
size and position, and put through one colour-grading pass. Client logos were keyed onto
pure-white plates and normalised to even optical weight.

---

## Before this goes live

Things that need a decision or an asset from IBB — none of them block review of the
design, but all of them should be settled before launch.

**1. The contact form has no backend.** It validates, then opens the visitor's mail
client pre-addressed to `ibbatucla@gmail.com`, so it is never a dead end. To collect
submissions properly, put an endpoint in `FORM_ENDPOINT` at the top of `js/main.js`
(Formspree, Basin, Netlify Forms, a Google Apps Script — any of them work). The mailing
list signup in the footer behaves the same way.

**2. The apply link points to Instagram.** The current site says the application link
lives in the Instagram bio, so that is where the Join Us CTA goes. Swap it for the real
application URL when there is one.

**3. The recruitment dates are Fall 2025**, copied verbatim from the current site. They
need replacing for the current cycle (`join.html`, the `TIMELINE` section).

**4. Replace the extracted imagery with originals.** Screenshots were the only source
available, so resolution is capped:
- *Headshots* are usable but soft at large sizes. Two also come from different shoots —
  **Alan Whitmoyer** (grey studio backdrop) and **Aidan Teeling** (warmer, brighter).
  They are the two worth reshooting first; a consistent navy duotone on hover currently
  masks most of the difference.
- *Four general members have no photograph on the current site* (Aditya Arora, Akshay
  Ashok, Aaron Knibbe, Brandon Liu) and render as monograms. Drop in photos and they
  pick up the same treatment automatically.
- *Client logos* should be swapped for vector originals. Tencent in particular is very
  small in the source.
- *A second hero-quality photograph* would let the Clients page carry one too. The old
  site's daytime skyline was unusable — the testimonial text was printed over it.

**5. Two numbers disagreed on the old site.** The homepage says "30+ countries", the
Work With Us page said "over 35 countries". The page now says "over 30" so both agree —
change it back if 35 is the accurate figure.

**6. Confirm the LinkedIn page.** Two exist:
`linkedin.com/company/international-business-for-bruins-at-ucla` (used here, matches the
current name) and `linkedin.com/company/international-bruins-in-business-at-ucla`.

---

## Accessibility

Checked and passing: every text/background pair meets WCAG AA (the lowest is 5.4:1);
semantic landmarks and a single H1 per page; a skip link; visible focus rings on every
interactive element; `aria-current` on the active nav item; `aria-expanded` /
`aria-controls` on the menu and FAQ; a live region announcing team filter results; alt
text on every meaningful image; no horizontal scroll at 375, 414, 768, 1024, 1280 or
1440px; and every control at least 44×44px on mobile.

One item from the brief was not built: **scroll-spy in the nav**. The site is five
separate pages rather than one long page, so there are no in-page sections for the nav
to track — `aria-current="page"` marks the active page instead. If a single-page section
nav is ever added, scroll-spy becomes worth having.

---

## Editing notes

- The nav and footer are repeated in each HTML file. That is normal for a static site
  with no build step, but it does mean a nav change is a five-file change.
- Adding a team member: copy an `<article class="member">` block in `team.html`, drop a
  4:5 photo into `assets/img/team/`, and give it `data-regions` (`asia`,
  `north-america`, `europe`) so the filter picks it up.
- Adding a service: copy a `.card` block. The icons are `<symbol>` elements in the
  sprite at the top of each page.
- Never hard-code a colour or a spacing value — add a token in `css/tokens.css` instead.
  Keeping that rule is what stops the site drifting back into the inconsistency the
  rebuild was meant to fix.
