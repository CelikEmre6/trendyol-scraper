import { getData, getData2 } from '@/browser/func/getData'
import { appDirectoryName, fileEncoding, welcomeNoteFilename } from '@shared/constants'
import { NoteInfo, Search, TelegramSettings } from '@shared/models'
import {
  CreateNote,
  DeleteNote,
  DeleteSearch,
  GetNotes,
  GetSearch,
  GetSettingsJson,
  ReadNote,
  SaveSearch,
  SetSettingsJson,
  WriteNote
} from '@shared/types'
import { exec } from 'child_process'
import { dialog } from 'electron'
import ExcelJS from 'exceljs'
import { ensureDir, readFile, readdir, remove, stat, writeFile } from 'fs-extra'
import { isEmpty } from 'lodash'
import os, { homedir } from 'os'
import path from 'path'
import welcomeNoteFile from '../../../resources/welcomeNote.md?asset'
import { TelegramService } from './Telegram'

export const getRootDir = () => {
  return `${homedir()}/${appDirectoryName}`
}

export const getNotes: GetNotes = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const notesFileNames = await readdir(rootDir, {
    encoding: fileEncoding,
    withFileTypes: false
  })

  const notes = notesFileNames.filter((fileName) => fileName.endsWith('.md'))

  if (isEmpty(notes)) {
    console.info('No notes found, creating a welcome note')

    const content = await readFile(welcomeNoteFile, { encoding: fileEncoding })

    // create the welcome note
    await writeFile(`${rootDir}/${welcomeNoteFilename}`, content, { encoding: fileEncoding })

    notes.push(welcomeNoteFilename)
  }

  return Promise.all(notes.map(getNoteInfoFromFilename))
}

export const getNoteInfoFromFilename = async (filename: string): Promise<NoteInfo> => {
  const fileStats = await stat(`${getRootDir()}/${filename}`)

  return {
    title: filename.replace(/\.md$/, ''),
    lastEditTime: fileStats.mtimeMs
  }
}

export const readNote: ReadNote = async (filename) => {
  const rootDir = getRootDir()

  return readFile(`${rootDir}/${filename}.md`, { encoding: fileEncoding })
}

export const writeNote: WriteNote = async (filename, content) => {
  const rootDir = getRootDir()

  console.info(`Writing note ${filename}`)
  return writeFile(`${rootDir}/${filename}.md`, content, { encoding: fileEncoding })
}

export const createNote: CreateNote = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'New note',
    defaultPath: `${rootDir}/Untitled.md`,
    buttonLabel: 'Create',
    properties: ['showOverwriteConfirmation'],
    showsTagField: false,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })

  if (canceled || !filePath) {
    console.info('Note creation canceled')
    return false
  }

  const { name: filename, dir: parentDir } = path.parse(filePath)

  if (parentDir !== rootDir) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Creation failed',
      message: `All notes must be saved under ${rootDir}.
      Avoid using other directories!`
    })

    return false
  }

  console.info(`Creating note: ${filePath}`)
  await writeFile(filePath, '')

  return filename
}

export const deleteNote: DeleteNote = async (filename) => {
  const rootDir = getRootDir()

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Delete note',
    message: `Are you sure you want to delete ${filename}?`,
    buttons: ['Delete', 'Cancel'], // 0 is Delete, 1 is Cancel
    defaultId: 1,
    cancelId: 1
  })

  if (response === 1) {
    console.info('Note deletion canceled')
    return false
  }

  console.info(`Deleting note: ${filename}`)
  await remove(`${rootDir}/${filename}.md`)
  return true
}

export const getSearchResults = async (url: string, onProgress?: (progress: string) => void) => {
  const data = await getData(url, onProgress)
  return data
}

export const getSearchResults2 = async (urls: string) => {
  const searches = await getSearch()
  const StokSearches = searches.filter((search) => {
    return search.description!.includes('Tekli Ürün Çekme')
  })
  const data = await getData2(urls)
  if (StokSearches.length > 0) {
    const lastSearch = StokSearches[StokSearches.length - 1]
    compareStokSearches(lastSearch.results, data)
  }

  return data
}
async function compareStokSearches(lastSearch: any[], data: any[]) {
  const settings = await getSettingsJson()
  if (
    !settings.telegramApiKey ||
    !settings.telegramChatId ||
    settings.telegramApiKey === '' ||
    settings.telegramChatId === ''
  ) {
    return
  }

  const telegramSettings: TelegramSettings = {
    apiKey: settings.telegramApiKey,
    chatId: settings.telegramChatId
  }
  const priceCheck = settings.telegramPrice
  const stockCheck = settings.telegramStock
  const telegramService = new TelegramService(telegramSettings.apiKey, telegramSettings.chatId)
  if ((await telegramService.verifyCredentials()) === false) {
    return
  }

  if (!priceCheck && !stockCheck) {
    return
  }
  lastSearch.forEach((lastItem) => {
    const matchingDataItem = data.find((item) => item.url === lastItem.url)
    if (priceCheck) {
      if (
        matchingDataItem &&
        lastItem.details.indirimliFiyati !== matchingDataItem.details.indirimliFiyati
      ) {
        const message =
          `Fiyat değişikliği: ${lastItem.url}\n` +
          `Son Arama Fiyatı: ${lastItem.details.indirimliFiyati}\n` +
          `Yeni Arama Fiyatı: ${matchingDataItem.details.indirimliFiyati}`
        telegramService.sendMessage(message)
      }
    }
    if (stockCheck) {
      if (matchingDataItem && lastItem.details.sizes) {
        lastItem.details.sizes.forEach((lastSize) => {
          const matchingSize = matchingDataItem.details.sizes.find(
            (size) => size.itemNumber === lastSize.itemNumber
          )

          if (matchingSize && lastSize.inStock !== matchingSize.inStock) {
            let stockMessage = `Stok Değisikliği: ${matchingDataItem.url}\n`
            if (lastSize.beden && lastSize.beden.trim() !== '') {
              stockMessage += `Bedeni: ${lastSize.beden}\n`
            }
            stockMessage +=
              `Son Aramadaki Beden: ${lastSize.inStock}\n` + `Yeni Arama: ${matchingSize.inStock}`
            telegramService.sendMessage(stockMessage)
          }
        })
      }
    }
  })
}
function getMacAddress() {
  const networkInterfaces = os.networkInterfaces()
  for (const interfaceName in networkInterfaces) {
    const interfaceInfo = networkInterfaces[interfaceName]
    if (!interfaceInfo) {
      return 'MAC Address not found'
    }
    for (const details of interfaceInfo) {
      if (details.mac && details.mac !== '00:00:00:00:00:00') {
        return details.mac
      }
    }
  }
  return 'MAC Address not found'
}

export const getSettingsJson: GetSettingsJson = async () => {
  try {
    const settings = await readFile(`${getRootDir()}/settings.json`, { encoding: fileEncoding })
    return JSON.parse(settings)
  } catch (error) {
    const macAddress = getMacAddress()

    await writeFile(
      `${getRootDir()}/settings.json`,
      JSON.stringify(
        {
          macAddress: macAddress,
          ProductNumber: 1000,
          variant: true,
          comment: false,
          commentNumber: 20
        },
        null,
        2
      ),
      {
        encoding: fileEncoding
      }
    )
    return {
      macAddress: macAddress,
      ProductNumber: 1000,
      variant: true,
      comment: false,
      commentNumber: 20
    }
  }
}

export const writeSettingsJson: SetSettingsJson = async (settings) => {
  if (settings.telegramApiKey && settings.telegramApiKey !== '') {
    const telegramService = new TelegramService(
      settings.telegramApiKey,
      settings.telegramChatId || ''
    )
    if ((await telegramService.verifyCredentials()) === false) {
      throw new Error()
    }
  }
  await writeFile(`${getRootDir()}/settings.json`, JSON.stringify(settings, null, 2), {
    encoding: fileEncoding
  })
  return settings
}

export const saveSearch: SaveSearch = async ({ results, date, description }) => {
  const filePath = `${getRootDir()}/${date}.json`

  try {
    await writeFile(
      filePath,
      JSON.stringify(
        {
          results,
          date,
          description
        },
        null,
        2
      ),
      {
        encoding: fileEncoding
      }
    )
    console.info(`Search saved: ${filePath}`)
  } catch (error) {
    console.error(`Failed to save search: ${filePath}`, error)
    throw error
  }
}

export const getSearch: GetSearch = async () => {
  const rootDir = getRootDir()

  const searchFiles = await readdir(rootDir, {
    encoding: fileEncoding,
    withFileTypes: false
  })

  const search = searchFiles
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => fileName !== 'settings.json')
    .filter((fileName) => fileName !== 'links.json')

  const data = search.map(async (fileName) => {
    const file = await readFile(`${rootDir}/${fileName}`, { encoding: fileEncoding })
    return JSON.parse(file) as Search
  })

  return Promise.all(data)
}

export const deleteSearch: DeleteSearch = async (filename) => {
  const rootDir = getRootDir()

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Delete Search Results',
    message: `Arama sonuçlarını silmek istediğinize emin misiniz?`,
    buttons: ['Sil', 'İptal'], // 0 is Delete, 1 is Cancel
    defaultId: 1,
    cancelId: 1
  })

  if (response === 1) {
    console.info('SearchResult deletion canceled')
    return false
  }

  console.info(`Deleting SearchResults: ${filename}`)
  await remove(`${rootDir}/${filename}.json`)
  return true
}

export const createExcelFile: SaveSearch = async (jsonData) => {
  const rootDir = getRootDir()
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Trendyol Arama Sonuçları')

  const keys = new Set<string>()
  let maxImageCount = 0
  jsonData.results = jsonData.results
    .filter((result) => result.groupId !== undefined)
    .sort((a, b) => {
      const productGroupIdA = a.groupId.toString()
      const productGroupIdB = b.groupId.toString()
      return productGroupIdA.localeCompare(productGroupIdB)
    })
  jsonData.results.forEach((result) => {
    Object.keys(result).forEach((key) => {
      if (key !== 'details') {
        keys.add(key)
      }
    })

    if (result.details) {
      if ((result.details as any).sizes && (result.details as any).sizes.length > 0) {
        Object.keys((result.details as any).sizes[0]).forEach((key) => {
          keys.add(key)
        })
      }
      Object.keys(result.details).forEach((key) => {
        if (key !== 'images' && key !== 'attributes' && key !== 'sizes' && key !== 'images') {
          keys.add(key)
        }
      })
      if ((result.details as any).attributes) {
        Object.keys((result.details as any).attributes).forEach((key) => {
          keys.add(key)
        })
      }

      if (Array.isArray((result.details as any).images)) {
        maxImageCount = Math.max(maxImageCount, (result.details as any).images.length)
      }
    }
  })

  const columns = Array.from(keys).map((key: string) => ({
    header: key.charAt(0).toUpperCase() + key.slice(1),
    key: key,
    width: 20
  }))

  for (let i = 1; i <= maxImageCount; i++) {
    columns.push({
      header: `Resim${i}`,
      key: `Resim${i}`,
      width: 30
    })
  }

  worksheet.columns = columns

  jsonData.results.forEach((result) => {
    const sizes = (result.details as any).sizes || []
    if (sizes.length > 0) {
      sizes.forEach((size) => {
        const row: { [key: string]: string } = {}
        keys.forEach((key) => {
          if (key in result) {
            row[key] = result[key]
          } else if (result.details && key in result.details) {
            row[key] = result.details[key]
          } else if (
            (result.details as any).attributes &&
            key in (result.details as any).attributes
          ) {
            row[key] = (result.details as any).attributes[key]
          } else if (size && key in size) {
            row[key] = size[key]
          } else {
            row[key] = ''
          }
        })

        if (Array.isArray((result.details as any).images as string[])) {
          ;(result.details as any).images.forEach((image, index) => {
            row[`Resim${index + 1}`] = image
          })
        }

        worksheet.addRow(row)
      })
    } else {
      const row: { [key: string]: string } = {}
      keys.forEach((key) => {
        if (key in result) {
          row[key] = result[key]
        } else if (result.details && key in result.details) {
          row[key] = result.details[key]
        } else if (
          (result.details as any).attributes &&
          key in (result.details as any).attributes
        ) {
          row[key] = (result.details as any).attributes[key]
        } else {
          row[key] = ''
        }
      })

      if (Array.isArray((result.details as any).images as string[])) {
        ;(result.details as any).images.forEach((image, index) => {
          row[`Resim${index + 1}`] = image
        })
      }

      worksheet.addRow(row)
    }
  })

  const filePath = `${rootDir}/${jsonData.date}.xlsx`
  await workbook.xlsx.writeFile(filePath)
  exec(`start "" "${filePath}"`, (error) => {
    if (error) {
      console.error(`Error opening file: ${error}`)
    }
  })
  console.log(`Excel file created successfully at ${filePath}`)
}

export const saveStockLinks = async (links) => {
  await writeFile(`${getRootDir()}/links.json`, links, {
    encoding: fileEncoding
  })
  return links
}
export const loadStockLinks = async () => {
  try {
    const links = await readFile(`${getRootDir()}/links.json`, { encoding: fileEncoding })
    return links
      .replace(/[\\[\]"]/g, '')
      .replace(/,\s+/g, ', ')
      .trim()
      .split(',')
  } catch (err) {
    console.error('Dosya okunurken hata oluştu:', err)
    throw err
  }
}
