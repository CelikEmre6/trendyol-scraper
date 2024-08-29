/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import CDP from 'chrome-remote-interface'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

type ProxyConfig = {
  host?: string
  port?: number
  username?: string
  password?: string
}

export const real = async ({
  proxy = {}
}: {
  proxy: ProxyConfig
}): Promise<{
  browser: any
  page: any
}> => {
  const launch = (await import('chrome-launcher')).launch

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    try {
      const chromeFlags = ['--no-sandbox']
      if (proxy && proxy.host && proxy.host.length > 0) {
        chromeFlags.push(`--proxy-server=${proxy.host}:${proxy.port}`)
      }
      const chrome = await launch({
        chromeFlags
      })

      const cdpSession = await CDP({ port: chrome.port })

      const { Network, Page, Runtime } = cdpSession

      await Runtime.enable()
      await Network.enable()
      await Page.enable()
      await Page.setLifecycleEventsEnabled({ enabled: true })

      const data = await axios
        .get('http://127.0.0.1:' + chrome.port + '/json/version')
        .then((response) => {
          console.log(response.data)
          return response.data.webSocketDebuggerUrl
        })
        .catch((err) => {
          throw new Error(err.message)
        })

      puppeteer.use(StealthPlugin())

      const browser = await puppeteer.connect({
        targetFilter: (target) => !!target.url(),
        browserWSEndpoint: data
      })
      browser.close = async () => {
        if (cdpSession) {
          await cdpSession.close()
        }
        if (chrome) {
          await chrome.kill()
        }
      }
      const pages = await browser.pages()
      const page = pages[0]
      if (proxy && proxy.username && proxy.password && proxy.username.length > 0) {
        await page.authenticate({
          username: proxy.username,
          password: proxy.password
        })
      }
      await page.setUserAgent(data['User-Agent'])
      await page.setViewport({
        width: 1920,
        height: 1080
      })
      resolve({
        browser: browser,
        page: page
      })
    } catch (err: any) {
      console.log(err)
      throw new Error(err.message)
    }
  })
}
