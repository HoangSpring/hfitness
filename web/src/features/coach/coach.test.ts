import { describe, expect, it } from 'vitest';
import { parseCoachReply } from './coach';

describe('coach reply parsing', () => {
  it.each([
    ['Recommendation:\nTrain consistently.\n\nWhy:\nYour routine is irregular.', 'Recommendation:', 'Why:'],
    ['Khuyến nghị:\nTập đều.\n\nLý do:\nLịch tập chưa ổn định.', 'Khuyến nghị:', 'Lý do:'],
  ])('parses %s', (text, recommendation, reason) => {
    const result = parseCoachReply(text);
    expect(result).toEqual({ recommendation: text.split(recommendation)[1].split(reason)[0].trim(), reason: text.split(reason)[1].trim() });
  });

  it('keeps an unstructured reply as plain text', () => {
    expect(parseCoachReply('A plain answer')).toEqual({ plain: 'A plain answer' });
  });
});
