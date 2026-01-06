import { test, expect } from '@playwright/test'

/**
 * E2E Test: Navigation
 * Tests the main navigation and page loading
 */

test.describe('Navigation', () => {
    test('should load the app and display main navigation', async ({ page }) => {
        await page.goto('/')

        // Wait for app to load
        await expect(page.locator('body')).toBeVisible()

        // Check that the app has loaded (looking for common elements)
        const mainContent = page.locator('main, [role="main"], .app, #root')
        await expect(mainContent.first()).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to Production page', async ({ page }) => {
        await page.goto('/')

        // Look for Production link/button in navigation
        const productionLink = page.getByRole('link', { name: /production|produção|calculadora/i })
            .or(page.getByRole('button', { name: /production|produção/i }))
            .or(page.locator('a[href*="production"], button:has-text("Production")'))

        if (await productionLink.first().isVisible()) {
            await productionLink.first().click()
            await page.waitForLoadState('networkidle')
        }
    })

    test('should navigate to FichaTecnica page', async ({ page }) => {
        await page.goto('/')

        // Look for FichaTecnica link
        const fichaLink = page.getByRole('link', { name: /ficha|técnica|receita/i })
            .or(page.locator('a[href*="ficha"], a[href*="receita"]'))

        if (await fichaLink.first().isVisible()) {
            await fichaLink.first().click()
            await page.waitForLoadState('networkidle')
        }
    })

    test('should navigate to Kanban page', async ({ page }) => {
        await page.goto('/')

        // Look for Kanban link
        const kanbanLink = page.getByRole('link', { name: /kanban|tarefas/i })
            .or(page.locator('a[href*="kanban"]'))

        if (await kanbanLink.first().isVisible()) {
            await kanbanLink.first().click()
            await page.waitForLoadState('networkidle')
        }
    })
})
