export function updateMosaicPauseState(element: HTMLElement, setPaused: (paused: boolean) => void): () => void {
  const isInViewport = () => {
    const rect = element.getBoundingClientRect();
    return !document.hidden && rect.bottom > 0 && rect.top < window.innerHeight;
  };
  const observer = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
  observer.observe(element);
  const onVisibilityChange = () => setPaused(!isInViewport());
  document.addEventListener('visibilitychange', onVisibilityChange);
  onVisibilityChange();
  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
