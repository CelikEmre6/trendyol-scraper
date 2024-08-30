import { Browser, Page } from 'puppeteer'

// Sayfanın belirli bir koordinatına tıklama fonksiyonu
const clickAtPosition = async (page: Page, x: number, y: number): Promise<void> => {
  await page.mouse.click(x, y)
}

// Sayfada CAPTCHA'nın durumunu kontrol eder ve çözümlemeye çalışır.
const checkStat = async ({ page }: { page: Page }): Promise<boolean> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<boolean>(async (resolve) => {
    const st = setTimeout(() => {
      clearTimeout(st)
      resolve(false)
    }, 4000)

    try {
      // Sayfa içeriğinde aradığınız metni bulmaya çalışın
      const textSelector = await page.evaluate(() => {
        const elements = [...document.querySelectorAll('body *')]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return elements.find(
          (element: any) =>
            element.innerText.includes(
              'Aşağıdaki işlemi tamamlayarak insan olduğunuzu doğrulayın.'
            ) || element.innerText.includes('Verify you are human by completing the action below.')
        )
      })

      if (textSelector) {
        console.log('Captcha detected')
        setCaptchaPage(true)
      } else {
        console.log('Captcha not detected')
        setCaptchaPage(false)
      }

      if (is_captcha_page) {
        clickAtPosition(page, 560, 300)
      }
      clearTimeout(st)
      resolve(true)
    } catch (err) {
      clearTimeout(st)
      resolve(false)
    }
  })
}

// CAPTCHA çözümleme durumunu tutar
let is_captcha_page = false

// CAPTCHA çözümleme durumunu ayarlar
export const setCaptchaPage = (status: boolean): void => {
  is_captcha_page = status
}

// Otomatik CAPTCHA çözümleme işlemini başlatır
export const autoSolve = async ({ page }: { page: Page; browser: Browser }): Promise<void> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async (resolve) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // random between 1.5 and 2.5 seconds
        const random = Math.random() * (2500 - 1500) + 1500
        await new Promise((resolve) => setTimeout(resolve, random))
        await checkStat({ page: page }).catch(() => {
          // CAPTCHA kontrolü sırasında hata oluşursa yakalanır
        })
      } catch (err) {
        // Döngü içerisindeki hatalar yakalanır
      }
    }
    resolve()
  })
}
