import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'node:path'
import { dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { LocalDb } from './local-db'

const isDev = !app.isPackaged
const forceDevTools = process.env.SOURCE_HUB_DEVTOOLS === '1'
const __dirname = dirname(fileURLToPath(import.meta.url))
let localDb: LocalDb | null = null
const projectWatchers = new Map<number, fs.FSWatcher>()
const watcherDebounceTimers = new Map<number, NodeJS.Timeout>()

const LATEST_RELEASE_API = 'https://api.github.com/repos/HyIsNoob/Source-Hub/releases/latest'

interface UpdateCheckResult {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
  releaseNotes: string
}

interface LatestReleasePayload {
  tag_name?: string
  html_url?: string
  body?: string
}

const MEDIA_EXTENSIONS = new Set([
  'mp4',
  'mov',
  'avi',
  'mkv',
  'wav',
  'mp3',
  'aac',
  'flac',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
])

const getMediaTypeFromExt = (ext: string) => {
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video'
  if (['wav', 'mp3', 'aac', 'flac'].includes(ext)) return 'audio'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  return 'other'
}

const getTypeFolderName = (mediaType: string) => {
  if (mediaType === 'video') return 'videos'
  if (mediaType === 'audio') return 'audio'
  if (mediaType === 'image') return 'images'
  return 'others'
}

const normalizeVersion = (value: string) => value.trim().replace(/^v/i, '')

const compareSemver = (left: string, right: string) => {
  const l = normalizeVersion(left).split('.').map((part) => Number(part) || 0)
  const r = normalizeVersion(right).split('.').map((part) => Number(part) || 0)
  const maxLength = Math.max(l.length, r.length)

  for (let index = 0; index < maxLength; index += 1) {
    const lPart = l[index] ?? 0
    const rPart = r[index] ?? 0
    if (lPart > rPart) return 1
    if (lPart < rPart) return -1
  }

  return 0
}

const getAutoUpdateEnabled = () => {
  const configured = localDb?.getSetting('auto_update_enabled')
  if (configured === null) {
    return true
  }

  return configured === '1'
}

const checkLatestRelease = async (): Promise<UpdateCheckResult> => {
  const response = await fetch(LATEST_RELEASE_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Source-Hub-Updater',
    },
  })

  if (!response.ok) {
    throw new Error(`Update check failed: HTTP ${response.status}`)
  }

  const payload = (await response.json()) as LatestReleasePayload
  const currentVersion = normalizeVersion(app.getVersion())
  const latestVersion = normalizeVersion(payload.tag_name || currentVersion)
  const hasUpdate = compareSemver(latestVersion, currentVersion) > 0

  return {
    hasUpdate,
    currentVersion,
    latestVersion,
    releaseUrl: payload.html_url || 'https://github.com/HyIsNoob/Source-Hub/releases/latest',
    releaseNotes: payload.body || '',
  }
}

const sanitizeSegment = (value: string) => {
  const forbidden = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*'])
  const sanitized = value
    .trim()
    .split('')
    .map((char) => {
      if (forbidden.has(char) || char.charCodeAt(0) < 32) {
        return '_'
      }

      return char
    })
    .join('')
    .replace(/\s+/g, '_')
    .slice(0, 80)

  return sanitized || 'untitled'
}

const ensureUniqueFilePath = (targetDir: string, fileName: string) => {
  const ext = extname(fileName)
  const baseName = basename(fileName, ext)
  let candidate = join(targetDir, fileName)
  let index = 1

  while (fs.existsSync(candidate)) {
    candidate = join(targetDir, `${baseName}_${index}${ext}`)
    index += 1
  }

  return candidate
}

const getLibraryRoot = () => join(app.getPath('userData'), 'media-library')

const resolveLibraryRoot = () => {
  const configured = localDb?.getSetting('library_root')
  return configured && configured.trim().length > 0 ? configured : getLibraryRoot()
}

const resolveWorkspaceRoot = () => {
  const configured = localDb?.getSetting('workspace_root')
  return configured && configured.trim().length > 0 ? configured : null
}

const copyIntoProjectManagedFolder = (projectName: string, mediaType: string, sourceFilePath: string) => {
  const projectSegment = sanitizeSegment(projectName)
  const typeFolder = getTypeFolderName(mediaType)
  const targetDir = join(resolveLibraryRoot(), 'projects', projectSegment, typeFolder)
  fs.mkdirSync(targetDir, { recursive: true })

  const targetPath = ensureUniqueFilePath(targetDir, basename(sourceFilePath))
  fs.copyFileSync(sourceFilePath, targetPath)

  return targetPath
}

const collectMediaFilesRecursively = (folderPath: string): string[] => {
  const discovered: string[] = []
  const entries = fs.readdirSync(folderPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(folderPath, entry.name)
    if (entry.isDirectory()) {
      discovered.push(...collectMediaFilesRecursively(fullPath))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const ext = extname(entry.name).toLowerCase().replace('.', '')
    if (MEDIA_EXTENSIONS.has(ext)) {
      discovered.push(fullPath)
    }
  }

  return discovered
}

const resolveProjectManagedFolder = (projectName: string) => {
  const projectSegment = sanitizeSegment(projectName)
  const projectDir = join(resolveLibraryRoot(), 'projects', projectSegment)
  fs.mkdirSync(projectDir, { recursive: true })
  return projectDir
}

const resolveWindowIconPath = () => {
  if (isDev) {
    return join(app.getAppPath(), 'favicon.ico')
  }

  return join(process.resourcesPath, 'favicon.ico')
}

const ingestFolderIntoProject = (projectId: number, sourceFolder: string) => {
  if (!localDb) {
    throw new Error('Database not initialized')
  }

  if (!fs.existsSync(sourceFolder)) {
    throw new Error('Folder does not exist')
  }

  const projectName = localDb.getProjectName(projectId)
  const libraryRoot = resolveLibraryRoot()
  const sourceFiles = collectMediaFilesRecursively(sourceFolder)

  for (const sourcePath of sourceFiles) {
    try {
      if (sourcePath.startsWith(libraryRoot)) {
        continue
      }

      if (localDb.hasAssetBySourcePath(projectId, sourcePath)) {
        continue
      }

      const stats = fs.statSync(sourcePath)
      const ext = extname(sourcePath).toLowerCase().replace('.', '')
      const mediaType = getMediaTypeFromExt(ext)
      const managedPath = copyIntoProjectManagedFolder(projectName, mediaType, sourcePath)

      localDb.addAsset(projectId, basename(managedPath), mediaType, stats.size, sourcePath, managedPath)
    } catch (err) {
      console.error(`Failed to auto-sort ${sourcePath}:`, err)
    }
  }
}

const stopRealtimeWatchers = () => {
  for (const watcher of projectWatchers.values()) {
    watcher.close()
  }
  projectWatchers.clear()

  for (const timer of watcherDebounceTimers.values()) {
    clearTimeout(timer)
  }
  watcherDebounceTimers.clear()
}

const refreshRealtimeWatchers = () => {
  if (!localDb) {
    return
  }

  stopRealtimeWatchers()

  if (!localDb.getWatchEnabled()) {
    return
  }

  const projects = localDb.getProjectsWithWatchFolders()
  for (const project of projects) {
    if (!fs.existsSync(project.watchFolderPath)) {
      continue
    }

    const scheduleIngest = () => {
      const existing = watcherDebounceTimers.get(project.id)
      if (existing) {
        clearTimeout(existing)
      }

      const timer = setTimeout(() => {
        watcherDebounceTimers.delete(project.id)
        try {
          ingestFolderIntoProject(project.id, project.watchFolderPath)
        } catch (error) {
          console.error(`Realtime watch ingest failed for project ${project.id}:`, error)
        }
      }, 700)

      watcherDebounceTimers.set(project.id, timer)
    }

    try {
      const watcher = fs.watch(project.watchFolderPath, { recursive: true }, () => {
        scheduleIngest()
      })

      watcher.on('error', (error) => {
        console.error(`Watcher error for project ${project.id}:`, error)
      })

      projectWatchers.set(project.id, watcher)
    } catch (error) {
      console.error(`Failed to watch folder for project ${project.id}:`, error)
    }
  }
}

const registerIpcHandlers = () => {
  ipcMain.handle('dashboard:get-data', () => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    return localDb.getDashboardData()
  })

  ipcMain.handle('projects:create', (_event, payload: { name: string; style: string }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const safeName = payload.name.trim()
    const safeStyle = payload.style.trim()

    if (!safeName || !safeStyle) {
      throw new Error('Project name and style are required')
    }

    localDb.createProject(safeName, safeStyle)
    refreshRealtimeWatchers()
    return localDb.getDashboardData()
  })

  ipcMain.handle('projects:update', (_event, payload: { id: number; name: string; style: string }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const safeName = payload.name.trim()
    const safeStyle = payload.style.trim()
    if (!safeName || !safeStyle) {
      throw new Error('Project name and style are required')
    }

    localDb.updateProject(payload.id, safeName, safeStyle)
    return localDb.getProjectDetails(payload.id)
  })

  ipcMain.handle('collections:create', (_event, payload: { name: string }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const safeName = payload.name.trim()
    if (!safeName) {
      throw new Error('Collection name is required')
    }

    localDb.createCollection(safeName)
    return localDb.getDashboardData()
  })

  ipcMain.handle('projects:delete', (_event, projectId: number) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    localDb.deleteProject(projectId)
    refreshRealtimeWatchers()
    return localDb.getDashboardData()
  })

  ipcMain.handle('collections:delete', (_event, collectionId: number) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    localDb.deleteCollection(collectionId)
    return localDb.getDashboardData()
  })

  ipcMain.handle('collections:rename', (_event, payload: { id: number; name: string }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const safeName = payload.name.trim()
    if (!safeName) {
      throw new Error('Collection name is required')
    }

    localDb.renameCollection(payload.id, safeName)
    return localDb.getCollectionDetails(payload.id)
  })

  ipcMain.handle('projects:get-details', (_event, id: number) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }
    return localDb.getProjectDetails(id)
  })

  ipcMain.handle('collections:get-details', (_event, id: number) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }
    return localDb.getCollectionDetails(id)
  })

  ipcMain.handle('library:get-root', () => {
    return resolveLibraryRoot()
  })

  ipcMain.handle('settings:get-folders', () => {
    return {
      libraryRoot: resolveLibraryRoot(),
      workspaceRoot: resolveWorkspaceRoot(),
      realtimeWatchEnabled: localDb?.getWatchEnabled() ?? false,
    }
  })

  ipcMain.handle('settings:set-realtime-watch', (_event, enabled: boolean) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    localDb.setWatchEnabled(Boolean(enabled))
    refreshRealtimeWatchers()

    return {
      libraryRoot: resolveLibraryRoot(),
      workspaceRoot: resolveWorkspaceRoot(),
      realtimeWatchEnabled: localDb.getWatchEnabled(),
    }
  })

  ipcMain.handle('settings:set-library-root', (_event, folderPath: string | null) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    if (folderPath && folderPath.trim().length > 0) {
      const normalized = folderPath.trim()
      fs.mkdirSync(normalized, { recursive: true })
      localDb.setSetting('library_root', normalized)
    } else {
      localDb.setSetting('library_root', null)
    }

    return {
      libraryRoot: resolveLibraryRoot(),
      workspaceRoot: resolveWorkspaceRoot(),
      realtimeWatchEnabled: localDb.getWatchEnabled(),
    }
  })

  ipcMain.handle('settings:set-workspace-root', (_event, folderPath: string | null) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    if (folderPath && folderPath.trim().length > 0) {
      const normalized = folderPath.trim()
      fs.mkdirSync(normalized, { recursive: true })
      localDb.setSetting('workspace_root', normalized)
    } else {
      localDb.setSetting('workspace_root', null)
    }

    return {
      libraryRoot: resolveLibraryRoot(),
      workspaceRoot: resolveWorkspaceRoot(),
      realtimeWatchEnabled: localDb.getWatchEnabled(),
    }
  })

  ipcMain.handle('settings:get-update-preferences', () => {
    return {
      autoUpdateEnabled: getAutoUpdateEnabled(),
    }
  })

  ipcMain.handle('settings:set-auto-update', (_event, enabled: boolean) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    localDb.setSetting('auto_update_enabled', enabled ? '1' : '0')
    return {
      autoUpdateEnabled: getAutoUpdateEnabled(),
    }
  })

  ipcMain.handle('updates:check', async () => {
    return checkLatestRelease()
  })

  ipcMain.handle('folders:open', async (_event, folderPath: string) => {
    if (!folderPath || folderPath.trim().length === 0) {
      throw new Error('Folder path is required')
    }

    const normalized = folderPath.trim()
    if (!fs.existsSync(normalized)) {
      throw new Error('Folder does not exist')
    }

    const result = await shell.openPath(normalized)
    if (result) {
      throw new Error(result)
    }

    return true
  })

  ipcMain.handle('links:open-external', async (_event, targetUrl: string) => {
    try {
      await shell.openExternal(targetUrl)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('folders:pick', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Choose Folder',
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    return filePaths[0]
  })

  ipcMain.handle('assets:import', async (_event, projectId: number) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const projectName = localDb.getProjectName(projectId)

    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Import Source Media',
      filters: [
        { name: 'Media Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wav', 'mp3', 'aac', 'jpg', 'png'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    for (const filePath of filePaths) {
      try {
        const stats = fs.statSync(filePath)
        const ext = extname(filePath).toLowerCase().replace('.', '')

        const mediaType = getMediaTypeFromExt(ext)
        const managedPath = copyIntoProjectManagedFolder(projectName, mediaType, filePath)

        localDb.addAsset(projectId, basename(managedPath), mediaType, stats.size, filePath, managedPath)
      } catch (err) {
        console.error(`Failed to import ${filePath}:`, err)
      }
    }

    return localDb.getProjectDetails(projectId)
  })

  ipcMain.handle('assets:import-to-collection', async (_event, collectionId: number) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Import Source Media To Collection',
      filters: [
        { name: 'Media Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wav', 'mp3', 'aac', 'jpg', 'png'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    for (const filePath of filePaths) {
      try {
        const stats = fs.statSync(filePath)
        const ext = extname(filePath).toLowerCase().replace('.', '')

        const mediaType = getMediaTypeFromExt(ext)
        const managedPath = copyIntoProjectManagedFolder('Collection_Inbox', mediaType, filePath)

        const assetId = localDb.addAsset(null, basename(managedPath), mediaType, stats.size, filePath, managedPath)
        localDb.addAssetToCollection(collectionId, assetId)
      } catch (err) {
        console.error(`Failed to import ${filePath}:`, err)
      }
    }

    return localDb.getCollectionDetails(collectionId)
  })

  ipcMain.handle('assets:auto-sort-folder', async (_event, payload: { projectId: number; folderPath: string }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const safeFolderPath = payload.folderPath.trim()
    if (!safeFolderPath || !fs.existsSync(safeFolderPath)) {
      throw new Error('Folder does not exist')
    }

    ingestFolderIntoProject(payload.projectId, safeFolderPath)

    return localDb.getProjectDetails(payload.projectId)
  })

  ipcMain.handle('projects:set-watch-folder', (_event, payload: { projectId: number; folderPath: string | null }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const normalized = payload.folderPath && payload.folderPath.trim().length > 0 ? payload.folderPath.trim() : null
    if (normalized && !fs.existsSync(normalized)) {
      throw new Error('Watch folder does not exist')
    }

    localDb.updateProjectWatchFolder(payload.projectId, normalized)
    refreshRealtimeWatchers()
    return localDb.getProjectDetails(payload.projectId)
  })

  ipcMain.handle('projects:get-managed-folder', (_event, projectId: number) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const projectName = localDb.getProjectName(projectId)
    return resolveProjectManagedFolder(projectName)
  })

  ipcMain.handle('assets:auto-sort-watch-folder', async (_event, payload: { projectId: number }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const details = localDb.getProjectDetails(payload.projectId)
    const watchFolderPath = details.watchFolderPath ?? null
    if (!watchFolderPath || !fs.existsSync(watchFolderPath)) {
      throw new Error('Watch folder is not configured or missing')
    }

    ingestFolderIntoProject(payload.projectId, watchFolderPath)

    return localDb.getProjectDetails(payload.projectId)
  })

  ipcMain.handle('assets:auto-sort-project-from-workspace', async (_event, payload: { projectId: number }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    const workspaceRoot = resolveWorkspaceRoot()
    if (!workspaceRoot || !fs.existsSync(workspaceRoot)) {
      throw new Error('Workspace root is not configured or missing')
    }

    const projectName = localDb.getProjectName(payload.projectId)
    const exact = join(workspaceRoot, projectName)
    const sanitized = join(workspaceRoot, sanitizeSegment(projectName))
    const sourceFolder = fs.existsSync(exact) ? exact : fs.existsSync(sanitized) ? sanitized : null

    if (!sourceFolder) {
      throw new Error('Project folder was not found inside workspace root')
    }

    ingestFolderIntoProject(payload.projectId, sourceFolder)

    return localDb.getProjectDetails(payload.projectId)
  })

  ipcMain.handle('assets:delete', (_event, payload: { projectId: number; assetId: number }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    localDb.deleteAsset(payload.assetId, payload.projectId)
    return localDb.getProjectDetails(payload.projectId)
  })

  ipcMain.handle('collections:remove-asset', (_event, payload: { collectionId: number; assetId: number }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    localDb.removeAssetFromCollection(payload.collectionId, payload.assetId)
    return localDb.getCollectionDetails(payload.collectionId)
  })

  ipcMain.handle('collections:add-asset', (_event, payload: { collectionId: number; assetId: number }) => {
    if (!localDb) {
      throw new Error('Database not initialized')
    }

    localDb.addAssetToCollection(payload.collectionId, payload.assetId)
    return localDb.getCollectionDetails(payload.collectionId)
  })
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    show: false,
    width: 1420,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#f4f4f0',
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    icon: resolveWindowIconPath(),
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    if (forceDevTools) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
    mainWindow.once('ready-to-show', () => {
      mainWindow.maximize()
      mainWindow.show()
    })
    return mainWindow
  }

  mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  return mainWindow
}

// Fix for AMD GPU bug
app.disableHardwareAcceleration()

app.whenReady().then(() => {
  localDb = new LocalDb(app.getPath('userData'), {
    seedDemoData: isDev || process.env.SOURCE_HUB_SEED_DEMO === '1',
  })
  registerIpcHandlers()
  refreshRealtimeWatchers()
  const mainWindow = createWindow()

  if (getAutoUpdateEnabled()) {
    void checkLatestRelease()
      .then((result) => {
        if (!result.hasUpdate) {
          return
        }

        void dialog
          .showMessageBox(mainWindow, {
            type: 'info',
            title: 'Source Hub Update Available',
            message: `A new version is available (${result.latestVersion}).`,
            detail: `Current: ${result.currentVersion}\nLatest: ${result.latestVersion}`,
            buttons: ['Open Release Page', 'Later'],
            defaultId: 0,
            cancelId: 1,
          })
          .then((selection) => {
            if (selection.response === 0) {
              void shell.openExternal(result.releaseUrl)
            }
          })
      })
      .catch((error) => {
        console.error('Auto-update check failed:', error)
      })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopRealtimeWatchers()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
