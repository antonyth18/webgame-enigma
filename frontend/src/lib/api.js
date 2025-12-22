const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  // In dev, Vite proxy forwards `/api` to `http://localhost:3000`
  '/api/v1';

/**
 * Small wrapper around fetch that:
 * - prefixes the backend base URL
 * - sends JSON by default
 * - attaches Authorization header if a JWT token exists in localStorage
 */
export async function apiFetch(path, options = {}) {
  const token = window.localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Try to surface a useful error message
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  // Allow 204 / empty responses
  if (res.status === 204) return null;
  return res.json();
}

// Convenience helpers for common backend endpoints
export function signup({ teamName, email, password }) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ teamName, email, password }),
  });
}

export function signin({ email, password }) {
  return apiFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getRoomLeaderboard(roomCode) {
  return apiFetch(`/room/${encodeURIComponent(roomCode)}/leaderboard`, {
    method: 'GET',
  });
}

export function getGlobalLeaderboard() {
  return apiFetch('/room/leaderboard/global', {
    method: 'GET',
  });
}

export function createRoom(name) {
  return apiFetch('/room/create', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function joinRoom(roomCode, team) {
  return apiFetch('/room/join', {
    method: 'POST',
    body: JSON.stringify({ roomCode, team }),
  });
}

// Game endpoints (points / state)
export function getGameState(roomCode) {
  return apiFetch(`/game/${encodeURIComponent(roomCode)}/state`, {
    method: 'GET',
  });
}

export function getCurrentQuestion(roomCode) {
  return apiFetch(`/game/${encodeURIComponent(roomCode)}/question`, {
    method: 'GET',
  });
}

export function submitUpsideDownAnswer(roomCode, answer) {
  return apiFetch(`/game/${encodeURIComponent(roomCode)}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
}

export function submitHawkinsHint(roomCode, answer) {
  return apiFetch(`/game/${encodeURIComponent(roomCode)}/hint`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
}


