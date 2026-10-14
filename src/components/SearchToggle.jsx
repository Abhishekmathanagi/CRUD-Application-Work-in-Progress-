import { useEffect, useRef } from "react";

export default function SearchToggle({ enabled, onToggle, query, onQueryChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (enabled) inputRef.current?.focus();
  }, [enabled]);

  return (
    <div className="search">
      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label="Enable search"
        />
        <span className="slider" />
        <span className="switch-label">Search</span>
      </label>

      {enabled && (
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Search by name or ID…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search items"
        />
      )}
    </div>
  );
}
