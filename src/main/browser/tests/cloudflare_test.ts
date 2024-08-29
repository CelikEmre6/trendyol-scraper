//import { connect } from '..'
import { connect } from '..'

export const testFunc = async () => {
  console.log('Start of test.js')
  const { page, browser } = await connect({
    proxy: {
      username: 'lum-customer-hl_3b3b3b3b-zone-static',
      password: '2zv4k3z0z8z6'
    },
    turnstile: true,
    fingerprint: true
  })

  console.log('Connected to browser')
  await page.goto(
    'https://www.sahibinden.com/emlak/bilecik?query_text_mf=bilecik+satılık+artsa&query_text=satılık+artsa',
    {
      waitUntil: 'domcontentloaded'
    }
  )
  console.log('Navigated to page')
  await page.waitForSelector('.searchResultsFirstColumn', {
    timeout: 60000
  })
  // clearInterval(cl)
  await browser.close()
  console.log('End of test.js')
}
