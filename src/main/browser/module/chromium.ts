/* eslint-disable @typescript-eslint/no-explicit-any */
import chromium from '@sparticuz/chromium'
import axios from 'axios'
import CDP, { Client } from 'chrome-remote-interface'

interface CustomConfig {
  executablePath?: string
  chromePath?: string
}

interface ProxyConfig {
  host: string
  port: number
}

interface SessionResult {
  chromeSession: {
    browserWSEndpoint: string
    agent: string
  }
  cdpSession: Client
  chrome: any // `launch` fonksiyonundan dönen chrome nesnesinin tipi. `any` yerine daha spesifik bir tip kullanılabilir.
}

// Chrome oturumunu kapatma işlevi
export const closeSession = async ({
  cdpSession,
  chrome
}: {
  cdpSession?: Client
  chrome?: any // Chrome nesnesi için doğru tipi ekleyin
}): Promise<boolean> => {
  if (cdpSession) {
    try {
      await cdpSession.close()
    } catch (err) {
      console.error(err)
    }
  }
  if (chrome) {
    try {
      await chrome.kill()
    } catch (err) {
      console.error(err)
    }
  }
  return true
}

// Yeni bir Chrome oturumu başlatma işlevi
export const startSession = ({
  args = [] as string[],
  headless = false,
  customConfig = {} as CustomConfig,
  proxy = {} as ProxyConfig
}): Promise<SessionResult> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<SessionResult>(async (resolve, reject) => {
    const chromeLauncher = await import('chrome-launcher')
    const { launch } = chromeLauncher
    try {
      const chromePath =
        customConfig.executablePath || customConfig.chromePath || (chromium as any).path

      const chromeFlags: string[] = [].concat(args as any)

      if (headless === true) {
        process.platform.includes('win') ? chromeFlags.push('--headless=new') : ''
      }

      if (proxy && proxy.host && proxy.host.length > 0) {
        chromeFlags.push(`--proxy-server=${proxy.host}:${proxy.port}`)
      }

      const chrome = await launch({
        chromePath,
        chromeFlags,
        ...customConfig
      })

      const cdpSession = (await CDP({ port: chrome.port })) as Client
      const { Network, Page, Runtime, DOM } = cdpSession

      await Promise.all([
        Page.enable(),
        Page.setLifecycleEventsEnabled({ enabled: true }),
        Runtime.enable(),
        Network.enable(),
        DOM.enable()
      ])

      const chromeSession = await axios
        .get(`http://localhost:${chrome.port}/json/version`)
        .then((response) => {
          const data = response.data
          return {
            browserWSEndpoint: data.webSocketDebuggerUrl,
            agent: data['User-Agent']
          }
        })
        .catch((err) => {
          throw new Error(err.message)
        })
      resolve({
        chromeSession: chromeSession,
        cdpSession: cdpSession,
        chrome: chrome
      })
    } catch (err: any) {
      console.log(err)
      reject(new Error(err.message))
    }
  })
}
