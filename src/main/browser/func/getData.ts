/* eslint-disable no-unsafe-finally */
import { getSettingsJson } from '@/lib'
import axios from 'axios'
import http from 'http'
import https from 'https'
import * as cheerio from 'cheerio'
import { isSearchCancelled, currentSearchId } from '../../cancelState'
import { TempStorage } from './tempStorage'
/* eslint-disable @typescript-eslint/no-explicit-any */

// Bellek sızıntısını (bağlantı havuzu şişmesi) önlemek için özel axios istemcisi
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false })
})

async function fetchScriptContent(url: string) {
  try {
    const headers = {
      Cookie:
        'userid=undefined; COOKIE_TY.IsUserAgentMobileOrTablet=false; hvtb=1; VisitCount=1; SearchMode=1; platform=web; FirstSession=0; __cf_bm=EbzlC27ecBqKkYBSntn0VeKUSTiP2hu.0h3mI0jmuuA-1736601761-1.0.1.1-DS_VX2WNNQzlQHZvlUgy55TIFqme2ublZT5r9enzXy.jv3oGfPjyYBcY1E1F2ACCJbNynehLhBhyoZ3ziaJ82w; __cflb=04dToXpE75gnanWf1Jct5BHNFbbVQqWDiiELspsLhK; _cfuvid=D0zw2yXwAIrBwASc8_2aJu_gdak0593B18YXWW3vQu0-1736601761129-0.0.1.1-604800000; _ga_1=GS1.1.1736601760.1.0.1736601760.0.0.1336485586; _ga=GA1.1.1652191714.1734013764; OptanonConsent=isGpcEnabled=0&datestamp=Sat+Jan+11+2025+16%3A23%3A01+GMT%2B0300+(GMT%2B03%3A00)&version=202402.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&genVendors=V77%3A0%2CV67%3A0%2CV79%3A0%2CV71%3A0%2CV69%3A0%2CV7%3A0%2CV5%3A0%2CV9%3A0%2CV1%3A0%2CV70%3A0%2CV3%3A0%2CV68%3A0%2CV78%3A0%2CV17%3A0%2CV76%3A0%2CV80%3A0%2CV16%3A0%2CV72%3A0%2CV10%3A0%2CV40%3A0%2C&consentId=f31a483f-977c-44be-9902-52c1c26c4dd0&interactionCount=1&isAnonUser=1; LegalRequirementConfirmed=confirmed'
    }

    // Sadece ham HTML stringini al, destructure ile axios response nesnesini hemen serbest bırak
    const { data: rawHtml } = await axiosInstance.get<string>(url, { headers })

    // Cheerio'yu yükle, script içeriklerini çıkar ve DOM'u hemen serbest bırak
    let matchingScript: string | null = null
    {
      const $ = cheerio.load(rawHtml)
      const scripts = $('script')
        .map((_, el) => $(el).html())
        .get()
      matchingScript = scripts.find((c) => c?.includes('__envoy__SHARED_PROPS')) ?? null
      // $ ve rawHtml bu scope'tan çıkınca GC tarafından toplanabilir
    }

    if (!matchingScript) {
      console.log(url)
      return {}
    }

    const rawJson = matchingScript.split('window["__envoy__SHARED_PROPS"]=')[1]
    if (!rawJson) {
      console.log(url)
      return {}
    }

    // matchingScript artık gerekmez
    matchingScript = null

    let jsonObject: any = JSON.parse(rawJson)

    if (!jsonObject?.product) {
      console.log('No product data found in the parsed script.')
      jsonObject = null
      return {}
    }

    const product = jsonObject.product

    const attributes = (product.attributes || []).reduce(
      (acc: any, attribute: any) => {
        const keyName = attribute?.key?.name
        const valueName = attribute?.value?.name
        if (keyName && valueName) acc[keyName] = valueName
        return acc
      },
      {}
    )

    const productId = product.id

    // Açıklama API'sini çek, sadece result kısmını al, büyük response nesnesini serbest bırak
    let descriptions: any[] = []
    try {
      const { data: descResponseData } = await axiosInstance.get(
        `https://apigw.trendyol.com/discovery-pdp-websfxcomponentread-santral/${productId}`
      )
      descriptions = descResponseData?.result?.descriptions ?? []
      // descResponseData büyük olabilir, erken serbest bırak
    } catch {
      descriptions = []
    }

    const açıklama = descriptions
      .filter((d: any) => d?.priority === 0)
      .map((d: any) => d?.text)
      .join(' ')

    // descriptions artık gerekmez
    descriptions = []

    const dictionary: any = {
      url: url,
      groupId: product.productGroupId,
      details: {
        isim: product.name || 'Belirtilmemiş',
        productId: product.id || 'Belirtilmemiş',
        marka: product.brand?.name || 'Belirtilmemiş',
        Kategori: product.category?.name || 'Belirtilmemiş',
        KategoriHiyerarsi: product.category?.hierarchy || 'Belirtilmemiş',
        saticiAdi: product.merchantListing?.merchant?.name || 'Belirtilmemiş',
        saticiId: product.merchantListing?.merchant?.id || 'Belirtilmemiş',
        saticiSehri: product.merchantListing?.merchant?.cityName || 'Belirtilmemiş',
        saticiEmail:
          product.merchantListing?.merchant?.registeredEmailAddress || 'Belirtilmemiş',
        code: product.productCode || 'Belirtilmemiş',
        indirimliFiyati:
          product.merchantListing?.winnerVariant?.price?.discountedPrice?.value ??
          'Belirtilmemiş',
        SatisFiyati:
          product.merchantListing?.winnerVariant?.price?.sellingPrice?.value ??
          'Belirtilmemiş',
        OrjinalFiyati:
          product.merchantListing?.winnerVariant?.price?.originalPrice?.value ??
          'Belirtilmemiş',
        KuponluFiyatı:
          product.merchantListing?.winnerVariant?.price?.couponApplicablePrice?.value ??
          'Belirtilmemiş',
        vergi: product.tax ?? 'Belirtilmemiş',
        ortalamaDegerlendirme: product.ratingScore?.averageRating ?? 'Belirtilmemiş',
        toplamDegerlendirmeSayısı: product.ratingScore?.totalCount ?? 'Belirtilmemiş',
        toplamYorumSayısı: product.ratingScore?.commentCount ?? 'Belirtilmemiş',
        bedavaKargo:
          typeof product.merchantListing?.winnerVariant?.freeCargo !== 'undefined'
            ? product.merchantListing?.winnerVariant?.freeCargo
              ? 'bedava'
              : 'bedava değil'
            : 'belirtilmemiş',
        attributes,
        açıklama,
        images: product.images || [],
        sizes: (product.variants || []).map((variant: any) => ({
          itemNumber: variant?.itemNumber,
          beden: variant?.value,
          barcode: variant?.barcode || product.variants?.[0]?.barcode || '',
          inStock: variant?.inStock ? 'Stokta var' : 'Stokta yok'
        }))
      }
    }

    // Büyük jsonObject'i GC'e bırak
    jsonObject = null

    return dictionary
  } catch (error) {
    console.log('Error fetching or parsing data:', error)
    return {}
  }
}

export const getData = async (url: string, onProgress?: (progress: any) => void) => {
  const mySearchId = currentSearchId
  // TempStorage: veriler 10'ar üründe bir diske yazılır, bellekte birikmez
  const storage = new TempStorage('trendyol', 10)
  const linkSet = new Set<string>()
  const productGroupSet = new Set<string>()
  let pageUrl = ''
  let extraQueryParams = ''

  try {
    const urlObj = new URL(url)
    if (!urlObj.hostname.includes('trendyol.com')) {
      return []
    }
    urlObj.searchParams.delete('pi')
    pageUrl = urlObj.pathname.replace(/^\//, '') // "sr" veya "kadin-gomlek-x-g1-c75"
    extraQueryParams = urlObj.searchParams.toString() // "wc=104103&prc=50-200&..."
  } catch {
    return []
  }

  if (!pageUrl) {
    return []
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
      if (isSearchCancelled || mySearchId !== currentSearchId) break

      const extraParamsStr = extraQueryParams ? `&${extraQueryParams}` : ''
      const { data } = await axiosInstance.get(
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
      const products: any[] = data.products || []

      for (const product of products) {
        productGroupSet.add(product.groupId)
        linkSet.add('https://www.trendyol.com' + product.url)
        if (linkSet.size >= productNumber) break
      }

      if (products.length === 0 || linkSet.size >= productNumber) break
    }
  } catch (error) {
    console.error('Data fetch error:', error)
  }

  if (variant) {
    const uniqueProductGroups = Array.from(productGroupSet)
    // Chunk helper - inline, küçük scope
    const chunks: string[][] = []
    for (let i = 0; i < uniqueProductGroups.length; i += 24) {
      chunks.push(uniqueProductGroups.slice(i, i + 24))
    }

    await Promise.all(
      chunks.map(async (group) => {
        if (isSearchCancelled || mySearchId !== currentSearchId) return
        const queryParams = group.map((id) => `productGroupIds=${id}`).join('%')
        const variantUrl = `https://apigw.trendyol.com/discovery-sfint-search-service/api/search/color-variants?${queryParams}&channelId=1&storefrontId=1&culture=tr-TR`

        try {
          const { data: results } = await axiosInstance.get(variantUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'CF-IPCountry': 'TR',
              'accept-language': 'tr,en-US;q=0.9,en;q=0.8',
              Cookie: 'countryCode=TR;'
            }
          })
          for (const groupId of Object.keys(results || {})) {
            for (const product of results[groupId] || []) {
              linkSet.add('https://www.trendyol.com' + product.url)
            }
          }
        } catch (error) {
          console.error('Data fetch error:', error)
        }
      })
    )
  }

  // productGroupSet artık gerekmez
  productGroupSet.clear()

  const uniqueLinks = Array.from(linkSet)
  // linkSet'i temizle, uniqueLinks yeterli
  linkSet.clear()

  let counter = 1
  const leng = uniqueLinks.length
  let consecutiveFailures = 0
  const maxFailures = 15

  // Fetch script content for all products
  for (const link of uniqueLinks) {
    if (isSearchCancelled || mySearchId !== currentSearchId) {
      console.log('Arama kullanıcı tarafından veya yeni arama başlatıldığı için iptal edildi.')
      break
    }
    const result = await fetchScriptContent(link)
    if (result.url && result.url.trim()) {
      storage.push(result)
      consecutiveFailures = 0
    } else {
      consecutiveFailures++
      if (consecutiveFailures >= maxFailures) {
        console.warn(`Üst üste ${maxFailures} üründen veri alınamadı. İşlem durduruluyor.`)
        if (storage.count === 0) {
          storage.cleanup()
          throw new Error(
            `Üst üste ${maxFailures} üründen veri alınamadı. Trendyol sayfa yapısı değişmiş veya IP adresiniz engellenmiş olabilir.`
          )
        } else {
          break
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
    const percentVal = ((counter++ / leng) * 100).toFixed(2)

    if (counter % 50 === 0) {
      if (global.gc) {
        try {
          global.gc()
        } catch {
          // GC disabled
        }
      }
    }

    // Sadece her 10 üründe bir veya en sonda arayüze mesaj göndererek IPC darboğazını (Crash) önle
    if (counter % 10 === 0 || counter > leng) {
      if (typeof onProgress === 'function') {
        onProgress({
          percent: percentVal,
          total: leng,
          success: storage.count,
          failed: counter - 1 - storage.count
        })
      }
    }
  }

  if (typeof onProgress === 'function') {
    onProgress({ message: '' })
  }

  if (storage.count === 0 && uniqueLinks.length > 0) {
    storage.cleanup()
    throw new Error(
      'Hiçbir üründen veri alınamadı. Trendyol sayfa yapısı değişmiş veya IP adresiniz engellenmiş olabilir.'
    )
  }

  // Diskten oku, geçici dosyayı sil, sonuçları döndür
  return storage.finalize()
}

export const getData2 = async (urls: string[]) => {
  const mySearchId = currentSearchId
  const storage = new TempStorage('trendyol2', 10)
  let consecutiveFailures = 0
  const maxFailures = 15

  for (const link of urls) {
    if (isSearchCancelled || mySearchId !== currentSearchId) break
    const result = await fetchScriptContent(link)
    if (result.url && result.url.trim()) {
      storage.push(result)
      consecutiveFailures = 0
    } else {
      consecutiveFailures++
      if (consecutiveFailures >= maxFailures) {
        if (storage.count === 0) {
          storage.cleanup()
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

  if (storage.count === 0 && urls.length > 0) {
    storage.cleanup()
    throw new Error(
      'Hiçbir üründen veri alınamadı. Trendyol sayfa yapısı değişmiş veya IP adresiniz engellenmiş olabilir.'
    )
  }

  return storage.finalize()
}
