import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { t } from '../../i18n/en';
import { heroMosaicColumns, type HeroTile } from './heroMosaic.data';
import { updateMosaicPauseState } from './HeroMosaicVisibility';

function TileContent({ tile }: { tile: HeroTile }) {
  const [failed, setFailed] = useState(false);
  if (tile.kind === 'photo' && tile.photo && !failed) {
    return <img src={`/media/hero/exercise-${tile.photo}.jpg`} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
  }
  if (tile.kind === 'light') return <span className="mosaic-label">{t('public.mosaicBrand')}</span>;
  if (tile.kind === 'icon') return <span className="mosaic-icon-tile"><span className="mosaic-icon" aria-hidden="true">↕</span><strong>{t('public.mosaicWorkout')}</strong></span>;
  return <span className="mosaic-fallback" aria-hidden="true">HF</span>;
}

function MosaicColumn({ direction, offset, tiles }: { direction: 'down' | 'up'; offset: string; tiles: readonly HeroTile[] }) {
  return <div className={`mosaic-column mosaic-${direction}`} style={{ '--mosaic-offset': offset } as CSSProperties & Record<'--mosaic-offset', string>}>
    <div className="mosaic-track">
      {[0, 1].map((copy) => <div className="mosaic-copy" key={copy} aria-hidden={copy === 1}>
        {tiles.map((tile, index) => <div className={`mosaic-tile mosaic-${tile.kind}`} key={`${copy}-${index}`}><TileContent tile={tile} /></div>)}
      </div>)}
    </div>
  </div>;
}

export function HeroMosaic() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const mosaic = document.querySelector<HTMLElement>('.hero-mosaic');
    if (!mosaic) return undefined;
    return updateMosaicPauseState(mosaic, setPaused);
  }, []);
  return <div className={`hero-mosaic mosaic-viewport ${paused ? 'is-paused' : ''}`} aria-hidden="true">
    <MosaicColumn direction="down" offset="86px" tiles={heroMosaicColumns[0]} />
    <MosaicColumn direction="up" offset="-12px" tiles={heroMosaicColumns[1]} />
    <MosaicColumn direction="down" offset="86px" tiles={heroMosaicColumns[2]} />
  </div>;
}
