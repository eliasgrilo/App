import { test, expect } from '@playwright/test'
import fs from 'fs/promises'

test('full user flows: no console errors, preferment, yeast, save/load, export/import, clear', async ({ page }) => {
  const errors = []
  const failedResponses = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('response', r => {
    if (r.status() >= 400) failedResponses.push({ url: r.url(), status: r.status() })
  })

  await page.goto('/', { timeout: 60_000 })
  await expect(page.locator('h1', { hasText: 'Padoca Pizza' })).toBeVisible({ timeout: 30_000 })

  // Preferment: select Poolish and assert card
  await page.locator('label', { hasText: 'Poolish' }).click()
  await expect(page.locator('h2', { hasText: 'Pré-fermento' })).toBeVisible()

  // Yeast: switch to ADY and assert summary updated
  await page.locator('label', { hasText: 'ADY' }).click()
  await expect(page.locator('input[name="yeastType"][value="ADY"]')).toBeChecked()

  // Save recipe: set a unique ball weight first
  await page.locator('label', { hasText: 'Ball Weight' }).locator('input').fill('123')

  page.once('dialog', async dialog => { await dialog.accept('E2E Test Recipe') })
  await page.locator('button:has-text("Salvar")').click()
  await expect(page.locator('text=E2E Test Recipe')).toBeVisible({ timeout: 5000 })

  // Change ballWeight to ensure load restores it
  await page.locator('label', { hasText: 'Ball Weight (g)' }).locator('input').fill('555')
  await page.locator('li', { hasText: 'E2E Test Recipe' }).locator('button', { hasText: 'Carregar' }).click()
  await expect(page.locator('label', { hasText: 'Ball Weight (g)' }).locator('input')).toHaveValue('123')

  // Export JSON and check download content includes our recipe
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('button', { hasText: 'Exportar JSON' }).click()
  ])
  const p = await download.path()
  const text = await fs.readFile(p, 'utf8')
  const content = JSON.parse(text)
  expect(content.recipes['E2E Test Recipe']).toBeDefined()

  // Import the same JSON via the hidden file input
  await page.setInputFiles('input[type=file]', [{ name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(content)) }])
  await expect(page.locator('li', { hasText: 'E2E Test Recipe' })).toBeVisible()

  // Clear form and assert a known default value is present (e.g., prefermentType 'None')
  await page.locator('button', { hasText: 'Limpar' }).click()
  await expect(page.locator('input[name="prefermentType"][value="None"]')).toBeChecked()

  // Fail if any non-ignored network errors (e.g., missing assets)
  const ignored = ['/favicon.ico']
  const realFailures = failedResponses.filter(f => !ignored.some(i => f.url.endsWith(i)))
  expect(realFailures, `Network errors: ${JSON.stringify(realFailures)}`).toHaveLength(0)

  // Ensure no JS console errors occurred (ignore harmless resource 404s)
  const ignorableConsole = (e) => e.includes('Failed to load resource') || e.includes('favicon')
  expect(errors.filter(e => !ignorableConsole(e)), `Console errors: ${errors.join('\n')}`).toHaveLength(0)
})
