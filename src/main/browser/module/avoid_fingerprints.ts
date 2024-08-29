/* eslint-disable @typescript-eslint/no-explicit-any */
import { Page } from 'puppeteer'

// Sayfada yeni bir belge yüklendiğinde çalışacak JavaScript kodunu sayfaya enjekte eder.
// Bu kod, parmak izi önleme teknikleri uygular.
export async function avoidFingerprints(page: Page): Promise<Page> {
  await page.evaluateOnNewDocument(() => {
    // Canvas API metotlarının override'ı
    const toBlob = HTMLCanvasElement.prototype.toBlob
    const toDataURL = HTMLCanvasElement.prototype.toDataURL
    const getImageData = CanvasRenderingContext2D.prototype.getImageData

    // Canvas'a rastgele gürültü ekler
    const noisify = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
      const shift = {
        r: Math.floor(Math.random() * 10) - 5,
        g: Math.floor(Math.random() * 10) - 5,
        b: Math.floor(Math.random() * 10) - 5,
        a: Math.floor(Math.random() * 10) - 5
      }

      const width = canvas.width
      const height = canvas.height
      const imageData = getImageData.apply(context, [0, 0, width, height])
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const n = i * (width * 4) + j * 4
          imageData.data[n + 0] += shift.r
          imageData.data[n + 1] += shift.g
          imageData.data[n + 2] += shift.b
          imageData.data[n + 3] += shift.a
        }
      }

      context.putImageData(imageData, 0, 0)
    }

    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: function (...args: any[]) {
        noisify(this, this.getContext('2d')!)
        return toBlob.apply(this, args as any)
      }
    })

    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      value: function (...args: any[]) {
        noisify(this, this.getContext('2d')!)
        return toDataURL.apply(this, args as any)
      }
    })

    Object.defineProperty(CanvasRenderingContext2D.prototype, 'getImageData', {
      value: function (...args: any[]) {
        noisify(this.canvas, this)
        return getImageData.apply(this, args as any)
      }
    })

    // WebGL API'lerini override ederek gürültü ekler
    const config = {
      random: {
        value: () => Math.random(),
        item: (e: any[]) => e[Math.floor(config.random.value() * e.length)],
        array: (e: any[]) => new Int32Array([config.random.item(e), config.random.item(e)]),
        items: (e: any[], n: number) => {
          let length = e.length
          const result = new Array(n)
          const taken = new Array(length)
          while (n--) {
            const i = Math.floor(config.random.value() * length)
            result[n] = e[i in taken ? taken[i] : i]
            taken[i] = --length in taken ? taken[length] : length
          }
          return result
        }
      },
      spoof: {
        webgl: {
          buffer: (target: any) => {
            const bufferData = target.prototype.bufferData
            Object.defineProperty(target.prototype, 'bufferData', {
              value: function (...args: any[]) {
                const index = Math.floor(config.random.value() * 10)
                const noise = 0.1 * config.random.value() * args[1][index]
                args[1][index] += noise
                return bufferData.apply(this, args)
              }
            })
          },
          parameter: (target: any) => {
            const getParameter = target.prototype.getParameter
            Object.defineProperty(target.prototype, 'getParameter', {
              value: function (parameter: number) {
                // WebGL parametre değerlerini manipüle eder
                if (parameter === 37445) return 'Intel Open Source Technology Center'
                if (parameter === 37446) return 'Mesa DRI Intel(R) Ivybridge Mobile '
                return getParameter.call(this, parameter)
              }
            })
          }
        }
      }
    }

    config.spoof.webgl.buffer(WebGLRenderingContext)
    config.spoof.webgl.buffer(WebGL2RenderingContext)
    config.spoof.webgl.parameter(WebGLRenderingContext)
    config.spoof.webgl.parameter(WebGL2RenderingContext)

    // HTMLElement özelliklerini override ederek, ölçümlere rastgele gürültü ekler
    const rand = {
      noise: () => Math.floor(Math.random() - Math.random()),
      sign: () => {
        const tmp = [-1, -1, -1, -1, -1, -1, +1, -1, -1, -1]
        return tmp[Math.floor(Math.random() * tmp.length)]
      }
    }

    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      get() {
        const height = Math.floor(this.getBoundingClientRect().height)
        return height + (rand.sign() === 1 ? rand.noise() : 0)
      }
    })

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      get() {
        const width = Math.floor(this.getBoundingClientRect().width)
        return width + (rand.sign() === 1 ? rand.noise() : 0)
      }
    })

    // Ses ve video işlemleri üzerinden cihaz parmak izi oluşturulmasını engeller
    navigator.mediaDevices.getUserMedia = undefined as any
    // Diğer WebRTC işlevlerini devre dışı bırakır
    window.RTCPeerConnection = undefined as any
    ;(window as any).webkitRTCPeerConnection = undefined as any
  })

  return page
}
