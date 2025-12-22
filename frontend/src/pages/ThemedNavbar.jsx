import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./themed-navbar.css";

export default function ThemedNavbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const roomCode = typeof window !== "undefined"
    ? window.localStorage.getItem("roomCode")
    : null;
  const isLoggedIn = typeof window !== "undefined"
    ? Boolean(window.localStorage.getItem("token"))
    : false;
  // Always show a leaderboard link:
  // - If we have a roomCode, go to that room's leaderboard
  // - Otherwise, go to a generic /leader page that doesn't hit the backend
  const leaderboardPath = roomCode ? `/leader/${roomCode}` : "/leader";

  // Reusable nav link
  const Item = ({ to, children }) => {
    const active = pathname === to;
    return (
      <Link to={to} className={`nv-item ${active ? "active" : ""}`}>
        {children}
        {active && <span className="nv-underline" />}
      </Link>
    );
  };

  return (
    <header className="nv-wrap">
      <div className="nv-row">
        {/* Brand / Logo */}
        <Link to="/dashboard" className="nv-brand">
          ENIGMA
          <span className="nv-spark" />
        </Link>

        {/* ✅ Desktop Navigation */}
        <nav className="nv-desktop">
          <Item to="/dashboard">Dashboard</Item>
          <Item to={leaderboardPath}>Leaderboard</Item>
          {!isLoggedIn && <Item to="/login">Login</Item>}
          {isLoggedIn && (
            <button
              type="button"
              className="nv-item nv-logout"
              onClick={() => {
                // Clear auth-related state
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("user");
                window.localStorage.removeItem("subteam");
                window.localStorage.removeItem("roomCode");
                navigate("/login");
              }}
            >
              Logout
            </button>
          )}
        </nav>

        {/* Burger menu for mobile */}
        <button
          className="nv-burger"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ✅ Mobile Dropdown Navigation */}
      {open && (
        <div className="nv-mobile">
          <Item to="/dashboard">Dashboard</Item>
          <Item to={leaderboardPath}>Leaderboard</Item>
          {!isLoggedIn && <Item to="/login">Login</Item>}
          {isLoggedIn && (
            <button
              type="button"
              className="nv-item nv-logout"
              onClick={() => {
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("user");
                window.localStorage.removeItem("subteam");
                window.localStorage.removeItem("roomCode");
                setOpen(false);
                navigate("/login");
              }}
            >
              Logout
            </button>
          )}
        </div>
      )}

      {/* Neon glow line */}
      <div className="nv-glow" />
    </header>
  );
}
