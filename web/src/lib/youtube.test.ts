import { describe, expect, it } from 'vitest';
import { normalizeExerciseVideoUrl, parseYouTubeId } from '../../../shared/youtube';

const validId = 'dQw4w9WgXcQ';

describe('parseYouTubeId', () => {
  it.each([
    `https://www.youtube.com/watch?v=${validId}`,
    `https://youtube.com/embed/${validId}`,
    `https://www.youtube.com/shorts/${validId}`,
    `https://youtu.be/${validId}`,
    `https://www.youtube-nocookie.com/embed/${validId}`,
  ])('accepts %s', (url) => {
    expect(parseYouTubeId(url)).toBe(validId);
  });

  it.each([
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    `https://youtube.com.evil.com/watch?v=${validId}`,
    'javascript:alert(1)',
    'data:text/html,test',
    'https://www.youtube.com/watch',
    'https://www.youtube.com/watch?v=short',
    `https://www.youtube.com/watch?v=${validId}extra`,
    `https://www.youtube.com/embed/${validId}/extra`,
    `https://youtu.be/${validId}/extra`,
    `https://example.com/video/${validId}`,
  ])('rejects %s', (url) => {
    expect(parseYouTubeId(url)).toBeNull();
  });
});

describe('normalizeExerciseVideoUrl', () => {
  it('normalizes YouTube URLs to the canonical watch URL', () => {
    expect(normalizeExerciseVideoUrl(`https://youtu.be/${validId}`)).toBe(`https://www.youtube.com/watch?v=${validId}`);
  });

  it.each(['https://cdn.example.com/demo.mp4', 'https://cdn.example.com/demo.webm?download=1'])('accepts direct video files: %s', (url) => {
    expect(normalizeExerciseVideoUrl(url)).toBe(url);
  });

  it.each(['https://cdn.example.com/demo.mov', 'http://cdn.example.com/demo.mp4', ''])('rejects unsupported video URLs: %s', (url) => {
    expect(normalizeExerciseVideoUrl(url)).toBeNull();
  });
});
