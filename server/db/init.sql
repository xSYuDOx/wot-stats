CREATE TABLE IF NOT EXISTS players (
  account_id BIGINT PRIMARY KEY,
  nickname TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_stats (
  account_id BIGINT PRIMARY KEY REFERENCES players(account_id),
  battles INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  damage_dealt INTEGER NOT NULL DEFAULT 0,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);
