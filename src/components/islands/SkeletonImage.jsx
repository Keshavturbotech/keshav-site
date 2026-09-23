// src/components/islands/SkeletonImage.jsx
// Small shared <img> wrapper: shows a pulsing skeleton behind the image until
// it's known to have loaded, fades the image in on load, and simply removes
// itself (skeleton included) on error — so a missing/broken image file never
// flashes the browser's broken-image glyph, it just quietly disappears.
import { useState } from "react";

export default function SkeletonImage({
  src,
  srcSet,
  sizes,
  alt = "",
  className = "",
  wrapperClassName = "",
  skeletonClassName = "bg-slate-200",
  loadedClassName = "opacity-100",
  unloadedClassName = "opacity-0",
  width,
  height,
  loading = "lazy",
  decoding = "async",
  ariaHidden = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) return null;

  return (
    <div className={`relative ${wrapperClassName}`}>
      {!loaded && (
        <div className={`absolute inset-0 animate-pulse ${skeletonClassName}`} aria-hidden="true" />
      )}
      <img
        // The <img> is already in the server-rendered HTML with its real src,
        // so the browser can finish loading (or fail) it before React
        // hydrates and attaches onLoad/onError — that event fires into a
        // void, leaving `loaded` stuck at false forever (skeleton never
        // clears). This ref checks img.complete the instant the node mounts,
        // catching images that already resolved pre-hydration.
        ref={(node) => {
          if (!node || !node.complete) return;
          if (node.naturalWidth > 0) setLoaded(true);
          else setErrored(true);
        }}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        aria-hidden={ariaHidden || undefined}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        className={`relative transition-opacity duration-300 ${className} ${loaded ? loadedClassName : unloadedClassName}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
