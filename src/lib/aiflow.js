import AIFlowClient from '@devvibex/aiflow';
// The appId is injected at build time by the platform gateway.
// NO API KEY is ever needed here — credit billing is handled server-side.
export const aiflow4507 = new AIFlowClient({
  appId: 'ck-7NBvL9JVqHNPCFbuy7EY6rI7BuJHwB_GXOygkm-1ZQk',
  baseUrl: 'https://app.vibe-x.app/v1/aiflow',
  endUserId: (typeof localStorage !== 'undefined' && localStorage.getItem('user_id')) || undefined,
  appUserToken: (typeof localStorage !== 'undefined' && localStorage.getItem('access_token')) || undefined,
});
export const aiflow4507ConfigPromise = aiflow4507.getConfig().catch((err) => {
  console.warn('AIFlow config preload failed:', err?.message);
  return null;
});
export const aiflow4506 = new AIFlowClient({
  appId: 'ck-Eq7onx4xYN8dkuUxgK5PZ2QdB3x-FIdjPtB5R2pMT1Y',
  baseUrl: 'https://app.vibe-x.app/v1/aiflow',
  endUserId: (typeof localStorage !== 'undefined' && localStorage.getItem('user_id')) || undefined,
  appUserToken: (typeof localStorage !== 'undefined' && localStorage.getItem('access_token')) || undefined,
});
export const aiflow4506ConfigPromise = aiflow4506.getConfig().catch((err) => {
  console.warn('AIFlow config preload failed:', err?.message);
  return null;
});
export const aiflow4505 = new AIFlowClient({
  appId: 'ck-HZNBx7hA152f_yVGeBAGmypNYOsGDpYHpaU3xXvG0TM',
  baseUrl: 'https://app.vibe-x.app/v1/aiflow',
  endUserId: (typeof localStorage !== 'undefined' && localStorage.getItem('user_id')) || undefined,
  appUserToken: (typeof localStorage !== 'undefined' && localStorage.getItem('access_token')) || undefined,
});
export const aiflow4505ConfigPromise = aiflow4505.getConfig().catch((err) => {
  console.warn('AIFlow config preload failed:', err?.message);
  return null;
});
export const aiflow4504 = new AIFlowClient({
  appId: 'ck-5twRT9JPqKjV5uTkcH0oCN6PVjKLjz_J0MmROISiHhI',
  baseUrl: 'https://app.vibe-x.app/v1/aiflow',
  endUserId: (typeof localStorage !== 'undefined' && localStorage.getItem('user_id')) || undefined,
  appUserToken: (typeof localStorage !== 'undefined' && localStorage.getItem('access_token')) || undefined,
});
export const aiflow4504ConfigPromise = aiflow4504.getConfig().catch((err) => {
  console.warn('AIFlow config preload failed:', err?.message);
  return null;
});
// All AIFlow clients in one array — used by the in-app AIFlow admin settings page.
export const aiflowClients = [aiflow4507, aiflow4506, aiflow4505, aiflow4504];