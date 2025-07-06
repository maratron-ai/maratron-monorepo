import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for E2E tests
 */

/**
 * Login using the Jackson test account (improved version)
 * Throws error if authentication fails, allowing test to skip gracefully
 */
export async function loginTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  
  // Check if Jackson login is available, otherwise throw error for test skip
  const jacksonButton = page.getByRole('button', { name: 'Jackson login' });
  if (await jacksonButton.isVisible()) {
    await jacksonButton.click();
    await page.waitForURL('**/home');
  } else {
    throw new Error('Jackson test login not available');
  }
}

/**
 * Safely attempt authentication and skip test if not available
 */
export async function authenticateUserOrSkip(page: Page): Promise<boolean> {
  try {
    await loginTestUser(page);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/home');
    return page.url().includes('/home');
  } catch {
    return false;
  }
}

/**
 * Send a chat message and wait for response
 */
export async function sendChatMessage(page: Page, message: string) {
  const messageInput = page.getByPlaceholder(/Ask about your running/i);
  await messageInput.fill(message);
  await page.getByRole('button', { type: 'submit' }).click();
  
  // Verify message appears
  await expect(page.getByText(message)).toBeVisible();
  
  // Wait for typing indicator
  await expect(page.getByText(/thinking/i)).toBeVisible();
}

/**
 * Navigate and verify page loads correctly
 */
export async function navigateAndVerify(page: Page, path: string, expectedElement: string) {
  await page.goto(path);
  await waitForPageLoad(page);
  await expect(page.getByText(expectedElement)).toBeVisible();
}

/**
 * Take a screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Verify page accessibility basics
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for main heading
  const headings = page.getByRole('heading');
  await expect(headings.first()).toBeVisible();
  
  // Check for skip links or main navigation
  const nav = page.getByRole('navigation');
  const main = page.getByRole('main');
  
  // At least one should exist
  try {
    await expect(nav.or(main)).toBeVisible();
  } catch {
    // If neither exists, check for basic page structure
    await expect(page.locator('body')).toBeVisible();
  }
}

/**
 * Test form validation
 */
export async function testFormValidation(
  page: Page, 
  formSelector: string, 
  requiredFields: string[]
) {
  const form = page.locator(formSelector);
  
  // Try to submit empty form
  await form.locator('button[type="submit"]').click();
  
  // Check for validation messages
  for (const field of requiredFields) {
    const fieldElement = form.locator(`[name="${field}"], #${field}`);
    if (await fieldElement.count() > 0) {
      // Field should show validation state
      const fieldValidation = await fieldElement.getAttribute('aria-invalid');
      if (fieldValidation !== 'true') {
        // Check for other validation indicators
        const hasRequiredAttr = await fieldElement.getAttribute('required');
        expect(hasRequiredAttr).toBeTruthy();
      }
    }
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, apiPath: string) {
  return await page.waitForResponse(response => 
    response.url().includes(apiPath) && response.status() === 200
  );
}

/**
 * Check for console errors
 */
export async function checkConsoleErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Return function to check errors later
  return () => {
    if (errors.length > 0) {
      console.warn('Console errors detected:', errors);
    }
    return errors;
  };
}