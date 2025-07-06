import { test, expect } from '@playwright/test';
import { loginTestUser, waitForPageLoad, checkBasicAccessibility } from './utils/test-helpers';

test.describe('Authentication', () => {
  test('should show login form when not authenticated', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login page title and form elements
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel('Email:')).toBeVisible();
    await expect(page.getByLabel('Password:')).toBeVisible();
    
    // Check for specific login button (the form submit button)
    await expect(page.getByRole('button', { name: 'Login' }).last()).toBeVisible();
  });

  test('should have Jackson quick login button for testing', async ({ page }) => {
    await page.goto('/login');
    
    // Check for development login button
    await expect(page.getByRole('button', { name: 'Jackson login' })).toBeVisible();
  });

  test('should redirect to signup page', async ({ page }) => {
    await page.goto('/login');
    
    // Click signup button
    await page.getByRole('button', { name: 'Not registered? Sign up' }).click();
    
    // Wait for navigation to occur
    await page.waitForURL('**/signup', { timeout: 5000 });
    
    // Should navigate to signup page
    await expect(page.url()).toContain('/signup');
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid credentials
    await page.getByLabel('Email:').fill('invalid@email.com');
    await page.getByLabel('Password:').fill('wrongpassword');
    
    // Click the form submit button (not the Jackson login button)
    await page.getByRole('button', { name: 'Login' }).last().click();
    
    // Should show error message
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('should successfully login with Jackson test account', async ({ page }) => {
    await page.goto('/login');
    
    // Click Jackson login button
    await page.getByRole('button', { name: 'Jackson login' }).click();
    
    // Wait for navigation with timeout and error handling
    try {
      await page.waitForURL('**/home', { timeout: 10000 });
      
      // Verify we're on the home page
      await expect(page.url()).toContain('/home');
      
      // Wait for authenticated content to load
      await expect(page.getByText(/Welcome back/i)).toBeVisible({ timeout: 5000 });
      
      // Check basic accessibility
      await checkBasicAccessibility(page);
    } catch (error) {
      // If we don't reach home, check if we're still on login page due to auth issues
      if (page.url().includes('/login')) {
        throw new Error('Authentication failed - still on login page');
      }
      throw error;
    }
  });

  test('should redirect authenticated users to home', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByRole('button', { name: 'Jackson login' }).click();
    
    try {
      // Wait for authentication to complete
      await page.waitForURL('**/home', { timeout: 10000 });
      await expect(page.url()).toContain('/home');
      
      // Then try to access login page again
      await page.goto('/login');
      
      // Should show "You are logged in!" message
      await expect(page.getByText('You are logged in!')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Go Home' })).toBeVisible();
    } catch (error) {
      // If authentication fails, check if we're redirected somewhere else
      if (page.url().includes('/login')) {
        throw new Error('Authentication failed - unable to login with Jackson account');
      }
      throw error;
    }
  });
});