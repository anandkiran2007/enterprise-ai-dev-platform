import { test, expect } from "@playwright/test";

const baseURL = 'http://localhost:3000';

test('Happy Path: User can register successfully', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    
    // Fill in the registration form
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Expect successful registration message
    const successMessage = await page.locator('.success-message');
    await expect(successMessage).toHaveText('Registration successful!');
});

test('Edge Case: User tries to register with an already taken email', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    
    // Fill in the registration form with an existing email
    await page.fill('input[name="username"]', 'anotheruser');
    await page.fill('input[name="email"]', 'testuser@example.com'); // already taken
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Expect error message for taken email
    const errorMessage = await page.locator('.error-message');
    await expect(errorMessage).toHaveText('Email is already taken.');
});

test('Error State: User tries to register with weak password', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    
    // Fill in the registration form with a weak password
    await page.fill('input[name="username"]', 'weakuser');
    await page.fill('input[name="email"]', 'weakuser@example.com');
    await page.fill('input[name="password"]', '123'); // weak password
    await page.click('button[type="submit"]');
    
    // Expect error message for weak password
    const errorMessage = await page.locator('.error-message');
    await expect(errorMessage).toHaveText('Password must be at least 8 characters long and include a number.');
});

test('Happy Path: User can log in successfully', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    // Fill in the login form
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Expect successful login message
    const welcomeMessage = await page.locator('.welcome-message');
    await expect(welcomeMessage).toHaveText('Welcome back, testuser!');
});

test('Error State: User tries to log in with incorrect credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    // Fill in the login form with incorrect credentials
    await page.fill('input[name="email"]', 'wronguser@example.com');
    await page.fill('input[name="password"]', 'WrongPassword!');
    await page.click('button[type="submit"]');
    
    // Expect error message for incorrect credentials
    const errorMessage = await page.locator('.error-message');
    await expect(errorMessage).toHaveText('Invalid email or password.');
});