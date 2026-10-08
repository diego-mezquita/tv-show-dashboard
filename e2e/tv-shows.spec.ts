import { expect, test, type Locator, type Page } from '@playwright/test'

// The real API's data changes over time, so journeys read the title of the card they open instead of expecting fixed names
async function openShow(card: Locator) {
  const title = await card.locator('.show-card__title').innerText()

  await card.getByRole('link').click()

  return title
}

function pageHeading(page: Page) {
  return page.getByRole('heading', { level: 1 })
}

function recommendedShows(page: Page) {
  return page.getByRole('region', { name: 'Recommended for you' }).getByRole('listitem')
}

test('navigates to a show detail page when clicking a show on the home page', async ({ page }) => {
  await page.goto('/')

  const title = await openShow(page.getByRole('listitem').first())

  await expect(page).toHaveURL(/\/shows\/\d+$/)
  await expect(pageHeading(page)).toHaveText(title)
})

test('searches for a show, opens a result, goes back to the results and opens a different show', async ({ page }) => {
  await page.goto('/')

  // await search(page, 'girls')
  const searchField = page.getByRole('searchbox', { name: 'Search TV shows by name' })

  await searchField.fill('girls')
  await searchField.press('Enter')
  await expect(page).toHaveURL('/search?q=girls')

  const firstTitle = await openShow(page.getByRole('listitem').nth(0))
  await expect(pageHeading(page)).toHaveText(firstTitle)

  await page.goBack()
  await expect(page).toHaveURL('/search?q=girls')
  await expect(page.getByRole('searchbox', { name: 'Search TV shows by name' })).toHaveValue('girls')

  const secondTitle = await openShow(page.getByRole('listitem').nth(1))
  await expect(pageHeading(page)).toHaveText(secondTitle)
})

test('navigates through recommendations and back to the home page', async ({ page }) => {
  await page.goto('/')
  await openShow(page.getByRole('listitem').first())

  const firstRecommendation = await openShow(recommendedShows(page).first())
  await expect(pageHeading(page)).toHaveText(firstRecommendation)

  const secondRecommendation = await openShow(recommendedShows(page).first())
  await expect(pageHeading(page)).toHaveText(secondRecommendation)

  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page).toHaveURL('/')
  await expect(pageHeading(page)).toHaveText('Top rated TV shows by genre')
})
