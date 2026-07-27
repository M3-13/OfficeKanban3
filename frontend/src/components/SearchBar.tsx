export default function SearchBar() {
  return (
    <div className="w-full max-w-search">
      <input
        type="text"
        placeholder="Suche..."
        disabled
        className="w-full border border-border-light rounded-pill px-4 py-2 text-sm min-h-[44px] bg-card_bg text-muted cursor-not-allowed"
      />
    </div>
  );
}
