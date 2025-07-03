/**
 * Integration test for timezone functionality in chat API
 */

import { validateChatRequest } from '../chat-handler';

describe('Timezone Integration', () => {
  it('should accept timezone in chat request validation', () => {
    const request = {
      messages: [
        { role: 'user', content: 'What time is it?' }
      ],
      timezone: 'America/New_York'
    };

    const result = validateChatRequest(request);

    expect(result.isValid).toBe(true);
    expect(result.timezone).toBe('America/New_York');
    expect(result.messages).toHaveLength(1);
    expect(result.messages![0].content).toBe('What time is it?');
  });

  it('should handle chat request without timezone', () => {
    const request = {
      messages: [
        { role: 'user', content: 'Hello' }
      ]
    };

    const result = validateChatRequest(request);

    expect(result.isValid).toBe(true);
    expect(result.timezone).toBeUndefined();
    expect(result.messages).toHaveLength(1);
  });

  it('should reject invalid chat request format', () => {
    const request = {
      // Missing messages
      timezone: 'America/New_York'
    };

    const result = validateChatRequest(request);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle timezone with special characters safely', () => {
    const request = {
      messages: [
        { role: 'user', content: 'What time is it?' }
      ],
      timezone: 'Australia/Lord_Howe'
    };

    const result = validateChatRequest(request);

    expect(result.isValid).toBe(true);
    expect(result.timezone).toBe('Australia/Lord_Howe');
  });
});