Drop real product photos here, using the exact filenames referenced in
`src/data/products.ts` (e.g. `180-gpm-lube-filter-1.webp`).

Any file placed here gets picked up automatically by
`src/lib/productImages.ts` on the next `astro build` / `astro dev` and is
served as an optimized, content-hashed AVIF. Filenames not present here yet
keep working exactly as before, served raw from `public/`.

No code changes needed as you add more files — just drop them in.
