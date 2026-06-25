export function scrollAppToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelector<HTMLElement>('.app-main')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export function scheduleScrollAppToTop() {
  scrollAppToTop();
  const frame = window.requestAnimationFrame(scrollAppToTop);
  const timeout = window.setTimeout(scrollAppToTop, 0);

  return () => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
  };
}
