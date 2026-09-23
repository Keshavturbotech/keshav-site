/* global process */
// src/lib/fastImageService.mjs
//
// Astro's built-in sharp service, with one change: AVIF encoding uses a lower
// libaom/libavif "effort" (speed) setting.
//
// Why: sharp's default AVIF effort is 4, which is very slow. With ~2,700
// product-image variants (see src/lib/productImages.ts) the image step alone
// pushed the Cloudflare Pages build past its 20-minute limit
// ("Build took too long and was timed out"). Effort 2 encodes several times
// faster for a small size increase at the same visual quality (quality stays
// at whatever the caller asks for — 90 in productImages.ts).
//
// Override with the AVIF_EFFORT env var (0 = fastest/biggest … 9 = slowest/smallest).
// Anything that isn't AVIF is passed straight through to Astro's stock service.

import sharpService from "astro/assets/services/sharp";
import sharp from "sharp";

const parsed = Number(process.env.AVIF_EFFORT);
const AVIF_EFFORT =
  Number.isInteger(parsed) && parsed >= 0 && parsed <= 9 ? parsed : 2;

const fitMap = {
  fill: "fill",
  contain: "inside",
  cover: "cover",
  none: "outside",
  "scale-down": "inside",
  outside: "outside",
  inside: "inside",
};

export default {
  ...sharpService,
  async transform(inputBuffer, transformOptions, config) {
    if (transformOptions.format !== "avif") {
      return sharpService.transform(inputBuffer, transformOptions, config);
    }

    const pipeline = sharp(inputBuffer, {
      failOnError: false,
      limitInputPixels: config.service.config.limitInputPixels,
    }).rotate();

    // Same resize rules as Astro's stock sharp service. (Astro passes BOTH
    // width and height for srcset variants, so this can't be width-only.)
    const t = transformOptions;
    const withoutEnlargement = Boolean(t.fit);
    const kernel = config.service.config.kernel;
    if (t.width && t.height && t.fit) {
      pipeline.resize({
        width: Math.round(t.width),
        height: Math.round(t.height),
        kernel,
        fit: fitMap[t.fit] ?? "inside",
        position: t.position,
        withoutEnlargement,
      });
    } else if (t.height && !t.width) {
      pipeline.resize({
        height: Math.round(t.height),
        kernel,
        withoutEnlargement,
      });
    } else if (t.width) {
      pipeline.resize({
        width: Math.round(t.width),
        kernel,
        withoutEnlargement,
      });
    }
    if (transformOptions.background) {
      pipeline.flatten({ background: transformOptions.background });
    }

    const q = Number(transformOptions.quality);
    pipeline.avif({
      quality: Number.isFinite(q) && q > 0 ? q : undefined,
      effort: AVIF_EFFORT,
    });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), format: info.format };
  },
};
