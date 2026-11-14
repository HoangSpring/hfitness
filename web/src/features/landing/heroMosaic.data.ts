export type HeroTile = { kind: 'red' | 'graphite' | 'dark' | 'light' | 'icon' | 'photo'; photo?: number };

export const heroMosaicColumns: readonly (readonly HeroTile[])[] = [
  [{ kind: 'red' }, { kind: 'photo', photo: 1 }, { kind: 'photo', photo: 2 }, { kind: 'graphite' }, { kind: 'photo', photo: 4 }],
  [{ kind: 'light' }, { kind: 'photo', photo: 3 }, { kind: 'dark' }, { kind: 'photo', photo: 1 }, { kind: 'red' }],
  [{ kind: 'graphite' }, { kind: 'icon' }, { kind: 'photo', photo: 2 }, { kind: 'red' }, { kind: 'photo', photo: 4 }],
];

export const heroTiles = heroMosaicColumns[0];

export function mosaicTileCopies(tiles: readonly HeroTile[]): readonly HeroTile[] {
  return [...tiles, ...tiles];
}
