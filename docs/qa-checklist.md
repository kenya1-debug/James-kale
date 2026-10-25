# Quality checklist: run before launch

Run a production build (`LOW_MEMORY=1 NODE_OPTIONS=--max-old-space-size=2048 npm run build && npm start`), then test at http://localhost:3000. Do not run the dev server at the same time.

## Lighthouse (Chrome DevTools → Lighthouse → Mobile → Navigation)
Test each of: `/`, `/practice-areas/conveyancing-land-law`, `/insights/why-write-a-will`, `/book-a-consultation`, `/contact`.
Target: 95+ in Performance, Accessibility, Best Practices and SEO. Run it in a private window with extensions off, because extensions skew scores.
If Performance is below 95: check the "Largest Contentful Paint element" and "Properly size images" items first.
Scores from localhost are optimistic. Repeat on the live Vercel URL using PageSpeed Insights (pagespeed.web.dev).

## Keyboard and screen reader (10 minutes)
- Tab through the home page: the first Tab stop is "Skip to content", focus is always visible, and the order follows the page.
- Open the mobile menu with Enter, close it with Escape.
- Complete the booking form using only the keyboard (arrow keys choose a practice area and a time).
- Zoom the browser to 200%: nothing overlaps or disappears.
- Switch on "Reduce motion" in your operating system: animations stop.

## Small phones
Open DevTools device mode at 320 px wide: no sideways scrolling, buttons are easy to tap, the sticky call and WhatsApp bar does not cover the cookie banner or form buttons.

## Slow connection
DevTools → Network → throttle to "Slow 4G". The text and hero must appear without waiting for scripts, and the page below the hero must be visible even before it animates.

## Structured data and sharing
- Paste the live home page, a practice area and an article into search.google.com/test/rich-results: expect valid LegalService, FAQPage, BreadcrumbList and Article items.
- Check `/sitemap.xml` and `/robots.txt` open and list the pages.
- Share a page link in WhatsApp: the preview should show the title, description and the green card image.

## Security
- With a production build, open DevTools → Console on every page type: no "Content Security Policy" violation messages. If any appear, tell me the blocked address.
- `/admin` must redirect to the login page when signed out.
- Securityheaders.com (after deployment): aim for grade A or A+.
