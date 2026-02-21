export function SearchBar({ query, onSearch, inputRef }) {
  return (
    <div class="search-bar">
      <span class="search-icon">/</span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onInput={(e) => onSearch(e.target.value)}
        placeholder="Search entries..."
      />
    </div>
  )
}
