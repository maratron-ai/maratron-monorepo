import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Maratron - AI-Powered Marathon Training Coach/);
    
    // Check for key landing page elements
    await expect(page.getByText('Your Personal Marathon Coach, Reimagined')).toBeVisible();
    await expect(page.getByText('AI-powered training that adapts to you')).toBeVisible();
  });

  test('should display main call-to-action buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check for specific CTA buttons using test IDs
    await expect(page.getByTestId('hero-start-now')).toBeVisible();
    await expect(page.getByTestId('footer-start-now')).toBeVisible();
    await expect(page.getByTestId('hero-watch-demo')).toBeVisible();
    await expect(page.getByTestId('footer-watch-demo')).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    
    // Check for key feature sections
    await expect(page.getByText('AI-Powered Personalization')).toBeVisible();
    await expect(page.getByText('VDOT & Race Prediction')).toBeVisible();
    await expect(page.getByText('Smart Load Management')).toBeVisible();
  });

  test('should have working signup navigation', async ({ page }) => {
    await page.goto('/');
    
    // Click the hero Start Now button specifically
    await page.getByTestId('hero-start-now').click();
    
    // Wait for navigation to complete
    await page.waitForURL('**/signup');
    
    // Verify we're on the signup page
    await expect(page.url()).toContain('/signup');
    await expect(page.getByText('Create Your Account')).toBeVisible();
  });
});