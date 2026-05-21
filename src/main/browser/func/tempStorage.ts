import { writeFileSync, readFileSync, existsSync, unlinkSync, appendFileSync } from 'fs'
import { homedir } from 'os'
import path from 'path'

/**
 * Geçici depolama yardımcısı.
 * Ürünleri bellekte biriktirmek yerine 10'arlı gruplar halinde diske yazar.
 * Bu sayede 5000+ ürün çekilirken RAM tükenmesini önler.
 */
export class TempStorage {
  private buffer: any[] = []
  private filePath: string
  private totalFlushed = 0
  private flushSize: number
  private isFirstWrite = true

  constructor(prefix: string, flushSize = 10) {
    const tempDir = path.join(homedir(), '.trendyol-scraper-temp')
    // Dizin yoksa oluştur
    const fs = require('fs')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    this.filePath = path.join(tempDir, `${prefix}-${Date.now()}.json`)
    this.flushSize = flushSize

    // Başlangıçta boş bir JSON array aç
    writeFileSync(this.filePath, '[\n', 'utf8')
  }

  /** Bir ürünü buffer'a ekle, buffer dolunca diske yaz */
  push(item: any): void {
    this.buffer.push(item)
    if (this.buffer.length >= this.flushSize) {
      this.flush()
    }
  }

  /** Buffer'daki verileri diske yaz ve bellekten temizle */
  flush(): void {
    if (this.buffer.length === 0) return

    const lines = this.buffer
      .map((item) => {
        const prefix = this.isFirstWrite ? '' : ',\n'
        this.isFirstWrite = false
        return prefix + JSON.stringify(item)
      })
      .join('')

    appendFileSync(this.filePath, lines, 'utf8')

    this.totalFlushed += this.buffer.length
    this.buffer = [] // Belleği serbest bırak

    // Garbage collector'a yardımcı olmak için global.gc varsa çağır
    if (global.gc) {
      try {
        global.gc()
      } catch {
        // gc erişimi yoksa yoksay
      }
    }
  }

  /** Tüm verileri diskten oku ve geçici dosyayı sil */
  finalize(): any[] {
    // Kalan buffer'ı son kez diske yaz
    this.flush()

    // JSON dizisini kapat
    appendFileSync(this.filePath, '\n]', 'utf8')

    // Dosyayı oku ve parse et
    try {
      const raw = readFileSync(this.filePath, 'utf8')
      const data = JSON.parse(raw)
      return data
    } catch (error) {
      console.error('TempStorage dosyası okunamadı:', error)
      return []
    } finally {
      this.cleanup()
    }
  }

  /** Geçici dosyayı sil */
  cleanup(): void {
    try {
      if (existsSync(this.filePath)) {
        unlinkSync(this.filePath)
      }
    } catch {
      // Silinemezse yoksay
    }
  }

  /** Şu ana kadar toplam kaç ürün yazıldı (buffer dahil) */
  get count(): number {
    return this.totalFlushed + this.buffer.length
  }
}
