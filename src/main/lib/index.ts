import { getData } from '@/browser/func/getData'
import { setTapu } from '@/browser/func/setTapu'
import { testFunc } from '@/browser/tests/cloudflare_test'
import { appDirectoryName, fileEncoding, welcomeNoteFilename } from '@shared/constants'
import { NoteInfo, Search, SearchResult } from '@shared/models'
import {
  CreateNote,
  DeleteNote,
  DeleteSearch,
  GetNotes,
  GetSearch,
  GetSettingsJson,
  ImportFromExcel,
  ReadNote,
  SaveSearch,
  SearchResults,
  SetSettingsJson,
  SetTapuData,
  WriteNote
} from '@shared/types'
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

export const getSearchResults: SearchResults = async (city, town, quarters) => {
  const quartesString = quarters.map((quarter) => `address_quarter=${quarter}`).join('&')

  const searchString = `https://www.sahibinden.com/satilik-arsa?pagingSize=50&${quartesString}&address_town=${town}&query_text_mf=sat%C4%B1l%C4%B1k+arsa&address_city=${city}`

  const data = await getData(searchString)

  return data
}

export const setTapuData: SetTapuData = (data) => {
  setTapu(data).then()
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
  const worksheet = workbook.addWorksheet('Arsa Arama Sonuçları')

  // Sütun başlıklarını ekle
  worksheet.columns = [
    { header: 'Başlık', key: 'title', width: 30 },
    { header: 'Link', key: 'link', width: 50 },
    { header: 'Resim', key: 'imageUrl', width: 50 },
    { header: 'm2', key: 'm2', width: 10 },
    { header: 'Fiyat', key: 'price', width: 15 },
    { header: 'm2 Fiyatı', key: 'pricePerM2', width: 15 },
    { header: 'İl', key: 'il', width: 15 },
    { header: 'İlçe', key: 'ilce', width: 15 },
    { header: 'Lokasyon', key: 'location', width: 20 },
    { header: 'Ada No', key: 'adaNo', width: 10 },
    { header: 'Parsel No', key: 'parselNo', width: 10 },
    { header: 'Kimden', key: 'kimden', width: 20 },
    { header: 'Telefon No', key: 'telefonNo', width: 20 },
    { header: 'İsim', key: 'isim', width: 20 },
    { header: 'Şirket', key: 'sirket', width: 30 }
  ]

  // Verileri satır satır ekle
  jsonData.results.forEach((result) => {
    worksheet.addRow(result)
  })

  // Excel dosyasını yaz
  const filePath = `${rootDir}/${jsonData.date}.xlsx`
  await workbook.xlsx.writeFile(filePath)

  console.log(`Excel file created successfully at ${filePath}`)
}

export const importFromExcel: ImportFromExcel = async (filePath, desc) => {
  console.log('desc', desc)
  const rootDir = getRootDir()

  const workbook = new ExcelJS.Workbook()

  // Excel dosyasını yükle
  await workbook.xlsx.readFile(`${rootDir}/${filePath}.xlsx`)

  const worksheet = workbook.getWorksheet(1) // İlk sayfayı al
  const data: SearchResult[] = []

  // İlk satırda başlıklar olduğu için ikinci satırdan itibaren okumaya başla
  worksheet?.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber === 1) return // Başlıkları atla

    const rowData = {
      title: row.getCell('A').value?.toString(),
      link: row.getCell('B').value?.toString(),
      imageUrl: row.getCell('C').value?.toString(),
      m2: row.getCell('D').value?.toString(),
      price: row.getCell('E').value?.toString(),
      pricePerM2: row.getCell('F').value?.toString(),
      il: row.getCell('G').value?.toString(),
      ilce: row.getCell('H').value?.toString(),
      location: row.getCell('I').value?.toString(),
      adaNo: row.getCell('J').value?.toString(),
      parselNo: row.getCell('K').value?.toString(),
      kimden: row.getCell('L').value?.toString(),
      telefonNo: row.getCell('M').value?.toString(),
      isim: row.getCell('N').value?.toString(),
      sirket: row.getCell('O').value?.toString()
    }

    data.push(rowData as SearchResult)
  })

  saveSearch({
    results: data,
    date: parseInt(filePath),
    description: desc
  })
  return data
}
