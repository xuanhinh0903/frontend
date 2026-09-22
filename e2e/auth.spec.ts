import { expect, test, type Page } from '@playwright/test'
import { MOCK_ACCOUNT } from '@/mocks/account'

const SESSION_KEY = 'msvn.auth.session'

async function signIn(page: Page, password = MOCK_ACCOUNT.password) {
  await page.getByLabel('Email').fill(MOCK_ACCOUNT.email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

function readStoredSession(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
}

test('redirects anonymous visitors to the login page', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
})

test('signs in and lands on the requested page', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('You are signed in.')).toBeVisible()
  await expect(page.getByText(MOCK_ACCOUNT.email)).toBeVisible()
  expect(await readStoredSession(page)).toContain(MOCK_ACCOUNT.email)
})

test('shows the server error for wrong credentials', async ({ page }) => {
  await page.goto('/login')
  await signIn(page, 'wrong-password')

  await expect(page.getByRole('alert')).toHaveText('Invalid email or password')
  await expect(page).toHaveURL(/\/login$/)
  expect(await readStoredSession(page)).toBeNull()
})

test('keeps the session across a reload and clears it on logout', async ({
  page,
}) => {
  await page.goto('/login')
  await signIn(page)
  await expect(page.getByText('You are signed in.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('You are signed in.')).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await readStoredSession(page)).toBeNull()
})
