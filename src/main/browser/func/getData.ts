/* eslint-disable no-unsafe-finally */
import axios from 'axios'
import cheerio from 'cheerio'
/* eslint-disable @typescript-eslint/no-explicit-any */

interface Product {
  productId: number
  url: string
  details: any[]
  productGroupId: number
}

interface GroupedProducts {
  [productGroupId: number]: Product[]
}

async function fetchScriptContent(url: string) {
  try {
    const { data } = await axios.get(url)
    const $ = cheerio.load(data)
    const scriptContents = $('script')
      .map((i, el) => $(el).html())
      .get()
    const matchingScript = scriptContents.find((content) => content?.includes('inStock'))
    const jsonRegex = /window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*(\{.*?\});/s
    const match = matchingScript.match(jsonRegex)

    if (match) {
      const jsonString = match[1]
      const jsonObject = JSON.parse(jsonString)
      const attributes = jsonObject.product.attributes.reduce((acc, attribute) => {
        const keyName = attribute.key.name
        const valueName = attribute.value.name
        acc[keyName] = valueName
        return acc
      }, {})

      const dictionary: any = {
        basketCount: jsonObject.product.socialProof.basketCount || 'Belirtilmemiş',
        pageViewCount: jsonObject.product.socialProof.pageViewCount || 'Belirtilmemiş',
        favoriteCount: jsonObject.product.socialProof.favoriteCount || 'Belirtilmemiş',
        tax: jsonObject.product.tax || 'Belirtilmemiş',
        averageRating: jsonObject.product.ratingScore.averageRating || 'Belirtilmemiş',
        totalRatingCount: jsonObject.product.ratingScore.totalRatingCount || 'Belirtilmemiş',
        totalCommentCount: jsonObject.product.ratingScore.totalCommentCount || 'Belirtilmemiş',
        brand: jsonObject.product.brand.name || 'Belirtilmemiş',
        freeCargo: jsonObject.product.isFreeCargo || 'Belirtilmemiş',
        attributes,
        discountedPrice:
          jsonObject.product.variants[0].price.discountedPrice.value || 'Belirtilmemiş',
        sellingPrice: jsonObject.product.variants[0].price.sellingPrice.value || 'Belirtilmemiş',
        originalPrice: jsonObject.product.variants[0].price.originalPrice.value || 'Belirtilmemiş',
        couponApplicablePrice:
          jsonObject.product.variants[0].price.couponApplicablePrice || 'Belirtilmemiş',
        category: jsonObject.product.category.name || 'Belirtilmemiş',
        categoryHierarchy: jsonObject.product.category.hierarchy || 'Belirtilmemiş',
        name: jsonObject.product.name || 'Belirtilmemiş',
        description: jsonObject.product.descriptions
          .sort((a, b) => a.priority - b.priority)
          .map((description) => description.text)
          .join(' '),
        images: jsonObject.product.images || [],
        sizes: jsonObject.product.allVariants.reduce((acc, variant) => {
          acc[variant.itemNumber] = {
            value: variant.value,
            barcode: variant.barcode,
            inStock: variant.inStock
          }
          return acc
        }, {})
      }
      return dictionary
    } else {
      console.log("No 'allVariants' found in the script.")
      return {}
    }
  } catch (error) {
    console.log('Error fetching or parsing data:', error)
  }
}

export const getData = async (url: string, onProgress?: (progress: number) => void) => {
  const allData: any[] = []
  const groupedProducts: GroupedProducts = {}
  // let pageUrl = ''
  // if (url.includes('pi=')) {
  //   return allData
  // }
  // if (url.includes('?')) {
  //   pageUrl = url + '&pi='
  // } else {
  //   pageUrl = url + '?pi='
  // }
  try {
    for (let page = 1; page <= 10; page++) {
      const response = await axios.get(
        `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/erkek-gomlek-x-g2-c75?pi=${page}`
      )
      // const response = await axios.get(pageUrl + page)
      const data = response.data
      const products = data.result?.products || []
      if (products.length == 0 || page == 60) {
        break
      }

      products.forEach((product: any) => {
        const groupId = product.productGroupId
        if (!groupedProducts[groupId]) {
          groupedProducts[groupId] = []
        }
        groupedProducts[groupId].push({
          productId: product.id,
          url: 'https://www.trendyol.com' + product.url,
          details: [],
          productGroupId: groupId
        })
      })
    }
  } catch (error) {
    console.error('Data fetch error:', error)
  }

  const groupedProductIds = Object.keys(groupedProducts)

  function chunkArray(arr: string[], size: number): string[][] {
    const chunks: string[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }

  const productGroupsChunks = chunkArray(groupedProductIds, 24)
  const groupedProducts2: GroupedProducts = {}

  await Promise.all(
    productGroupsChunks.map(async (group) => {
      const queryParams = group.map((id) => `productGroupIds=${id}`).join('&')
      const url = `https://public.trendyol.com/discovery-web-websfxproductgroups-santral/api/v2/product-groups?${queryParams}`

      try {
        const response = await axios.get(url)
        const results = response.data?.result || []

        Object.keys(results).forEach((groupId) => {
          const products = results[groupId] || []

          products.forEach((product: any) => {
            if (!groupedProducts2[groupId]) {
              groupedProducts2[groupId] = []
            }
            groupedProducts2[groupId].push({
              productId: product.id,
              url: 'https://www.trendyol.com' + product.url,
              details: [],
              productGroupId: groupId
            })
          })
        })
      } catch (error) {
        console.error('Data fetch error:', error)
      }
    })
  )

  function addMissingGroupsToSecond(
    groupedProducts1: GroupedProducts,
    groupedProducts2: GroupedProducts
  ): GroupedProducts {
    const updatedGroupedProducts2 = { ...groupedProducts2 }

    Object.keys(groupedProducts1).forEach((groupId) => {
      if (!updatedGroupedProducts2[groupId]) {
        updatedGroupedProducts2[groupId] = groupedProducts1[groupId]
      }
    })

    return updatedGroupedProducts2
  }

  const updatedGroupedProducts2 = addMissingGroupsToSecond(groupedProducts, groupedProducts2)
  let counter = 1
  const leng = Object.values(updatedGroupedProducts2).reduce(
    (sum, products) => sum + (products ? products.length : 0),
    0
  )
  // Fetch script content for all products
  for (const groupId of Object.keys(updatedGroupedProducts2)) {
    const products = updatedGroupedProducts2[groupId] || []
    for (const product of products) {
      product.details = await fetchScriptContent(product.url)
      await new Promise((resolve) => setTimeout(resolve, 100)) // 300 ms bekleme
      const progress = ((counter++ / leng) * 100).toFixed(2)
      onProgress(parseFloat(progress))
    }
  }

  const results: any[] = []
  Object.keys(updatedGroupedProducts2).forEach((groupId) => {
    const productsSon = updatedGroupedProducts2[groupId] || []

    productsSon.forEach((product: any) => {
      const id = product.id
      const link = product.url
      const details = product.details
      const gId = product.productGroupId
      results.push({
        id,
        link,
        details,
        gId
      })
    })
  })

  return results
}

//     if (forceLoginEncountered) {
//       console.log('Force login encountered, reopening browser...')
//       forceLoginEncountered = false
//     }
//     let pagedUrl = ''
//     if (url.includes('?')) {
//       pagedUrl = `${url}&pagingOffset=${pageCount * 50}&pagingSize=50`
//     } else {
//       pagedUrl = `${url}?pagingOffset=${pageCount * 50}&pagingSize=50`
//     }
//     try {
//       await page.goto(pagedUrl, {
//         waitUntil: 'domcontentloaded'
//       })
//       await page.waitForSelector('.searchResultsFirstColumn', {
//         timeout: 60000
//       })

//       const advertNotFound = await page.evaluate(() => {
//         return document.body.innerText.includes('Arama filtrelerine uygun ilan bulunamadı.')
//       })
//       if (advertNotFound) {
//         console.log('ilan bulunumadı')
//         break
//       }

//       const data = await page.evaluate(() => {
//         const rows = document.querySelectorAll('tr.searchResultsItem')
//         const results: any[] = []

//         rows.forEach((row) => {
//           const titleElement = row.querySelector('a.classifiedTitle')
//           const title = titleElement ? titleElement.getAttribute('title') : null
//           const link = titleElement ? titleElement.getAttribute('href') : null

//           const imageElement = row.querySelector('td.searchResultsLargeThumbnail img')
//           const imageUrl = imageElement ? imageElement.getAttribute('src') : null

//           const priceText =
//             (
//               row.querySelector(
//                 'td.searchResultsPriceValue .classified-price-container span'
//               ) as any
//             )?.innerText.trim() || null
//           const price = priceText ? priceText : null

//           // const location =
//           //   (row.querySelector('td.searchResultsLocationValue.true') as any)?.innerText.trim() ||
//           //   null

//           results.push({
//             title,
//             link: link ? `https://www.sahibinden.com${link}` : null,
//             imageUrl,
//             price
//           })
//         })

//         return results
//       })
//       for (const item of data) {
//         if (item.link) {
//           try {
//             // Detay sayfasına git ve gerekli bilgileri al
//             await page.goto(item.link, {
//               waitUntil: 'domcontentloaded'
//             })

//             await delay(1250)

//             const pageNotFound = await page.evaluate(() => {
//               return document.body.innerText.includes('Aradığınız sayfa artık bulunamıyor.')
//             })

//             const forceLogin = await page.evaluate(() => {
//               return (
//                 document.body.innerText.includes('giriş yapmanız gerekmektedir') ||
//                 document.body.innerText.includes('you need to log in')
//               )
//             })

//             if (pageNotFound) {
//               console.log(`Aradığınız sayfa artık bulunamıyor: ${item.link}`)
//               continue
//             }

//             if (forceLogin) {
//               console.log(`Giriş yapmanız gerekmektedir: ${item.link}`)
//               forceLoginEncountered = true
//               break
//             }

//             await page.waitForSelector('.classifiedDetailTitle', {
//               timeout: 10000
//             })

//             const details = await page.evaluate(() => {
//               const listingData: ListingData = {}

//               // `ul` etiketinin içindeki `li` etiketlerini bul
//               const infoList = document.querySelector('ul.classifiedInfoList')
//               if (infoList) {
//                 const items = infoList.querySelectorAll('li')
//                 if (items) {
//                   items.forEach((item) => {
//                     // `strong` etiketini bul ve kontrol et
//                     const strongElement = item.querySelector('strong')
//                     const spanElement = item.querySelector('span')

//                     if (strongElement && spanElement) {
//                       const key = strongElement.textContent?.trim().replace(':', '') || ''
//                       const value = spanElement.textContent?.trim() || ''
//                       // Anahtar-değer çiftini nesneye ekle
//                       listingData[key] = value
//                     }
//                   })
//                 }
//               }
//               let telefonNo = 'Belirtilmemiş'
//               let isim = 'Belirtilmemiş'
//               let sirket = 'Belirtilmemiş'

//               // Kimden bilgisine göre telefon ve isim alıyoruz
//               if (listingData.Kimden === 'Sahibinden') {
//                 telefonNo =
//                   document
//                     .querySelector('#phoneInfoPart > li > span.pretty-phone-part.show-part > span')
//                     ?.getAttribute('data-content') || 'Belirtilmemiş'

//                 const isimElement = document.querySelector('.username-info-area h5 span')
//                 if (isimElement) {
//                   const isimStyleContent = window.getComputedStyle(isimElement, ':before').content
//                   isim = isimStyleContent.replace(/["']/g, '') || 'Belirtilmemiş'
//                 }
//               } else if (listingData.Kimden) {
//                 // Sahibinden değilse, kurumsal bilgileri al
//                 const sirketElement = document.querySelector('.user-info-store-name a')
//                 if (sirketElement) {
//                   sirket = sirketElement.getAttribute('title') || 'Belirtilmemiş'
//                 }

//                 const isimElement = document.querySelector('.user-info-agent h3') as HTMLElement
//                 if (isimElement) {
//                   isim = isimElement.innerText.trim() || 'Belirtilmemiş'
//                 }

//                 const telefonElement = document.querySelector('.user-info-phones dd') as HTMLElement
//                 if (telefonElement) {
//                   telefonNo = telefonElement.innerText.trim() || 'Belirtilmemiş'
//                 }
//               } else {
//                 telefonNo =
//                   document
//                     .querySelector('#phoneInfoPart > li > span.pretty-phone-part.show-part > span')
//                     ?.getAttribute('data-content') || 'Belirtilmemiş'

//                 const isimElement = document.querySelector('.username-info-area h5 span')
//                 if (isimElement) {
//                   const isimStyleContent = window.getComputedStyle(isimElement, ':before').content
//                   isim = isimStyleContent.replace(/["']/g, '') || 'Belirtilmemiş'
//                 }
//               }
//               const explanationElement = document.querySelector(
//                 '#classifiedDescription'
//               ) as HTMLElement
//               const explanation = explanationElement ? explanationElement.innerText.trim() : ''

//               const ilElement = document.querySelector(
//                 '#classifiedDetail > div > div.classifiedDetailContent > div.classifiedInfo > h2 > a:nth-child(1)'
//               ) as HTMLElement
//               const il = ilElement ? ilElement.innerText : ''

//               const ilceElement = document.querySelector(
//                 '#classifiedDetail > div > div.classifiedDetailContent > div.classifiedInfo > h2 > a:nth-child(3)'
//               ) as HTMLElement
//               const ilce = ilceElement ? ilceElement.innerText : ''

//               const mahElement = document.querySelector(
//                 '#classifiedDetail > div > div.classifiedDetailContent > div.classifiedInfo > h2 > a:nth-child(5)'
//               ) as HTMLElement
//               const mahalle = mahElement ? mahElement.innerText : ''
//               // Resim linklerini saklayacağımız bir dizi oluşturuyoruz
//               const imageLinks: string[] = []

//               // 'li' elemanlarını seçiyoruz
//               const listItems = document.querySelectorAll('ul.classifiedDetailThumbList > li')

//               // Her bir 'li' elemanını kontrol ediyoruz
//               listItems.forEach((listItem) => {
//                 // 'li' içindeki 'img' elemanlarını seçiyoruz
//                 const img = listItem.querySelector('img') as HTMLImageElement | null
//                 if (img && img.src) {
//                   imageLinks.push(img.src.replace('thmb_', ''))
//                 }
//               })
//               listingData['il'] = il
//               listingData['ilce'] = ilce
//               listingData['mahalle'] = mahalle
//               listingData['Resimler'] = imageLinks
//               listingData['TelefonNo'] = telefonNo
//               listingData['Satıcı'] = isim
//               listingData['Şirket'] = sirket
//               listingData['Açıklama'] = explanation
//               return listingData
//             })
//             item.il = details.il
//             item.ilce = details.ilce
//             item.location = details.mahalle
//             delete details.il
//             delete details.ilce
//             delete details.mahalle
//             item.detaylar = details

//             await delay(Math.floor(Math.random() * 1000) + 2000)
//           } catch (error) {
//             console.log(`Error processing link ${item.link}:`, error)
//             continue
//           }
//         }

//         if (item.link) {
//           allData.push(item)
//         }

//         if (allData.length >= 250) {
//           break
//         }
//       }

//       if (allData.length >= 250 || data.length < 50) {
//         break
//       }

//       pageCount++
//     } catch (error) {
//       console.log(`Error navigating to page ${pagedUrl}:`, error)
//     } finally {
//       await browser.close()
//       if (forceLoginEncountered) {
//         continue
//       }
//     }
//   }
//   return allData.slice(0, 250)
// }
