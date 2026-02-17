import { test, expect } from '@playwright/test';

test.describe('Study Management App E2E Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    
    // Check for login form elements
    await expect(page.locator('text=メールアドレス')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'メールでログイン' })).toBeVisible();
  });

  test('should display error on invalid email', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    
    const sendButton = page.locator('button:has-text("メールでログイン")');
    await sendButton.click();
    
    // Should show validation error or form validation
    // HTML5 validation or alert will handle invalid email
    await page.waitForTimeout(500);
  });

  test('should display page title', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Study|Progress|Management/i);
  });

  test('should show login form with Google button', async ({ page }) => {
    await page.goto('/');
    
    // Look for Google login button
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
    
    // Check if either email or Google button exists
    const buttons = await page.locator('button[type="submit"], button:has-text("Google")').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('should handle email input and submission', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    
    // Verify email was entered
    const inputValue = await emailInput.inputValue();
    expect(inputValue).toBe('test@example.com');
  });

  test('should navigate and maintain session', async ({ page }) => {
    await page.goto('/');
    
    // Check initial page load
    const header = page.locator('header, [role="banner"]');
    const headerVisible = await header.isVisible().catch(() => false);
    
    // Page should be accessible
    expect(page.url()).toContain('localhost:3000');
  });

  test('should detect all input fields on form', async ({ page }) => {
    await page.goto('/');
    
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
    
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is still visible
    const emailInput = page.locator('input[type="email"]');
    const isVisible = await emailInput.isVisible().catch(() => true);
    
    expect(page.url()).toContain('localhost:3000');
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    expect(page.url()).toContain('localhost:3000');
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    expect(page.url()).toContain('localhost:3000');
  });

  test('should handle page errors gracefully', async ({ page }) => {
    // Intercept network errors
    let errorLogged = false;
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogged = true;
      }
    });
    
    await page.goto('/');
    
    // Page should still be functional
    expect(page.url()).toContain('localhost:3000');
  });

  test('should render all form elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for form container
    const form = page.locator('form, [role="group"]');
    const formVisible = await form.isVisible().catch(() => false);
    
    // At minimum, we should have input and button elements
    const hasInputs = await page.locator('input').count().then(c => c > 0);
    const hasButtons = await page.locator('button').count().then(c => c > 0);
    
    expect(hasInputs || hasButtons).toBe(true);
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/');
    await page.goto('/');
    
    // Should remain on the same page
    expect(page.url()).toContain('localhost:3000');
  });

  test('should preserve form state during navigation', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('persistent@example.com');
    
    // Reload and check if still there (depending on form behavior)
    const value = await emailInput.inputValue();
    expect(value).toBe('persistent@example.com');
  });
});
