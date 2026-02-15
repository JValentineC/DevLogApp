import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface RandomUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  devLogCount: number;
}

interface AboutProps {
  user?: {
    id: number;
    username: string;
    email?: string;
    name?: string;
    profilePhoto?: string;
    bio?: string;
    role?: "user" | "admin" | "super_admin";
  } | null;
  onNavigateToProfile?: () => void;
}

const About: React.FC<AboutProps> = ({ user, onNavigateToProfile }) => {
  const navigate = useNavigate();
  const [randomUsers, setRandomUsers] = useState<RandomUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchRandomUsers = async () => {
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3001/api";
        const response = await fetch(`${API_BASE_URL}/users/random?limit=5`);
        const data = await response.json();

        if (response.ok && data.users) {
          setRandomUsers(data.users);
        }
      } catch (error) {
        console.error("Error fetching random users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchRandomUsers();
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Banner */}
      <div className="hero min-h-[300px] bg-gradient-to-br from-primary to-secondary">
        <div className="hero-overlay bg-opacity-60"></div>
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">About Me</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card Sidebar */}
          {user && (
            <aside className="lg:col-span-1">
              <div className="card bg-base-200 shadow-xl">
                <figure className="px-10 pt-10">
                  <div className="avatar">
                    <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img
                        src={
                          user?.profilePhoto ||
                          "/DevLogApp/apple-touch-icon (2).png"
                        }
                        alt={user?.name || user?.username || "Profile"}
                      />
                    </div>
                  </div>
                </figure>
                <div className="card-body items-center text-center">
                  <h2 className="card-title">
                    {user?.name || user?.username || "Jonathan Ramirez"}
                  </h2>
                  <p className="text-sm opacity-70">Full Stack Developer</p>
                  <div className="divider"></div>
                  <div className="w-full text-left">
                    <h3 className="font-bold mb-2">About Me</h3>
                    {user?.bio ? (
                      <p className="text-sm">{user.bio}</p>
                    ) : (
                      <p className="text-sm">
                        <a
                          href="#profile"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigateToProfile?.();
                          }}
                          className="link link-error"
                        >
                          Add your bio
                        </a>{" "}
                        to tell visitors about yourself.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className={user ? "lg:col-span-3" : "lg:col-span-4"}>
            {/* Welcome Section */}
            <section className="card bg-base-200 shadow-xl mb-8">
              <div className="card-body">
                <h2 className="card-title text-2xl">Welcome to My Dev Log</h2>
                <p>
                  Hello! I'm Jonathan Ramirez, a passionate developer
                  documenting my journey and sharing insights through dev logs.
                  This platform is where I chronicle my learning experiences,
                  technical challenges, and solutions I discover along the way.
                </p>
              </div>
            </section>

            {/* Features Grid */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">What You'll Find Here</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title text-lg">📝 Development Logs</h3>
                    <p className="text-sm">
                      Detailed entries about my coding projects, experiments,
                      and learning experiences.
                    </p>
                  </div>
                </div>
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title text-lg">
                      💡 Technical Insights
                    </h3>
                    <p className="text-sm">
                      Solutions to problems I've encountered and lessons learned
                      from real-world development.
                    </p>
                  </div>
                </div>
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title text-lg">🚀 Project Updates</h3>
                    <p className="text-sm">
                      Progress updates on ongoing projects and new technologies
                      I'm exploring.
                    </p>
                  </div>
                </div>
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title text-lg">🔧 Tips & Tricks</h3>
                    <p className="text-sm">
                      Useful tools, techniques, and best practices I've
                      discovered in my development journey.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Journey Section */}
            <section className="card bg-base-200 shadow-xl mb-8">
              <div className="card-body">
                <h2 className="card-title text-2xl">My Journey</h2>
                <p className="mb-4">
                  As a developer, I believe in continuous learning and sharing
                  knowledge with the community. This dev log serves as both a
                  personal reference and a resource for fellow developers who
                  might face similar challenges.
                </p>
                <p>
                  Through documenting my development journey, I aim to not only
                  track my own progress but also contribute to the collective
                  knowledge of the developer community.
                </p>
              </div>
            </section>

            {/* Meet a Star Section */}
            <section className="mb-8">
              <div
                style={{
                  border: "2px solid var(--color-border-primary)",
                  borderRadius: "0",
                  padding: "var(--spacing-xl)",
                  background: "var(--color-bg-primary)",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    marginBottom: "var(--spacing-lg)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  ⭐ Meet a Star
                </h2>
                {loadingUsers ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "var(--spacing-xl)",
                    }}
                  >
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : randomUsers.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "var(--spacing-lg)",
                    }}
                  >
                    {randomUsers.map((randomUser) => (
                      <div
                        key={randomUser.id}
                        onClick={() => navigate(`/profile/${randomUser.id}`)}
                        style={{
                          cursor: "pointer",
                          textAlign: "center",
                          padding: "var(--spacing-md)",
                          background: "var(--color-bg-secondary)",
                          border: "1px solid var(--color-border-primary)",
                          borderRadius: "var(--radius-md)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.borderColor =
                            "var(--color-primary)";
                          e.currentTarget.style.boxShadow = "var(--shadow-md)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor =
                            "var(--color-border-primary)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <img
                          src={
                            randomUser.profilePhoto ||
                            "/DevLogApp/apple-touch-icon (2).png"
                          }
                          alt={`${randomUser.firstName} ${randomUser.lastName}`}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            margin: "0 auto var(--spacing-md)",
                            border: "3px solid var(--color-primary)",
                          }}
                        />
                        <h3
                          style={{
                            fontSize: "1rem",
                            fontWeight: "600",
                            color: "var(--color-text-primary)",
                            marginBottom: "var(--spacing-xs)",
                          }}
                        >
                          {randomUser.firstName} {randomUser.lastName}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {randomUser.devLogCount}{" "}
                          {randomUser.devLogCount === 1 ? "log" : "logs"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      textAlign: "center",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    No users to display yet
                  </p>
                )}
              </div>
            </section>

            {/* Contact Section */}
            <section className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl">Get in Touch</h2>
                <p className="mb-4">
                  Feel free to reach out if you have questions, suggestions, or
                  just want to connect with a fellow developer!
                </p>
                <div className="card-actions">
                  <a
                    href="https://www.jvcswebdesigns.xyz/about.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    View My Resume →
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
