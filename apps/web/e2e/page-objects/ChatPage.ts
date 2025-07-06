import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Chat Interface
 * Provides reusable methods and locators for chat functionality testing
 */
export class ChatPage {
  readonly page: Page;
  
  // Primary chat interface elements
  readonly chatHeading: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly welcomeMessage: Locator;
  
  // Chat interaction elements
  readonly typingIndicator: Locator;
  readonly onlineStatus: Locator;
  readonly errorMessage: Locator;
  readonly chatMessages: Locator;
  
  // Authentication-related elements
  readonly authRequiredMessage: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Primary interface elements
    this.chatHeading = page.getByRole('heading', { name: /Maratron AI Assistant/i });
    this.messageInput = page.getByPlaceholder(/Ask about your running/i);
    this.sendButton = page.getByRole('button', { type: 'submit' });
    this.welcomeMessage = page.getByText(/Welcome to Maratron AI!/i);
    
    // Interaction elements
    this.typingIndicator = page.getByText(/thinking/i);
    this.onlineStatus = page.getByText('Online');
    this.errorMessage = page.getByText(/Failed to send message|Sorry, I encountered an error/i);
    this.chatMessages = page.locator('[data-testid="chat-message"], .chat-message');
    
    // Authentication elements
    this.authRequiredMessage = page.getByText('Please sign in to access the AI assistant');
  }

  /**
   * Navigate to the chat page
   */
  async goto() {
    await this.page.goto('/chat');
  }

  /**
   * Login using Jackson test account and navigate to chat
   * Skips test if authentication is not available
   */
  async loginAndNavigateToChat() {
    await this.page.goto('/login');
    
    const jacksonButton = this.page.getByRole('button', { name: 'Jackson login' });
    if (await jacksonButton.isVisible()) {
      await jacksonButton.click();
      await this.page.waitForURL('**/home');
      await this.goto();
    } else {
      throw new Error('Jackson test login not available');
    }
  }

  /**
   * Send a message in the chat
   */
  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  /**
   * Wait for a message to appear in the chat
   */
  async waitForMessage(messageText: string, timeout = 5000) {
    await expect(this.page.getByText(messageText)).toBeVisible({ timeout });
  }

  /**
   * Wait for typing indicator to appear
   */
  async waitForTypingIndicator() {
    await expect(this.typingIndicator).toBeVisible();
  }

  /**
   * Clear the message input
   */
  async clearMessage() {
    await this.messageInput.clear();
  }

  /**
   * Check if send button is enabled/disabled
   */
  async isSendButtonEnabled(): Promise<boolean> {
    return await this.sendButton.isEnabled();
  }

  /**
   * Check if chat interface is fully loaded
   */
  async waitForChatInterfaceLoaded() {
    await expect(this.chatHeading).toBeVisible();
    await expect(this.messageInput).toBeVisible();
    await expect(this.sendButton).toBeVisible();
  }

  /**
   * Check if authentication is required
   */
  async isAuthenticationRequired(): Promise<boolean> {
    return await this.authRequiredMessage.isVisible();
  }

  /**
   * Get all visible chat messages
   */
  async getChatMessages(): Promise<string[]> {
    const messages = await this.chatMessages.allTextContents();
    return messages.filter(msg => msg.trim().length > 0);
  }

  /**
   * Check if online status is displayed
   */
  async isOnlineStatusVisible(): Promise<boolean> {
    return await this.onlineStatus.isVisible();
  }

  /**
   * Check if error message is displayed
   */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Simulate network going offline
   */
  async goOffline() {
    await this.page.context().setOffline(true);
  }

  /**
   * Restore network connection
   */
  async goOnline() {
    await this.page.context().setOffline(false);
  }
}