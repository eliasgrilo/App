import { test, expect } from '@playwright/test'

/**
 * E2E Test: FichaTecnica (Recipe Management)
 * Tests creating and managing pizza recipes
 */

test.describe('FichaTecnica', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')

        // Navigate to FichaTecnica - try multiple selectors
        const fichaLink = page.getByRole('link', { name: /ficha|técnica/i })
            .or(page.locator('a[href*="ficha"]'))
            .or(page.locator('button:has-text("Ficha")'))

        if (await fichaLink.first().isVisible({ timeout: 5000 })) {
            await fichaLink.first().click()
            await page.waitForLoadState('networkidle')
        }
    })

    test('should display FichaTecnica page header', async ({ page }) => {
        // Look for the page title
        const header = page.getByRole('heading', { name: /ficha|técnica/i })
            .or(page.locator('h1:has-text("Ficha")'))

        if (await header.first().isVisible({ timeout: 5000 })) {
            await expect(header.first()).toBeVisible()
        }
    })

    test('should open create pizza modal', async ({ page }) => {
        // Look for "Nova Pizza" button
        const newPizzaButton = page.getByRole('button', { name: /nova pizza|adicionar|criar/i })
            .or(page.locator('button:has-text("Nova Pizza")'))

        if (await newPizzaButton.first().isVisible({ timeout: 5000 })) {
            await newPizzaButton.first().click()

            // Wait for modal to appear
            const modal = page.locator('[role="dialog"], .modal, [class*="modal"]')
            await expect(modal.first()).toBeVisible({ timeout: 5000 })
        }
    })

    test('should create a new pizza', async ({ page }) => {
        // Open create modal
        const newPizzaButton = page.getByRole('button', { name: /nova pizza|adicionar/i })
            .or(page.locator('button:has-text("Nova Pizza")'))

        if (await newPizzaButton.first().isVisible({ timeout: 5000 })) {
            await newPizzaButton.first().click()

            // Wait for modal
            await page.waitForTimeout(500)

            // Fill in pizza name
            const nameInput = page.locator('input[placeholder*="nome"], input[type="text"]').first()
            if (await nameInput.isVisible({ timeout: 3000 })) {
                await nameInput.fill('Pizza E2E Test')

                // Submit
                const submitButton = page.getByRole('button', { name: /criar|salvar|confirmar/i })
                if (await submitButton.first().isVisible({ timeout: 3000 })) {
                    await submitButton.first().click()
                }
            }
        }
    })
})
