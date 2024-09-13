import { getData } from '@/browser/func/getData'
import { testFunc } from '@/browser/tests/cloudflare_test'
import { appDirectoryName, fileEncoding, welcomeNoteFilename } from '@shared/constants'
import { NoteInfo, Search } from '@shared/models'
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

export const solveCaptcha: () => Promise<void> = async () => {
  await testFunc()
}

export const getSearchResults = async (url: string, onProgress?: (progress: number) => void) => {
  const data = await getData(url, onProgress)
  return data
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
          autoResolver: true,
          scraperTimeout: [1500, 2500],
          captchaTimeout: [1000, 2000],
          fingerprints: true,
          headless: false
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
      autoResolver: true,
      scraperTimeout: [1500, 2500],
      captchaTimeout: [1000, 2000],
      fingerprints: true,
      headless: false
    }
  }
}

export const writeSettingsJson: SetSettingsJson = async (settings) => {
  await writeFile(`${getRootDir()}/settings.json`, JSON.stringify(settings, null, 2), {
    encoding: fileEncoding
  })
  return settings
}

export const saveSearch: SaveSearch = async ({ results, date, description }) => {
  const filePath = `${getRootDir()}/${date}.json`

  try {
    const uniqueResults = results.filter(
      (result, index, self) => index === self.findIndex((r) => r.link === result.link)
    )
    await writeFile(
      filePath,
      JSON.stringify(
        {
          results: uniqueResults,
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
  const itemnumberKey = 'Item Number'
  // Tüm sonuçları ve detaylarını tarayarak anahtarları topluyoruz
  jsonData.results.forEach((result) => {
    Object.keys(result).forEach((key) => {
      if (key !== 'details') {
        keys.add(key)
      }
    })

    if (result.details) {
      if (result.details.sizes && result.details.sizes.length > 0) {
        Object.keys(result.details.sizes[0]).forEach((key) => {
          keys.add(key)
        })
      }
      Object.keys(result.details).forEach((key) => {
        if (key !== 'images' && key !== 'attributes' && key !== 'sizes' && key !== 'images') {
          keys.add(key)
        }
      })
      if (result.details.attributes) {
        Object.keys(result.details.attributes).forEach((key) => {
          keys.add(key)
        })
      }

      // Resimler alanının bir dizi olup olmadığını kontrol et
      if (Array.isArray(result.details.images)) {
        maxImageCount = Math.max(maxImageCount, result.details.images.length)
      }
    }
  })

  // Sütun başlıklarını dinamik olarak oluştur
  const columns = Array.from(keys).map((key: string) => ({
    header: key.charAt(0).toUpperCase() + key.slice(1),
    key: key,
    width: 20
  }))

  // Resimler için ek sütunlar oluştur
  for (let i = 1; i <= maxImageCount; i++) {
    columns.push({
      header: `Resim${i}`,
      key: `Resim${i}`,
      width: 30
    })
  }

  worksheet.columns = columns

  // Verileri satır satır ekle
  jsonData.results.forEach((result) => {
    result.details.sizes.forEach((size) => {
      const row: { [key: string]: string } = {}
      keys.forEach((key) => {
        if (key in result) {
          row[key] = result[key]
        } else if (result.details && key in result.details) {
          row[key] = result.details[key]
        } else if (result.details.attributes && key in result.details.attributes) {
          row[key] = result.details.attributes[key]
        } else if (size && key in size) {
          row[key] = size[key]
        } else {
          row[key] = ''
        }
      })

      // Resimleri yerleştir
      if (Array.isArray(result.details?.images as string[])) {
        result.details.images.forEach((image, index) => {
          row[`Resim${index + 1}`] = image
        })
      }

      worksheet.addRow(row)
    })

    // Anahtarları tarayarak verileri yerleştir
  })

  // Excel dosyasını yaz
  const filePath = `${rootDir}/${jsonData.date}.xlsx`
  await workbook.xlsx.writeFile(filePath)
  exec(`start "" "${filePath}"`, (error) => {
    if (error) {
      console.error(`Error opening file: ${error}`)
    }
  })
  console.log(`Excel file created successfully at ${filePath}`)
}
