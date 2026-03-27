interface DesktopInfo {
  platform: string
  versions: Record<string, string>
}

interface DashboardStat {
  label: string
  value: string
}

interface PipelineStep {
  name: string
  status: string
  value: string
}

interface ProjectCard {
  id: number
  name: string
  style: string
  assets: number
  storage: string
  lastUpdate: string
}

interface DashboardData {
  quickStats: DashboardStat[]
  importPipeline: PipelineStep[]
  projects: ProjectCard[]
  collections: CollectionCard[]
}

interface CollectionCard {
  id: number
  name: string
  assets: number
  storage: string
  lastUpdate: string
}

interface AssetData {
  id: number
  name: string
  mediaType: string
  sizeBytes: number
  sizeFormatted: string
  createdAt: string
  sourcePath?: string | null
  managedPath?: string | null
}

interface ProjectDetails {
  id: number
  name: string
  style: string
  createdAt: string
  updatedAt: string
  watchFolderPath?: string | null
  assets: AssetData[]
}

interface FolderSettings {
  libraryRoot: string
  workspaceRoot: string | null
  realtimeWatchEnabled: boolean
}

interface UpdatePreferences {
  autoUpdateEnabled: boolean
}

interface UpdateCheckResult {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
  releaseNotes: string
}

interface AppMeta {
  name: string
  version: string
  packaged: boolean
}

interface CollectionDetails {
  id: number
  name: string
  assets: AssetData[]
}

interface SourceHubApi {
  getDashboardData: () => Promise<DashboardData>
  createProject: (payload: { name: string; style: string }) => Promise<DashboardData>
  updateProject: (payload: { id: number; name: string; style: string }) => Promise<ProjectDetails>
  createCollection: (payload: { name: string }) => Promise<DashboardData>
  renameCollection: (payload: { id: number; name: string }) => Promise<CollectionDetails>
  deleteCollection: (collectionId: number) => Promise<DashboardData>
  deleteProject: (projectId: number) => Promise<DashboardData>
  getProjectDetails: (id: number) => Promise<ProjectDetails>
  getCollectionDetails: (id: number) => Promise<CollectionDetails>
  getLibraryRoot: () => Promise<string>
  getFolderSettings: () => Promise<FolderSettings>
  getUpdatePreferences: () => Promise<UpdatePreferences>
  getAppMeta: () => Promise<AppMeta>
  setRealtimeWatchEnabled: (enabled: boolean) => Promise<FolderSettings>
  setAutoUpdateEnabled: (enabled: boolean) => Promise<UpdatePreferences>
  setLibraryRoot: (folderPath: string | null) => Promise<FolderSettings>
  setWorkspaceRoot: (folderPath: string | null) => Promise<FolderSettings>
  checkForUpdates: () => Promise<UpdateCheckResult>
  openExternal: (targetUrl: string) => Promise<boolean>
  pickFolder: () => Promise<string | null>
  openFolder: (folderPath: string) => Promise<boolean>
  importAssets: (projectId: number) => Promise<ProjectDetails | null>
  autoSortProjectFolder: (payload: { projectId: number; folderPath: string }) => Promise<ProjectDetails>
  autoSortProjectFromWorkspace: (payload: { projectId: number }) => Promise<ProjectDetails>
  autoSortProjectWatchFolder: (payload: { projectId: number }) => Promise<ProjectDetails>
  setProjectWatchFolder: (payload: { projectId: number; folderPath: string | null }) => Promise<ProjectDetails>
  getProjectManagedFolder: (projectId: number) => Promise<string>
  importAssetsToCollection: (collectionId: number) => Promise<CollectionDetails | null>
  deleteAsset: (payload: { projectId: number; assetId: number }) => Promise<ProjectDetails>
  addAssetToCollection: (payload: { collectionId: number; assetId: number }) => Promise<CollectionDetails>
  removeAssetFromCollection: (payload: { collectionId: number; assetId: number }) => Promise<CollectionDetails>
}

interface Window {
  desktopInfo?: DesktopInfo
  sourceHubApi?: SourceHubApi
}
