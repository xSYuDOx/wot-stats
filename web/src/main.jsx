import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [session, setSession] = useState({ authenticated: false });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSession = async () => {
    const res = await fetch(`${API_BASE}/api/session`, { credentials: 'include' });
    const data = await res.json();
    setSession(data);
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/stats`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Не вдалося отримати статистику');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/stats/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Не вдалося оновити статистику');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (session.authenticated) {
      fetchStats();
    }
  }, [session.authenticated]);

  const loginUrl = `${API_BASE}/auth/login?redirect=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="page">
      <header className="hero">
        <h1>Wargaming OAuth + статистика</h1>
        <p>Авторизуйтеся через Wargaming та зберіть свою ігрову статистику.</p>
        {!session.authenticated ? (
          <a className="button" href={loginUrl}>
            Увійти через Wargaming
          </a>
        ) : (
          <button className="button" onClick={refreshStats} disabled={loading}>
            {loading ? 'Оновлюємо...' : 'Оновити статистику'}
          </button>
        )}
      </header>

      {session.authenticated && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2>{session.player?.nickname}</h2>
              <p>Account ID: {session.player?.account_id}</p>
            </div>
            <button
              className="link"
              onClick={async () => {
                await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
                setSession({ authenticated: false });
                setStats(null);
              }}
            >
              Вийти
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          {stats ? (
            <div className="grid">
              <div className="stat">
                <span className="label">Бої</span>
                <span className="value">{stats.battles}</span>
              </div>
              <div className="stat">
                <span className="label">Перемоги</span>
                <span className="value">{stats.wins}</span>
              </div>
              <div className="stat">
                <span className="label">Шкода</span>
                <span className="value">{stats.damage_dealt}</span>
              </div>
              {stats.last_synced && (
                <div className="stat">
                  <span className="label">Синхронізовано</span>
                  <span className="value">{new Date(stats.last_synced).toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <p>Після авторизації ми завантажимо вашу статистику.</p>
          )}
        </section>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
