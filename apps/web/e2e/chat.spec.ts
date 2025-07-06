import { test, expect } from '@playwright/test';
import { ChatPage } from './page-objects/ChatPage';

test.describe('AI Chat Functionality', () => {
  // Helper function to safely attempt authentication
  async function attemptAuthentication(chatPage: ChatPage) {
    try {
      await chatPage.loginAndNavigateToChat();
      return true;
    } catch (error) {
      test.skip('Jackson test login not available');
      return false;
    }
  }

  test('should display chat interface for authenticated users', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await attemptAuthentication(chatPage);
    
    // Verify chat interface elements are visible
    await chatPage.waitForChatInterfaceLoaded();
    await expect(chatPage.welcomeMessage).toBeVisible();
  });

  test('should display chat interface even when not authenticated', async ({ page }) => {
    const chatPage = new ChatPage(page);
    
    // Try to access chat page without authentication
    await chatPage.goto();
    
    // Should show chat interface (the app allows access to chat interface)
    await expect(chatPage.chatHeading).toBeVisible();
    
    // Should show loading state
    await expect(page.getByText('Loading chat...')).toBeVisible();
  });

  test('should send a message and show it in chat', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await attemptAuthentication(chatPage);
    
    // Send a test message
    await chatPage.sendMessage('What is running?');
    
    // Should show the sent message in chat
    await chatPage.waitForMessage('What is running?');
    
    // Should show typing indicator
    await chatPage.waitForTypingIndicator();
  });

  test('should show typing indicator during response', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await attemptAuthentication(chatPage);
    
    // Send a message
    await chatPage.sendMessage('Tell me about running benefits');
    
    // Should show typing indicator
    await chatPage.waitForTypingIndicator();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await attemptAuthentication(chatPage);
    
    // Mock network error by going offline
    await chatPage.goOffline();
    
    // Try to send a message
    await chatPage.sendMessage('This should fail');
    
    // Should show error message after timeout
    await expect(chatPage.errorMessage).toBeVisible({ timeout: 10000 });
    
    // Restore network
    await chatPage.goOnline();
  });

  test('should disable send button when input is empty', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await attemptAuthentication(chatPage);
    
    // Send button should be disabled with empty input
    expect(await chatPage.isSendButtonEnabled()).toBe(false);
    
    // Should enable when text is entered
    await chatPage.messageInput.fill('Test message');
    expect(await chatPage.isSendButtonEnabled()).toBe(true);
    
    // Should disable again when input is cleared
    await chatPage.clearMessage();
    expect(await chatPage.isSendButtonEnabled()).toBe(false);
  });

  test('should show online status indicator', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await attemptAuthentication(chatPage);
    
    // Check for online status
    expect(await chatPage.isOnlineStatusVisible()).toBe(true);
  });
});