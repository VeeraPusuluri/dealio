# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dealio.spec.ts >> Dealio E2E Flow >> Builder can login, create project and Customer can request meeting
- Location: tests-e2e/dealio.spec.ts:4:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/builder/
Received string:  "http://localhost:8080/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:8080/login"

```

```yaml
- region "Notifications (F8)":
  - list:
    - status:
      - text: Demo login failed Cannot reach the server. Make sure both backend services are running.
      - button:
        - img
- region "Notifications alt+T"
- link "Dealio":
  - /url: /home
  - img
  - text: Dealio
- img
- text: Trusted by 12,400+ stakeholders
- heading "Welcome back to Dealio" [level=2]
- paragraph: Sign in to your role-specific dashboard and pick up where you left off.
- img
- text: Free to join — no credit card needed
- img
- text: Role-based dashboard built for your workflow
- img
- text: Connect with builders, CPs, banks & more
- img
- text: AI insights, analytics & real-time updates
- paragraph: Available roles
- img
- text: Customer
- img
- text: Channel Partner
- img
- text: Builder
- img
- text: Bank Officer
- paragraph: + 3 more roles
- paragraph: © 2026 Dealio · Free forever for all roles
- heading "Welcome back" [level=1]
- paragraph:
  - text: New to Dealio?
  - button "Sign up free"
- text: I am a
- button "Customer":
  - img
  - text: Customer
- button "Channel":
  - img
  - text: Channel
- button "Builder":
  - img
  - img
  - text: Builder
- button "Bank":
  - img
  - text: Bank
- button "Interior":
  - img
  - text: Interior
- button "NRI":
  - img
  - text: NRI
- button "Land":
  - img
  - text: Land
- text: Continue with
- button "Google":
  - img
  - text: Google
- button "Phone OTP":
  - img
  - text: Phone OTP
- button "Skip → Continue as demo Builder"
- text: Phone number
- combobox:
  - option "🇮🇳 +91" [selected]
  - option "🇺🇸 +1"
  - option "🇬🇧 +44"
  - option "🇦🇪 +971"
  - option "🇸🇬 +65"
  - option "🇦🇺 +61"
- textbox "98765 43210"
- button "Send verification code":
  - img
  - text: Send verification code
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dealio E2E Flow', () => {
  4  |   test('Builder can login, create project and Customer can request meeting', async ({ page }) => {
  5  |     page.on('console', msg => console.log(`[BROWSER_LOG] ${msg.text()}`));
  6  | 
  7  |     // 1. Builder Login
  8  |     await page.goto('http://localhost:8080/login');
  9  |     
  10 |     // Select Builder Role
  11 |     await page.getByRole('button', { name: /builder/i }).click();
  12 |     
  13 |     // Use Demo Skip to login quickly
  14 |     await page.getByRole('button', { name: /continue as demo builder/i }).click();
  15 |     
  16 |     // Should be on Builder Dashboard
> 17 |     await expect(page).toHaveURL(/.*\/builder/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  18 |     await expect(page.getByText(/overview/i).first()).toBeVisible();
  19 | 
  20 |     // 2. Create Project
  21 |     await page.getByText(/projects/i).first().click();
  22 |     
  23 |     // Check if we are on projects page
  24 |     await expect(page).toHaveURL(/.*\/projects/);
  25 |     
  26 |     // Click "Add your first project" or "Add Project"
  27 |     const addFirstBtn = page.getByRole('button', { name: /add your first project/i });
  28 |     if (await addFirstBtn.isVisible()) {
  29 |       await addFirstBtn.click();
  30 |     } else {
  31 |       await page.getByRole('button', { name: /add project/i }).first().click();
  32 |     }
  33 |     
  34 |     // Check if we are on new project page
  35 |     await expect(page).toHaveURL(/.*\/projects\/new/);
  36 |     
  37 |     // Step 1: Basic Info
  38 |     await page.locator('input[placeholder="Enter project name"]').fill('E2E Test Project');
  39 |     await page.getByLabel(/total units/i).fill('100');
  40 |     await page.getByLabel(/rera number/i).fill('RERA12345');
  41 |     await page.getByLabel(/rera expiry/i).fill('2030-12-31');
  42 |     await page.getByRole('button', { name: /next/i }).click();
  43 |     
  44 |     // Step 2: Location
  45 |     await page.getByLabel(/address/i).fill('123 Test Street');
  46 |     await page.getByLabel(/locality/i).fill('Test Locality');
  47 |     await page.getByLabel(/pincode/i).fill('500001');
  48 |     await page.getByRole('button', { name: /next/i }).click();
  49 |     
  50 |     // Step 3: Pricing
  51 |     await page.getByLabel(/price from/i).fill('5000000');
  52 |     await page.getByLabel(/price to/i).fill('10000000');
  53 |     await page.getByLabel(/possession date/i).fill('2028-01-01');
  54 |     await page.getByRole('button', { name: /next/i }).click();
  55 |     
  56 |     // Step 4: Configurations (auto-populated, just click next)
  57 |     await page.getByRole('button', { name: /next/i }).click();
  58 |     
  59 |     // Step 5: Amenities & Media
  60 |     await page.getByRole('button', { name: /create project/i }).click();
  61 |     
  62 |     await expect(page.getByText(/project created successfully/i)).toBeVisible();
  63 |     await expect(page.getByText(/E2E Test Project/i)).toBeVisible();
  64 | 
  65 |     // 3. Logout and Login as Customer
  66 |     await page.getByRole('button', { name: /user menu/i }).click(); 
  67 |     await page.getByRole('menuitem', { name: /logout/i }).click();
  68 | 
  69 |     await page.goto('http://localhost:8080/login');
  70 |     await page.getByRole('button', { name: /customer/i }).click();
  71 |     await page.getByRole('button', { name: /continue as demo customer/i }).click();
  72 | 
  73 |     await expect(page).toHaveURL(/.*\/customer/);
  74 | 
  75 |     // 4. Request Meeting
  76 |     await page.getByText(/Hyderabad/i).first().click(); // Search or select city
  77 |     await page.getByText(/E2E Test Project/i).click();
  78 |     await page.getByRole('button', { name: /schedule meeting/i }).click();
  79 |     
  80 |     await page.getByLabel(/date/i).fill('2026-06-01');
  81 |     await page.getByRole('button', { name: /book meeting/i }).click();
  82 |     
  83 |     await expect(page.getByText(/meeting requested/i)).toBeVisible();
  84 |   });
  85 | });
  86 | 
```