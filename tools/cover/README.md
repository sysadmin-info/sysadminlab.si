# Cover renderer

Generates 1200×630 article covers (Open Graph / social) in the Sysadmin Lab
style: dark gradient on the left, `LOG #NNN` in the accent colour, title in
Chakra Petch, subtitle, and a `SYSADMIN LAB .SI` footer.

## Setup (once)

```sh
cd tools
npm install
npx playwright install --only-shell chromium
```

## Usage

```sh
cd tools
node cover/render.mjs \
  --title "Lokalny LLM jako pierwsza linia triage'u alertów" \
  --subtitle "Ollama, Zabbix i 48 godzin testów" \
  --log 1 \
  --bg ~/images/serverroom.jpg \
  --out ../content/posts/my-post/feature.png
```

| Option       | Default     | Notes                                                   |
|--------------|-------------|---------------------------------------------------------|
| `--title`    | (required)  |                                                         |
| `--subtitle` | empty       | Omitted from the layout when empty.                     |
| `--log`      | `001`       | `7` → `LOG #007`; a value starting with `LOG` is kept.  |
| `--bg`       | none        | Local image, scaled to cover. Without it: dark grid.    |
| `--out`      | `cover.png` | `.jpg` extension switches to JPEG.                      |

Fonts come from `static/fonts/`, so rendering makes no network requests.
`example.png` is a sample render without a background image.

Layout lives in `template.html`; parameters are passed via the query string
and inserted with `textContent` (no HTML injection).
