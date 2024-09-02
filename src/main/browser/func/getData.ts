/* eslint-disable no-unsafe-finally */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { connect } from '..'

export const getData = async (url: string) => {
  const allData: any[] = []
  let pageCount = 0
  let forceLoginEncountered = false

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  while (pageCount < 5) {
    const { page, browser } = await connect({
      proxy: {
        username: 'lum-customer-hl_3b3b3b3b-zone-static',
        password: '2zv4k3z0z8z6'
      },
      turnstile: true,
      fingerprint: true
    })

    if (forceLoginEncountered) {
      console.log('Force login encountered, reopening browser...')
      forceLoginEncountered = false
    }

    const pagedUrl = `${url}&pagingOffset=${pageCount * 50}`

    try {
      await page.goto(pagedUrl, {
        waitUntil: 'domcontentloaded'
      })

      await page.waitForSelector('.searchResultsFirstColumn', {
        timeout: 60000
      })

      const advertNotFound = await page.evaluate(() => {
        return document.body.innerText.includes('Arama filtrelerine uygun ilan bulunamadı.')
      })
      if (advertNotFound) {
        console.log('ilan bulunumadı')
        break
      }

      const data = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr.searchResultsItem')
        const results: any[] = []

        rows.forEach((row) => {
          const titleElement = row.querySelector('a.classifiedTitle')
          const title = titleElement ? titleElement.getAttribute('title') : null
          const link = titleElement ? titleElement.getAttribute('href') : null

          const imageElement = row.querySelector('td.searchResultsLargeThumbnail img')
          const imageUrl = imageElement ? imageElement.getAttribute('src') : null

          const m2Text =
            (row.querySelector('td.searchResultsAttributeValue') as any)?.innerText.trim() || null
          const m2 = m2Text ? m2Text : null

          const priceText =
            (
              row.querySelector(
                'td.searchResultsPriceValue .classified-price-container span'
              ) as any
            )?.innerText.trim() || null
          const price = priceText ? priceText : null

          const pricePerM2Text =
            (row.querySelectorAll('td.searchResultsPriceValue')[1] as any)?.innerText.trim() || null
          const pricePerM2 = pricePerM2Text ? pricePerM2Text : null

          const dateElement = row.querySelector('td.searchResultsDateValue.true')
          const day = dateElement?.querySelector('span')?.innerText.trim() || null
          const year = dateElement?.querySelectorAll('span')[1]?.innerText.trim() || null
          const date = day && year ? new Date(`${day} ${year}`) : null

          const location =
            (row.querySelector('td.searchResultsLocationValue.true') as any)?.innerText.trim() ||
            null

          results.push({
            title,
            link: link ? `https://www.sahibinden.com${link}` : null,
            imageUrl,
            m2,
            price,
            pricePerM2,
            date,
            location
          })
        })

        return results
      })
      for (const item of data) {
        if (item.link) {
          try {
            // Detay sayfasına git ve gerekli bilgileri al
            await page.goto(item.link, {
              waitUntil: 'domcontentloaded'
            })

            await delay(1250)

            const pageNotFound = await page.evaluate(() => {
              return document.body.innerText.includes('Aradığınız sayfa artık bulunamıyor.')
            })

            const forceLogin = await page.evaluate(() => {
              return (
                document.body.innerText.includes('giriş yapmanız gerekmektedir') ||
                document.body.innerText.includes('you need to log in')
              )
            })

            if (pageNotFound) {
              console.log(`Aradığınız sayfa artık bulunamıyor: ${item.link}`)
              continue
            }

            if (forceLogin) {
              console.log(`Giriş yapmanız gerekmektedir: ${item.link}`)
              forceLoginEncountered = true
              break
            }

            await page.waitForSelector('.classifiedDetailTitle', {
              timeout: 10000
            })

            const details = await page.evaluate(() => {
              const detailItems = document.querySelectorAll('li')
              let adaNo = 'Belirtilmemiş'
              let parselNo = 'Belirtilmemiş'
              let kimden = 'Belirtilmemiş'
              let telefonNo = 'Belirtilmemiş'
              let isim = 'Belirtilmemiş'
              let sirket = 'Belirtilmemiş'
              let imar = 'Belirtilmemiş'

              detailItems.forEach((item) => {
                if (item.innerText.includes('Ada No')) {
                  adaNo =
                    item.querySelector('span')?.innerText.trim().replace('.', '') || 'Belirtilmemiş'
                }
                if (item.innerText.includes('Parsel No')) {
                  parselNo =
                    item.querySelector('span')?.innerText.trim().replace('.', '') || 'Belirtilmemiş'
                }
                if (item.innerText.includes('Kimden')) {
                  kimden = item.querySelector('span')?.innerText.trim() || 'Belirtilmemiş'
                }
                if (item.innerText.includes('İmar Durumu')) {
                  imar = item.querySelector('span')?.innerText.trim() || 'Belirtilmemiş'
                }
              })

              // Kimden bilgisine göre telefon ve isim alıyoruz
              if (kimden === 'Sahibinden') {
                telefonNo =
                  document
                    .querySelector('#phoneInfoPart > li > span.pretty-phone-part.show-part > span')
                    ?.getAttribute('data-content') || 'Belirtilmemiş'

                const isimElement = document.querySelector('.username-info-area h5 span')
                if (isimElement) {
                  const isimStyleContent = window.getComputedStyle(isimElement, ':before').content
                  isim = isimStyleContent.replace(/["']/g, '') || 'Belirtilmemiş'
                }
              } else {
                // Sahibinden değilse, kurumsal bilgileri al
                const sirketElement = document.querySelector('.user-info-store-name a')
                if (sirketElement) {
                  sirket = sirketElement.getAttribute('title') || 'Belirtilmemiş'
                }

                const isimElement = document.querySelector('.user-info-agent h3') as HTMLElement
                if (isimElement) {
                  isim = isimElement.innerText.trim() || 'Belirtilmemiş'
                }

                const telefonElement = document.querySelector('.user-info-phones dd') as HTMLElement
                if (telefonElement) {
                  telefonNo = telefonElement.innerText.trim() || 'Belirtilmemiş'
                }
              }

              return {
                adaNo,
                parselNo,
                kimden,
                telefonNo,
                isim,
                sirket,
                imar
              }
            })

            item.adaNo = details.adaNo
            item.parselNo = details.parselNo
            item.kimden = details.kimden
            item.telefonNo = details.telefonNo
            item.isim = details.isim
            item.sirket = details.sirket
            item.imar = details.imar

            await delay(Math.floor(Math.random() * 1000) + 2000)
          } catch (error) {
            console.log(`Error processing link ${item.link}:`, error)
            continue
          }
        }

        if (!isNaN(item.adaNo) && !isNaN(item.parselNo)) {
          allData.push(item)
        }

        if (allData.length >= 250) {
          break
        }
      }

      if (allData.length >= 250 || data.length < 50) {
        break
      }

      pageCount++
    } catch (error) {
      console.log(`Error navigating to page ${pagedUrl}:`, error)
    } finally {
      await browser.close()
      if (forceLoginEncountered) {
        continue
      }
    }
  }

  return allData.slice(0, 250)
}
