import { calculateAnalytics } from '../analytics';
import type { Run } from '@maratypes/run';

describe('calculateAnalytics', () => {
  const sampleRuns: Run[] = [
    {
      id: '1',
      date: new Date('2024-01-01'),
      duration: '30:00',
      distance: 5,
      distanceUnit: 'miles',
      userId: 'user1',
    },
    {
      id: '2',
      date: new Date('2024-01-03'),
      duration: '45:00',
      distance: 7,
      distanceUnit: 'miles',
      userId: 'user1',
    },
    {
      id: '3',
      date: new Date('2024-01-05'),
      duration: '20:00',
      distance: 3,
      distanceUnit: 'miles',
      userId: 'user1',
    },
  ];

  it('calculates basic stats correctly', () => {
    const analytics = calculateAnalytics(sampleRuns);
    
    expect(analytics.totalRuns).toBe(3);
    expect(analytics.totalDistance).toBe(15);
    expect(analytics.totalTime).toBe(95); // 30 + 45 + 20 minutes
    expect(analytics.longestRun).toBe(7);
    expect(analytics.weeklyDistanceChart).toBeDefined();
    expect(analytics.cumulativeDistance).toBeDefined();
  });

  it('calculates average pace correctly', () => {
    const analytics = calculateAnalytics(sampleRuns);
    
    // 95 minutes / 15 miles = 6.33 minutes per mile = 6:20
    expect(analytics.averagePace).toBe('6:20');
  });

  it('handles empty runs array', () => {
    const analytics = calculateAnalytics([]);
    
    expect(analytics.totalRuns).toBe(0);
    expect(analytics.totalDistance).toBe(0);
    expect(analytics.totalTime).toBe(0);
    expect(analytics.averagePace).toBe('0:00');
    expect(analytics.longestRun).toBe(0);
    expect(analytics.weeklyAverage).toBe(0);
    expect(analytics.weeklyDistanceChart).toEqual([]);
    expect(analytics.cumulativeDistance).toEqual([]);
  });

  it('converts kilometers to miles', () => {
    const kmRuns: Run[] = [
      {
        id: '1',
        date: new Date('2024-01-01'),
        duration: '30:00',
        distance: 8, // 8 km = ~4.97 miles
        distanceUnit: 'kilometers',
        userId: 'user1',
      },
    ];

    const analytics = calculateAnalytics(kmRuns);
    
    expect(analytics.totalDistance).toBeCloseTo(4.97, 1);
  });

  it('calculates distance distribution correctly', () => {
    const analytics = calculateAnalytics(sampleRuns);
    
    const distribution = analytics.distanceDistribution;
    expect(distribution.find(d => d.range === '1-3 miles')?.count).toBe(1); // 3mi run
    expect(distribution.find(d => d.range === '3-5 miles')?.count).toBe(1); // 5mi run  
    expect(distribution.find(d => d.range === '5-10 miles')?.count).toBe(1); // 7mi run
  });
});