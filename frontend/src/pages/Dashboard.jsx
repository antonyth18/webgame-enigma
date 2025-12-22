import { useEffect, useState } from 'react';
import { WorldSelection } from '../components/WorldSelection.jsx';
import { HawkinsLabDashboard } from '../components/HawkinsLabDashboard.jsx';
import { UpsideDownDashboard } from '../components/UpsideDownDashboard.jsx';
import "./Dashboard.css";
import { createRoom, joinRoom } from '../lib/api';

export default function App() {
  const [selectedWorld, setSelectedWorld] = useState(null); // null, 'upside-down', or 'hawkins-lab'
  const [upsideDownProgress, setUpsideDownProgress] = useState(null);
  const [hawkinsLabProgress, setHawkinsLabProgress] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [allowedWorld, setAllowedWorld] = useState(null); // 'upside-down' for Cipher, 'hawkins-lab' for Key
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomJoinError, setRoomJoinError] = useState('');
  const [roomJoinLoading, setRoomJoinLoading] = useState(false);

  // Only the allowed world will be unlocked; the other remains sealed
  const lockedWorld = allowedWorld;

  // Simulated other team's world (for demo, this would come from server/shared state)
  const otherTeamWorld = null; // Can be 'upside-down' or 'hawkins-lab'

  // Simple auth check: consider user logged in if a token exists
  useEffect(() => {
    const token = window.localStorage.getItem('token');
    setIsAuthenticated(Boolean(token));

     const subteam = window.localStorage.getItem('subteam'); // 'A' (Cipher) or 'B' (Key)
     if (subteam === 'A') {
       setAllowedWorld('upside-down');
     } else if (subteam === 'B') {
       setAllowedWorld('hawkins-lab');
     } else {
       setAllowedWorld(null);
     }
  }, []);

  // Ensure we have a real backend room code stored (Team A creates room if missing)
  useEffect(() => {
    const token = window.localStorage.getItem('token');
    if (!token) return;

    const isValidRoomCode = (code) => /^[A-Z0-9]{6}$/.test(String(code ?? '').toUpperCase());
    const existingRoomCodeRaw = window.localStorage.getItem('roomCode');
    const existingRoomCode = existingRoomCodeRaw ? existingRoomCodeRaw.toUpperCase() : '';

    // If someone stored the ENIG-* display code here, clear it so we don't spam 404s.
    if (existingRoomCode && !isValidRoomCode(existingRoomCode)) {
      console.warn('[Dashboard] Invalid roomCode in storage, clearing:', existingRoomCode);
      window.localStorage.removeItem('roomCode');
    }

    if (existingRoomCode && isValidRoomCode(existingRoomCode)) return;

    const subteam = window.localStorage.getItem('subteam');
    if (subteam !== 'A') {
      return;
    }

    const userRaw = window.localStorage.getItem('user');
    let teamName = 'Room';
    try {
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (user?.teamName) teamName = user.teamName;
    } catch {
      // ignore
    }

    (async () => {
      try {
        const room = await createRoom(`${teamName}'s Room`);
        if (room?.code) {
          window.localStorage.setItem('roomCode', room.code);
          console.log('[Dashboard] Created room and stored roomCode:', room.code);
        }
      } catch (err) {
        console.error('[Dashboard] Failed to create room:', err);
      }
    })();
  }, []);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setRoomJoinError('');

    const code = roomCodeInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setRoomJoinError('Enter a valid 6-character room code (e.g. H94A04).');
      return;
    }

    const subteam = window.localStorage.getItem('subteam');
    const team = subteam === 'B' ? 'B' : 'A';

    setRoomJoinLoading(true);
    try {
      await joinRoom(code, team);
      window.localStorage.setItem('roomCode', code);
      setRoomCodeInput('');
    } catch (err) {
      setRoomJoinError(err?.message || 'Failed to join room.');
    } finally {
      setRoomJoinLoading(false);
    }
  };

  const handleWorldSelection = (worldId) => {
    setSelectedWorld(worldId);
  };

  const handleUpsideDownProgress = (progress) => {
    setUpsideDownProgress(progress);
  };

  const handleHawkinsLabProgress = (progress) => {
    setHawkinsLabProgress(progress);
  };

  // If no world selected, show selection screen
  if (!selectedWorld) {
    const roomCode = (window.localStorage.getItem('roomCode') || '').toUpperCase();
    const isValidRoomCode = /^[A-Z0-9]{6}$/.test(roomCode);
    const subteam = window.localStorage.getItem('subteam');

    return (
      <div className="relative">
        <WorldSelection
          onSelectWorld={handleWorldSelection}
          lockedWorld={lockedWorld}
          otherTeamWorld={otherTeamWorld}
          isAuthenticated={isAuthenticated}
        />

        {/* Show room code to share with Hawkins Lab */}
        {isAuthenticated && subteam === 'A' && isValidRoomCode ? (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]">
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-black/70 backdrop-blur-md px-5 py-3">
              <div className="text-xs uppercase tracking-widest text-zinc-300">
                Room code
              </div>
              <div className="font-mono text-lg text-red-300 tracking-widest">
                {roomCode}
              </div>
              <button
                type="button"
                className="text-xs px-3 py-1 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(roomCode);
                  } catch {
                    // ignore clipboard errors
                  }
                }}
              >
                Copy
              </button>
              <div className="text-xs text-zinc-400">
                Share with Hawkins Lab
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Show selected world's dashboard
  if (selectedWorld === 'upside-down') {
    return (
      <UpsideDownDashboard
        otherTeamProgress={hawkinsLabProgress}
        onProgressUpdate={handleUpsideDownProgress}
      />
    );
  }

  if (selectedWorld === 'hawkins-lab') {
    const roomCode = (window.localStorage.getItem('roomCode') || '').toUpperCase();
    const needsJoin = !/^[A-Z0-9]{6}$/.test(roomCode);
    if (needsJoin) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="w-full max-w-md rounded-2xl border border-[#FFA500]/30 bg-zinc-900/40 backdrop-blur-xl p-8">
            <h2 className="text-xl font-semibold text-[#FFA500] mb-2">Join Room</h2>
            <p className="text-sm text-zinc-300 mb-6">
              Hawkins Lab needs the 6-character room code created by Upside Down.
            </p>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="e.g. H94A04"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#FFA500]/30 text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FFA500]/40"
              />
              {roomJoinError ? (
                <div className="text-sm text-red-300">{roomJoinError}</div>
              ) : null}
              <button
                type="submit"
                disabled={roomJoinLoading}
                className="w-full py-3 rounded-lg border border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500]/10 disabled:opacity-50"
              >
                {roomJoinLoading ? 'Joining...' : 'Join'}
              </button>
            </form>
          </div>
        </div>
      );
    }
    return (
      <HawkinsLabDashboard
        otherTeamProgress={upsideDownProgress}
        onProgressUpdate={handleHawkinsLabProgress}
      />
    );
  }

  return null;
}
