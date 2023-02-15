import { calculateProgress } from '.';

describe('Progress logic', () => {
  test('adjusts XP correctly', () => {
    expect(calculateProgress(0, 1)).toBe(10);
    expect(calculateProgress(20, 1)).toBe(30);
    expect(calculateProgress(40, 0)).toBe(40);
  });
});
