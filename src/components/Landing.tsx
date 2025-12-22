import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import "./Landing.css";

interface LandingProps {
  onLoginSuccess: (user: { id: number; username: string }) => void;
}

const Landing: React.FC<LandingProps> = ({ onLoginSuccess }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      <div className="landing-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">DevLogs</h1>
            <p className="hero-subtitle">
              Track your development journey with i.c.Stars
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowLogin(true)}
              >
                Sign In
              </button>
              <button
                className="btn btn-secRegistery"
                onClick={() => setShowRegister(true)}
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="about-section">
          <div className="about-content">
            <div className="about-card">
              <div className="about-icon">⭐</div>
              <h2>About i.c.Stars</h2>
              <p>
                i.c.Stars is a leadership and technology training program that
                prepares inner-city adults for technology careers and positions
                of leadership in business and in their communities.
              </p>
              <p>
                Through intensive technical training, business leadership
                development, and real-world client projects, i.c.Stars
                transforms talented individuals into technology professionals
                and civic leaders.
              </p>
            </div>

            <div className="about-card">
              <div className="about-icon">🏢</div>
              <h2>About iCAA</h2>
              <p>
                The i.c.Stars Community Apprenticeship Academy (iCAA) expands
                the i.c.Stars model to serve even more communities and
                individuals seeking to build careers in technology.
              </p>
              <p>
                iCAA provides accessible, community-focused training programs
                that equip participants with in-demand technical skills,
                professional development, and pathways to sustainable careers in
                the tech industry.
              </p>
            </div>

            <div className="about-card">
              <div className="about-icon">📝</div>
              <h2>DevLogs Platform</h2>
              <p>
                DevLogs is your personal development journal - a platform for
                i.c.Stars and iCAA participants to document their learning
                journey, track progress, and build a portfolio of their growth.
              </p>
              <p>
                Record your daily insights, challenges overcome, and skills
                mastered as you transform into a technology professional and
                community leader.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Platform Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">✍️</div>
              <h3>Daily Dev Logs</h3>
              <p>Document your coding journey, lessons learned, and wins</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Visualize your growth with streaks and activity metrics</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <h3>Community</h3>
              <p>Connect with fellow i.c.Stars and iCAA participants</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <h3>Goal Setting</h3>
              <p>Set and achieve your professional development goals</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💼</div>
              <h3>Portfolio Building</h3>
              <p>Showcase your journey to potential employers</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join the i.c.Stars and iCAA community today</p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => setShowRegister(true)}
          >
            Get Started
          </button>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-links">
              <a
                href="https://www.icstars.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                i.c.Stars Website
              </a>
              <span className="footer-divider">•</span>
              <a href="#about">About</a>
              <span className="footer-divider">•</span>
              <a href="#contact">Contact</a>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} i.c.Stars & iCAA. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>

      {showLogin && (
        <Login
          onLoginSuccess={onLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showRegister && (
        <Register
          onRegisterSuccess={onLoginSuccess}
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
};

export default Landing;
