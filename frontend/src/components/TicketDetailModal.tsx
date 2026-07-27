import { useState, useEffect, useCallback } from "react";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import type { Ticket, TicketUpdate, Comment } from "../api/tickets";
import * as ticketsApi from "../api/tickets";

const md = new MarkdownIt({ breaks: true, linkify: true });

function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(md.render(source));
}

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (data: TicketUpdate) => void;
  onDelete: () => void;
}

export default function TicketDetailModal({
  ticket,
  onClose,
  onUpdate,
  onDelete,
}: TicketDetailModalProps) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description || "");
  const [priority, setPriority] = useState(ticket.priority);
  const [dueDate, setDueDate] = useState(ticket.due_date || "");
  const [tags, setTags] = useState((ticket.tags || []).join(", "));
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    loadComments();
  }, [ticket.id]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await ticketsApi.listComments(ticket.id);
      setComments(data);
    } catch {
      // silent
    } finally {
      setLoadingComments(false);
    }
  }, [ticket.id]);

  const handleSave = () => {
    const update: TicketUpdate = {};
    if (title !== ticket.title) update.title = title;
    if (description !== (ticket.description || "")) update.description = description || null;
    if (priority !== ticket.priority) update.priority = priority;
    if (dueDate !== (ticket.due_date || "")) update.due_date = dueDate || null;
    const newTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (JSON.stringify(newTags) !== JSON.stringify(ticket.tags || [])) {
      update.tags = newTags;
    }
    if (Object.keys(update).length > 0) {
      onUpdate(update);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await ticketsApi.createComment(ticket.id, newComment.trim());
      setComments([...comments, comment]);
      setNewComment("");
    } catch {
      // silent
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await ticketsApi.deleteComment(ticket.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch {
      // silent
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-overlay backdrop-blur-[2px]" />
      <div
        className="relative bg-card_bg rounded-lg max-w-[640px] w-full max-h-[90vh] overflow-y-auto p-6 animate-[fade-in_200ms_ease-out] shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-light mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none font-semibold"
          />
          <button
            onClick={onClose}
            className="ml-3 w-8 h-8 flex items-center justify-center rounded-sm text-muted hover:text-fg hover:bg-border-light"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Priorität</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none bg-card_bg"
              >
                <option value={1}>1 - Niedrig</option>
                <option value={2}>2 - Mittel</option>
                <option value={3}>3 - Hoch</option>
                <option value={4}>4 - Sehr hoch</option>
                <option value={5}>5 - Kritisch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fälligkeitsdatum</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (kommagetrennt)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="bug, feature, urgent"
              className="w-full border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung (Markdown)</label>
            <div className="grid grid-cols-2 gap-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:border-accent focus:ring-3 focus:ring-accent-light outline-none resize-y"
                placeholder="Markdown-Beschreibung..."
              />
              <div
                className="prose prose-sm max-w-none border border-border-light rounded-md p-3 bg-bg/50 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(description || "*Keine Beschreibung*"),
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-accent text-white rounded-md py-2.5 px-5 font-medium min-h-[44px] hover:bg-accent-hover active:scale-[0.97] transition-transform duration-150"
            >
              Speichern
            </button>
            <button
              onClick={onDelete}
              className="flex-1 bg-danger text-white rounded-md py-2.5 px-5 font-medium min-h-[44px] hover:bg-[#DC2626] active:scale-[0.97] transition-transform duration-150"
            >
              Ticket löschen
            </button>
          </div>

          <div className="border-t border-border-light pt-4 mt-4">
            <h4 className="font-semibold text-sm mb-3">Kommentare ({comments.length})</h4>

            {loadingComments ? (
              <p className="text-sm text-muted">Laden...</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-sm text-muted">Noch keine Kommentare.</p>
                )}
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border border-border-light rounded-md p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted">
                        {new Date(comment.created_at).toLocaleString("de-DE")}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-muted hover:text-danger"
                      >
                        Löschen
                      </button>
                    </div>
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(comment.content),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Kommentar schreiben... (Markdown)"
                className="flex-1 border border-border rounded-md px-4 py-2.5 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none"
              />
              <button
                type="submit"
                className="bg-accent text-white rounded-md py-2.5 px-5 font-medium min-h-[44px] hover:bg-accent-hover active:scale-[0.97] transition-transform duration-150 text-sm shrink-0"
              >
                Senden
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
