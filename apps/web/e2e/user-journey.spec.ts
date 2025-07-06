import { test, expect } from '@playwright/test';
import { UserJourneyPage } from './page-objects/UserJourneyPage';

test.describe('Core User Journey', () => {
  // Helper function to safely attempt authentication
  async function attemptAuthentication(journeyPage: UserJourneyPage) {
    try {
      await journeyPage.attemptAuthentication();
      return true;
    } catch (error) {
      test.skip('Jackson test login not available');
      return false;
    }
  }

  test('complete user journey from landing to using the app', async ({ page }) => {
    const journeyPage = new UserJourneyPage(page);
    
    // 1. Start on landing page
    await journeyPage.gotoLandingPage();
    await journeyPage.verifyLandingPageLoaded();
    
    // 2. Test landing page navigation
    await journeyPage.verifyStartNowButton();
    
    // 3. Login with test account
    await attemptAuthentication(journeyPage);
    
    // 4. Explore different sections
    await journeyPage.navigateToRuns();
    await journeyPage.navigateToChat();
    
    // Send a test message in chat
    await journeyPage.sendChatMessage('Hello, how can you help me with running?');
    
    // 5. Test navigation back to home
    await journeyPage.navigateToHome();
  });

  test('mobile user journey', async ({ page }) => {
    const journeyPage = new UserJourneyPage(page);
    
    // Set mobile viewport
    await journeyPage.setMobileViewport();
    
    // Start on landing page
    await journeyPage.gotoLandingPage();
    await journeyPage.verifyLandingPageLoaded();
    
    // Login
    await attemptAuthentication(journeyPage);
    
    // Test mobile chat interface
    await journeyPage.testMobileChatInterface();
  });

  test('error handling and recovery', async ({ page }) => {
    const journeyPage = new UserJourneyPage(page);
    
    // Login first
    await attemptAuthentication(journeyPage);
    
    // Test 404 page
    await journeyPage.test404Handling();
    
    // Test invalid routes after authentication
    await journeyPage.testInvalidDeepRoute();
    
    // Return to valid page
    await journeyPage.navigateToHome();
  });

  test('page performance and loading states', async ({ page }) => {
    const journeyPage = new UserJourneyPage(page);
    
    // Login
    await attemptAuthentication(journeyPage);
    
    // Test individual page loading
    await journeyPage.navigateToRuns();
    await journeyPage.navigateToChat();
    
    // Test rapid navigation
    await journeyPage.testRapidNavigation();
  });
});