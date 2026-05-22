import { existsSync } from 'fs'
import { platform } from 'os'

const MAC_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
]

const LINUX_CHROME_PATHS = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]

const WIN_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]

function firstExisting(paths) {
  return paths.find(p => existsSync(p)) || null
}

export function resolveChromeExecutable() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv

  if (platform() === 'darwin') {
    const mac = firstExisting(MAC_CHROME_PATHS)
    if (mac) return mac
  }

  if (platform() === 'linux') {
    const linux = firstExisting(LINUX_CHROME_PATHS)
    if (linux) return linux
  }

  if (platform() === 'win32') {
    const win = firstExisting(WIN_CHROME_PATHS)
    if (win) return win
  }

  return null
}

export function buildPuppeteerOptions() {
  const executablePath = resolveChromeExecutable()
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
  ]

  const opts = { headless: true, args }
  if (executablePath) {
    opts.executablePath = executablePath
    console.log(`[wodsi-wsp] Chrome: ${executablePath}`)
  } else {
    console.warn(
      '[wodsi-wsp] Chrome del sistema no encontrado. Instalá uno o ejecutá:\n'
      + '  cd services/whatsapp-worker && npx puppeteer browsers install chrome',
    )
  }

  return opts
}
