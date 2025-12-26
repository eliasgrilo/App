import { test, expect } from '@playwright/test'

test('validate formulas with concrete values', async ({ page }) => {
  await page.goto('/', { timeout: 60_000 })
  await expect(page.locator('h1', { hasText: 'Padoca Pizza' })).toBeVisible({ timeout: 30_000 })
  // Set concrete values for testing: 1 ball
  await page.locator('label', { hasText: 'Dough Balls' }).locator('input').fill('1')
  // Wait for recalc
  await page.waitForTimeout(200)
  // Set concrete values for testing
  // Default dough is: 1 ball, 350g = 350g total
  // Default recipe: 100 flour, 70 water, 2.5 salt, 0 sugar, 0 oil, 0 milk, 0 butter, 0 malt, 0.12 yeast (IDY default)
  // Total % = 100 + 70 + 2.5 + 0.12 = 172.62%
  // Flour weight = 350 * 100 / 172.62 = 202.73g

  // Verify initial state values (allow small floating point differences)
  await expect(page.locator('text=Entrada:')).toBeVisible()

  // Extract flour value from the UI
  // Note: App.jsx uses divs, not dt/dd
  const flourGrams = await page.locator('div.text-xs:has-text("Farinha") + div').first().textContent()
  const flourValue = parseFloat(flourGrams)
  expect(flourValue).toBeGreaterThan(200) // ~202.73g expected
  expect(flourValue).toBeLessThan(205)

  // Hydration check: (70 + 0) * 100 / 202.73 = 34.5%
  // Value is in a sibling div to "Hidratação"
  const hydrationText = await page.locator('div.text-xs:has-text("Hidratação") + div').first().textContent()
  const hydrationValue = parseFloat(hydrationText)
  expect(hydrationValue).toBeGreaterThan(69)
  expect(hydrationValue).toBeLessThan(71)

  // Total mass should match: flour + water + salt + yeast = 202.73 + 141.91 + 5.07 + 0.24 ≈ 349.95g
  const totalMassText = await page.locator('div.text-xs:has-text("Total da Massa") + div').first().textContent()
  const totalMass = parseFloat(totalMassText)
  expect(totalMass).toBeGreaterThan(349)
  expect(totalMass).toBeLessThan(351)

  // Now change ball count to 2 and weight to 250g each = 500g total
  await page.locator('label', { hasText: 'Dough Balls' }).locator('input').fill('2')
  await page.locator('label', { hasText: 'Ball Weight (g)' }).locator('input').fill('250')

  // Wait for recalculation
  await page.waitForTimeout(500)

  // New flour weight = 500 * 100 / 172.62 = 289.61g
  const flourGrams2 = await page.locator('div.text-xs:has-text("Farinha") + div').first().textContent()
  const flourValue2 = parseFloat(flourGrams2)
  expect(flourValue2).toBeGreaterThan(285)
  expect(flourValue2).toBeLessThan(295)

  // Water should scale: 289.61 * 70 / 100 ≈ 202.73g
  const waterText = await page.locator('div.text-xs:has-text("Água") + div').first().textContent()
  const waterValue = parseFloat(waterText)
  expect(waterValue).toBeGreaterThan(200)
  expect(waterValue).toBeLessThan(205)

  // Hydration should remain the same (water/flour * 100)
  const hydrationText2 = await page.locator('div.text-xs:has-text("Hidratação") + div').first().textContent()
  const hydrationValue2 = parseFloat(hydrationText2)
  expect(hydrationValue2).toBeGreaterThan(69)
  expect(hydrationValue2).toBeLessThan(71)
})
