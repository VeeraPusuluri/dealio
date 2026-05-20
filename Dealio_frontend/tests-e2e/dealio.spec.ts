import { test, expect } from '@playwright/test';

test.describe('Dealio E2E Flow', () => {
  test('Builder can login, create project and Customer can request meeting', async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER_LOG] ${msg.text()}`));

    // 1. Builder Login
    await page.goto('http://localhost:8080/login');
    
    // Select Builder Role
    await page.getByRole('button', { name: /builder/i }).click();
    
    // Use Demo Skip to login quickly
    await page.getByRole('button', { name: /continue as demo builder/i }).click();
    
    // Should be on Builder Dashboard
    await expect(page).toHaveURL(/.*\/builder/);
    await expect(page.getByText(/overview/i).first()).toBeVisible();

    // 2. Create Project
    await page.getByText(/projects/i).first().click();
    
    // Check if we are on projects page
    await expect(page).toHaveURL(/.*\/projects/);
    
    // Click "Add your first project" or "Add Project"
    const addFirstBtn = page.getByRole('button', { name: /add your first project/i });
    if (await addFirstBtn.isVisible()) {
      await addFirstBtn.click();
    } else {
      await page.getByRole('button', { name: /add project/i }).first().click();
    }
    
    // Check if we are on new project page
    await expect(page).toHaveURL(/.*\/projects\/new/);
    
    // Step 1: Basic Info
    await page.locator('input[placeholder="Enter project name"]').fill('E2E Test Project');
    await page.getByLabel(/total units/i).fill('100');
    await page.getByLabel(/rera number/i).fill('RERA12345');
    await page.getByLabel(/rera expiry/i).fill('2030-12-31');
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 2: Location
    await page.getByLabel(/address/i).fill('123 Test Street');
    await page.getByLabel(/locality/i).fill('Test Locality');
    await page.getByLabel(/pincode/i).fill('500001');
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 3: Pricing
    await page.getByLabel(/price from/i).fill('5000000');
    await page.getByLabel(/price to/i).fill('10000000');
    await page.getByLabel(/possession date/i).fill('2028-01-01');
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 4: Configurations (auto-populated, just click next)
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 5: Amenities & Media
    await page.getByRole('button', { name: /create project/i }).click();
    
    await expect(page.getByText(/project created successfully/i)).toBeVisible();
    await expect(page.getByText(/E2E Test Project/i)).toBeVisible();

    // 3. Logout and Login as Customer
    await page.getByRole('button', { name: /user menu/i }).click(); 
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.goto('http://localhost:8080/login');
    await page.getByRole('button', { name: /customer/i }).click();
    await page.getByRole('button', { name: /continue as demo customer/i }).click();

    await expect(page).toHaveURL(/.*\/customer/);

    // 4. Request Meeting
    await page.getByText(/Hyderabad/i).first().click(); // Search or select city
    await page.getByText(/E2E Test Project/i).click();
    await page.getByRole('button', { name: /schedule meeting/i }).click();
    
    await page.getByLabel(/date/i).fill('2026-06-01');
    await page.getByRole('button', { name: /book meeting/i }).click();
    
    await expect(page.getByText(/meeting requested/i)).toBeVisible();
  });
});
