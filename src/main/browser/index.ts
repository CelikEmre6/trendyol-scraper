/* eslint-disable @typescript-eslint/no-explicit-any */
import { Browser, Page } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import { avoidFingerprints } from './module/avoid_fingerprints'
import { closeSession, startSession } from './module/chromium'
import { notice } from './module/notice'
import { autoSolve } from './module/turnstile'

let global_target_status = true

interface TargetFilterParams {
  target: Page
  skipTarget: string[]
}

const targetFilter = ({ target, skipTarget }: TargetFilterParams): boolean => {
  if (!global_target_status) {
    return true
  }
  let response = !!target.url()
  if (skipTarget.find((item) => target.url().includes(item))) {
    response = true
  }
  return response
}

const handleNewPage = async (page: Page): Promise<Page> => {
  await avoidFingerprints(page)
  return page
}

const setTarget = ({ status = true }: { status?: boolean }): void => {
  global_target_status = status
}

interface ConnectParams {
  args?: string[]
  headless?: boolean
  customConfig?: object
  proxy?:
    | {
        username?: string
        password?: string
      }
    | any
  skipTarget?: string[]
  fingerprint?: boolean
  turnstile?: boolean
  connectOption?: object
  tf?: boolean
}

export const connect = ({
  args = [],
  headless = false,
  customConfig = {},
  proxy = {},
  skipTarget = [],
  fingerprint = true,
  turnstile = false,
  connectOption = {},
  tf = true
}: ConnectParams): Promise<{
  browser: Browser
  page: Page
  cdpSession: any // Specify the correct type for cdpSession based on the chrome-remote-interface usage
  chrome: any // Specify the correct type for the Chrome instance from "chrome-launcher"
  setTarget: typeof setTarget
}> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    global_target_status = tf

    const { chromeSession, cdpSession, chrome } = await startSession({
      args,
      headless,
      customConfig,
      proxy
    })

    const browser = (await puppeteer.connect({
      targetFilter: ((target: Page) => targetFilter({ target, skipTarget })) as any,
      browserWSEndpoint: chromeSession.browserWSEndpoint,
      ...connectOption
    })) as Browser

    const pages = await browser.pages()
    const page = pages[0]

    if (proxy && proxy.username && proxy.password) {
      await page.authenticate({
        username: proxy.username,
        password: proxy.password
      })
    }

    if (fingerprint) {
      await handleNewPage(page)
    }
    if (turnstile) {
      autoSolve({ page, browser })
    }

    await page.setUserAgent(chromeSession.agent)

    await page.setViewport({
      width: 1920,
      height: 1080
    })

    browser.on('disconnected', async () => {
      notice({
        message: 'Browser Disconnected',
        type: 'info'
      })
      await closeSession({ cdpSession, chrome })
    })

    browser.on('targetcreated', async (target) => {
      const newPage = await target.page()
      if (newPage) {
        try {
          await newPage.setUserAgent(chromeSession.agent)
          await newPage.setViewport({
            width: 1920,
            height: 1080
          })

          if (fingerprint) {
            await handleNewPage(newPage)
          }

          if (turnstile) {
            autoSolve({ page: newPage, browser })
          }
        } catch (err) {
          console.error(err)
        }
      }
    })

    resolve({
      browser,
      page,
      cdpSession,
      chrome,
      setTarget
    })
  })
}
