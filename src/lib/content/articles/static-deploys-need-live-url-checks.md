---
title: "Static Deploys Need Live URL Checks"
slug: "static-deploys-need-live-url-checks"
date: "2026-07-02"
updated_date: "2026-07-02"
release_date: "2026-07-02"
release_time: "09:00"
status: "published"
draft_type: "field-note"
summary: "A SvelteKit/PHP-static deploy can pass locally and still fail on the live host. The useful release check is the public URL: root-relative assets, real nested routes, disabled third-party widgets, and computed styles."
seo_title: "Static Deploys Need Live URL Checks"
seo_description: "A practical SvelteKit/PHP-static deployment note about asset paths, nested routes, feature-gating third-party widgets, and verifying the live server instead of trusting the build alone."
tags:
  - SvelteKit
  - static sites
  - deployment
  - QA
  - frontend
  - feature flags
credits:
  - "Ryan Spice"
co_authors:
  - "OpenAI Codex|https://openai.com/codex/|Organization"
references:
  - "SvelteKit configuration|https://svelte.dev/docs/kit/configuration"
  - "SvelteKit $app/paths|https://svelte.dev/docs/kit/$app-paths"
  - "Building your app|https://svelte.dev/docs/kit/building-your-app"
---

# Static Deploys Need Live URL Checks

The most useful deployment check is often not a bigger test suite. It is opening the exact public URL that people will use.

> [!tip] Publish note
>
> This is the short version I want in the release loop: a green build proves the artifact exists; the live URL proves the host, route depth, rewrites, adapter output, feature gates, and generated links agree.

This came up on a small SvelteKit brochure site that builds cleanly into a PHP/static hosting shape. The local build passed. The homepage looked fine. Then the deployed nested pages had broken CSS.

That is the kind of bug a build can miss. The build proves that assets were produced. It does not prove the deployed host, route depth, rewrites, adapter output, and generated links all agree.

## The Failure Mode

The site had an app asset directory similar to:

```text
/_tcma_app/
```

The homepage could resolve styles, but a nested page such as:

```text
/booking/
```

was trying to interpret app assets relative to the current page depth. A stylesheet reference that behaves on `/` can become wrong under `/booking/` if the output relies on page-relative asset URLs and the host does not serve that shape.

SvelteKit gives you the pieces to control this. `kit.appDir` controls the application asset directory, and `kit.paths.relative` controls whether generated base and asset paths are relative in server-rendered HTML. Relative paths can be useful, but on a traditional static host with nested routes, root-relative paths are often the safer public contract.

The configuration shape is small:

```js
const config = {
  kit: {
    appDir: '_tcma_app',
    paths: {
      base: '',
      relative: false
    }
  }
};
```

The important part is not the exact directory name. The important part is making the URL contract explicit, then verifying the deployed HTML from a nested public route.

## Feature Gates Should Remove the Surface

The same deploy also needed a temporary feature gate for a third-party booking widget. The safe version was not just hiding a panel with CSS. The widget needed to disappear as a product surface and as a network dependency.

That means the gate controls all of this:

- the booking option card
- the target section, including `id="calendly"`
- the third-party script tag
- the inline widget element

The content config can stay boring:

```ts
export const clinic = {
  onlineBooking: {
    provider: 'Calendly',
    enabled: false,
    eventUrl: null
  }
};
```

Then the page derives whether booking exists from the config and only renders the integration when the feature is enabled.

This is a better deployment state than leaving a dead widget in the page. Search engines, accessibility tooling, privacy scans, and users all see the same truth: online booking is not currently available.

## The Check That Caught It

The release loop that mattered was simple:

1. Build the site.
2. Deploy it.
3. Fetch the live nested route.
4. Confirm the disabled widget is absent.
5. Open the live route in a browser and inspect computed styles.

The HTTP check should answer questions like:

```text
GET /booking/ -> 200
contains id="calendly" -> false
contains assets.calendly.com -> false
contains Online Booking -> false
contains call and email fallback CTAs -> true
```

The browser check should answer a different class of question:

```text
body background is the expected site color
body font is the expected production font stack
visible cards match the enabled contact options
call and email links exist
```

That computed-style check is small, but it catches the thing an HTML substring check will not: the CSS actually loaded on the live page.

## What Belongs in the Release Checklist

For SvelteKit sites deployed to non-Node or PHP/static hosting, I want this in the checklist:

- Verify at least one top-level route and one nested route on the live domain.
- Check that app asset links use the intended root-relative or base-relative form.
- Check computed styles in a real browser, not only generated HTML.
- Treat feature gates as render gates, not visual hiding.
- Confirm disabled third-party integrations do not load remote scripts.
- Confirm fallback CTAs remain present when an integration is disabled.
- Keep the deploy script boring enough that the live verification can be repeated quickly.

This does not replace typechecking, tests, or build logs. It covers the part those tools cannot see: the final contract between generated HTML and the actual public server.

Static output is still software. The release artifact is not the folder on disk. It is the live URL.
