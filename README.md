# Crossroads — paper website

A small, static, single-page site for the public release of *Crossroads: A Smart
Contract Layer for Chain-Abstracted Assets*. No build step, no dependencies — plain
HTML/CSS/vanilla JS in the Cast Iron house style, with four interactive figures.

## Files
- `index.html` — all page content
- `style.css` — design system (warm paper + teal/indigo accent)
- `logo.svg` — hub-and-spoke mark / favicon
- `flow.js` — figure: animated deposit → trade → withdraw walkthrough
- `swap.js` — figure (the motivation): cross-chain swap route + fee-cost comparison (dropdowns + presets)
- `apps.js` — figure: applications explorer (filterable, click to expand)

## Preview locally
```sh
cd crossroads_website
python3 -m http.server 8000
# open http://localhost:8000
```
(Opening `index.html` directly works too; a server just matches production exactly.)

## Deploy
Any static host works — GitHub Pages, Netlify, Vercel, S3, or `secure-governance.com/crossroads/`.
Just upload the folder.

## ⚠️ Fill in before release (search `TODO` in index.html)
1. **Read the paper** button → set `href` to the hosted PDF (e.g. arXiv link, or drop
   `Crossroads.pdf` in this folder — the button already points there).
2. **Code** button → set `href` to the de-anonymized public repo (currently `#`).
3. **Author links** in the hero are guesses — verify/replace the three `href`s
   (James Austgen, Dani Vilardell, Ari Juels).
4. **BibTeX** in the Cite section — update once you have final venue/eprint details.
