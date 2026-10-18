/**
 * Reload the page when a newer build has been published. Phones (especially
 * Safari on iPhone) keep old tabs alive for days, so a link opened from
 * WhatsApp can land in a stale version of the app.
 */
const RELOADED_FOR_KEY = 'reloadedForBuild';

function currentBuild(): string | null {
  const src = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')?.src;
  return src?.match(/assets\/index-[\w-]+\.js/)?.[0] ?? null;
}

async function checkForUpdate() {
  const current = currentBuild();
  if (!current) return;
  try {
    const res = await fetch(`${window.location.pathname}?build-check=${Date.now()}`, { cache: 'no-store' });
    const latest = (await res.text()).match(/assets\/index-[\w-]+\.js/)?.[0];
    if (!latest || latest === current) return;
    // Reload at most once per new build, in case a CDN still serves the old page
    if (sessionStorage.getItem(RELOADED_FOR_KEY) === latest) return;
    sessionStorage.setItem(RELOADED_FOR_KEY, latest);
    window.location.reload();
  } catch {
    // Offline or storage blocked — keep running the current version
  }
}

export function startAutoUpdate() {
  if (!import.meta.env.PROD) return;
  checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
  window.addEventListener('hashchange', checkForUpdate);
}
