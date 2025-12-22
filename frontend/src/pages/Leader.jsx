import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Leader.css";
import { getRoomLeaderboard, getGlobalLeaderboard } from "../lib/api";

// small helper
const classNames = (...xs) => xs.filter(Boolean).join(" ");

export default function Leaderboard() {
  const { roomCode } = useParams();

  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    let mounted = true;
    let intervalId;

    async function fetchLeaderboard({ isBackground = false } = {}) {
      try {
        if (!isBackground) setLoading(true);
        setError("");

        const data = roomCode
          ? await getRoomLeaderboard(roomCode)
          : await getGlobalLeaderboard();

        // Backend returns: { leaderboard: [{ teamName, points }, ...] }
        const sorted = (data?.leaderboard ?? [])
          .sort((a, b) => b.points - a.points)
          .slice(0, 7)
          .map((team, index) => ({
            rank: index + 1,
            name: team.teamName,
            score: team.points,
          }));

        if (!mounted) return;
        setLeaders(sorted);
        // replay slide-in animation on refresh
        setAnimate(true);
      } catch (err) {
        console.error("Leaderboard fetch failed", err);
        if (!mounted) return;
        setError(err.message || "Failed to load leaderboard.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchLeaderboard();

    // auto-refresh every 3s so DB updates show up
    intervalId = window.setInterval(() => {
      fetchLeaderboard({ isBackground: true });
    }, 3000);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [roomCode]);

  // Animation trigger (turn off shortly after setting `animate: true`)
  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(() => setAnimate(false), 100);
    return () => window.clearTimeout(t);
  }, [animate]);

  const maxRank = 7;

  return (
    /* 🔥 FULL BLACK BACKGROUND */
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      {/* LEADERBOARD CARD */}
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-red-900/40 bg-neutral-900/60">
        {/* Header */}
        <div className="px-5 py-4 border-b border-red-900/40">
          <h3 className="text-lg font-semibold text-red-300 relative">
            Leaderboard
            <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-red-500/70 shadow-[0_0_8px_rgba(255,0,0,0.6)]" />
          </h3>
        </div>

        {loading ? (
          <p className="px-5 py-6 text-sm text-neutral-400">
            Loading leaderboard...
          </p>
        ) : error ? (
          <p className="px-5 py-6 text-sm text-red-400">
            {error}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/40 text-neutral-300">
                  <th className="text-left py-3 px-5">Rank</th>
                  <th className="text-left py-3 px-5">Team</th>
                  <th className="text-right py-3 px-5">Score</th>
                </tr>
              </thead>

              <tbody>
                {leaders.map((row) => {
                  const delay = (maxRank - row.rank) * 150;

                  const isTop1 = row.rank === 1;
                  const isTop2 = row.rank === 2;
                  const isTop3 = row.rank === 3;

                  return (
                    <tr
                      key={row.rank}
                      className={classNames(
                        "border-t transition-all duration-700 ease-out",
                        "hover:bg-neutral-900/70",
                        animate
                          ? "translate-y-full opacity-0"
                          : "translate-y-0 opacity-100",

                        "text-red-300",

                        // 🥇 TOP 1
                        isTop1 &&
                          "bg-red-900/30 shadow-[0_0_25px_rgba(255,0,0,0.65)] text-red-200",

                        // 🥈 TOP 2
                        isTop2 &&
                          "bg-red-900/20 shadow-[0_0_18px_rgba(255,0,0,0.45)]",

                        // 🥉 TOP 3
                        isTop3 &&
                          "bg-red-900/10 shadow-[0_0_12px_rgba(255,0,0,0.3)]"
                      )}
                      style={{ transitionDelay: `${delay}ms` }}
                    >
                      <td className="py-3 px-5">
                        {isTop1 ? "👑 #1" : `#${row.rank}`}
                      </td>
                      <td className="py-3 px-5 font-semibold">
                        {row.name}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-red-300">
                        {row.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
