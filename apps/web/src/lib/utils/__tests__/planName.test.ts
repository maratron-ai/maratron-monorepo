import { defaultPlanName, getDistanceLabel, RaceType } from '../running/planName';

describe('plan name utils', () => {
  const cases: Array<[RaceType, number, string]> = [
    ['5k', 1, '5K Training Plan 1'],
    ['10k', 2, '10K Training Plan 2'],
    ['half', 3, 'Half Marathon Training Plan 3'],
    ['full', 4, 'Marathon Training Plan 4'],
  ];

  it.each(cases)('defaultPlanName %s %d', (race, count, expected) => {
    expect(defaultPlanName(race, count)).toBe(expected);
  });

  it('getDistanceLabel returns correct label', () => {
    expect(getDistanceLabel('full')).toBe('Marathon');
  });
});
