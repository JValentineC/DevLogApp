import React, { useState, useEffect } from "react";
import { devLogApi } from "../lib/api";
import "./DevLogList.css";

interface DevLog {
  id: number;
  title: string;
  content: string;
  tags: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const DevLogList: React.FC = () => {
  const [devLogs, setDevLogs] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchDevLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const { entries } = await devLogApi.getAll({ published: true });
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
  }, []);

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
        <div className="devlog-list__empty">
          <h3>No Dev Logs Yet</h3>
          <p>
            Start documenting your development journey by creating your first
            entry!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="devlog-list">
      <div className="devlog-list__header">
        <h2>Dev Log Entries</h2>
        <span className="devlog-list__count">
          {devLogs.length} {devLogs.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="devlog-list__grid">
        {devLogs.map((log) => (
          <article key={log.id} className="devlog-card">
            <div className="devlog-card__header">
              <h3 className="devlog-card__title">{log.title}</h3>
              <time className="devlog-card__date" dateTime={log.createdAt}>
                {formatDate(log.createdAt)}
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
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default DevLogList;
