import React from "react";
import "./About.css";

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
  return (
    <div className="about-page">
      <div className="hero-banner">
        <div className="hero-banner__overlay">
          <h1>About Me</h1>
        </div>
      </div>

      <div className="about-content">
        <div className="about-container">
          {user && (
            <aside className="profile-card">
              <div className="profile-section">
                <img
                  src={
                    user?.profilePhoto || "/DevLogApp/apple-touch-icon (2).png"
                  }
                  alt={user?.name || user?.username || "Profile"}
                  className="profile-img"
                />
                <h2 className="profile-name">
                  {user?.name || user?.username || "Jonathan Ramirez"}
                </h2>
                <p className="profile-title">Full Stack Developer</p>
              </div>
              <div className="profile-bio">
                <h3>About Me</h3>
                {user?.bio ? (
                  <p>{user.bio}</p>
                ) : (
                  <p>
                    <a
                      href="#profile"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateToProfile?.();
                      }}
                      style={{
                        color: "#dc3545",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      Add your bio
                    </a>{" "}
                    to tell visitors about yourself.
                  </p>
                )}
              </div>
            </aside>
          )}

          <section className="about-section">
            <h2>Welcome to My Dev Log</h2>
            <p>
              Hello! I'm Jonathan Ramirez, a passionate developer documenting my
              journey and sharing insights through dev logs. This platform is
              where I chronicle my learning experiences, technical challenges,
              and solutions I discover along the way.
            </p>
          </section>

          <section className="about-section">
            <h2>What You'll Find Here</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>📝 Development Logs</h3>
                <p>
                  Detailed entries about my coding projects, experiments, and
                  learning experiences.
                </p>
              </div>
              <div className="feature-card">
                <h3>💡 Technical Insights</h3>
                <p>
                  Solutions to problems I've encountered and lessons learned
                  from real-world development.
                </p>
              </div>
              <div className="feature-card">
                <h3>🚀 Project Updates</h3>
                <p>
                  Progress updates on ongoing projects and new technologies I'm
                  exploring.
                </p>
              </div>
              <div className="feature-card">
                <h3>🔧 Tips & Tricks</h3>
                <p>
                  Useful tools, techniques, and best practices I've discovered
                  in my development journey.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>My Journey</h2>
            <p>
              As a developer, I believe in continuous learning and sharing
              knowledge with the community. This dev log serves as both a
              personal reference and a resource for fellow developers who might
              face similar challenges.
            </p>
            <p>
              Through documenting my development journey, I aim to not only
              track my own progress but also contribute to the collective
              knowledge of the developer community.
            </p>
          </section>

          <section className="about-section">
            <h2>Get in Touch</h2>
            <p>
              Feel free to reach out if you have questions, suggestions, or just
              want to connect with a fellow developer!
            </p>
            <div className="contact-links">
              <a
                href="https://www.jvcswebdesigns.xyz/about.html"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-btn"
              >
                View My Resume
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
