import { test as setup, expect } from '@playwright/test';
import path from 'path';

// Authentication setup following Playwright best practices
// https://playwright.dev/docs/auth

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Check if Jackson test login is available
  const jacksonButton = page.getByRole('button', { name: 'Jackson login' });
  
  if (await jacksonButton.isVisible()) {
    await jacksonButton.click();
    
    // Wait for authentication to complete
    // Replace with actual post-login indicator
    await page.waitForURL('**/home');
    await expect(page.getByText(/Welcome back,/)).toBeVisible();
    
    // Save authenticated state
    await page.context().storageState({ path: authFile });
    
    console.log('✅ Authentication setup completed');
  } else {
    // If Jackson login not available, log and continue
    console.log('⚠️  Jackson test login not available - tests will run unauthenticated');
    
    // Create empty auth file to prevent errors
    await page.context().storageState({ path: authFile });
  }
});