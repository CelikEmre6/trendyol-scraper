/* eslint-disable no-unsafe-finally */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { connect } from '..'
interface ListingData {
  [key: string]: string | string[]
}

export const getData = async (url: string) => {
  const allData: any[] = []
  let pageCount = 1
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

    //const pagedUrl = `${url}&pagingOffset=${pageCount * 50}`
    const pagedUrl = url
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

          const priceText =
            (
              row.querySelector(
                'td.searchResultsPriceValue .classified-price-container span'
              ) as any
            )?.innerText.trim() || null
          const price = priceText ? priceText : null

          const location =
            (row.querySelector('td.searchResultsLocationValue.true') as any)?.innerText.trim() ||
            null

          results.push({
            title,
            link: link ? `https://www.sahibinden.com${link}` : null,
            imageUrl,
            price,
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
              const listingData: ListingData = {}

              // `ul` etiketinin içindeki `li` etiketlerini bul
              const infoList = document.querySelector('ul.classifiedInfoList')
              if (infoList) {
                const items = infoList.querySelectorAll('li')
                if (items) {
                  items.forEach((item) => {
                    // `strong` etiketini bul ve kontrol et
                    const strongElement = item.querySelector('strong')
                    const spanElement = item.querySelector('span')

                    if (strongElement && spanElement) {
                      const key = strongElement.textContent?.trim().replace(':', '') || ''
                      const value = spanElement.textContent?.trim() || ''
                      // Anahtar-değer çiftini nesneye ekle
                      listingData[key] = value
                    }
                  })
                }
              }
              let telefonNo = 'Belirtilmemiş'
              let isim = 'Belirtilmemiş'
              let sirket = 'Belirtilmemiş'

              // Kimden bilgisine göre telefon ve isim alıyoruz
              if (listingData.Kimden === 'Sahibinden') {
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
              const imageElements = document.querySelectorAll(
                `#classifiedDetail > div > div.classifiedDetailContent > div.classifiedDetailPhotos > div.classifiedDetailThumbListContainer > ul > li > label > img`
              )

              // Resim linklerini saklayacağımız bir dizi oluşturuyoruz
              const imageLinks: string[] = []

              // 'li' elemanlarını seçiyoruz
              const listItems = document.querySelectorAll('ul.classifiedDetailThumbList > li')

              // Her bir 'li' elemanını kontrol ediyoruz
              listItems.forEach((listItem) => {
                // 'li' içindeki 'img' elemanlarını seçiyoruz
                const img = listItem.querySelector('img') as HTMLImageElement | null
                if (img && img.src) {
                  imageLinks.push(img.src)
                }
              })

              listingData['Resimler'] = imageLinks
              listingData['TelefonNo'] = telefonNo
              listingData['Satıcı'] = isim
              listingData['Şirket'] = sirket
              return listingData
            })

            item.detaylar = details

            await delay(Math.floor(Math.random() * 1000) + 2000)
          } catch (error) {
            console.log(`Error processing link ${item.link}:`, error)
            continue
          }
        }

        if (item.link) {
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
