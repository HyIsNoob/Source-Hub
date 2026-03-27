import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('desktopInfo', {
  platform: process.platform,
  versions: process.versions,
})

contextBridge.exposeInMainWorld('sourceHubApi', {
  getDashboardData: () => ipcRenderer.invoke('dashboard:get-data'),
  createProject: (payload: { name: string; style: string }) =>
    ipcRenderer.invoke('projects:create', payload),
  updateProject: (payload: { id: number; name: string; style: string }) => ipcRenderer.invoke('projects:update', payload),
  createCollection: (payload: { name: string }) => ipcRenderer.invoke('collections:create', payload),
  renameCollection: (payload: { id: number; name: string }) => ipcRenderer.invoke('collections:rename', payload),
  deleteCollection: (collectionId: number) => ipcRenderer.invoke('collections:delete', collectionId),
  deleteProject: (projectId: number) => ipcRenderer.invoke('projects:delete', projectId),
  getProjectDetails: (id: number) => ipcRenderer.invoke('projects:get-details', id),
  getCollectionDetails: (id: number) => ipcRenderer.invoke('collections:get-details', id),
  getLibraryRoot: () => ipcRenderer.invoke('library:get-root'),
  getFolderSettings: () => ipcRenderer.invoke('settings:get-folders'),
  getUpdatePreferences: () => ipcRenderer.invoke('settings:get-update-preferences'),
  setRealtimeWatchEnabled: (enabled: boolean) => ipcRenderer.invoke('settings:set-realtime-watch', enabled),
  setAutoUpdateEnabled: (enabled: boolean) => ipcRenderer.invoke('settings:set-auto-update', enabled),
  setLibraryRoot: (folderPath: string | null) => ipcRenderer.invoke('settings:set-library-root', folderPath),
  setWorkspaceRoot: (folderPath: string | null) => ipcRenderer.invoke('settings:set-workspace-root', folderPath),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  openExternal: (targetUrl: string) => ipcRenderer.invoke('links:open-external', targetUrl),
  pickFolder: () => ipcRenderer.invoke('folders:pick'),
  openFolder: (folderPath: string) => ipcRenderer.invoke('folders:open', folderPath),
  importAssets: (projectId: number) => ipcRenderer.invoke('assets:import', projectId),
  autoSortProjectFolder: (payload: { projectId: number; folderPath: string }) =>
    ipcRenderer.invoke('assets:auto-sort-folder', payload),
  autoSortProjectFromWorkspace: (payload: { projectId: number }) =>
    ipcRenderer.invoke('assets:auto-sort-project-from-workspace', payload),
  autoSortProjectWatchFolder: (payload: { projectId: number }) =>
    ipcRenderer.invoke('assets:auto-sort-watch-folder', payload),
  setProjectWatchFolder: (payload: { projectId: number; folderPath: string | null }) =>
    ipcRenderer.invoke('projects:set-watch-folder', payload),
  getProjectManagedFolder: (projectId: number) => ipcRenderer.invoke('projects:get-managed-folder', projectId),
  importAssetsToCollection: (collectionId: number) => ipcRenderer.invoke('assets:import-to-collection', collectionId),
  deleteAsset: (payload: { projectId: number; assetId: number }) => ipcRenderer.invoke('assets:delete', payload),
  addAssetToCollection: (payload: { collectionId: number; assetId: number }) =>
    ipcRenderer.invoke('collections:add-asset', payload),
  removeAssetFromCollection: (payload: { collectionId: number; assetId: number }) =>
    ipcRenderer.invoke('collections:remove-asset', payload),
})
