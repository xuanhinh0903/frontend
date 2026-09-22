import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { MOCK_ACCOUNT } from '@/mocks/account'

const BLOCKING_IMPACTS = new Set(['serious', 'critical'])

async function blockingViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations.filter((violation) =>
    BLOCKING_IMPACTS.has(violation.impact ?? ''),
  )
}

test('login page has no serious or critical accessibility violations', async ({
  page,
}) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

  expect(await blockingViolations(page)).toEqual([])
})

test('home page has no serious or critical accessibility violations', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(MOCK_ACCOUNT.email)
  await page.getByLabel('Password').fill(MOCK_ACCOUNT.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('You are signed in.')).toBeVisible()

  expect(await blockingViolations(page)).toEqual([])
})
