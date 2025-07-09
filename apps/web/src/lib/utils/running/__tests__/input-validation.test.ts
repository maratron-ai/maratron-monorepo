import { RunningValidationError, validateGoalPace } from '../validation';

// Test the internal parseDuration function through public API
describe('Input Validation and Error Handling', () => {
  const mockCalculatedPace = '8:00';
  const mockVDOT = 45;
  const mockWeeks = 16;

  describe('Pace format validation', () => {
    it('should handle valid mm:ss format', () => {
      const result = validateGoalPace('7:30', mockCalculatedPace, mockVDOT, mockWeeks);
      expect(result.isValid).toBe(true);
    });

    it('should handle valid single digit minutes', () => {
      const result = validateGoalPace('6:45', mockCalculatedPace, mockVDOT, mockWeeks);
      expect(result.isValid).toBe(true);
    });

    it('should handle valid hh:mm:ss format', () => {
      const result = validateGoalPace('1:12:30', mockCalculatedPace, mockVDOT, mockWeeks);
      expect(result.isValid).toBe(true);
    });

    it('should auto-convert single number to minutes', () => {
      const result = validateGoalPace('8', mockCalculatedPace, mockVDOT, mockWeeks);
      expect(result.isValid).toBe(true);
    });

    it('should handle large numbers by converting to minutes', () => {
      // "830" gets converted to 830 minutes, which exceeds our range, so should be rejected
      expect(() => validateGoalPace('830', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should handle whitespace gracefully', () => {
      const result = validateGoalPace(' 7:30 ', mockCalculatedPace, mockVDOT, mockWeeks);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid pace format handling', () => {
    it('should reject empty string', () => {
      expect(() => validateGoalPace('', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject invalid format with letters', () => {
      expect(() => validateGoalPace('8min', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject format without colon', () => {
      expect(() => validateGoalPace('830', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject invalid colon format', () => {
      expect(() => validateGoalPace('8:', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject too many colons', () => {
      expect(() => validateGoalPace('1:2:3:4', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject invalid seconds (>= 60)', () => {
      expect(() => validateGoalPace('8:60', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject negative values', () => {
      expect(() => validateGoalPace('-8:30', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject unreasonably high single number', () => {
      expect(() => validateGoalPace('999', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should provide helpful error messages', () => {
      try {
        validateGoalPace('invalid', mockCalculatedPace, mockVDOT, mockWeeks);
      } catch (error) {
        expect(error).toBeInstanceOf(RunningValidationError);
        expect(error.message).toContain('Use mm:ss format');
        expect(error.message).toContain('8:30');
      }
    });
  });

  describe('Range validation', () => {
    it('should reject unreasonably slow pace', () => {
      expect(() => validateGoalPace('61:00', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject invalid minute range in hh:mm:ss', () => {
      expect(() => validateGoalPace('1:61:30', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should reject invalid second range in hh:mm:ss', () => {
      expect(() => validateGoalPace('1:30:60', mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should accept reasonable pace ranges', () => {
      // Test various reasonable paces
      const reasonablePaces = ['5:00', '6:30', '8:45', '10:15', '12:00'];
      
      reasonablePaces.forEach(pace => {
        const result = validateGoalPace(pace, mockCalculatedPace, mockVDOT, mockWeeks);
        expect(result).toBeDefined(); // Should not throw
      });
    });
  });

  describe('Error codes', () => {
    it('should provide specific error codes for different validation failures', () => {
      const testCases = [
        { input: '', expectedCode: 'INVALID_DURATION_FORMAT' },
        { input: 'invalid', expectedCode: 'INVALID_DURATION_FORMAT' },
        { input: '8:60', expectedCode: 'INVALID_PACE_RANGE' },
        { input: '999', expectedCode: 'INVALID_PACE_RANGE' },
      ];

      testCases.forEach(({ input, expectedCode }) => {
        try {
          validateGoalPace(input, mockCalculatedPace, mockVDOT, mockWeeks);
          fail(`Expected error for input: ${input}`);
        } catch (error) {
          expect(error).toBeInstanceOf(RunningValidationError);
          expect((error as RunningValidationError).code).toBe(expectedCode);
        }
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined gracefully', () => {
      expect(() => validateGoalPace(null as any, mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
      
      expect(() => validateGoalPace(undefined as any, mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should handle non-string input', () => {
      expect(() => validateGoalPace(123 as any, mockCalculatedPace, mockVDOT, mockWeeks))
        .toThrow(RunningValidationError);
    });

    it('should handle very fast but valid paces', () => {
      const result = validateGoalPace('4:30', mockCalculatedPace, mockVDOT, mockWeeks);
      // Should validate the pace format successfully, even if it's unrealistic for goal
      expect(result).toBeDefined();
    });

    it('should handle marathon-length paces', () => {
      const result = validateGoalPace('15:00', mockCalculatedPace, mockVDOT, mockWeeks);
      expect(result).toBeDefined();
    });
  });

  describe('User-friendly messages', () => {
    it('should provide clear guidance for common mistakes', () => {
      const commonMistakes = [
        { input: 'invalid', expectedHint: 'mm:ss format' },
        { input: '8:60', expectedHint: 'seconds 0-59' },
        { input: '8:', expectedHint: 'mm:ss format' },
      ];

      commonMistakes.forEach(({ input, expectedHint }) => {
        try {
          validateGoalPace(input, mockCalculatedPace, mockVDOT, mockWeeks);
        } catch (error) {
          expect(error.message).toContain(expectedHint);
        }
      });
    });

    it('should suggest proper format in error messages', () => {
      try {
        validateGoalPace('invalid', mockCalculatedPace, mockVDOT, mockWeeks);
      } catch (error) {
        expect(error.message).toContain('"8:30"'); // Example format
      }
    });
  });
});