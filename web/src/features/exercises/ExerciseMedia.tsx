import { useState } from 'react';
import { t } from '../../i18n/en';
import { parseYouTubeId } from '../../../../shared/youtube';

function Placeholder({ className = '' }: { className?: string }) {
  return <div className={`exercise-placeholder ${className}`} aria-label={t('exercises.placeholder')}>HF</div>;
}

export function ExerciseCover({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) return <Placeholder className="exercise-image" />;
  return <img className="exercise-image exercise-image-photo" src={imageUrl} alt={t('exercises.imageAlt', { name })} loading="lazy" onError={() => setFailed(true)} />;
}

export function ExerciseFrameViewer({ name, imageUrl, imageUrls }: { name: string; imageUrl: string | null; imageUrls: string[] }) {
  const frames = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  const hasEndFrame = frames.length > 1;
  const selectFrame = (nextFrame: number) => {
    if (frames.length > 0) setFrame(Math.min(Math.max(nextFrame, 0), frames.length - 1));
  };

  return <div className="exercise-frame-viewer" tabIndex={0} onKeyDown={(event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectFrame(frame - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectFrame(frame + 1); }
  }} aria-label={t('exercises.frameViewer', { name })}>
    {frames.length === 0 || failed ? <Placeholder className="detail-media" /> : <img className="detail-media exercise-image-photo" src={frames[frame]} alt={t('exercises.imageAlt', { name })} onError={() => setFailed(true)} />}
    <div className="frame-controls" role="group" aria-label={t('exercises.frameControls')}>
      <button type="button" className={frame === 0 ? 'active' : ''} aria-pressed={frame === 0} onClick={() => selectFrame(0)}>{t('exercises.startFrame')}</button>
      <button type="button" className={frame === 1 ? 'active' : ''} aria-pressed={frame === 1} disabled={!hasEndFrame} onClick={() => selectFrame(1)}>{t('exercises.endFrame')}</button>
    </div>
  </div>;
}

export function ExerciseVideo({ name, videoUrl }: { name: string; videoUrl: string | null }) {
  if (!videoUrl) return null;
  const youtubeId = parseYouTubeId(videoUrl);
  if (youtubeId) {
    return <div className="exercise-video"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" title={t('exercises.videoTitle', { name })} /><a href={videoUrl} target="_blank" rel="noreferrer">{t('exercises.watchOnYouTube')}</a></div>;
  }
  return <div className="exercise-video"><video controls preload="metadata" playsInline src={videoUrl} aria-label={t('exercises.videoTitle', { name })} /><a href={videoUrl} target="_blank" rel="noreferrer">{t('exercises.openVideo')}</a></div>;
}
