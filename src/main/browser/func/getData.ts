/* eslint-disable no-unsafe-finally */
import { getSettingsJson } from '@/lib'
import { isSearchCancelled } from '../../cancelState'
import axios from 'axios'
import * as cheerio from 'cheerio'
/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchScriptContent(url: string) {
  try {
    const headers = {
      Cookie:
        'userid=undefined; COOKIE_TY.IsUserAgentMobileOrTablet=false; hvtb=1; VisitCount=1; SearchMode=1; platform=web; FirstSession=0; __cf_bm=EbzlC27ecBqKkYBSntn0VeKUSTiP2hu.0h3mI0jmuuA-1736601761-1.0.1.1-DS_VX2WNNQzlQHZvlUgy55TIFqme2ublZT5r9enzXy.jv3oGfPjyYBcY1E1F2ACCJbNynehLhBhyoZ3ziaJ82w; __cflb=04dToXpE75gnanWf1Jct5BHNFbbVQqWDiiELspsLhK; _cfuvid=D0zw2yXwAIrBwASc8_2aJu_gdak0593B18YXWW3vQu0-1736601761129-0.0.1.1-604800000; _ga_1=GS1.1.1736601760.1.0.1736601760.0.0.1336485586; _ga=GA1.1.1652191714.1734013764; OptanonConsent=isGpcEnabled=0&datestamp=Sat+Jan+11+2025+16%3A23%3A01+GMT%2B0300+(GMT%2B03%3A00)&version=202402.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&genVendors=V77%3A0%2CV67%3A0%2CV79%3A0%2CV71%3A0%2CV69%3A0%2CV7%3A0%2CV5%3A0%2CV9%3A0%2CV1%3A0%2CV70%3A0%2CV3%3A0%2CV68%3A0%2CV78%3A0%2CV17%3A0%2CV76%3A0%2CV80%3A0%2CV16%3A0%2CV72%3A0%2CV10%3A0%2CV40%3A0%2C&consentId=f31a483f-977c-44be-9902-52c1c26c4dd0&interactionCount=1&isAnonUser=1; LegalRequirementConfirmed=confirmed'
    }

    const { data } = await axios.get(url, { headers })
    const $ = cheerio.load(data)
    const scriptContents = $('script')
      .map((_, el) => $(el).html())
      .get()

    const matchingScript = scriptContents.find((content) =>
      content?.includes('__envoy__SHARED_PROPS')
    )

    let match: string | undefined
    if (matchingScript) {
      match = matchingScript.split('window["__envoy__SHARED_PROPS"]=')[1]
    }

    if (match) {
      const jsonObject = JSON.parse(match)

      if (!jsonObject || !jsonObject.product) {
        console.log('No product data found in the parsed script.')
        return {}
      }

      const attributes = (jsonObject.product.attributes || []).reduce(
        (acc: any, attribute: any) => {
          const keyName = attribute?.key?.name
          const valueName = attribute?.value?.name
          if (keyName && valueName) acc[keyName] = valueName
          return acc
        },
        {}
      )
      const productId = jsonObject.product.id
      const descData = await axios.get(
        `https://apigw.trendyol.com/discovery-pdp-websfxcomponentread-santral/${productId}`
      )
      const descDataJson = descData.data.result
      const dictionary: any = {
        url: url,
        groupId: jsonObject.product?.productGroupId,
        details: {
          isim: jsonObject.product?.name || 'Belirtilmemiş',
          productId: jsonObject.product?.id || 'Belirtilmemiş',
          marka: jsonObject.product?.brand?.name || 'Belirtilmemiş',
          Kategori: jsonObject.product?.category?.name || 'Belirtilmemiş',
          KategoriHiyerarsi: jsonObject.product?.category?.hierarchy || 'Belirtilmemiş',
          saticiAdi: jsonObject.product?.merchantListing?.merchant?.name || 'Belirtilmemiş',
          saticiId: jsonObject.product?.merchantListing?.merchant?.id || 'Belirtilmemiş',
          saticiSehri: jsonObject.product?.merchantListing?.merchant?.cityName || 'Belirtilmemiş',
          saticiEmail:
            jsonObject.product?.merchantListing?.merchant?.registeredEmailAddress ||
            'Belirtilmemiş',
          code: jsonObject.product?.productCode || 'Belirtilmemiş',
          indirimliFiyati:
            jsonObject.product?.merchantListing?.winnerVariant?.price?.discountedPrice?.value ??
            'Belirtilmemiş',
          SatisFiyati:
            jsonObject.product?.merchantListing?.winnerVariant?.price?.sellingPrice?.value ??
            'Belirtilmemiş',
          OrjinalFiyati:
            jsonObject.product?.merchantListing?.winnerVariant?.price?.originalPrice?.value ??
            'Belirtilmemiş',
          KuponluFiyatı:
            jsonObject.product?.merchantListing?.winnerVariant?.price?.couponApplicablePrice
              ?.value ?? 'Belirtilmemiş',
          vergi: jsonObject.product?.tax ?? 'Belirtilmemiş',
          ortalamaDegerlendirme: jsonObject.product?.ratingScore?.averageRating ?? 'Belirtilmemiş',
          toplamDegerlendirmeSayısı: jsonObject.product?.ratingScore?.totalCount ?? 'Belirtilmemiş',
          toplamYorumSayısı: jsonObject.product?.ratingScore?.commentCount ?? 'Belirtilmemiş',
          bedavaKargo:
            typeof jsonObject.product?.merchantListing?.winnerVariant?.freeCargo !== 'undefined'
              ? jsonObject.product?.merchantListing?.winnerVariant?.freeCargo
                ? 'bedava'
                : 'bedava değil'
              : 'belirtilmemiş',
          attributes,
          açıklama: (descDataJson?.descriptions || [])
            .filter((description: any) => description?.priority === 0)
            .map((description: any) => description?.text)
            .join(' '),
          images: jsonObject.product?.images || [],
          sizes: (jsonObject.product?.variants || []).map((variant: any) => ({
            itemNumber: variant?.itemNumber,
            beden: variant?.value,
            barcode: variant?.barcode || jsonObject.product?.variants?.[0]?.barcode || '',
            inStock: variant?.inStock ? 'Stokta var' : 'Stokta yok'
          }))
        }
      }

      return dictionary
    } else {
      console.log(url)
      return {}
    }
  } catch (error) {
    console.log('Error fetching or parsing data:', error)
    return {}
  }
}

export const getData = async (url: string, onProgress?: (progress: any) => void) => {
  const allData: any[] = []
  const links: string[] = []
  const productGroups: string[] = []
  let pageUrl = ''
  let extraQueryParams = ''

  try {
    const urlObj = new URL(url)
    if (!urlObj.hostname.includes('trendyol.com')) {
      return allData
    }
    urlObj.searchParams.delete('pi')
    pageUrl = urlObj.pathname.replace(/^\//, '') // "sr" veya "kadin-gomlek-x-g1-c75"
    extraQueryParams = urlObj.searchParams.toString() // "wc=104103&prc=50-200&..."
  } catch {
    return allData
  }

  if (!pageUrl) {
    return allData
  }
  if (typeof onProgress === 'function') {
    onProgress({ message: 'Ürün Linkleri Toplanıyor...' })
  }
  const settings = await getSettingsJson()
  const productNumber = settings.productNumber
  const trial = settings.licanceType === 'trial'
  const variant = settings.variant
  try {
    for (let page = 1; page <= (trial ? 1 : 250); page++) {
      if (isSearchCancelled) break
      // const response = await axios.get(
      //   `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/erkek-kazak-x-g2-c1092?pi=${page}`
      // )

      const extraParamsStr = extraQueryParams ? `&${extraQueryParams}` : ''
      const response = await axios.get(
        `https://apigw.trendyol.com/discovery-sfint-search-service/api/search/products?pathModel=${pageUrl}${extraParamsStr}&pi=${page}&channelId=1&storefrontId=1&culture=tr-TR`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'CF-IPCountry': 'TR',
            'accept-language': 'tr,en-US;q=0.9,en;q=0.8',
            Cookie: 'countryCode=TR;'
          }
        }
      )
      const data = response.data
      const products = data.products || []

      for (const product of products) {
        //const productUrl = 'https://www.trendyol.com' + product.url
        //console.log('Product URL:', productUrl)

        const groupId = product.groupId
        productGroups.push(groupId)
        if (!links.includes('https://www.trendyol.com' + product.url)) {
          links.push('https://www.trendyol.com' + product.url)
        }
        if (links.length >= productNumber) {
          break
        } //https://apigw.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/erkek-t-shirt-x-g2-c73?pi=1
      }

      if (products.length === 0 || links.length >= productNumber) {
        break
      }
    }
  } catch (error) {
    console.error('Data fetch error:', error)
  }

  function chunkArray(arr: string[], size: number): string[][] {
    const chunks: string[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }

  if (variant) {
    const uniqueProductGroups = Array.from(new Set(productGroups))
    const productGroupsChunks = chunkArray(uniqueProductGroups, 24)

    await Promise.all(
      productGroupsChunks.map(async (group) => {
        if (isSearchCancelled) return
        const queryParams = group.map((id) => `productGroupIds=${id}`).join('%')
        const url = `https://apigw.trendyol.com/discovery-sfint-search-service/api/search/color-variants?${queryParams}&channelId=1&storefrontId=1&culture=tr-TR`

        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'CF-IPCountry': 'TR',
              'accept-language': 'tr,en-US;q=0.9,en;q=0.8',
              Cookie: 'countryCode=TR;'
            }
          })
          const results = response.data || {}

          Object.keys(results).forEach((groupId) => {
            const products = results[groupId] || []

            products.forEach((product: any) => {
              links.push('https://www.trendyol.com' + product.url)
              console.log('Variant Product URL:', 'https://www.trendyol.com' + product.url)
            })
          })
        } catch (error) {
          console.error('Data fetch error:', error)
        }
      })
    )
  }

  const uniqueLinks = Array.from(new Set(links))
  let counter = 1
  const leng = uniqueLinks.length
  let consecutiveFailures = 0
  const maxFailures = 15

  // Fetch script content for all products
  for (const link of uniqueLinks) {
    if (isSearchCancelled) {
      console.log('Arama kullanıcı tarafından iptal edildi.')
      break
    }
    const result = await fetchScriptContent(link)
    if (result.url && result.url.trim()) {
      allData.push(result)
      consecutiveFailures = 0
    } else {
      consecutiveFailures++
      if (consecutiveFailures >= maxFailures) {
        console.warn(`Üst üste ${maxFailures} üründen veri alınamadı. İşlem durduruluyor.`)
        if (allData.length === 0) {
          throw new Error(
            `Üst üste ${maxFailures} üründen veri alınamadı. Trendyol sayfa yapısı değişmiş veya IP adresiniz engellenmiş olabilir.`
          )
        } else {
          break
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100)) // 300 ms bekleme
    const percentVal = ((counter++ / leng) * 100).toFixed(2)
    if (typeof onProgress === 'function') {
      onProgress({
        percent: percentVal,
        total: leng,
        success: allData.length,
        failed: (counter - 1) - allData.length
      })
    }
  }

  if (typeof onProgress === 'function') {
    onProgress({ message: '' })
  }

  if (allData.length === 0 && uniqueLinks.length > 0) {
    throw new Error(
      'Hiçbir üründen veri alınamadı. Trendyol sayfa yapısı değişmiş veya IP adresiniz engellenmiş olabilir.'
    )
  }

  return allData
}

export const getData2 = async (urls: string[]) => {
  const allData: any[] = []
  let consecutiveFailures = 0
  const maxFailures = 15

  for (const link of urls) {
    if (isSearchCancelled) break
    const result = await fetchScriptContent(link)
    if (result.url && result.url.trim()) {
      allData.push(result)
      consecutiveFailures = 0
    } else {
      consecutiveFailures++
      if (consecutiveFailures >= maxFailures) {
        if (allData.length === 0) {
          throw new Error(
            `Üst üste ${maxFailures} üründen veri alınamadı. Trendyol sayfa yapısı değişmiş veya IP adresiniz engellenmiş olabilir.`
          )
        } else {
          break
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  if (allData.length === 0 && urls.length > 0) {
    throw new Error(
      'Hiçbir üründen veri alınamadı. Trendyol sayfa yapısı değişmiş veya IP adresiniz engellenmiş olabilir.'
    )
  }

  return allData
}
