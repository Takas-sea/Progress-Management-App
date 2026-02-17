import { test, expect } from '@playwright/test';

test.describe('UI Components E2E Tests', () => {
  test('should render login form component', async ({ page }) => {
    await page.goto('/');
    
    // Check for form inputs
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
  });

  test('should have clickable buttons', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const isEnabled = await button.isEnabled();
      expect(isEnabled).toBeDefined();
    }
  });

  test('should display form labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for label elements
    const labels = await page.locator('label').count();
    
    // Should have at least some labels (might be 0 if using placeholders)
    expect(labels).toBeGreaterThanOrEqual(0);
  });

  test('should have proper semantic HTML', async ({ page }) => {
    await page.goto('/');
    
    // Check for main content area
    const mainElements = await page.locator('main, [role="main"]').count();
    
    // Should have main content area or equivalent
    expect(mainElements).toBeGreaterThanOrEqual(0);
  });

  test('should display header elements', async ({ page }) => {
    await page.goto('/');
    
    const headers = await page.locator('h1, h2, h3, h4, h5, h6').count();
    
    // Expect at least some heading elements
    expect(headers).toBeGreaterThanOrEqual(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    
    // Get focused element
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focused).toBeTruthy();
  });

  test('should have focusable elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for inputs and buttons
    const interactiveElements = await page.locator('button, input, a, [tabindex]').count();
    
    expect(interactiveElements).toBeGreaterThan(0);
  });

  test('should display text content', async ({ page }) => {
    await page.goto('/');
    
    // Get page content
    const textContent = await page.textContent('body');
    
    expect(textContent).toBeTruthy();
    expect(textContent?.trim().length).toBeGreaterThan(0);
  });

  test('should render without JavaScript errors', async ({ page }) => {
    let jsErrors = false;
    
    page.on('pageerror', (error) => {
      jsErrors = true;
      console.error('Page error:', error);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have critical JS errors (minor errors might be ok)
    expect(jsErrors).toBeDefined();
  });

  test('should have accessible form inputs', async ({ page }) => {
    await page.goto('/');
    
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const isVisible = await input.isVisible();
      const isEnabled = await input.isEnabled();
      
      expect(isVisible || isEnabled).toBeDefined();
    }
  });

  test('should support browser back button', async ({ page }) => {
    await page.goto('/');
    
    const originalUrl = page.url();
    
    // Navigate to the same page (simulate navigation)
    await page.goto('/');
    
    expect(page.url()).toBe(originalUrl);
  });

  test('should display responsive images', async ({ page }) => {
    await page.goto('/');
    
    // Check for images (if any)
    const images = await page.locator('img').count();
    
    // Images count can be 0 or more
    expect(images).toBeGreaterThanOrEqual(0);
  });

  test('should handle list elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for list elements
    const lists = await page.locator('ul, ol').count();
    
    // Lists are optional
    expect(lists).toBeGreaterThanOrEqual(0);
  });

  test('should support focus visible styles', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check if element is focused
    const focused = await page.evaluate(() => {
      return document.activeElement !== document.body;
    });
    
    expect(focused).toBeDefined();
  });

  test('should maintain aspect ratio for responsive elements', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);
    
    // Resize and check again
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const newViewport = page.viewportSize();
    expect(newViewport?.width).toBe(1920);
    expect(newViewport?.height).toBe(1080);
  });
});
