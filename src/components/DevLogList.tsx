import React, { useState, useEffect } from "react";
import { devLogApi, type DevLogEntry } from "../lib/api";
import "./DevLogList.css";

interface User {
  id: number;
  username: string;
}

interface DevLogListProps {
  userId?: number;
  username?: string;
  user?: User | null;
  onEdit?: (entry: DevLogEntry) => void;
  onRefresh?: () => void;
}

const DevLogList: React.FC<DevLogListProps> = ({
  userId,
  username,
  user,
  onEdit,
  onRefresh,
}) => {
  const [devLogs, setDevLogs] = useState<DevLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDevLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const filters: any = { published: true };
      if (userId) {
        filters.userId = userId;
      }
      const { entries } = await devLogApi.getAll(filters);
      setDevLogs(entries);
    } catch (err) {
      console.error("Error fetching dev logs:", err);
      setError("Failed to load dev logs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevLogs();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTags = (tags: string | null) => {
    if (!tags) return [];
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  };

  const handleDelete = async (id: number, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await devLogApi.delete(id);
      // Refresh the list
      await fetchDevLogs();
      onRefresh?.();
    } catch (err) {
      console.error("Error deleting dev log:", err);
      alert("Failed to delete dev log. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="devlog-list">
        <div className="devlog-list__loading">
          <div className="spinner"></div>
          <p>Loading dev logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="devlog-list">
        <div className="devlog-list__error">
          <p>{error}</p>
          <button onClick={fetchDevLogs} className="btn btn--retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (devLogs.length === 0) {
    return (
      <div className="devlog-list">
        {username && (
          <div className="devlog-list__header">
            <h2>{username}'s Dev Logs</h2>
          </div>
        )}
        <div className="devlog-list__empty">
          <h3>No Dev Logs Yet</h3>
          <p>
            {username
              ? `${username} hasn't published any dev logs yet.`
              : "Start documenting your development journey by creating your first entry!"}
          </p>
        </div>
      </div>
    );
  }

  // Separate user's own posts from others' posts
  const userPosts = user
    ? devLogs.filter((log) => log.author?.id === user.id)
    : [];
  const otherPosts = user
    ? devLogs.filter((log) => log.author?.id !== user.id)
    : devLogs;

  const renderDevLogCard = (log: DevLogEntry, isOwnPost: boolean) => {
    const authorName = log.author
      ? `${log.author.firstName} ${log.author.lastName}`
      : "Unknown Author";

    return (
      <article key={log.id} className="devlog-card">
        <div className="devlog-card__header">
          <h3 className="devlog-card__title">{log.title}</h3>
          <div className="devlog-card__author">
            {log.author?.profilePhoto && (
              <img
                src={log.author.profilePhoto}
                alt={authorName}
                className="devlog-card__author-photo"
              />
            )}
            <span className="devlog-card__author-name">by {authorName}</span>
          </div>
          <time className="devlog-card__date" dateTime={log.createdAt}>
            {log.createdAt && formatDate(log.createdAt)}
          </time>
        </div>

        <div className="devlog-card__content">
          <p>{log.content}</p>
        </div>

        {log.tags && (
          <div className="devlog-card__tags">
            {formatTags(log.tags).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="devlog-card__footer">
          <span className="devlog-card__status">
            {log.isPublished ? "✓ Published" : "📝 Draft"}
          </span>
          {isOwnPost && (
            <div className="devlog-card__actions">
              <button
                onClick={() => onEdit?.(log)}
                className="btn-edit"
                disabled={deletingId === log.id}
                title="Edit this entry"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(log.id!, log.title)}
                className="btn-delete"
                disabled={deletingId === log.id}
                title="Delete this entry"
              >
                {deletingId === log.id ? "Deleting..." : "🗑️ Delete"}
              </button>
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="devlog-list">
      {username && (
        <div className="devlog-list__header">
          <h2>{username}'s Dev Logs</h2>
          <span className="devlog-list__count">
            {devLogs.length} {devLogs.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      )}
      {!username && (
        <div className="devlog-list__header">
          <h2>Dev Log Entries</h2>
          <span className="devlog-list__count">
            {devLogs.length} {devLogs.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      )}

      {/* User's own posts section */}
      {userPosts.length > 0 && (
        <div className="devlog-list__section devlog-list__section--own">
          <h3 className="devlog-list__section-title">Your Posts</h3>
          <div className="devlog-list__grid">
            {userPosts.map((log) => renderDevLogCard(log, true))}
          </div>
        </div>
      )}

      {/* Other users' posts section */}
      {otherPosts.length > 0 && (
        <div className="devlog-list__section devlog-list__section--others">
          {userPosts.length > 0 && (
            <h3 className="devlog-list__section-title">Community Posts</h3>
          )}
          <div className="devlog-list__grid">
            {otherPosts.map((log) => renderDevLogCard(log, false))}
          </div>
        </div>
      )}
    </div>
  );
};
export default DevLogList;
