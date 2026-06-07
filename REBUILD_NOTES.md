# ManageMoney101 Static Rebuild Notes

## Outputs

- `fbmasterclass/index.html`
- `masterclassconfirmation/index.html`
- `assets/css/styles.css`
- `assets/js/site.js`
- `assets/img/`
- `assets/masterclass-reminder.ics`

## Source Pages Captured

- `https://lwb.managemoney101.com/taxtraining`
- `https://lwb.managemoney101.com/taxtrainingconfirmation`

Original screenshots and extracted DOM/network data are saved in `captures/original/`.
Local verification screenshots and reports are saved in `captures/local/`.

## Assets

Most visible static images from the ClickFunnels pages were downloaded locally into `assets/img/`.
The rebuild intentionally removes ClickFunnels runtime bundles, New Relic, tracking scripts, FontAwesome, intl-tel-input, lazysizes, countdown libraries, and other generated page-builder code.

## Form Behavior

The live ClickFunnels hidden form endpoint is:

- `POST https://lwb.managemoney101.com/taxtraining`

The visible popup fields captured from the live page are:

- `contact[first_name]`
- `contact[email]`
- `contact[phone_number]`

The local rebuilt form preserves those field names and the popup behavior, but it submits with `GET` to `/taxtrainingconfirmation` instead of posting test contacts to the live ClickFunnels endpoint. This is the closest safe static-compatible behavior without altering live ClickFunnels data.

## Confirmation Page Behavior

The live confirmation page uses Vimeo embeds:

- `https://player.vimeo.com/video/1094113928`
- `https://player.vimeo.com/video/1094113612`
- `https://player.vimeo.com/video/1094113345`

The static rebuild preserves those Vimeo URLs behind click-to-load black video facades. This keeps the visual state close to the original black/loading video boxes while avoiding eager third-party loads.

The original AddEvent calendar widget was replaced with a local `.ics` file:

- `assets/masterclass-reminder.ics`

## Validation

- Captured original desktop/tablet/mobile screenshots for both pages.
- Captured local desktop/tablet/mobile screenshots for both pages.
- Verified the rebuilt popup opens in Chrome through Computer Use.
- Verified the rebuilt confirmation page opens directly from a `file:///` URL in Dia, so the pages can be opened from Finder without a local server.
- Verified the rebuilt confirmation page renders in Chrome through Computer Use.
- Verified the first Vimeo facade replaces itself with an embedded player when clicked.
- Verified local form submission routes to the rebuilt confirmation page.
- Lighthouse local performance:
  - `fbmasterclass`: 100
  - `masterclassconfirmation`: 100

## Known Differences

- Local form submission does not post to the live ClickFunnels contact endpoint, by design.
- Vimeo embeds are loaded on click rather than eagerly loaded on page load for performance.
- The rebuild uses lean CSS/JS and local assets rather than ClickFunnels' generated classes and scripts, so source markup is intentionally different while preserving the visible page structure.

## Finder / Direct HTML Opening

The page paths are relative, not localhost or root-relative:

- Double-click `fbmasterclass/index.html` to open the registration page.
- Double-click `masterclassconfirmation/index.html` to open the confirmation page.

The registration form action points to `/taxtrainingconfirmation`, so it also routes correctly once deployed on Vercel.
