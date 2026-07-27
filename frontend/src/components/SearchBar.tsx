import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import type { Ticket } from "../api/tickets";
import * as searchApi from "../api/search";

const DEBOUNCE_MS = 300;

function highlightMatch(text: string | null, query: string): string {
  if (!text || !query) return DOMPurify.sanitize(text || "");
  const escaped = DOMPurify.sanitize(text);
  const lower = escaped.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: string[] = [];
  let lastIdx = 0;
  let idx = lower.indexOf(lowerQuery, lastIdx);
  while (idx >= 0) {
    parts.push(escaped.slice(lastIdx, idx));
    parts.push(
      `<mark class="bg-accent-light text-accent rounded-sm">${escaped.slice(idx, idx + query.length)}</mark>`,
    );
    lastIdx = idx + query.length;
    idx = lower.indexOf(lowerQuery, lastIdx);
  }
  parts.push(escaped.slice(lastIdx));
  return parts.join("");
}

export default function SearchBar() {
  const { id } = useParams<{ id: string }>();
  const boardId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!boardId || !q.trim()) {
        setResults([]);
        setTotal(0);
        setIsOpen(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchApi.searchTickets(boardId, q);
        setResults(data.tickets);
        setTotal(data.total);
        setIsOpen(true);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "response" in err) {
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr.response?.status === 404) {
            setError("Board nicht gefunden.");
          } else if (axiosErr.response?.status === 403) {
            setError("Kein Zugriff.");
          } else {
            setError("Suche fehlgeschlagen.");
          }
        } else {
          setError("Suche fehlgeschlagen.");
        }
        setResults([]);
        setTotal(0);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [boardId],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (ticket: Ticket) => {
    setIsOpen(false);
    setQuery("");
    if (boardId) {
      navigate(`/boards/${boardId}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleFocus = () => {
    if (results.length > 0 || error || query.trim()) {
      setIsOpen(true);
    }
  };

  const hasBoard = boardId !== null && !isNaN(boardId);

  return (
    <div ref={containerRef} className="w-full max-w-search relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={hasBoard ? "Tickets durchsuchen..." : "Board wechseln zum Suchen"}
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        disabled={!hasBoard}
        className={`w-full border border-border-light rounded-pill px-4 py-2 text-sm min-h-[44px] bg-card_bg outline-none focus:border-accent focus:ring-3 focus:ring-accent-light transition-shadow ${
          hasBoard ? "text-fg" : "text-muted cursor-not-allowed"
        }`}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card_bg border border-border rounded-lg shadow-card-hover z-[100] max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted">Suchen...</div>
          )}

          {error && !loading && (
            <div className="px-4 py-3 text-sm text-danger">{error}</div>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted">
              Keine Ergebnisse f&uuml;r &bdquo;{DOMPurify.sanitize(query)}&rdquo;
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs text-muted border-b border-border-light">
                {total} {total === 1 ? "Ticket" : "Tickets"} gefunden
              </div>
              {results.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleSelect(ticket)}
                  className="w-full text-left px-4 py-2.5 hover:bg-accent-subtle transition-colors border-b border-border-light last:border-b-0"
                >
                  <div
                    className="text-sm font-medium text-fg truncate"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        highlightMatch(ticket.title, query),
                      ),
                    }}
                  />
                  {ticket.description && (
                    <div
                      className="text-xs text-muted mt-0.5 truncate"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          highlightMatch(ticket.description, query).slice(0, 120),
                        ),
                      }}
                    />
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
