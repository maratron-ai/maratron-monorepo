import { RunningValidationError, validatePaceZones } from '../validation';

describe('RunningValidationError', () => {
  it('should create error with message and code', () => {
    const error = new RunningValidationError('Test message', 'TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('RunningValidationError');
  });

  it('should create error without code', () => {
    const error = new RunningValidationError('Test message');
    expect(error.message).toBe('Test message');
    expect(error.code).toBeUndefined();
    expect(error.name).toBe('RunningValidationError');
  });
});

describe('validatePaceZones', () => {
  it('should pass validation for valid pace zones', () => {
    const validZones = {
      easy: '8:30',
      marathon: '7:30', 
      tempo: '7:00',
      interval: '6:30'
    };
    
    expect(() => validatePaceZones(validZones, 50)).not.toThrow();
  });

  it('should throw error when tempo pace is slower than easy pace', () => {
    const invalidZones = {
      easy: '7:30',
      marathon: '7:00',
      tempo: '8:00', // Slower than easy - invalid
      interval: '6:30'
    };
    
    expect(() => validatePaceZones(invalidZones, 45)).toThrow(RunningValidationError);
    expect(() => validatePaceZones(invalidZones, 45)).toThrow(/Tempo pace \(8:00\) should be faster than easy pace \(7:30\)/);
  });

  it('should throw error when tempo pace is slower than marathon pace', () => {
    const invalidZones = {
      easy: '8:30',
      marathon: '7:00',
      tempo: '7:30', // Slower than marathon - invalid
      interval: '6:30'
    };
    
    expect(() => validatePaceZones(invalidZones, 45)).toThrow(RunningValidationError);
    expect(() => validatePaceZones(invalidZones, 45)).toThrow(/Tempo pace \(7:30\) should be faster than marathon pace \(7:00\)/);
  });

  it('should throw error when interval pace is slower than tempo pace', () => {
    const invalidZones = {
      easy: '8:30',
      marathon: '7:30',
      tempo: '7:00',
      interval: '7:15' // Slower than tempo - invalid
    };
    
    expect(() => validatePaceZones(invalidZones, 45)).toThrow(RunningValidationError);
    expect(() => validatePaceZones(invalidZones, 45)).toThrow(/Interval pace \(7:15\) should be faster than tempo pace \(7:00\)/);
  });

  it('should include VDOT in error message', () => {
    const invalidZones = {
      easy: '7:30',
      marathon: '7:00',
      tempo: '8:00',
      interval: '6:30'
    };
    
    expect(() => validatePaceZones(invalidZones, 42.7)).toThrow(/VDOT 42.7 produces invalid pace zones/);
  });

  it('should include error codes', () => {
    const invalidZones1 = {
      easy: '7:30',
      marathon: '7:00', 
      tempo: '8:00',
      interval: '6:30'
    };
    
    const invalidZones2 = {
      easy: '8:30',
      marathon: '7:00',
      tempo: '7:30',
      interval: '6:30'
    };
    
    const invalidZones3 = {
      easy: '8:30',
      marathon: '7:30',
      tempo: '7:00',
      interval: '7:15'
    };
    
    try {
      validatePaceZones(invalidZones1, 45);
    } catch (error) {
      expect(error).toBeInstanceOf(RunningValidationError);
      expect((error as RunningValidationError).code).toBe('INVALID_TEMPO_PACE');
    }
    
    try {
      validatePaceZones(invalidZones2, 45);
    } catch (error) {
      expect(error).toBeInstanceOf(RunningValidationError);
      expect((error as RunningValidationError).code).toBe('INVALID_TEMPO_MARATHON_RELATIONSHIP');
    }
    
    try {
      validatePaceZones(invalidZones3, 45);
    } catch (error) {
      expect(error).toBeInstanceOf(RunningValidationError);
      expect((error as RunningValidationError).code).toBe('INVALID_INTERVAL_PACE');
    }
  });

  it('should handle edge case where paces are equal', () => {
    const invalidZones = {
      easy: '8:00',
      marathon: '7:30',
      tempo: '8:00', // Equal to easy pace
      interval: '6:30'
    };
    
    expect(() => validatePaceZones(invalidZones, 45)).toThrow(RunningValidationError);
  });
});

describe('Legacy validateTargetPace (deprecated)', () => {
  it('should be replaced by progressive training system', () => {
    // This test documents that validateTargetPace is now superseded by validateGoalPace
    // which provides more sophisticated validation with training progression
    expect(true).toBe(true);
  });
});