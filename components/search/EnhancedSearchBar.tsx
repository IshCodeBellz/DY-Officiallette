"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface SearchSuggestion {
  id: string;
  type: "product" | "category" | "brand" | "query";
  text: string;
  subtitle?: string;
  url: string;
  imageUrl?: string;
}

interface RecentSearch {
  query: string;
  timestamp: string;
}

interface TrendingSearch {
  query: string;
  count: number;
}

export default function EnhancedSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(true);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches and trending on mount
  useEffect(() => {
    loadRecentSearches();
    loadTrendingSearches();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search suggestions
  const debouncedGetSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setShowHistory(true);
        return;
      }

      setLoading(true);
      setShowHistory(false);

      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (e) {
        console.error("Failed to load suggestions:", e);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Load suggestions when query changes
  useEffect(() => {
    debouncedGetSuggestions(query);
    setSelectedIndex(-1);
  }, [query, debouncedGetSuggestions]);

  async function loadRecentSearches() {
    try {
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recent searches:", e);
    }
  }

  async function loadTrendingSearches() {
    try {
      const res = await fetch("/api/search/trending");
      if (res.ok) {
        const data = await res.json();
        setTrendingSearches(data.trending || []);
      }
    } catch (e) {
      console.error("Failed to load trending searches:", e);
    }
  }

  function saveRecentSearch(searchQuery: string) {
    if (!searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      query: searchQuery.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [
      newSearch,
      ...recentSearches.filter((s) => s.query !== newSearch.query),
    ].slice(0, 10);

    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }

  function handleSearch(searchQuery?: string) {
    const searchTerm = searchQuery || query;
    if (!searchTerm.trim()) return;

    saveRecentSearch(searchTerm);
    setIsOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = showHistory
      ? [
          ...recentSearches.map((s) => ({ query: s.query })),
          ...trendingSearches.map((s) => ({ query: s.query })),
        ]
      : suggestions;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (showHistory) {
          const item = items[selectedIndex] as { query: string };
          handleSearch(item.query);
        } else {
          const suggestion = suggestions[selectedIndex];
          if (
            suggestion.type === "product" ||
            suggestion.type === "category" ||
            suggestion.type === "brand"
          ) {
            router.push(suggestion.url);
            setIsOpen(false);
          } else {
            handleSearch(suggestion.text);
          }
        }
      } else {
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleSuggestionClick(suggestion: SearchSuggestion) {
    if (
      suggestion.type === "product" ||
      suggestion.type === "category" ||
      suggestion.type === "brand"
    ) {
      router.push(suggestion.url);
    } else {
      handleSearch(suggestion.text);
    }
    setIsOpen(false);
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for items, brands, and more..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 pl-12 pr-12 text-sm border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-4 h-4 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-neutral-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-400 mx-auto"></div>
            </div>
          )}

          {/* Suggestions */}
          {!loading && !showHistory && suggestions.length > 0 && (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-3 ${
                    selectedIndex === index ? "bg-neutral-50" : ""
                  }`}
                >
                  {suggestion.imageUrl && (
                    <img
                      src={suggestion.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {suggestion.text}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-xs text-neutral-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-neutral-400 capitalize">
                      {suggestion.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent and Trending Searches */}
          {!loading && showHistory && (
            <div className="py-2">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h3 className="text-sm font-medium text-neutral-700">
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={search.timestamp}
                      onClick={() => handleSearch(search.query)}
                      className={`w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-3 ${
                        selectedIndex === index ? "bg-neutral-50" : ""
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-neutral-700">
                        {search.query}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches */}
              {trendingSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 border-b">
                    <h3 className="text-sm font-medium text-neutral-700">
                      Trending Searches
                    </h3>
                  </div>
                  {trendingSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={search.query}
                      onClick={() => handleSearch(search.query)}
                      className={`w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-3 ${
                        selectedIndex === recentSearches.length + index
                          ? "bg-neutral-50"
                          : ""
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      <span className="text-sm text-neutral-700">
                        {search.query}
                      </span>
                      <span className="text-xs text-neutral-400">
                        ({search.count})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {recentSearches.length === 0 && trendingSearches.length === 0 && (
                <div className="px-4 py-8 text-center text-neutral-500">
                  <p className="text-sm">Start typing to see suggestions</p>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!loading &&
            !showHistory &&
            suggestions.length === 0 &&
            query.trim() && (
              <div className="px-4 py-8 text-center text-neutral-500">
                <p className="text-sm">No suggestions found</p>
                <button
                  onClick={() => handleSearch()}
                  className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
                >
                  Search for "{query}"
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
