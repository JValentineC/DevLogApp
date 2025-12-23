import { useState, useEffect } from "react";
import "./DeveloperDashboard.css";

interface LogEntry {
  timestamp: string;
  message: string;
  level: string;
}

interface TableStats {
  tableName: string;
  rowCount: number;
  dataSize: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  recentSignups: number;
}

const DeveloperDashboard = () => {
  const [activeTab, setActiveTab] = useState<
    "logs" | "queries" | "stats" | "users" | "export"
  >("logs");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedQuery, setSelectedQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "https://devlogs-api.nfshost.com/api";

  const predefinedQueries = [
    { id: "recent-users", name: "Recent Users (Last 7 Days)" },
    { id: "active-sessions", name: "Active Sessions Today" },
    { id: "popular-tags", name: "Most Popular Tags" },
    { id: "user-activity", name: "User Activity Summary" },
    { id: "error-logs", name: "Recent Error Logs" },
  ];

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/logs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs || []);
      } else {
        setError(data.error || "Failed to fetch logs");
      }
    } catch (err) {
      setError("Error fetching logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/table-stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTableStats(data.stats || []);
      } else {
        setError(data.error || "Failed to fetch table stats");
      }
    } catch (err) {
      setError("Error fetching table stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/user-stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUserStats(data);
      } else {
        setError(data.error || "Failed to fetch user stats");
      }
    } catch (err) {
      setError("Error fetching user stats");
    } finally {
      setLoading(false);
    }
  };

  const runPredefinedQuery = async () => {
    if (!selectedQuery) return;

    setLoading(true);
    setError("");
    setQueryResult(null);
    try {
      const response = await fetch(`${API_URL}/admin/query/${selectedQuery}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setQueryResult(data);
      } else {
        setError(data.error || "Failed to run query");
      }
    } catch (err) {
      setError("Error running query");
    } finally {
      setLoading(false);
    }
  };

  const restartServer = async () => {
    if (!confirm("Are you sure you want to restart the server?")) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/restart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        alert("Server restart initiated. It may take 10-30 seconds.");
      } else {
        setError(data.error || "Failed to restart server");
      }
    } catch (err) {
      setError("Error restarting server");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/export/${type}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `devlogs-${type}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to export data");
      }
    } catch (err) {
      setError("Error exporting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") fetchLogs();
    else if (activeTab === "stats") fetchTableStats();
    else if (activeTab === "users") fetchUserStats();
  }, [activeTab]);

  return (
    <div className="developer-dashboard">
      <div className="dashboard-header">
        <h1>🛠️ Developer Dashboard</h1>
        <p>Super Admin Control Panel</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === "logs" ? "active" : ""}
          onClick={() => setActiveTab("logs")}
        >
          📋 Server Logs
        </button>
        <button
          className={activeTab === "queries" ? "active" : ""}
          onClick={() => setActiveTab("queries")}
        >
          🔍 Queries
        </button>
        <button
          className={activeTab === "stats" ? "active" : ""}
          onClick={() => setActiveTab("stats")}
        >
          📊 Table Stats
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👥 User Analytics
        </button>
        <button
          className={activeTab === "export" ? "active" : ""}
          onClick={() => setActiveTab("export")}
        >
          💾 Export Data
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-content">
        {activeTab === "logs" && (
          <div className="logs-panel">
            <div className="panel-header">
              <h2>Server Logs (Last 100 lines)</h2>
              <button onClick={fetchLogs} disabled={loading}>
                🔄 Refresh
              </button>
            </div>
            <div className="logs-container">
              {logs.length === 0 && !loading && <p>No logs available</p>}
              {logs.map((log, idx) => (
                <div key={idx} className={`log-entry ${log.level}`}>
                  <span className="log-timestamp">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
              {loading && <p>Loading logs...</p>}
            </div>
          </div>
        )}

        {activeTab === "queries" && (
          <div className="queries-panel">
            <div className="panel-header">
              <h2>Predefined Queries</h2>
            </div>
            <div className="query-selector">
              <select
                value={selectedQuery}
                onChange={(e) => setSelectedQuery(e.target.value)}
              >
                <option value="">Select a query...</option>
                {predefinedQueries.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
              <button
                onClick={runPredefinedQuery}
                disabled={!selectedQuery || loading}
              >
                ▶ Run Query
              </button>
            </div>
            {queryResult && (
              <div className="query-results">
                <h3>Results:</h3>
                <pre>{JSON.stringify(queryResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="stats-panel">
            <div className="panel-header">
              <h2>Database Table Statistics</h2>
              <button onClick={fetchTableStats} disabled={loading}>
                🔄 Refresh
              </button>
            </div>
            <div className="stats-grid">
              {tableStats.map((stat) => (
                <div key={stat.tableName} className="stat-card">
                  <h3>{stat.tableName}</h3>
                  <div className="stat-value">
                    {stat.rowCount.toLocaleString()}
                  </div>
                  <div className="stat-label">rows</div>
                  <div className="stat-size">{stat.dataSize}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-panel">
            <div className="panel-header">
              <h2>User Analytics</h2>
              <button onClick={fetchUserStats} disabled={loading}>
                🔄 Refresh
              </button>
            </div>
            {userStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <div className="stat-value">{userStats.totalUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Active Users (7d)</h3>
                  <div className="stat-value">{userStats.activeUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Admins</h3>
                  <div className="stat-value">{userStats.adminUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Recent Signups (30d)</h3>
                  <div className="stat-value">{userStats.recentSignups}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "export" && (
          <div className="export-panel">
            <div className="panel-header">
              <h2>Export Data</h2>
            </div>
            <div className="export-options">
              <div className="export-card">
                <h3>📄 Export Users</h3>
                <p>Download all user data as CSV</p>
                <button onClick={() => exportData("users")} disabled={loading}>
                  Download CSV
                </button>
              </div>
              <div className="export-card">
                <h3>📝 Export Dev Logs</h3>
                <p>Download all dev log entries as CSV</p>
                <button
                  onClick={() => exportData("devlogs")}
                  disabled={loading}
                >
                  Download CSV
                </button>
              </div>
              <div className="export-card">
                <h3>👤 Export Person Data</h3>
                <p>Download Person table data as CSV</p>
                <button
                  onClick={() => exportData("persons")}
                  disabled={loading}
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <div className="danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <button
            className="restart-button"
            onClick={restartServer}
            disabled={loading}
          >
            🔄 Restart Server
          </button>
          <p className="warning-text">
            This will restart the backend server. Users may experience a brief
            interruption.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
