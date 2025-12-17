import React, { useState, useEffect } from "react";
import "./UserList.css";

interface User {
  id: number;
  username: string;
  name: string | null;
  profilePhoto: string | null;
  bio: string | null;
  devLogCount: number;
}

interface UserListProps {
  onUserSelect: (userId: number, username: string) => void;
}

const UserList: React.FC<UserListProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3001/api";

        const response = await fetch(`${API_BASE_URL}/users`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch users");
        }

        setUsers(data.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="user-list">
        <div className="user-list__loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-list">
        <div className="user-list__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="user-list">
        <div className="user-list__empty">
          <h3>No Users Yet</h3>
          <p>Be the first to create a dev log!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="user-list__header">
        <h2>Developer Profiles</h2>
        <p>Browse dev logs from our community</p>
      </div>

      <div className="user-grid">
        {users.map((user) => (
          <div
            key={user.id}
            className="user-card"
            onClick={() => onUserSelect(user.id, user.name || user.username)}
          >
            <div className="user-card__avatar">
              <img
                src={user.profilePhoto || "/DevLogApp/apple-touch-icon (2).png"}
                alt={user.name || user.username}
              />
            </div>
            <div className="user-card__info">
              <h3>{user.name || user.username}</h3>
              <p className="user-card__username">@{user.username}</p>
              {user.bio && <p className="user-card__bio">{user.bio}</p>}
              <div className="user-card__stats">
                <span className="stat">
                  📝 {user.devLogCount}{" "}
                  {user.devLogCount === 1 ? "log" : "logs"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
