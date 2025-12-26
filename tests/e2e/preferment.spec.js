import { test, expect } from '@playwright/test'

test('preferment card appears when selecting Poolish and shows values', async ({ page }) => {
  await page.goto('/', { timeout: 60_000 })
  await expect(page.locator('h1')).toContainText('Padoca Pizza')

  // Select Poolish
  await page.locator('label', { hasText: 'Poolish' }).click()
  await expect(page.locator('input[name="prefermentType"][value="Poolish"]')).toBeChecked()

  // Pré-fermento section should appear
  await expect(page.locator('h2:has-text("Pré-fermento")')).toBeVisible({ timeout: 10_000 })
})
