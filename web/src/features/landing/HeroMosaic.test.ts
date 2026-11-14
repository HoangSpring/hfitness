import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateMosaicPauseState } from './HeroMosaicVisibility';
import { heroMosaicColumns, heroTiles, mosaicTileCopies } from './heroMosaic.data';

describe('hero mosaic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  });

  it('keeps five tiles per rendered column', () => {
    expect(heroTiles).toHaveLength(5);
    expect(heroMosaicColumns).toHaveLength(3);
    expect(heroMosaicColumns.every((column) => column.length === 5)).toBe(true);
    expect(heroMosaicColumns.map((column) => mosaicTileCopies(column))).toHaveLength(3);
    expect(heroMosaicColumns.every((column) => mosaicTileCopies(column).length === 10)).toBe(true);
    expect(heroMosaicColumns.map((column) => column.map((tile) => tile.kind))).toEqual([
      ['red', 'photo', 'photo', 'graphite', 'photo'],
      ['light', 'photo', 'dark', 'photo', 'red'],
      ['graphite', 'icon', 'photo', 'red', 'photo'],
    ]);
  });

  it('starts running and resumes when the hero becomes visible', () => {
    let intersectionCallback: (entries: Array<{ isIntersecting: boolean }>) => void = () => undefined;
    const disconnect = vi.fn();
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = vi.fn((callback) => {
      intersectionCallback = callback;
      return { observe: vi.fn(), disconnect };
    });
    const visibilityListeners = new Set<() => void>();
    const documentObject = {
      hidden: false,
      addEventListener: vi.fn((_event: string, listener: () => void) => visibilityListeners.add(listener)),
      removeEventListener: vi.fn(),
    };
    (globalThis as { document?: unknown }).document = documentObject;
    (globalThis as { window?: unknown }).window = { innerHeight: 800 };
    const element = { getBoundingClientRect: () => ({ top: 100, bottom: 500 }) } as HTMLElement;
    const states: boolean[] = [];
    const cleanup = updateMosaicPauseState(element, (paused) => states.push(paused));

    expect(states.at(-1)).toBe(false);
    intersectionCallback([{ isIntersecting: false }]);
    expect(states.at(-1)).toBe(true);
    intersectionCallback([{ isIntersecting: true }]);
    expect(states.at(-1)).toBe(false);
    documentObject.hidden = true;
    visibilityListeners.forEach((listener) => listener());
    expect(states.at(-1)).toBe(true);
    documentObject.hidden = false;
    visibilityListeners.forEach((listener) => listener());
    expect(states.at(-1)).toBe(false);

    cleanup();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
