// src/components/islands/BlogFilter.jsx — ported from BlogPage in App.jsx (line ~18114)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Calendar, Clock, ArrowRight } from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";
import { localizedPath } from "../../lib/localeMeta";
import { useURLFilters } from "../../hooks/useURLFilters.js";
import SkeletonImage from "./SkeletonImage.jsx";

// FIXED: was importing BLOG_POSTS directly from data/blog-posts.ts (raw
// English-only source) instead of receiving the page's already-localized
// list as a prop — same root bug as blog/index.astro and blog/[slug].astro
// (Part 1), just missed here because this component does its own data
// access instead of taking it from its parent. The blog LISTING content
// itself (not just its links) was silently staying English on every
// locale regardless of which page you were on. Also fixes the post links
// themselves, which were hardcoded to plain "/blog/slug" paths.
/**
 * @param {{ posts?: Array<Record<string, any>>, locale?: string }} props
 */
export default function BlogFilter({ posts: BLOG_POSTS = [], locale = "en" }) {
  // Tag + search round-trip through the URL (see ProductsGrid.jsx for the
  // same fix) so opening a post and hitting Back doesn't silently clear the
  // tag filter you had selected.
  const filterSchema = useMemo(
    () => [
      { key: "tag", param: "tag", default: "", parse: (raw) => raw, serialize: (v) => v || "" },
      { key: "search", param: "search", default: "", parse: (raw) => raw, serialize: (v) => v || "", debounce: true },
    ],
    [],
  );
  const { initial, sync } = useURLFilters(filterSchema);

  const [query, setQuery] = useState(initial.search);
  const [activeTag, setActiveTag] = useState(initial.tag);
  const searchRef = useRef(null);
  const q = query.trim().toLowerCase();

  useEffect(() => {
    sync({ tag: activeTag, search: query });
  }, [sync, activeTag, query]);

  const allTags = useMemo(
    () => [...new Set(BLOG_POSTS.flatMap((p) => p.tags))],
    [BLOG_POSTS],
  );

  const filtered = useMemo(() => {
    return BLOG_POSTS.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (q) {
        const hay = [p.title, p.excerpt, ...p.tags].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [BLOG_POSTS, q, activeTag]);

  const hasFilters = q !== "" || activeTag !== "";
  const clearAll = useCallback(() => {
    setQuery("");
    setActiveTag("");
    searchRef.current?.focus();
  }, []);
  const featuredPost = filtered[0] ?? null;
  const gridPosts = filtered.slice(1);

  return (
    <>
      {/* Search box — rendered inside the dark hero for prominence */}
      <div className="w-full max-w-2xl relative">
        <label htmlFor="blog-search" className="sr-only">
          Search articles
        </label>
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          id="blog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-xl pl-12 pr-12 py-4 text-base font-medium focus:outline-none focus:bg-white/20 focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Everything below gets its own light background, independent of the dark hero this is nested in */}
      <div className="bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 mt-10 pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100 shrink-0">
              <svg
                className="w-7 h-7 text-green-600"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-black text-slate-900 text-lg mb-1">
                Get new articles via WhatsApp
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Send us a WhatsApp message — we&apos;ll add you to our engineering update list. No spam,
                only 1–2 articles per month.
              </p>
            </div>
            <a
              href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent("Hi KESHAV ENTERPRISES, please add me to your engineering articles update list.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-whatsapp text-white px-6 py-3.5 rounded-xl font-black text-sm hover:bg-whatsapp-hover transition-all shadow-sm whitespace-nowrap"
            >
              Subscribe on WhatsApp
            </a>
          </div>

          {allTags.length > 0 && (
            <fieldset className="mb-10 flex flex-wrap items-center gap-2 border-0 p-0 m-0 min-w-0">
              <legend className="sr-only">Filter by topic</legend>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1 shrink-0">
                Topic:
              </span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((t) => (t === tag ? "" : tag))}
                  aria-pressed={activeTag === tag}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${activeTag === tag ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"}`}
                >
                  {tag}
                </button>
              ))}
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-slate-500 border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                >
                  <X className="w-3 h-3" aria-hidden="true" /> Clear
                </button>
              )}
            </fieldset>
          )}

          {hasFilters && (
            <p className="text-sm text-slate-500 font-medium mb-8" aria-live="polite">
              {filtered.length === 0
                ? "No articles match your search."
                : `${filtered.length} article${filtered.length === 1 ? "" : "s"} found`}
              {activeTag && (
                <span className="ml-1">
                  in <strong className="text-slate-700">{activeTag}</strong>
                </span>
              )}
              {q && (
                <span className="ml-1">
                  for <strong className="text-slate-700">&quot;{q}&quot;</strong>
                </span>
              )}
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-black text-slate-700 mb-3">No articles found</h2>
              <p className="text-slate-500 font-medium max-w-md mb-8">
                Try a different search term or remove the topic filter.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {featuredPost && (
                <article className="mb-16 group bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300 transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="h-72 lg:h-auto bg-slate-100 flex items-center justify-center relative overflow-hidden">
                      <SkeletonImage
                        src={`/${featuredPost.coverImage}`}
                        alt={featuredPost.title}
                        loading="eager"
                        width="600"
                        height="400"
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <span className="absolute top-6 left-6 bg-blue-600 text-white text-xs font-black px-3 py-1.5 uppercase tracking-widest rounded-full shadow-lg z-10">
                        {hasFilters ? "Top Result" : "Featured"}
                      </span>
                    </div>
                    <div className="p-10 lg:p-12 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-5">
                        {featuredPost.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTag((t) => (t === tag ? "" : tag));
                            }}
                            aria-pressed={activeTag === tag}
                            className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border transition-colors ${activeTag === tag ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                        <a
                          href={localizedPath(locale, `/blog/${featuredPost.slug}`)}
                          className="focus:outline-none focus-visible:underline"
                        >
                          {featuredPost.title}
                        </a>
                      </h2>
                      <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-slate-500 font-medium mb-8 flex-wrap">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" aria-hidden="true" />
                          {new Date(featuredPost.date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" aria-hidden="true" />
                          {featuredPost.readTime}
                        </span>
                      </div>
                      <a
                        href={localizedPath(locale, `/blog/${featuredPost.slug}`)}
                        className="self-start bg-blue-600 text-white px-8 py-4 rounded-xl font-black hover:bg-blue-700 transition-all shadow-sm flex items-center gap-3"
                      >
                        Read Article <ArrowRight className="w-5 h-5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              )}

              {gridPosts.length > 0 && (
                <div className="pb-16">
                  <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">
                    {hasFilters ? "More Matches" : "More Articles"}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gridPosts.map((post) => (
                      <article
                        key={post.id}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 group flex flex-col"
                      >
                        <a
                          href={localizedPath(locale, `/blog/${post.slug}`)}
                          aria-label={`Read post: ${post.title}`}
                          className="flex flex-col flex-1"
                        >
                          <div className="h-44 bg-slate-100 overflow-hidden relative">
                            <SkeletonImage
                              src={`/${post.coverImage}`}
                              alt=""
                              ariaHidden
                              width="400"
                              height="220"
                              wrapperClassName="w-full h-full"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-6 flex flex-col flex-1">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.tags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                              {post.excerpt}
                            </p>
                            <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                              Read Article <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </span>
                          </div>
                        </a>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
