/* eslint-disable @typescript-eslint/no-explicit-any */
import { SearchResult } from '@shared/models'
import { connect } from '..'

export const setTapu = async (results: SearchResult[]) => {
  const { page } = await connect({
    proxy: {
      username: 'lum-customer-hl_3b3b3b3b-zone-static',
      password: '2zv4k3z0z8z6'
    },
    turnstile: true,
    fingerprint: false
  })

  const url = 'https://parselsorgu.tkgm.gov.tr'

  await page.goto(url, {
    waitUntil: 'domcontentloaded'
  })

  await page.waitForSelector('.modal-footer', {
    timeout: 5000
  })

  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshButton = document.querySelector('#terms-ok') as any
    refreshButton?.click()
  })

  await page.waitForSelector('.sidebar-scrollable-content-container', {
    timeout: 10000
  })

  await waitOptions(page, 'select#province-select')

  let previousResult: SearchResult | null = null

  for (const result of results) {
    // İl Seçimi
    if (!previousResult || previousResult.il !== result.il) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await selectOptionByText(page, 'select#province-select', result.il)
    }

    await waitOptions(page, 'select#district-select')

    // İlçe Seçimi
    if (!previousResult || previousResult.ilce !== result.ilce) {
      await page.waitForSelector('select#district-select option')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await selectOptionByText(page, 'select#district-select', result.ilce)
    }

    await waitOptions(page, 'select#neighborhood-select')

    // Mahalle Seçimi
    if (!previousResult || previousResult.location !== result.location) {
      await page.waitForSelector('select#neighborhood-select option')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await selectOptionByPartialText(
        page,
        'select#neighborhood-select',
        result.location.toLowerCase()
      )
    }

    // input değerlerini temizle
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blockInput = document.querySelector('#block-input') as any
      blockInput.value = ''

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parcelInput = document.querySelector('#parcel-input') as any
      parcelInput.value = ''
    })

    // Ada No ve Parsel No Girişi
    await page.type('#block-input', result.adaNo!)
    await page.type('#parcel-input', result.parselNo!)

    // wait 1000ms bekle
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Sorgulama Butonuna Tıklama
    await page.click('#administrative-query-btn')

    // Önceki sonucu sakla
    previousResult = result

    // timeout 500ms bekle
    await new Promise((resolve) => setTimeout(resolve, 500))

    await page.evaluate((result: any) => {
      const divs = document.querySelectorAll(
        '#map-canvas > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-tooltip-pane > div'
      )

      divs.forEach((div) => {
        if (div.innerHTML.trim() === `${result.adaNo}/${result.parselNo}`) {
          div.innerHTML =
            result.adaNo +
            '-' +
            result.parselNo +
            '<br>m2: ' +
            result.m2 +
            ' m2 Fiyat: ' +
            result.pricePerM2 +
            '<br>Fiyat: ' +
            result.price
        }
      })
    }, result)
  }
}

// Yardımcı fonksiyonlar
const selectOptionByText = async function (page: any, selector: string, text: string) {
  const value = await page.evaluate(
    (selector, text) => {
      const options = Array.from(document.querySelector(selector).options)
      const option = options.find((option: any) => option.textContent.trim() === text)
      return option ? (option as any).value : null
    },
    selector,
    text
  )
  if (value) {
    await page.select(selector, value)
  }
}

const selectOptionByPartialText = async function (page: any, selector: string, text: string) {
  const value = await page.evaluate(
    (selector, text) => {
      const options = Array.from(document.querySelector(selector).options)
      const option = options.find((option: any) => option.textContent.toLowerCase().includes(text))
      return option ? (option as any).value : null
    },
    selector,
    text
  )
  if (value) {
    await page.select(selector, value)
  }
}

const waitOptions = async function (page: any, myselector: string) {
  await page.waitForFunction(
    (selector) => {
      const selectElement = document.querySelector(selector) as HTMLSelectElement
      return selectElement && selectElement.options && selectElement.options.length > 1
    },
    { timeout: 4000 },
    myselector
  )
}
