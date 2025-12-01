import express from 'express';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createClient } from './pgClient.js';
import { buildAuthUrl, fetchPlayerStats } from './wargaming.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = await createClient();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:4173'],
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/auth/login', (req, res) => {
  const redirectUri = `${process.env.PUBLIC_URL}/auth/callback`;
  const authUrl = buildAuthUrl(redirectUri);
  req.session.authRedirect = req.query.redirect ?? null;
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { access_token, account_id, nickname, expires_at, status } = req.query;

  if (status !== 'ok' || !access_token || !account_id) {
    return res.status(400).json({ message: 'У відповіді OAuth немає потрібних полів' });
  }

  const expiry = new Date(Number(expires_at) * 1000);
  await db.query(
    `INSERT INTO players(account_id, nickname, access_token, token_expires_at)
     VALUES($1, $2, $3, $4)
     ON CONFLICT (account_id) DO UPDATE SET nickname=EXCLUDED.nickname, access_token=EXCLUDED.access_token, token_expires_at=EXCLUDED.token_expires_at`,
    [account_id, nickname, access_token, expiry]
  );

  req.session.accountId = account_id;
  const target = req.session.authRedirect ?? process.env.CLIENT_URL ?? '/';
  delete req.session.authRedirect;
  res.redirect(target);
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/session', async (req, res) => {
  if (!req.session.accountId) {
    return res.json({ authenticated: false });
  }

  const { rows } = await db.query('SELECT account_id, nickname FROM players WHERE account_id=$1', [
    req.session.accountId,
  ]);
  if (!rows[0]) {
    return res.json({ authenticated: false });
  }
  res.json({ authenticated: true, player: rows[0] });
});

async function upsertStats(accountId) {
  const { rows } = await db.query(
    'SELECT access_token FROM players WHERE account_id=$1 AND token_expires_at > NOW()',
    [accountId]
  );
  if (!rows[0]) {
    throw new Error('Немає дійсного токена. Увійдіть ще раз.');
  }
  const token = rows[0].access_token;
  const stats = await fetchPlayerStats(accountId, token);

  const mapped = {
    battles: stats?.statistics?.all?.battles ?? 0,
    wins: stats?.statistics?.all?.wins ?? 0,
    damage: stats?.statistics?.all?.damage_dealt ?? 0,
  };
  await db.query(
    `INSERT INTO player_stats(account_id, battles, wins, damage_dealt, last_synced)
     VALUES($1, $2, $3, $4, NOW())
     ON CONFLICT (account_id) DO UPDATE SET battles=EXCLUDED.battles, wins=EXCLUDED.wins, damage_dealt=EXCLUDED.damage_dealt, last_synced=NOW()`,
    [accountId, mapped.battles, mapped.wins, mapped.damage]
  );
  return mapped;
}

app.get('/api/stats', async (req, res) => {
  if (!req.session.accountId) {
    return res.status(401).json({ message: 'Не авторизовано' });
  }
  const { rows } = await db.query('SELECT battles, wins, damage_dealt, last_synced FROM player_stats WHERE account_id=$1', [
    req.session.accountId,
  ]);
  if (rows[0]) {
    return res.json({ stats: rows[0] });
  }
  try {
    const stats = await upsertStats(req.session.accountId);
    res.json({ stats });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/stats/refresh', async (req, res) => {
  if (!req.session.accountId) {
    return res.status(401).json({ message: 'Не авторизовано' });
  }
  try {
    const stats = await upsertStats(req.session.accountId);
    res.json({ stats });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
