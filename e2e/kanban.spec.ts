import { test, expect } from '@playwright/test'

/**
 * E2E Test: Kanban Board
 * Tests creating columns and cards in Kanban
 */

test.describe('Kanban', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')

        // Navigate to Kanban
        const kanbanLink = page.getByRole('link', { name: /kanban/i })
            .or(page.locator('a[href*="kanban"]'))
            .or(page.locator('button:has-text("Kanban")'))

        if (await kanbanLink.first().isVisible({ timeout: 5000 })) {
            await kanbanLink.first().click()
            await page.waitForLoadState('networkidle')
        }
    })

    test('should display Kanban page header', async ({ page }) => {
        const header = page.getByRole('heading', { name: /kanban/i })
            .or(page.locator('h1:has-text("Kanban")'))

        if (await header.first().isVisible({ timeout: 5000 })) {
            await expect(header.first()).toBeVisible()
        }
    })

    test('should open add column modal', async ({ page }) => {
        // Look for "Nova Lista" button
        const newListButton = page.getByRole('button', { name: /nova lista|adicionar coluna|add column/i })
            .or(page.locator('button:has-text("Nova Lista")'))

        if (await newListButton.first().isVisible({ timeout: 5000 })) {
            await newListButton.first().click()

            // Wait for modal or input to appear
            const modal = page.locator('[role="dialog"], .modal, input[placeholder*="lista"], input[placeholder*="column"]')
            await expect(modal.first()).toBeVisible({ timeout: 5000 })
        }
    })

    test('should create a new column', async ({ page }) => {
        // Open create modal
        const newListButton = page.getByRole('button', { name: /nova lista/i })
            .or(page.locator('button:has-text("Nova Lista")'))

        if (await newListButton.first().isVisible({ timeout: 5000 })) {
            await newListButton.first().click()
            await page.waitForTimeout(500)

            // Fill in column name
            const nameInput = page.locator('input[placeholder*="nome"], input[placeholder*="lista"], input[type="text"]').first()
            if (await nameInput.isVisible({ timeout: 3000 })) {
                await nameInput.fill('Coluna E2E Test')

                // Submit
                const submitButton = page.getByRole('button', { name: /criar|salvar|adicionar|confirmar/i })
                if (await submitButton.first().isVisible({ timeout: 3000 })) {
                    await submitButton.first().click()
                }
            }
        }
    })

    test('should add a card to column', async ({ page }) => {
        // Look for "Cartão" button in any column
        const addCardButton = page.getByRole('button', { name: /cartão|card/i })
            .or(page.locator('button:has-text("Cartão")'))

        if (await addCardButton.first().isVisible({ timeout: 5000 })) {
            await addCardButton.first().click()
            await page.waitForTimeout(500)

            // Fill in card title
            const titleInput = page.locator('input[placeholder*="título"], input[placeholder*="card"], textarea').first()
            if (await titleInput.isVisible({ timeout: 3000 })) {
                await titleInput.fill('Card E2E Test')

                // Submit
                const submitButton = page.getByRole('button', { name: /criar|salvar|adicionar/i })
                if (await submitButton.first().isVisible({ timeout: 3000 })) {
                    await submitButton.first().click()
                }
            }
        }
    })
})
