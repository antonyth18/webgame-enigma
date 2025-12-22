import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemedNavbar from "./pages/ThemedNavbar";
import Leader from "./pages/Leader";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-neutral-200">
        <ThemedNavbar />
        <Routes>
          {/* Default to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Leaderboard: with or without a room code */}
          <Route path="/leader" element={<Leader />} />
          <Route path="/leader/:roomCode" element={<Leader />} />

          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
