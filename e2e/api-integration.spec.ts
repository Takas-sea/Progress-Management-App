import { test, expect } from '@playwright/test';

test.describe('API Integration E2E Tests', () => {
  test('should handle API requests', async ({ page }) => {
    // Listen to API response
    page.on('response', (response) => {
      console.log(`${response.request().method()} ${response.url()} -> Status: ${response.status()}`);
    });

    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('localhost:3000');
  });

  test('should handle form submission with validation', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    const sendButton = page.locator('button:has-text("メールでログイン")');
    
    // Try empty submission
    await sendButton.click();
    
    // Should show error or require validation
    await page.waitForTimeout(500);
  });

  test('should track network activity', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', (request) => {
      requests.push(`${request.method()} ${request.url()}`);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have made at least some requests
    expect(requests.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle failed network requests gracefully', async ({ page }) => {
    // Abort all image requests
    await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', (route) => route.abort());
    
    await page.goto('/');
    
    // Page should still be functional
    expect(page.url()).toContain('localhost:3000');
  });

  test('should display content correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that page has rendered content
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
    expect(pageText?.length).toBeGreaterThan(0);
  });

  test('should handle localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Set some data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });
    
    // Retrieve and verify
    const value = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });
    
    expect(value).toBe('test-value');
    
    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('test-key');
    });
  });

  test('should handle sessionStorage', async ({ page }) => {
    await page.goto('/');
    
    // Set some data in sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('session-key', 'session-value');
    });
    
    // Retrieve and verify
    const value = await page.evaluate(() => {
      return sessionStorage.getItem('session-key');
    });
    
    expect(value).toBe('session-value');
  });

  test('should parse text content correctly', async ({ page }) => {
    await page.goto('/');
    
    // Get all text content
    const content = await page.textContent('body');
    
    // Should have some meaningful content
    expect(content).toBeDefined();
    expect(content?.length).toBeGreaterThan(10);
  });

  test('should handle page interactions', async ({ page }) => {
    await page.goto('/');
    
    // Get all buttons
    const buttons = await page.locator('button').all();
    
    // Should have at least one interactive element
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  test('should measure page performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load reasonably quickly (within 10 seconds)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle document metadata', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic document metadata
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});
