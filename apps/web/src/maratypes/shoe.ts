// @maratypes/shoe.ts

import { DistanceUnit } from './basics';

// main type
export interface Shoe {
  id?: string;
  userId: string;
  name: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  currentDistance: number; // Usage so far (in distanceUnit)
  distanceUnit: DistanceUnit;
  maxDistance: number; // When shoe “expires”
  retired: boolean;
}
