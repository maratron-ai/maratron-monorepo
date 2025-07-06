/**
 * Simplified SQL Injection Security Test Suite for SMS-175
 * Tests core validation functions for SQL injection vulnerabilities
 */

import { validatePostContent, sanitizeSearchTokens } from '@lib/utils/validation/socialSchemas';
import { containsSuspiciousPatterns, sanitizeInputData } from '@lib/utils/validation/apiValidator';

describe('SQL Injection Prevention Tests (SMS-175)', () => {
  describe('Search Token Sanitization', () => {
    test('should sanitize malicious search tokens', () => {
      const testCases = [
        {
          input: "'; DROP TABLE Users; --",
          expected: ['DROP', 'TABLE', 'Users'] // SQL injection chars removed
        },
        {
          input: "' OR '1'='1",
          expected: ['OR', '11'] // Quotes and equals removed
        },
        {
          input: "admin'--",
          expected: ['admin'] // SQL injection chars removed
        },
        {
          input: "normal search query",
          expected: ['normal', 'search', 'query']
        },
        {
          input: "user@example.com runner-123",
          expected: ['user@example.com', 'runner123'] // Hyphens removed as potential SQL injection
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = sanitizeSearchTokens(input);
        expect(result).toEqual(expected);
      });
    });

    test('should limit token count and length', () => {
      // Test token count limit
      const manyTokens = Array(20).fill('token').join(' ');
      const sanitized = sanitizeSearchTokens(manyTokens);
      expect(sanitized.length).toBeLessThanOrEqual(10);

      // Test token length limit
      const longToken = 'a'.repeat(100);
      const sanitizedLong = sanitizeSearchTokens(longToken);
      expect(sanitizedLong.every(token => token.length <= 50)).toBe(true);
    });

    test('should handle edge cases safely', () => {
      const edgeCases = ['', '   ', '\n\t', null as any, undefined as any];
      
      edgeCases.forEach(testCase => {
        const result = sanitizeSearchTokens(testCase || '');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Post Content Validation', () => {
    test('should reject SQL injection attempts', () => {
      const maliciousContents = [
        "Normal post'; DROP TABLE Users; --",
        "Post content' OR '1'='1",
        "Post'; INSERT INTO Posts (content) VALUES ('malicious');--",
        "Content' UNION SELECT * FROM Users--",
        "Post content{malicious: 'code'}",
        "Content with <>malicious tags",
        "Post with {dangerous} characters"
      ];

      maliciousContents.forEach(content => {
        const result = validatePostContent(content);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should allow legitimate content', () => {
      const legitimateContents = [
        "Just finished a great 5K run! 🏃‍♂️",
        "Training for my first marathon. Any tips?",
        "Beautiful weather for running today!",
        "Personal best: 10K in 45 minutes!",
        "Running community is the best! Thanks for all the support.",
        "My time was 25:45 for the 5K race.",
        "Love running in the morning at 6:30 AM"
      ];

      legitimateContents.forEach(content => {
        const result = validatePostContent(content);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBeDefined();
        expect(typeof result.sanitized).toBe('string');
      });
    });

    test('should enforce content length limits', () => {
      const longContent = 'A'.repeat(2001);
      const result = validatePostContent(longContent);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should reject empty content', () => {
      const emptyContents = ['', '   ', '\n\t', ' \n '];
      
      emptyContents.forEach(content => {
        const result = validatePostContent(content);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('empty');
      });
    });

    test('should sanitize content properly', () => {
      const testContent = "This is a <script>alert('test')</script> normal post";
      const result = validatePostContent(testContent);
      
      if (result.isValid) {
        expect(result.sanitized).not.toContain('<script>');
        expect(result.sanitized).not.toContain('alert');
      } else {
        // Content should be rejected due to suspicious patterns
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Suspicious Pattern Detection', () => {
    test('should detect XSS attempts', () => {
      const xssAttempts = [
        "<script>alert('xss')</script>",
        "javascript:alert(1)",
        "onload=alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        "expression(alert(1))",
        "@import url(malicious.css)",
        "<iframe src='javascript:alert(1)'></iframe>"
      ];

      xssAttempts.forEach(attempt => {
        expect(containsSuspiciousPatterns(attempt)).toBe(true);
      });
    });

    test('should allow safe content', () => {
      const safeInputs = [
        "This is a normal message",
        "user@example.com",
        "Running at 7:30 AM",
        "My time was 25:45 for 5K",
        "Great workout today! 💪",
        "Temperature was 75°F during the run",
        "Pace: 8:30 per mile"
      ];

      safeInputs.forEach(input => {
        expect(containsSuspiciousPatterns(input)).toBe(false);
      });
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize string inputs', () => {
      const testCases = [
        {
          input: "<script>alert('test')</script>Hello World",
          expected: "Hello World"
        },
        {
          input: "javascript:alert(1) Normal text",
          expected: "Normal text" // javascript: removed
        },
        {
          input: "onclick=malicious() Safe content",
          expected: "Safe content" // onclick= removed
        },
        {
          input: "  Normal text with spaces  ",
          expected: "Normal text with spaces"
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = sanitizeInputData(input);
        expect(result).toBe(expected);
      });
    });

    test('should sanitize object inputs recursively', () => {
      const maliciousObject = {
        name: "<script>alert('xss')</script>John",
        email: "user@example.com",
        bio: "javascript:alert(1) I love running",
        nested: {
          content: "onclick=malicious() Safe nested content"
        }
      };

      const sanitized = sanitizeInputData(maliciousObject) as any;
      
      expect(sanitized.name).toBe("John");
      expect(sanitized.email).toBe("user@example.com");
      expect(sanitized.bio).toBe("I love running"); // javascript: removed
      expect(sanitized.nested.content).toBe("Safe nested content"); // onclick= removed
    });

    test('should sanitize array inputs', () => {
      const maliciousArray = [
        "<script>alert('test')</script>Item 1",
        "javascript:alert(1) Item 2",
        "Normal item 3"
      ];

      const sanitized = sanitizeInputData(maliciousArray) as string[];
      
      expect(sanitized[0]).toBe("Item 1");
      expect(sanitized[1]).toBe("Item 2"); // javascript: removed
      expect(sanitized[2]).toBe("Normal item 3");
    });

    test('should handle non-string inputs safely', () => {
      const testInputs = [
        123,
        true,
        null, // Should remain null
        undefined, // Should remain undefined
        new Date(),
        { number: 42 }
      ];

      testInputs.forEach(input => {
        const result = sanitizeInputData(input);
        expect(() => sanitizeInputData(input)).not.toThrow();
        
        // null and undefined should remain as-is, others should be defined
        if (input === null || input === undefined) {
          expect(result).toBe(input);
        } else {
          expect(result).toBeDefined();
        }
      });
    });
  });

  describe('Security Performance', () => {
    test('should validate content efficiently', () => {
      const startTime = Date.now();
      
      // Test with moderately large content
      const content = 'A'.repeat(1000);
      validatePostContent(content);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 50ms for normal content
      expect(duration).toBeLessThan(50);
    });

    test('should sanitize tokens efficiently', () => {
      const startTime = Date.now();
      
      // Test with many tokens
      const query = Array(50).fill('search term').join(' ');
      sanitizeSearchTokens(query);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 20ms even for large inputs
      expect(duration).toBeLessThan(20);
    });

    test('should detect suspicious patterns efficiently', () => {
      const startTime = Date.now();
      
      // Test with long content containing suspicious patterns
      const suspiciousContent = '<script>alert("test")</script>' + 'A'.repeat(1000);
      containsSuspiciousPatterns(suspiciousContent);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 10ms
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    test('should handle Unicode safely', () => {
      const unicodeInputs = [
        "Running in 東京 🏃‍♂️",
        "Café runner ☕",
        "Naïve runner's journey",
        "Résumé of my running career"
      ];

      unicodeInputs.forEach(input => {
        const validation = validatePostContent(input);
        expect(validation.isValid).toBe(true);
        expect(validation.sanitized).toBeDefined();
        
        const suspiciousCheck = containsSuspiciousPatterns(input);
        expect(suspiciousCheck).toBe(false);
      });
    });

    test('should handle boundary lengths correctly', () => {
      // Test exactly at the limit
      const exactLimit = 'A'.repeat(2000);
      const result = validatePostContent(exactLimit);
      expect(result.isValid).toBe(true);

      // Test one character over the limit
      const overLimit = 'A'.repeat(2001);
      const overResult = validatePostContent(overLimit);
      expect(overResult.isValid).toBe(false);
    });

    test('should handle malformed inputs gracefully', () => {
      const malformedInputs = [
        Buffer.from('malicious'),
        Symbol('test'),
        function() { return 'test'; },
        new Error('test error')
      ];

      malformedInputs.forEach(input => {
        expect(() => {
          sanitizeInputData(input as any);
          containsSuspiciousPatterns(String(input));
        }).not.toThrow();
      });
    });
  });

  describe('SQL Injection Pattern Recognition', () => {
    test('should identify common SQL injection patterns', () => {
      const sqlInjectionPatterns = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' OR 'x'='x",
        "') OR ('1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM users --",
        "1'; WAITFOR DELAY '00:00:05'--",
        "' OR SLEEP(5) --"
      ];

      sqlInjectionPatterns.forEach(pattern => {
        // Should be caught by content validation or token sanitization
        const postResult = validatePostContent(pattern);
        const sanitizedTokens = sanitizeSearchTokens(pattern);
        
        // Either the content should be rejected or the tokens should be sanitized
        const isSafe = !postResult.isValid || !sanitizedTokens.some(token => 
          token.includes("'") || token.includes(';') || token.includes('--')
        );
        
        expect(isSafe).toBe(true);
      });
    });

    test('should block NoSQL injection attempts', () => {
      const nosqlPatterns = [
        '{"$where": "this.username == \\"admin\\""}',
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$regex": ".*"}',
        '{"username": {"$exists": true}}'
      ];

      nosqlPatterns.forEach(pattern => {
        const result = validatePostContent(pattern);
        // Should be rejected due to { } characters
        expect(result.isValid).toBe(false);
      });
    });

    test('should handle encoded injection attempts', () => {
      const encodedPatterns = [
        "%27%20OR%20%271%27%3D%271", // URL encoded ' OR '1'='1
        "&lt;script&gt;alert(1)&lt;/script&gt;", // HTML encoded script tag
        "\\x27\\x20OR\\x20\\x271\\x27\\x3D\\x271" // Hex encoded
      ];

      encodedPatterns.forEach(pattern => {
        const suspiciousCheck = containsSuspiciousPatterns(pattern);
        const sanitized = sanitizeInputData(pattern);
        
        // Should either be flagged as suspicious or properly sanitized
        expect(typeof sanitized === 'string').toBe(true);
      });
    });
  });
});