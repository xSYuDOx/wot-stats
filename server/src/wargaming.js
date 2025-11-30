import dotenv from 'dotenv';

dotenv.config();

const REGION = process.env.WG_REGION ?? 'eu';
const WG_API = `https://api.worldoftanks.${REGION}`;

export function buildAuthUrl(redirectUri) {
  const params = new URLSearchParams({
    application_id: process.env.WG_APPLICATION_ID ?? '',
    redirect_uri: redirectUri,
    display: 'page',
  });
  return `${WG_API}/wot/auth/login/?${params.toString()}`;
}

export async function fetchPlayerStats(accountId, accessToken) {
  const params = new URLSearchParams({
    application_id: process.env.WG_APPLICATION_ID ?? '',
    access_token: accessToken,
    account_id: accountId,
    extra: 'statistics.battles,statistics.wins,statistics.damage_dealt',
  });
  const response = await fetch(`${WG_API}/wot/account/info/?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch player data from Wargaming');
  }
  const body = await response.json();
  if (body.status !== 'ok') {
    throw new Error(body?.error?.message ?? 'Wargaming API error');
  }
  return body.data?.[accountId];
}
