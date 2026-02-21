export function SearchBar({ query, onSearch }) {
  return (
    <div class="search-bar">
      <span class="search-icon">/</span>
      <input
        type="text"
        value={query}
        onInput={(e) => onSearch(e.target.value)}
        placeholder="Search entries..."
      />
    </div>
  )
}
