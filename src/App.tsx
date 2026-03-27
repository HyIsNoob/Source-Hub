import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.css'

type MainTab = 'projects' | 'collections' | 'settings'
type ViewTab = MainTab | 'project-details' | 'collection-details'
type AssetSortMode = 'newest' | 'oldest' | 'name' | 'sizeAsc' | 'sizeDesc'
type CollapsedSidebarVariant = 'clean' | 'bold'
type PerformanceProfile = 'balanced' | 'lite'
type IconScale = 'small' | 'medium'
type ActivityItem = { id: number; message: string; at: string }
type IconName =
  | 'projects'
  | 'collections'
  | 'settings'
  | 'plus'
  | 'back'
  | 'import'
  | 'sort'
  | 'watch'
  | 'folder'
  | 'bolt'
  | 'brush'
  | 'gauge'
  | 'motion'
  | 'activity'
  | 'library'
  | 'workspace'
  | 'trash'
  | 'link'
  | 'unlink'
  | 'rename'
  | 'open'
  | 'left'
  | 'right'
  | 'check'
  | 'close'

const MAIN_TABS: MainTab[] = ['projects', 'collections', 'settings']
const ASSETS_PER_PAGE = 200
const ASSET_ROW_HEIGHT = 58
const ASSET_OVERSCAN = 6

const getVirtualSlice = (total: number, scrollTop: number, viewportHeight: number) => {
  if (total === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      offsetTop: 0,
      offsetBottom: 0,
    }
  }

  const visibleCount = Math.max(1, Math.ceil(viewportHeight / ASSET_ROW_HEIGHT))
  const rawStart = Math.floor(scrollTop / ASSET_ROW_HEIGHT)
  const startIndex = Math.max(0, rawStart - ASSET_OVERSCAN)
  const endIndex = Math.min(total, rawStart + visibleCount + ASSET_OVERSCAN)
  const offsetTop = startIndex * ASSET_ROW_HEIGHT
  const offsetBottom = Math.max(0, (total - endIndex) * ASSET_ROW_HEIGHT)

  return {
    startIndex,
    endIndex,
    offsetTop,
    offsetBottom,
  }
}

const toFileUrl = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, '/')
  return encodeURI(`file:///${normalized}`)
}

const MonoIcon = ({ name, className }: { name: IconName; className?: string }) => {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'projects') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="8" y1="4" x2="8" y2="20" />
      </svg>
    )
  }

  if (name === 'collections') {
    return (
      <svg {...common}>
        <path d="M4 7h16v13H4z" />
        <path d="M7 4h10v3H7z" />
      </svg>
    )
  }

  if (name === 'settings') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 0 1 0 2.8 2 2 0 0 1-2.8 0l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 0 1-2.8 0 2 2 0 0 1 0-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 0 1 0-2.8 2 2 0 0 1 2.8 0l.1.1a1.6 1.6 0 0 0 1.7.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5h0a1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 0 1 2.8 0 2 2 0 0 1 0 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
      </svg>
    )
  }

  if (name === 'plus') {
    return (
      <svg {...common}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
  }

  if (name === 'back') {
    return (
      <svg {...common}>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    )
  }

  if (name === 'import') {
    return (
      <svg {...common}>
        <path d="M12 3v12" />
        <polyline points="8 11 12 15 16 11" />
        <path d="M4 19h16" />
      </svg>
    )
  }

  if (name === 'sort') {
    return (
      <svg {...common}>
        <path d="M7 4v15" />
        <polyline points="4 16 7 19 10 16" />
        <line x1="14" y1="7" x2="20" y2="7" />
        <line x1="14" y1="12" x2="19" y2="12" />
        <line x1="14" y1="17" x2="18" y2="17" />
      </svg>
    )
  }

  if (name === 'watch') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7" />
        <polyline points="12 9 12 12 14 14" />
      </svg>
    )
  }

  if (name === 'folder') {
    return (
      <svg {...common}>
        <path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    )
  }

  if (name === 'bolt') {
    return (
      <svg {...common}>
        <polyline points="13 2 6 13 12 13 11 22 18 11 12 11 13 2" />
      </svg>
    )
  }

  if (name === 'brush') {
    return (
      <svg {...common}>
        <path d="M7 16c1.5 0 2.7 1.2 2.7 2.7 0 1.2-1 2.3-2.3 2.3-2.1 0-3.4-1.4-3.4-3.3A3.7 3.7 0 0 1 7.7 14L17 4.7a2 2 0 0 1 2.8 2.8L10.5 16a5 5 0 0 1-3.5 0z" />
      </svg>
    )
  }

  if (name === 'gauge') {
    return (
      <svg {...common}>
        <path d="M4 14a8 8 0 1 1 16 0" />
        <line x1="12" y1="14" x2="16" y2="10" />
      </svg>
    )
  }

  if (name === 'motion') {
    return (
      <svg {...common}>
        <line x1="3" y1="12" x2="21" y2="12" />
        <path d="M6 7l-3 5 3 5" />
        <path d="M18 7l3 5-3 5" />
      </svg>
    )
  }

  if (name === 'activity') {
    return (
      <svg {...common}>
        <polyline points="3 13 7 13 10 7 14 17 17 11 21 11" />
      </svg>
    )
  }

  if (name === 'library') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="5" height="16" />
        <rect x="10" y="4" width="5" height="16" />
        <rect x="16" y="4" width="4" height="16" />
      </svg>
    )
  }

  if (name === 'trash') {
    return (
      <svg {...common}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <line x1="10" y1="10" x2="10" y2="17" />
        <line x1="14" y1="10" x2="14" y2="17" />
      </svg>
    )
  }

  if (name === 'link') {
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 1 1 7 7L17 13" />
        <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 1 1-7-7L7 11" />
      </svg>
    )
  }

  if (name === 'unlink') {
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" />
        <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11" />
        <line x1="4" y1="20" x2="20" y2="4" />
      </svg>
    )
  }

  if (name === 'rename') {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    )
  }

  if (name === 'open') {
    return (
      <svg {...common}>
        <path d="M14 3h7v7" />
        <path d="M10 14 21 3" />
        <path d="M21 14v6H3V3h6" />
      </svg>
    )
  }

  if (name === 'left') {
    return (
      <svg {...common}>
        <polyline points="15 18 9 12 15 6" />
      </svg>
    )
  }

  if (name === 'right') {
    return (
      <svg {...common}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    )
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }

  if (name === 'close') {
    return (
      <svg {...common}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <line x1="8" y1="5" x2="8" y2="19" />
    </svg>
  )
}

const getAssetExtension = (asset: AssetData) => {
  const raw = asset.name.split('.').pop()?.toLowerCase() || ''
  return raw
}

const parseSizeToken = (token: string) => {
  const matched = token.match(/^(size)(<=|>=|=|<|>)(\d+(?:\.\d+)?)(kb|mb|gb)?$/)
  if (!matched) {
    return null
  }

  const [, , operator, numeric, unit] = matched
  const multiplier = unit === 'gb' ? 1024 * 1024 * 1024 : unit === 'mb' ? 1024 * 1024 : 1024
  return {
    operator,
    bytes: Number(numeric) * multiplier,
  }
}

const evaluateSizeToken = (sizeBytes: number, operator: string, bytes: number) => {
  if (operator === '>') return sizeBytes > bytes
  if (operator === '>=') return sizeBytes >= bytes
  if (operator === '<') return sizeBytes < bytes
  if (operator === '<=') return sizeBytes <= bytes
  return sizeBytes === bytes
}

const generateVideoThumbnail = async (filePath: string) => {
  return new Promise<string | null>((resolve) => {
    const video = document.createElement('video')
    let settled = false

    const settle = (value: string | null) => {
      if (settled) {
        return
      }

      settled = true
      video.pause()
      video.removeAttribute('src')
      video.load()
      resolve(value)
    }

    const timeout = window.setTimeout(() => {
      settle(null)
    }, 2800)

    const capture = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 90
        const context = canvas.getContext('2d')
        if (!context) {
          window.clearTimeout(timeout)
          settle(null)
          return
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72)
        window.clearTimeout(timeout)
        settle(dataUrl)
      } catch {
        window.clearTimeout(timeout)
        settle(null)
      }
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = toFileUrl(filePath)

    video.addEventListener('loadeddata', () => {
      try {
        video.currentTime = Math.min(0.2, video.duration > 0 ? video.duration / 3 : 0.2)
      } catch {
        capture()
      }
    })
    video.addEventListener('seeked', capture)
    video.addEventListener('error', () => {
      window.clearTimeout(timeout)
      settle(null)
    })
  })
}

function App() {
  const [data, setData] = useState<DashboardData>({
    quickStats: [],
    importPipeline: [],
    projects: [],
    collections: [],
  })
  const [activeTab, setActiveTab] = useState<ViewTab>('projects')
  const [curtain, setCurtain] = useState<'up' | 'down' | null>(null)
  const [isPushingBack, setIsPushingBack] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [collapsedSidebarVariant, setCollapsedSidebarVariant] = useState<CollapsedSidebarVariant>('bold')
  const [performanceProfile, setPerformanceProfile] = useState<PerformanceProfile>('balanced')
  const [realtimeAnimationsEnabled, setRealtimeAnimationsEnabled] = useState(true)
  const [iconScale, setIconScale] = useState<IconScale>('medium')

  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [collectionDetails, setCollectionDetails] = useState<CollectionDetails | null>(null)

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectStyle, setNewProjectStyle] = useState('Standard')

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const [assetQuery, setAssetQuery] = useState('')
  const [debouncedAssetQuery, setDebouncedAssetQuery] = useState('')
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | 'video' | 'audio' | 'image' | 'other'>('all')
  const [assetSort, setAssetSort] = useState<AssetSortMode>('newest')
  const [projectPage, setProjectPage] = useState(1)
  const [collectionPage, setCollectionPage] = useState(1)
  const [selectedProjectAssetIds, setSelectedProjectAssetIds] = useState<number[]>([])
  const [selectedCollectionAssetIds, setSelectedCollectionAssetIds] = useState<number[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>([])
  const [targetCollectionId, setTargetCollectionId] = useState<number | ''>('')
  const [libraryRootPath, setLibraryRootPath] = useState('')
  const [workspaceRootPath, setWorkspaceRootPath] = useState<string | null>(null)
  const [realtimeWatchEnabled, setRealtimeWatchEnabled] = useState(false)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [projectListScrollTop, setProjectListScrollTop] = useState(0)
  const [collectionListScrollTop, setCollectionListScrollTop] = useState(0)
  const [projectListViewportHeight, setProjectListViewportHeight] = useState(420)
  const [collectionListViewportHeight, setCollectionListViewportHeight] = useState(420)
  const [thumbnailMap, setThumbnailMap] = useState<Record<number, string | null>>({})
  const [fps, setFps] = useState(0)
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([])

  const timecodeRef = useRef<HTMLParagraphElement>(null)
  const projectAssetsViewportRef = useRef<HTMLDivElement>(null)
  const collectionAssetsViewportRef = useRef<HTMLDivElement>(null)
  const thumbnailCacheRef = useRef<Map<string, string | null>>(new Map())
  const thumbnailPendingRef = useRef<Set<string>>(new Set())

  const pushActivity = (message: string) => {
    setActivityLog((prev) => [
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message,
        at: new Date().toLocaleTimeString(),
      },
      ...prev,
    ].slice(0, 12))
  }

  const loadDashboardData = async () => {
    const dbData = await window.sourceHubApi?.getDashboardData()
    if (dbData) {
      setData(dbData)
    }
  }

  const loadFolderSettings = async () => {
    const settings = await window.sourceHubApi?.getFolderSettings()
    if (settings) {
      setLibraryRootPath(settings.libraryRoot)
      setWorkspaceRootPath(settings.workspaceRoot)
      setRealtimeWatchEnabled(settings.realtimeWatchEnabled)
    }
  }

  const loadUpdatePreferences = async () => {
    const preferences = await window.sourceHubApi?.getUpdatePreferences()
    if (preferences) {
      setAutoUpdateEnabled(preferences.autoUpdateEnabled)
    }
  }

  const handleToggleRealtimeWatch = async () => {
    try {
      const settings = await window.sourceHubApi?.setRealtimeWatchEnabled(!realtimeWatchEnabled)
      if (settings) {
        setLibraryRootPath(settings.libraryRoot)
        setWorkspaceRootPath(settings.workspaceRoot)
        setRealtimeWatchEnabled(settings.realtimeWatchEnabled)
        pushActivity(`Realtime watch ${settings.realtimeWatchEnabled ? 'enabled' : 'disabled'}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle realtime watch'
      window.alert(message)
    }
  }

  const handleToggleAutoUpdate = async () => {
    try {
      const preferences = await window.sourceHubApi?.setAutoUpdateEnabled(!autoUpdateEnabled)
      if (preferences) {
        setAutoUpdateEnabled(preferences.autoUpdateEnabled)
        pushActivity(`Auto update ${preferences.autoUpdateEnabled ? 'enabled' : 'disabled'}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle auto update'
      window.alert(message)
    }
  }

  const handleCheckForUpdates = async () => {
    try {
      setIsCheckingUpdates(true)
      const result = await window.sourceHubApi?.checkForUpdates()
      if (!result) {
        return
      }

      if (result.hasUpdate) {
        const openRelease = window.confirm(
          `New update available: ${result.latestVersion}\nCurrent version: ${result.currentVersion}\n\nOpen release page now?`
        )
        if (openRelease) {
          await window.sourceHubApi?.openExternal(result.releaseUrl)
        }
        pushActivity(`Update available: ${result.latestVersion}`)
        return
      }

      window.alert(`You are up to date. Current version: ${result.currentVersion}`)
      pushActivity(`Update check complete: ${result.currentVersion}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check updates'
      window.alert(message)
    } finally {
      setIsCheckingUpdates(false)
    }
  }

  useEffect(() => {
    const storedVariant = window.localStorage.getItem('collapsedSidebarVariant')
    if (storedVariant === 'clean' || storedVariant === 'bold') {
      setCollapsedSidebarVariant(storedVariant)
    }

    const storedProfile = window.localStorage.getItem('performanceProfile')
    if (storedProfile === 'balanced' || storedProfile === 'lite') {
      setPerformanceProfile(storedProfile)
    }

    const storedMotion = window.localStorage.getItem('realtimeAnimationsEnabled')
    if (storedMotion === '0') {
      setRealtimeAnimationsEnabled(false)
    }

    const storedIconScale = window.localStorage.getItem('iconScale')
    if (storedIconScale === 'small' || storedIconScale === 'medium') {
      setIconScale(storedIconScale)
    }

    loadDashboardData()
    loadFolderSettings()
    void loadUpdatePreferences()

    let frame = 0
    const interval = setInterval(() => {
      frame += 1
      if (timecodeRef.current) {
        const hh = Math.floor(frame / 86400)
          .toString()
          .padStart(2, '0')
        const mm = Math.floor((frame % 86400) / 1440)
          .toString()
          .padStart(2, '0')
        const ss = Math.floor((frame % 1440) / 24)
          .toString()
          .padStart(2, '0')
        const ff = (frame % 24).toString().padStart(2, '0')
        timecodeRef.current.textContent = `${hh}:${mm}:${ss}:${ff}`
      }
    }, 1000 / 24)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('collapsedSidebarVariant', collapsedSidebarVariant)
  }, [collapsedSidebarVariant])

  useEffect(() => {
    window.localStorage.setItem('performanceProfile', performanceProfile)
  }, [performanceProfile])

  useEffect(() => {
    window.localStorage.setItem('realtimeAnimationsEnabled', realtimeAnimationsEnabled ? '1' : '0')
  }, [realtimeAnimationsEnabled])

  useEffect(() => {
    window.localStorage.setItem('iconScale', iconScale)
  }, [iconScale])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAssetQuery(assetQuery)
    }, 200)

    return () => clearTimeout(timer)
  }, [assetQuery])

  useEffect(() => {
    let frameCount = 0
    let lastTick = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      frameCount += 1
      if (now - lastTick >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastTick = now
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const runTransition = (direction: 'up' | 'down', callback: () => void) => {
    if (!realtimeAnimationsEnabled) {
      callback()
      return
    }

    if (curtain) {
      return
    }

    setCurtain(direction)
    setIsPushingBack(true)

    setTimeout(() => {
      callback()
      setIsPushingBack(false)
    }, 450)

    setTimeout(() => {
      setCurtain(null)
    }, 900)
  }

  const syncAssetViewportHeights = () => {
    if (projectAssetsViewportRef.current) {
      setProjectListViewportHeight(projectAssetsViewportRef.current.clientHeight)
    }

    if (collectionAssetsViewportRef.current) {
      setCollectionListViewportHeight(collectionAssetsViewportRef.current.clientHeight)
    }
  }

  const handleProjectAssetsScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    setProjectListScrollTop(target.scrollTop)
    setProjectListViewportHeight(target.clientHeight)
  }

  const handleCollectionAssetsScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    setCollectionListScrollTop(target.scrollTop)
    setCollectionListViewportHeight(target.clientHeight)
  }

  const resetAssetFilters = () => {
    setAssetQuery('')
    setAssetTypeFilter('all')
    setAssetSort('newest')
    setProjectPage(1)
    setCollectionPage(1)
    setSelectedProjectAssetIds([])
    setSelectedCollectionAssetIds([])
  }

  const handleAssetQueryChange = (value: string) => {
    setAssetQuery(value)
    if (activeTab === 'project-details') {
      setProjectPage(1)
    } else if (activeTab === 'collection-details') {
      setCollectionPage(1)
    }
  }

  const handleAssetTypeFilterChange = (value: 'all' | 'video' | 'audio' | 'image' | 'other') => {
    setAssetTypeFilter(value)
    if (activeTab === 'project-details') {
      setProjectPage(1)
    } else if (activeTab === 'collection-details') {
      setCollectionPage(1)
    }
  }

  const handleAssetSortChange = (value: AssetSortMode) => {
    setAssetSort(value)
    if (activeTab === 'project-details') {
      setProjectPage(1)
    } else if (activeTab === 'collection-details') {
      setCollectionPage(1)
    }
  }

  const handleTabChange = (tab: MainTab) => {
    if (tab === activeTab) {
      return
    }

    if (activeTab === 'project-details' || activeTab === 'collection-details') {
      runTransition(tab === 'collections' ? 'up' : 'down', () => {
        setProjectDetails(null)
        setCollectionDetails(null)
        resetAssetFilters()
        setActiveTab(tab)
      })
      return
    }

    const currentIndex = MAIN_TABS.indexOf(activeTab as MainTab)
    const targetIndex = MAIN_TABS.indexOf(tab)
    const pullDirection: 'up' | 'down' = targetIndex > currentIndex ? 'up' : 'down'

    runTransition(pullDirection, () => {
      setActiveTab(tab)
    })
  }

  const handleOpenProject = async (projectId: number) => {
    try {
      const details = await window.sourceHubApi?.getProjectDetails(projectId)
      if (!details) {
        return
      }

      runTransition('up', () => {
        setCollectionDetails(null)
        setProjectDetails(details)
        resetAssetFilters()
        setActiveTab('project-details')
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open project'
      window.alert(message)
    }
  }

  const handleOpenCollection = async (collectionId: number) => {
    try {
      const details = await window.sourceHubApi?.getCollectionDetails(collectionId)
      if (!details) {
        return
      }

      runTransition('up', () => {
        setProjectDetails(null)
        setCollectionDetails(details)
        resetAssetFilters()
        setActiveTab('collection-details')
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open collection'
      window.alert(message)
    }
  }

  const handleBackToDashboard = (target: MainTab) => {
    runTransition(target === 'collections' ? 'up' : 'down', () => {
      setProjectDetails(null)
      setCollectionDetails(null)
      resetAssetFilters()
      setActiveTab(target)
    })
  }

  const handleCreateProject = async () => {
    try {
      if (!newProjectName.trim()) {
        return
      }

      const dbData = await window.sourceHubApi?.createProject({
        name: newProjectName.trim(),
        style: newProjectStyle.trim() || 'Standard',
      })

      if (dbData) {
        setData(dbData)
        setIsProjectModalOpen(false)
        setNewProjectName('')
        setNewProjectStyle('Standard')

        if (activeTab !== 'projects') {
          handleBackToDashboard('projects')
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project'
      window.alert(message)
    }
  }

  const handleRenameProject = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const nameInput = window.prompt('Project name', projectDetails.name)
      if (!nameInput) {
        return
      }

      const styleInput = window.prompt('Project style', projectDetails.style)
      if (!styleInput) {
        return
      }

      const updated = await window.sourceHubApi?.updateProject({
        id: projectDetails.id,
        name: nameInput.trim(),
        style: styleInput.trim(),
      })

      if (updated) {
        setProjectDetails(updated)
        await loadDashboardData()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename project'
      window.alert(message)
    }
  }

  const handleDeleteProject = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const confirmed = window.confirm(`Delete project "${projectDetails.name}" and all linked assets?`)
      if (!confirmed) {
        return
      }

      const dbData = await window.sourceHubApi?.deleteProject(projectDetails.id)
      if (dbData) {
        setData(dbData)
        handleBackToDashboard('projects')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project'
      window.alert(message)
    }
  }

  const handleCreateCollection = async () => {
    try {
      if (!newCollectionName.trim()) {
        return
      }

      const dbData = await window.sourceHubApi?.createCollection({
        name: newCollectionName.trim(),
      })

      if (dbData) {
        setData(dbData)
        setIsCollectionModalOpen(false)
        setNewCollectionName('')

        if (activeTab !== 'collections') {
          handleBackToDashboard('collections')
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create collection'
      window.alert(message)
    }
  }

  const handleRenameCollection = async () => {
    try {
      if (!collectionDetails) {
        return
      }

      const nameInput = window.prompt('Collection name', collectionDetails.name)
      if (!nameInput) {
        return
      }

      const updated = await window.sourceHubApi?.renameCollection({
        id: collectionDetails.id,
        name: nameInput.trim(),
      })

      if (updated) {
        setCollectionDetails(updated)
        await loadDashboardData()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename collection'
      window.alert(message)
    }
  }

  const handleDeleteCollection = async () => {
    try {
      if (!collectionDetails) {
        return
      }

      const confirmed = window.confirm(`Delete collection "${collectionDetails.name}"?`)
      if (!confirmed) {
        return
      }

      const dbData = await window.sourceHubApi?.deleteCollection(collectionDetails.id)
      if (dbData) {
        setData(dbData)
        handleBackToDashboard('collections')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete collection'
      window.alert(message)
    }
  }

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  const toggleCollectionSelection = (collectionId: number) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(collectionId) ? prev.filter((id) => id !== collectionId) : [...prev, collectionId]
    )
  }

  const toggleAllProjectsSelection = () => {
    if (data.projects.length === 0) {
      return
    }

    const allSelected = data.projects.every((project) => selectedProjectIds.includes(project.id))
    if (allSelected) {
      setSelectedProjectIds([])
      return
    }

    setSelectedProjectIds(data.projects.map((project) => project.id))
  }

  const toggleAllCollectionsSelection = () => {
    if (data.collections.length === 0) {
      return
    }

    const allSelected = data.collections.every((collection) => selectedCollectionIds.includes(collection.id))
    if (allSelected) {
      setSelectedCollectionIds([])
      return
    }

    setSelectedCollectionIds(data.collections.map((collection) => collection.id))
  }

  const handleBulkDeleteProjects = async () => {
    try {
      if (selectedProjectIds.length === 0) {
        return
      }

      const confirmed = window.confirm(`Delete ${selectedProjectIds.length} selected projects and all linked assets?`)
      if (!confirmed) {
        return
      }

      let latestData: DashboardData | null = null
      for (const projectId of selectedProjectIds) {
        const updated = await window.sourceHubApi?.deleteProject(projectId)
        if (updated) {
          latestData = updated
        }
      }

      if (latestData) {
        setData(latestData)
      } else {
        await loadDashboardData()
      }
      setSelectedProjectIds([])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete selected projects'
      window.alert(message)
    }
  }

  const handleBulkDeleteCollections = async () => {
    try {
      if (selectedCollectionIds.length === 0) {
        return
      }

      const confirmed = window.confirm(`Delete ${selectedCollectionIds.length} selected collections?`)
      if (!confirmed) {
        return
      }

      let latestData: DashboardData | null = null
      for (const collectionId of selectedCollectionIds) {
        const updated = await window.sourceHubApi?.deleteCollection(collectionId)
        if (updated) {
          latestData = updated
        }
      }

      if (latestData) {
        setData(latestData)
      } else {
        await loadDashboardData()
      }
      setSelectedCollectionIds([])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete selected collections'
      window.alert(message)
    }
  }

  const handleImportProjectMedia = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const updatedDetails = await window.sourceHubApi?.importAssets(projectDetails.id)
      if (updatedDetails) {
        setProjectDetails(updatedDetails)
        await loadDashboardData()
        pushActivity(`Imported files into project ${updatedDetails.name}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import files'
      window.alert(message)
    }
  }

  const handleAutoSortProjectFolder = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const folderPath = await window.sourceHubApi?.pickFolder()
      if (!folderPath) {
        return
      }

      const updatedDetails = await window.sourceHubApi?.autoSortProjectFolder({
        projectId: projectDetails.id,
        folderPath,
      })

      if (updatedDetails) {
        setProjectDetails(updatedDetails)
        await loadDashboardData()
        pushActivity(`Auto-sorted folder into project ${updatedDetails.name}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to auto-sort folder'
      window.alert(message)
    }
  }

  const handleShowLibraryRoot = async () => {
    try {
      const libraryRoot = await window.sourceHubApi?.getLibraryRoot()
      if (!libraryRoot) {
        return
      }

      window.alert(`Managed library root:\n${libraryRoot}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get library root'
      window.alert(message)
    }
  }

  const handleSelectLibraryRoot = async () => {
    try {
      const folderPath = await window.sourceHubApi?.pickFolder()
      if (!folderPath) {
        return
      }

      const settings = await window.sourceHubApi?.setLibraryRoot(folderPath)
      if (settings) {
        setLibraryRootPath(settings.libraryRoot)
        setWorkspaceRootPath(settings.workspaceRoot)
        setRealtimeWatchEnabled(settings.realtimeWatchEnabled)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set library root'
      window.alert(message)
    }
  }

  const handleSelectWorkspaceRoot = async () => {
    try {
      const folderPath = await window.sourceHubApi?.pickFolder()
      if (!folderPath) {
        return
      }

      const settings = await window.sourceHubApi?.setWorkspaceRoot(folderPath)
      if (settings) {
        setLibraryRootPath(settings.libraryRoot)
        setWorkspaceRootPath(settings.workspaceRoot)
        setRealtimeWatchEnabled(settings.realtimeWatchEnabled)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set workspace root'
      window.alert(message)
    }
  }

  const handleOpenLibraryRoot = async () => {
    try {
      if (!libraryRootPath) {
        return
      }

      await window.sourceHubApi?.openFolder(libraryRootPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open library folder'
      window.alert(message)
    }
  }

  const handleOpenWorkspaceRoot = async () => {
    try {
      if (!workspaceRootPath) {
        return
      }

      await window.sourceHubApi?.openFolder(workspaceRootPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open workspace folder'
      window.alert(message)
    }
  }

  const handleSetProjectWatchFolder = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const folderPath = await window.sourceHubApi?.pickFolder()
      if (!folderPath) {
        return
      }

      const updatedDetails = await window.sourceHubApi?.setProjectWatchFolder({
        projectId: projectDetails.id,
        folderPath,
      })

      if (updatedDetails) {
        setProjectDetails(updatedDetails)
        pushActivity(`Watch folder updated for project ${updatedDetails.name}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set watch folder'
      window.alert(message)
    }
  }

  const handleOpenProjectWatchFolder = async () => {
    try {
      if (!projectDetails?.watchFolderPath) {
        return
      }

      await window.sourceHubApi?.openFolder(projectDetails.watchFolderPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open watch folder'
      window.alert(message)
    }
  }

  const handleAutoSortProjectWatchFolder = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const updatedDetails = await window.sourceHubApi?.autoSortProjectWatchFolder({
        projectId: projectDetails.id,
      })

      if (updatedDetails) {
        setProjectDetails(updatedDetails)
        await loadDashboardData()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to auto-sort watch folder'
      window.alert(message)
    }
  }

  const handleAutoSortProjectFromWorkspace = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const updatedDetails = await window.sourceHubApi?.autoSortProjectFromWorkspace({
        projectId: projectDetails.id,
      })

      if (updatedDetails) {
        setProjectDetails(updatedDetails)
        await loadDashboardData()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to auto-sort from workspace root'
      window.alert(message)
    }
  }

  const handleOpenProjectManagedFolder = async () => {
    try {
      if (!projectDetails) {
        return
      }

      const managedFolder = await window.sourceHubApi?.getProjectManagedFolder(projectDetails.id)
      if (!managedFolder) {
        return
      }

      await window.sourceHubApi?.openFolder(managedFolder)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open project managed folder'
      window.alert(message)
    }
  }

  const handleImportCollectionMedia = async () => {
    try {
      if (!collectionDetails) {
        return
      }

      const updatedDetails = await window.sourceHubApi?.importAssetsToCollection(collectionDetails.id)
      if (updatedDetails) {
        setCollectionDetails(updatedDetails)
        await loadDashboardData()
        pushActivity(`Imported files into collection ${updatedDetails.name}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import files to collection'
      window.alert(message)
    }
  }

  const handleDeleteProjectAsset = async (assetId: number) => {
    try {
      if (!projectDetails) {
        return
      }

      const updated = await window.sourceHubApi?.deleteAsset({
        projectId: projectDetails.id,
        assetId,
      })

      if (updated) {
        setProjectDetails(updated)
        setSelectedProjectAssetIds((prev) => prev.filter((id) => id !== assetId))
        await loadDashboardData()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete asset'
      window.alert(message)
    }
  }

  const handleUnlinkCollectionAsset = async (assetId: number) => {
    try {
      if (!collectionDetails) {
        return
      }

      const updated = await window.sourceHubApi?.removeAssetFromCollection({
        collectionId: collectionDetails.id,
        assetId,
      })

      if (updated) {
        setCollectionDetails(updated)
        setSelectedCollectionAssetIds((prev) => prev.filter((id) => id !== assetId))
        await loadDashboardData()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlink asset'
      window.alert(message)
    }
  }

  const toggleProjectAssetSelection = (assetId: number) => {
    setSelectedProjectAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    )
  }

  const toggleCollectionAssetSelection = (assetId: number) => {
    setSelectedCollectionAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    )
  }

  const toggleProjectPageSelection = () => {
    const idsOnPage = projectPagination.items.map((asset) => asset.id)
    if (idsOnPage.length === 0) {
      return
    }

    setSelectedProjectAssetIds((prev) => {
      if (idsOnPage.every((id) => prev.includes(id))) {
        return prev.filter((id) => !idsOnPage.includes(id))
      }
      return Array.from(new Set([...prev, ...idsOnPage]))
    })
  }

  const toggleCollectionPageSelection = () => {
    const idsOnPage = collectionPagination.items.map((asset) => asset.id)
    if (idsOnPage.length === 0) {
      return
    }

    setSelectedCollectionAssetIds((prev) => {
      if (idsOnPage.every((id) => prev.includes(id))) {
        return prev.filter((id) => !idsOnPage.includes(id))
      }
      return Array.from(new Set([...prev, ...idsOnPage]))
    })
  }

  const handleBulkDeleteProjectAssets = async () => {
    try {
      if (!projectDetails || selectedProjectAssetIds.length === 0) {
        return
      }

      const confirmed = window.confirm(`Delete ${selectedProjectAssetIds.length} selected assets?`)
      if (!confirmed) {
        return
      }

      let latestDetails: ProjectDetails = projectDetails
      for (const assetId of selectedProjectAssetIds) {
        const updated = await window.sourceHubApi?.deleteAsset({
          projectId: latestDetails.id,
          assetId,
        })
        if (updated) {
          latestDetails = updated
        }
      }

      setProjectDetails(latestDetails)
      setSelectedProjectAssetIds([])
      await loadDashboardData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete selected assets'
      window.alert(message)
    }
  }

  const handleBulkUnlinkCollectionAssets = async () => {
    try {
      if (!collectionDetails || selectedCollectionAssetIds.length === 0) {
        return
      }

      const confirmed = window.confirm(`Unlink ${selectedCollectionAssetIds.length} selected assets from collection?`)
      if (!confirmed) {
        return
      }

      let latestDetails: CollectionDetails = collectionDetails
      for (const assetId of selectedCollectionAssetIds) {
        const updated = await window.sourceHubApi?.removeAssetFromCollection({
          collectionId: latestDetails.id,
          assetId,
        })
        if (updated) {
          latestDetails = updated
        }
      }

      setCollectionDetails(latestDetails)
      setSelectedCollectionAssetIds([])
      await loadDashboardData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlink selected assets'
      window.alert(message)
    }
  }

  const handleLinkSelectedProjectAssetsToCollection = async () => {
    try {
      if (!projectDetails || selectedProjectAssetIds.length === 0 || targetCollectionId === '') {
        return
      }

      const targetCollection = data.collections.find((collection) => collection.id === targetCollectionId)
      if (!targetCollection) {
        window.alert('Target collection was not found')
        return
      }

      const confirmed = window.confirm(
        `Link ${selectedProjectAssetIds.length} selected assets to collection "${targetCollection.name}"?`
      )
      if (!confirmed) {
        return
      }

      for (const assetId of selectedProjectAssetIds) {
        await window.sourceHubApi?.addAssetToCollection({
          collectionId: targetCollectionId,
          assetId,
        })
      }

      setSelectedProjectAssetIds([])
      await loadDashboardData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to link assets to collection'
      window.alert(message)
    }
  }

  const getFilteredAssets = useCallback((assets: AssetData[]) => {
    const query = debouncedAssetQuery.trim().toLowerCase()
    const tokens = query.length === 0 ? [] : query.split(/\s+/).filter(Boolean)

    const filtered = assets.filter((asset) => {
      const extension = getAssetExtension(asset)
      const haystack = `${asset.name} ${asset.mediaType} ${extension} ${asset.sizeFormatted} ${asset.createdAt}`.toLowerCase()

      const queryMatch =
        tokens.length === 0 ||
        tokens.every((token) => {
          if (token.startsWith('type:')) {
            return asset.mediaType.startsWith(token.slice(5))
          }

          if (token.startsWith('ext:')) {
            return extension === token.slice(4)
          }

          const sizeCheck = parseSizeToken(token)
          if (sizeCheck) {
            return evaluateSizeToken(asset.sizeBytes, sizeCheck.operator, sizeCheck.bytes)
          }

          return haystack.includes(token)
        })

      const typeMatch = assetTypeFilter === 'all' || asset.mediaType === assetTypeFilter
      return queryMatch && typeMatch
    })

    const sorted = [...filtered]
    if (assetSort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (assetSort === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (assetSort === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (assetSort === 'sizeAsc') {
      sorted.sort((a, b) => a.sizeBytes - b.sizeBytes)
    } else if (assetSort === 'sizeDesc') {
      sorted.sort((a, b) => b.sizeBytes - a.sizeBytes)
    }

    return sorted
  }, [assetSort, assetTypeFilter, debouncedAssetQuery])

  const paginateAssets = (assets: AssetData[], page: number) => {
    const totalPages = Math.max(1, Math.ceil(assets.length / ASSETS_PER_PAGE))
    const currentPage = Math.min(Math.max(page, 1), totalPages)
    const startIndex = (currentPage - 1) * ASSETS_PER_PAGE
    const items = assets.slice(startIndex, startIndex + ASSETS_PER_PAGE)
    return { items, currentPage, totalPages }
  }

  const projectAssets = useMemo(
    () => (projectDetails ? getFilteredAssets(projectDetails.assets) : []),
    [projectDetails, getFilteredAssets]
  )
  const collectionAssets = useMemo(
    () => (collectionDetails ? getFilteredAssets(collectionDetails.assets) : []),
    [collectionDetails, getFilteredAssets]
  )
  const projectPagination = useMemo(() => paginateAssets(projectAssets, projectPage), [projectAssets, projectPage])
  const collectionPagination = useMemo(
    () => paginateAssets(collectionAssets, collectionPage),
    [collectionAssets, collectionPage]
  )
  const allProjectsSelected = useMemo(
    () => data.projects.length > 0 && data.projects.every((project) => selectedProjectIds.includes(project.id)),
    [data.projects, selectedProjectIds]
  )
  const allCollectionsSelected = useMemo(
    () => data.collections.length > 0 && data.collections.every((collection) => selectedCollectionIds.includes(collection.id)),
    [data.collections, selectedCollectionIds]
  )

  const isProjectPageFullySelected = useMemo(
    () =>
      projectPagination.items.length > 0 &&
      projectPagination.items.every((asset) => selectedProjectAssetIds.includes(asset.id)),
    [projectPagination.items, selectedProjectAssetIds]
  )
  const isCollectionPageFullySelected = useMemo(
    () =>
      collectionPagination.items.length > 0 &&
      collectionPagination.items.every((asset) => selectedCollectionAssetIds.includes(asset.id)),
    [collectionPagination.items, selectedCollectionAssetIds]
  )

  const projectVirtualSlice = useMemo(
    () => getVirtualSlice(projectPagination.items.length, projectListScrollTop, projectListViewportHeight),
    [projectPagination.items.length, projectListScrollTop, projectListViewportHeight]
  )
  const collectionVirtualSlice = useMemo(
    () => getVirtualSlice(collectionPagination.items.length, collectionListScrollTop, collectionListViewportHeight),
    [collectionPagination.items.length, collectionListScrollTop, collectionListViewportHeight]
  )

  const projectVisibleAssets = useMemo(
    () => projectPagination.items.slice(projectVirtualSlice.startIndex, projectVirtualSlice.endIndex),
    [projectPagination.items, projectVirtualSlice.startIndex, projectVirtualSlice.endIndex]
  )
  const collectionVisibleAssets = useMemo(
    () => collectionPagination.items.slice(collectionVirtualSlice.startIndex, collectionVirtualSlice.endIndex),
    [collectionPagination.items, collectionVirtualSlice.startIndex, collectionVirtualSlice.endIndex]
  )

  useEffect(() => {
    if (projectPage !== projectPagination.currentPage) {
      setProjectPage(projectPagination.currentPage)
    }
  }, [projectPage, projectPagination.currentPage])

  useEffect(() => {
    setProjectListScrollTop(0)
    if (projectAssetsViewportRef.current) {
      projectAssetsViewportRef.current.scrollTop = 0
    }
  }, [projectPagination.currentPage, assetTypeFilter, assetSort, debouncedAssetQuery, projectDetails?.id])

  useEffect(() => {
    if (collectionPage !== collectionPagination.currentPage) {
      setCollectionPage(collectionPagination.currentPage)
    }
  }, [collectionPage, collectionPagination.currentPage])

  useEffect(() => {
    setCollectionListScrollTop(0)
    if (collectionAssetsViewportRef.current) {
      collectionAssetsViewportRef.current.scrollTop = 0
    }
  }, [collectionPagination.currentPage, assetTypeFilter, assetSort, debouncedAssetQuery, collectionDetails?.id])

  useEffect(() => {
    syncAssetViewportHeights()
    window.addEventListener('resize', syncAssetViewportHeights)
    return () => {
      window.removeEventListener('resize', syncAssetViewportHeights)
    }
  }, [activeTab, projectDetails?.id, collectionDetails?.id])

  useEffect(() => {
    const visibleAssets = [...projectVisibleAssets, ...collectionVisibleAssets]
    for (const asset of visibleAssets) {
      const sourcePath = asset.managedPath || asset.sourcePath
      const cacheKey = sourcePath ? `${asset.mediaType}:${sourcePath}` : `asset:${asset.id}`

      if (thumbnailMap[asset.id] !== undefined) {
        continue
      }

      if (thumbnailCacheRef.current.has(cacheKey)) {
        setThumbnailMap((prev) => ({
          ...prev,
          [asset.id]: thumbnailCacheRef.current.get(cacheKey) ?? null,
        }))
        continue
      }

      if (thumbnailPendingRef.current.has(cacheKey)) {
        continue
      }

      thumbnailPendingRef.current.add(cacheKey)

      void Promise.resolve().then(() => {
        const resolveThumbnail = async () => {
          if (!sourcePath) {
            return null
          }

          if (asset.mediaType === 'image') {
            return toFileUrl(sourcePath)
          }

          if (asset.mediaType === 'video') {
            return generateVideoThumbnail(sourcePath)
          }

          return null
        }

        void resolveThumbnail().then((thumbnail) => {
          thumbnailCacheRef.current.set(cacheKey, thumbnail)
          setThumbnailMap((prev) => ({
            ...prev,
            [asset.id]: thumbnail,
          }))
        })
      }).finally(() => {
        thumbnailPendingRef.current.delete(cacheKey)
      })
    }
  }, [projectVisibleAssets, collectionVisibleAssets, thumbnailMap])

  useEffect(() => {
    const validIds = new Set(projectAssets.map((asset) => asset.id))
    setSelectedProjectAssetIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [projectAssets])

  useEffect(() => {
    const validIds = new Set(collectionAssets.map((asset) => asset.id))
    setSelectedCollectionAssetIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [collectionAssets])

  useEffect(() => {
    const validIds = new Set(data.projects.map((project) => project.id))
    setSelectedProjectIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [data.projects])

  useEffect(() => {
    const validIds = new Set(data.collections.map((collection) => collection.id))
    setSelectedCollectionIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [data.collections])

  useEffect(() => {
    if (data.collections.length === 0) {
      if (targetCollectionId !== '') {
        setTargetCollectionId('')
      }
      return
    }

    if (targetCollectionId === '' || !data.collections.some((collection) => collection.id === targetCollectionId)) {
      setTargetCollectionId(data.collections[0].id)
    }
  }, [data.collections, targetCollectionId])

  const colors = ['var(--color-1)', 'var(--color-2)', 'var(--color-3)', 'var(--color-4)', 'var(--color-5)']

  return (
    <div
      className={`layout-engine profile-${performanceProfile} ${realtimeAnimationsEnabled ? 'motion-on' : 'motion-off'} icons-${iconScale}`}
    >
      {curtain && (
        <div className={`scene-curtain curtain-${curtain}`}>
          <div className="curtain-text">
            SWITCHING_SEQ //{' '}
            {activeTab === 'projects'
              ? 'PROJECTS'
              : activeTab === 'collections'
                ? 'COLLECTIONS'
                : activeTab === 'settings'
                  ? 'SETTINGS'
                  : 'DETAILS'}
          </div>
        </div>
      )}

      <div className="workspace">
        <nav className={`tool-panel ${isSidebarCollapsed ? 'collapsed' : ''} variant-${collapsedSidebarVariant}`}>
          <button
            className="collapse-toggle"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? '>' : '<'}
          </button>

          <div className="brand-section">
            <h1>{isSidebarCollapsed ? 'SH' : 'SourceHub'}</h1>
            {!isSidebarCollapsed && <p>ASSET CONTROL</p>}
          </div>

          <div className="tab-triggers">
            <button
              className={`trigger-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => handleTabChange('projects')}
              title="Projects"
            >
              <span className="tab-label-wrap">
                <MonoIcon name="projects" className="mono-icon tab-icon" />
                {!isSidebarCollapsed && <span>Timeline_Cuts</span>}
              </span>
              {isSidebarCollapsed && <span className="btn-icon-fallback">PJ</span>}
              {!isSidebarCollapsed && <span className="trigger-arrow">{activeTab === 'projects' ? 'ON' : 'GO'}</span>}
            </button>

            <button
              className={`trigger-btn ${activeTab === 'collections' ? 'active' : ''}`}
              onClick={() => handleTabChange('collections')}
              title="Collections"
            >
              <span className="tab-label-wrap">
                <MonoIcon name="collections" className="mono-icon tab-icon" />
                {!isSidebarCollapsed && <span>Master_Vault</span>}
              </span>
              {isSidebarCollapsed && <span className="btn-icon-fallback">CL</span>}
              {!isSidebarCollapsed && <span className="trigger-arrow">{activeTab === 'collections' ? 'ON' : 'GO'}</span>}
            </button>

            <button
              className={`trigger-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabChange('settings')}
              title="Settings"
            >
              <span className="tab-label-wrap">
                <MonoIcon name="settings" className="mono-icon tab-icon" />
                {!isSidebarCollapsed && <span>System_Config</span>}
              </span>
              {isSidebarCollapsed && <span className="btn-icon-fallback">ST</span>}
              {!isSidebarCollapsed && <span className="trigger-arrow">{activeTab === 'settings' ? 'ON' : 'GO'}</span>}
            </button>
          </div>

          <div className="create-actions-panel">
            <button className="create-action-btn" onClick={() => setIsProjectModalOpen(true)} title="Create New Project">
              {isSidebarCollapsed ? (
                <span className="create-action-content">
                  <MonoIcon name="plus" className="mono-icon create-action-icon" />
                  <span>P</span>
                </span>
              ) : (
                <span className="create-action-content">
                  <MonoIcon name="plus" className="mono-icon create-action-icon" />
                  <span>NEW_PROJECT</span>
                </span>
              )}
            </button>
            <button
              className="create-action-btn create-collection-btn"
              onClick={() => setIsCollectionModalOpen(true)}
              title="Create New Collection"
            >
              {isSidebarCollapsed ? (
                <span className="create-action-content">
                  <MonoIcon name="plus" className="mono-icon create-action-icon" />
                  <span>C</span>
                </span>
              ) : (
                <span className="create-action-content">
                  <MonoIcon name="plus" className="mono-icon create-action-icon" />
                  <span>NEW_COLLECTION</span>
                </span>
              )}
            </button>
          </div>

          <div className="system-status">
            <div className="status-indicator">
              <span className="blink-dot" />
              {!isSidebarCollapsed && <span>SYS.REC</span>}
            </div>
            {!isSidebarCollapsed && (
              <p className="timecode" ref={timecodeRef}>
                00:00:00:00
              </p>
            )}
          </div>
        </nav>

        <main className="viewport">
          <div className="viewport-scroll">
            <div className={`viewport-content ${isPushingBack ? 'content-push-back' : 'content-pop-forward'}`}>
              <div className="typo-header">
                <h2>
                  {activeTab === 'projects'
                    ? 'LATEST_CUTS'
                    : activeTab === 'collections'
                      ? 'MASTER_VAULT'
                      : activeTab === 'settings'
                        ? 'SETTINGS_PANEL'
                      : activeTab === 'project-details'
                        ? 'PROJECT_INSPECT'
                        : 'COLLECTION_INSPECT'}
                </h2>
                <div className="meta-line">
                  {activeTab === 'projects' && `PROJECTS: ${data.projects.length} | SYNCED_LOCAL`}
                  {activeTab === 'collections' && `COLLECTIONS: ${data.collections.length} | SYNCED_LOCAL`}
                  {activeTab === 'settings' && `REALTIME_WATCH: ${realtimeWatchEnabled ? 'ON' : 'OFF'} | SYSTEM_CONFIG`}
                  {activeTab === 'project-details' && `ASSETS: ${projectAssets.length} | FILTERED_VIEW`}
                  {activeTab === 'collection-details' && `ASSETS: ${collectionAssets.length} | FILTERED_VIEW`}
                </div>
              </div>

              {activeTab === 'projects' && (
                <div className="dashboard-panels">
                  <div className="stats-strip">
                    {data.quickStats.map((stat) => (
                      <div key={stat.label} className="stat-tile">
                        <span className="stat-label">{stat.label}</span>
                        <span className="stat-value">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pipeline-strip">
                    {data.importPipeline.map((step) => (
                      <div key={step.name} className="pipeline-item">
                        <span>{step.name}</span>
                        <span>{step.status}</span>
                        <span>{step.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="dashboard-bulk-toolbar">
                    <div className="asset-selection-tools">
                      <button className="action-cut mini-cut" onClick={toggleAllProjectsSelection}>
                        <span className="btn-inline-icon-wrap">
                          <MonoIcon name={allProjectsSelected ? 'close' : 'check'} className="mono-icon inline-btn-icon" />
                          <span>{allProjectsSelected ? 'UNSELECT_ALL' : 'SELECT_ALL'}</span>
                        </span>
                      </button>
                      <button
                        className="action-cut mini-cut"
                        onClick={() => setSelectedProjectIds([])}
                        disabled={selectedProjectIds.length === 0}
                      >
                        <span className="btn-inline-icon-wrap">
                          <MonoIcon name="close" className="mono-icon inline-btn-icon" />
                          <span>CLEAR_SELECTION</span>
                        </span>
                      </button>
                    </div>
                    <button
                      className="action-cut mini-cut danger-cut"
                      onClick={handleBulkDeleteProjects}
                      disabled={selectedProjectIds.length === 0}
                    >
                      <span className="btn-inline-icon-wrap">
                        <MonoIcon name="trash" className="mono-icon inline-btn-icon" />
                        <span>DELETE_SELECTED ({selectedProjectIds.length})</span>
                      </span>
                    </button>
                  </div>

                </div>
              )}

              {activeTab === 'collections' && (
                <div className="dashboard-bulk-toolbar collection-toolbar">
                  <div className="asset-selection-tools">
                    <button className="action-cut mini-cut" onClick={toggleAllCollectionsSelection}>
                      <span className="btn-inline-icon-wrap">
                        <MonoIcon name={allCollectionsSelected ? 'close' : 'check'} className="mono-icon inline-btn-icon" />
                        <span>{allCollectionsSelected ? 'UNSELECT_ALL' : 'SELECT_ALL'}</span>
                      </span>
                    </button>
                    <button
                      className="action-cut mini-cut"
                      onClick={() => setSelectedCollectionIds([])}
                      disabled={selectedCollectionIds.length === 0}
                    >
                      <span className="btn-inline-icon-wrap">
                        <MonoIcon name="close" className="mono-icon inline-btn-icon" />
                        <span>CLEAR_SELECTION</span>
                      </span>
                    </button>
                  </div>
                  <button
                    className="action-cut mini-cut danger-cut"
                    onClick={handleBulkDeleteCollections}
                    disabled={selectedCollectionIds.length === 0}
                  >
                    <span className="btn-inline-icon-wrap">
                      <MonoIcon name="trash" className="mono-icon inline-btn-icon" />
                      <span>DELETE_SELECTED ({selectedCollectionIds.length})</span>
                    </span>
                  </button>
                </div>
              )}

              <div className="blocks-grid">
                {activeTab === 'settings' && (
                  <div className="settings-panel-view">
                    <div className="settings-grid">
                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="library" className="mono-icon settings-title-icon" />
                          <span>LIBRARY_ROOT</span>
                        </h3>
                        <p>{libraryRootPath || 'NOT_SET'}</p>
                        <div className="settings-actions-row">
                          <button className="action-cut mini-cut" onClick={handleSelectLibraryRoot}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="folder" className="mono-icon inline-btn-icon" />
                              <span>SET_FOLDER</span>
                            </span>
                          </button>
                          <button className="action-cut mini-cut" onClick={handleOpenLibraryRoot}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="open" className="mono-icon inline-btn-icon" />
                              <span>OPEN_FOLDER</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="workspace" className="mono-icon settings-title-icon" />
                          <span>WORKSPACE_ROOT</span>
                        </h3>
                        <p>{workspaceRootPath || 'NOT_SET'}</p>
                        <div className="settings-actions-row">
                          <button className="action-cut mini-cut" onClick={handleSelectWorkspaceRoot}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="folder" className="mono-icon inline-btn-icon" />
                              <span>SET_FOLDER</span>
                            </span>
                          </button>
                          <button
                            className="action-cut mini-cut"
                            onClick={handleOpenWorkspaceRoot}
                            disabled={!workspaceRootPath}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="open" className="mono-icon inline-btn-icon" />
                              <span>OPEN_FOLDER</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="watch" className="mono-icon settings-title-icon" />
                          <span>REALTIME_WATCH</span>
                        </h3>
                        <p>{realtimeWatchEnabled ? 'ENABLED' : 'DISABLED'}</p>
                        <div className="settings-actions-row">
                          <button className="action-cut mini-cut" onClick={handleToggleRealtimeWatch}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon
                                name={realtimeWatchEnabled ? 'close' : 'bolt'}
                                className="mono-icon inline-btn-icon"
                              />
                              <span>{realtimeWatchEnabled ? 'TURN_OFF' : 'TURN_ON'}</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="bolt" className="mono-icon settings-title-icon" />
                          <span>AUTO_UPDATE</span>
                        </h3>
                        <p>{autoUpdateEnabled ? 'ENABLED' : 'DISABLED'}</p>
                        <div className="settings-actions-row">
                          <button className="action-cut mini-cut" onClick={handleToggleAutoUpdate}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name={autoUpdateEnabled ? 'close' : 'check'} className="mono-icon inline-btn-icon" />
                              <span>{autoUpdateEnabled ? 'TURN_OFF' : 'TURN_ON'}</span>
                            </span>
                          </button>
                          <button className="action-cut mini-cut" onClick={handleCheckForUpdates} disabled={isCheckingUpdates}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="activity" className="mono-icon inline-btn-icon" />
                              <span>{isCheckingUpdates ? 'CHECKING...' : 'CHECK_UPDATE'}</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="brush" className="mono-icon settings-title-icon" />
                          <span>COLLAPSED_SIDEBAR_STYLE</span>
                        </h3>
                        <p>{collapsedSidebarVariant === 'clean' ? 'CLEAN' : 'BOLD'}</p>
                        <div className="settings-actions-row">
                          <button
                            className="action-cut mini-cut"
                            onClick={() => setCollapsedSidebarVariant('clean')}
                            disabled={collapsedSidebarVariant === 'clean'}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="check" className="mono-icon inline-btn-icon" />
                              <span>CLEAN</span>
                            </span>
                          </button>
                          <button
                            className="action-cut mini-cut"
                            onClick={() => setCollapsedSidebarVariant('bold')}
                            disabled={collapsedSidebarVariant === 'bold'}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="check" className="mono-icon inline-btn-icon" />
                              <span>BOLD</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="gauge" className="mono-icon settings-title-icon" />
                          <span>PERFORMANCE_PROFILE</span>
                        </h3>
                        <p>{performanceProfile === 'lite' ? 'LITE (LOW-END DEVICES)' : 'BALANCED'}</p>
                        <div className="settings-actions-row">
                          <button
                            className="action-cut mini-cut"
                            onClick={() => setPerformanceProfile('balanced')}
                            disabled={performanceProfile === 'balanced'}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="check" className="mono-icon inline-btn-icon" />
                              <span>BALANCED</span>
                            </span>
                          </button>
                          <button
                            className="action-cut mini-cut"
                            onClick={() => setPerformanceProfile('lite')}
                            disabled={performanceProfile === 'lite'}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="check" className="mono-icon inline-btn-icon" />
                              <span>LITE</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="motion" className="mono-icon settings-title-icon" />
                          <span>REALTIME_ANIMATION</span>
                        </h3>
                        <p>{realtimeAnimationsEnabled ? 'ON' : 'OFF'}</p>
                        <div className="settings-actions-row">
                          <button
                            className="action-cut mini-cut"
                            onClick={() => setRealtimeAnimationsEnabled((prev) => !prev)}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon
                                name={realtimeAnimationsEnabled ? 'close' : 'bolt'}
                                className="mono-icon inline-btn-icon"
                              />
                              <span>{realtimeAnimationsEnabled ? 'TURN_OFF' : 'TURN_ON'}</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="settings" className="mono-icon settings-title-icon" />
                          <span>ICON_SIZE</span>
                        </h3>
                        <p>{iconScale === 'small' ? 'SMALL (LOW HEIGHT)' : 'MEDIUM'}</p>
                        <div className="settings-actions-row">
                          <button
                            className="action-cut mini-cut"
                            onClick={() => setIconScale('small')}
                            disabled={iconScale === 'small'}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="check" className="mono-icon inline-btn-icon" />
                              <span>SMALL</span>
                            </span>
                          </button>
                          <button
                            className="action-cut mini-cut"
                            onClick={() => setIconScale('medium')}
                            disabled={iconScale === 'medium'}
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="check" className="mono-icon inline-btn-icon" />
                              <span>MEDIUM</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="bolt" className="mono-icon settings-title-icon" />
                          <span>PERFORMANCE_DIAGNOSTICS</span>
                        </h3>
                        <div className="settings-diagnostics-list">
                          <span>FPS: {fps}</span>
                          <span>Thumb Cache: {Object.keys(thumbnailMap).length}</span>
                          <span>Project Visible Rows: {projectVisibleAssets.length}</span>
                          <span>Collection Visible Rows: {collectionVisibleAssets.length}</span>
                        </div>
                      </div>

                      <div className="settings-card settings-activity-card">
                        <h3 className="settings-title-with-icon">
                          <MonoIcon name="activity" className="mono-icon settings-title-icon" />
                          <span>ACTIVITY_LOG</span>
                        </h3>
                        <div className="settings-activity-list">
                          {activityLog.length === 0 ? (
                            <span>No recent activity</span>
                          ) : (
                            activityLog.map((entry) => (
                              <span key={entry.id}>
                                [{entry.at}] {entry.message}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'projects' &&
                  data.projects.map((project, i) => (
                    <div key={project.id} className="art-block" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div className="block-header" style={{ backgroundColor: colors[i % colors.length] }}>
                        <span>TRK_{String(i + 1).padStart(3, '0')}</span>
                        <div className="block-header-actions">
                          <span>{project.style.toUpperCase()}</span>
                          <label className="block-select-toggle" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedProjectIds.includes(project.id)}
                              onChange={() => toggleProjectSelection(project.id)}
                            />
                            <span>SEL</span>
                          </label>
                        </div>
                      </div>

                      <div className="block-title-area">
                        <h3 className="block-title">{project.name}</h3>
                      </div>

                      <div className="block-footer">
                        <div className="tech-spec">
                          SIZE: {project.storage}
                          <br />
                          CACHE: {project.assets} FILES
                          <br />
                          UPDATED: {project.lastUpdate}
                        </div>
                        <button className="action-cut" onClick={() => handleOpenProject(project.id)}>
                          OPEN_SEQ
                        </button>
                      </div>
                    </div>
                  ))}

                {activeTab === 'collections' &&
                  data.collections.map((collection, i) => (
                    <div key={collection.id} className="art-block vault-block" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div
                        className="block-header"
                        style={{ backgroundColor: colors[(i + 3) % colors.length], color: '#111' }}
                      >
                        <span>BIN_{String(i + 1).padStart(3, '0')}</span>
                        <div className="block-header-actions">
                          <span>COLLECTION</span>
                          <label className="block-select-toggle" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedCollectionIds.includes(collection.id)}
                              onChange={() => toggleCollectionSelection(collection.id)}
                            />
                            <span>SEL</span>
                          </label>
                        </div>
                      </div>

                      <div className="block-title-area">
                        <h3 className="block-title">{collection.name}</h3>
                      </div>

                      <div className="block-footer">
                        <div className="tech-spec">
                          SIZE: {collection.storage}
                          <br />
                          CACHE: {collection.assets} FILES
                          <br />
                          UPDATED: {collection.lastUpdate}
                        </div>
                        <button className="action-cut" onClick={() => handleOpenCollection(collection.id)}>
                          INSPECT_BIN
                        </button>
                      </div>
                    </div>
                  ))}

                {activeTab === 'project-details' && projectDetails && (
                  <div className="project-details-view">
                    <div className="project-details-header">
                      <div className="project-toolbar project-toolbar-extended">
                        <button className="back-btn" onClick={() => handleBackToDashboard('projects')}>
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="back" className="mono-icon inline-btn-icon" />
                            <span>Back to Projects</span>
                          </span>
                        </button>
                        <div className="details-actions primary-actions">
                          <button
                            className="action-cut compact-action-btn"
                            onClick={handleImportProjectMedia}
                            data-label="Import Files"
                            title="Import Files"
                            aria-label="Import Files"
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="import" className="mono-icon inline-btn-icon" />
                              <span className="compact-action-label">Import Files</span>
                            </span>
                          </button>
                          <button
                            className="action-cut compact-action-btn"
                            onClick={handleAutoSortProjectFolder}
                            data-label="Auto Sort Folder"
                            title="Auto Sort Folder"
                            aria-label="Auto Sort Folder"
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="sort" className="mono-icon inline-btn-icon" />
                              <span className="compact-action-label">Auto Sort Folder</span>
                            </span>
                          </button>
                          <button
                            className="action-cut compact-action-btn"
                            onClick={handleSetProjectWatchFolder}
                            data-label="Set Watch Folder"
                            title="Set Watch Folder"
                            aria-label="Set Watch Folder"
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="watch" className="mono-icon inline-btn-icon" />
                              <span className="compact-action-label">Set Watch Folder</span>
                            </span>
                          </button>
                          <button
                            className="action-cut compact-action-btn"
                            onClick={handleOpenProjectManagedFolder}
                            data-label="Open Project Folder"
                            title="Open Project Folder"
                            aria-label="Open Project Folder"
                          >
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="folder" className="mono-icon inline-btn-icon" />
                              <span className="compact-action-label">Open Project Folder</span>
                            </span>
                          </button>
                        </div>
                        <details className="advanced-actions-panel">
                          <summary>More Actions</summary>
                          <div className="details-actions advanced-actions-grid">
                            <button
                              className="action-cut"
                              onClick={handleAutoSortProjectWatchFolder}
                              disabled={!projectDetails.watchFolderPath}
                            >
                              <span className="btn-inline-icon-wrap">
                                <MonoIcon name="sort" className="mono-icon inline-btn-icon" />
                                <span>Auto Sort Watch</span>
                              </span>
                            </button>
                            <button className="action-cut" onClick={handleAutoSortProjectFromWorkspace}>
                              <span className="btn-inline-icon-wrap">
                                <MonoIcon name="sort" className="mono-icon inline-btn-icon" />
                                <span>Auto Sort Workspace</span>
                              </span>
                            </button>
                            <button
                              className="action-cut"
                              onClick={handleOpenProjectWatchFolder}
                              disabled={!projectDetails.watchFolderPath}
                            >
                              <span className="btn-inline-icon-wrap">
                                <MonoIcon name="open" className="mono-icon inline-btn-icon" />
                                <span>Open Watch Folder</span>
                              </span>
                            </button>
                            <button className="action-cut" onClick={handleShowLibraryRoot}>
                              <span className="btn-inline-icon-wrap">
                                <MonoIcon name="library" className="mono-icon inline-btn-icon" />
                                <span>Show Library Path</span>
                              </span>
                            </button>
                            <button className="action-cut" onClick={handleRenameProject}>
                              <span className="btn-inline-icon-wrap">
                                <MonoIcon name="rename" className="mono-icon inline-btn-icon" />
                                <span>Rename Project</span>
                              </span>
                            </button>
                            <button className="action-cut danger-cut" onClick={handleDeleteProject}>
                              <span className="btn-inline-icon-wrap">
                                <MonoIcon name="trash" className="mono-icon inline-btn-icon" />
                                <span>Delete Project</span>
                              </span>
                            </button>
                          </div>
                        </details>
                      </div>

                      <div className="watch-status-strip">
                        <span className={`watch-pill ${projectDetails.watchFolderPath ? 'is-set' : 'is-missing'}`}>
                          Watch: {projectDetails.watchFolderPath ? 'Set' : 'Not Set'}
                        </span>
                        <span className={`watch-pill ${realtimeWatchEnabled ? 'is-set' : 'is-missing'}`}>
                          Realtime: {realtimeWatchEnabled ? 'On' : 'Off'}
                        </span>
                        <button className="action-cut mini-cut" onClick={() => handleTabChange('settings')}>
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="settings" className="mono-icon inline-btn-icon" />
                            <span>Open Settings</span>
                          </span>
                        </button>
                      </div>

                      <h2 className="details-title">{projectDetails.name}</h2>
                      <div className="details-meta">
                        STYLE: {projectDetails.style} | CREATED: {new Date(projectDetails.createdAt).toLocaleDateString()} | UPDATED: {projectDetails.updatedAt}
                      </div>
                      <div className="details-meta">WATCH_FOLDER: {projectDetails.watchFolderPath || 'NOT_SET'}</div>
                    </div>

                    <div className="asset-filters">
                      <input
                        type="text"
                        value={assetQuery}
                        onChange={(event) => handleAssetQueryChange(event.target.value)}
                        placeholder="Search media name"
                      />
                      <select
                        value={assetTypeFilter}
                        onChange={(event) =>
                          handleAssetTypeFilterChange(event.target.value as 'all' | 'video' | 'audio' | 'image' | 'other')
                        }
                      >
                        <option value="all">ALL_TYPES</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="image">Image</option>
                        <option value="other">Other</option>
                      </select>
                      <select value={assetSort} onChange={(event) => handleAssetSortChange(event.target.value as AssetSortMode)}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="name">Name</option>
                        <option value="sizeAsc">Size Asc</option>
                        <option value="sizeDesc">Size Desc</option>
                      </select>
                    </div>

                    <div className="asset-toolbar">
                      <div className="asset-selection-tools">
                        <button className="action-cut mini-cut" onClick={toggleProjectPageSelection}>
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon
                              name={isProjectPageFullySelected ? 'close' : 'check'}
                              className="mono-icon inline-btn-icon"
                            />
                            <span>{isProjectPageFullySelected ? 'Unselect Page' : 'Select Page'}</span>
                          </span>
                        </button>
                        <select
                          className="link-target-select"
                          value={targetCollectionId === '' ? '' : String(targetCollectionId)}
                          onChange={(event) => {
                            const value = event.target.value
                            setTargetCollectionId(value === '' ? '' : Number(value))
                          }}
                          disabled={data.collections.length === 0}
                        >
                          {data.collections.length === 0 ? (
                            <option value="">No Collections</option>
                          ) : (
                            data.collections.map((collection) => (
                              <option key={collection.id} value={collection.id}>
                                {collection.name}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          className="action-cut mini-cut"
                          onClick={handleLinkSelectedProjectAssetsToCollection}
                          disabled={selectedProjectAssetIds.length === 0 || targetCollectionId === ''}
                        >
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="link" className="mono-icon inline-btn-icon" />
                            <span>Link to Collection ({selectedProjectAssetIds.length})</span>
                          </span>
                        </button>
                        <button
                          className="action-cut mini-cut danger-cut"
                          onClick={handleBulkDeleteProjectAssets}
                          disabled={selectedProjectAssetIds.length === 0}
                        >
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="trash" className="mono-icon inline-btn-icon" />
                            <span>Delete Selected ({selectedProjectAssetIds.length})</span>
                          </span>
                        </button>
                      </div>
                      <div className="asset-pagination">
                        <button
                          className="page-btn"
                          onClick={() => setProjectPage((prev) => Math.max(1, prev - 1))}
                          disabled={projectPagination.currentPage <= 1}
                        >
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="left" className="mono-icon inline-btn-icon" />
                            <span>Prev</span>
                          </span>
                        </button>
                        <span>
                          Page {projectPagination.currentPage} / {projectPagination.totalPages}
                        </span>
                        <button
                          className="page-btn"
                          onClick={() => setProjectPage((prev) => Math.min(projectPagination.totalPages, prev + 1))}
                          disabled={projectPagination.currentPage >= projectPagination.totalPages}
                        >
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="right" className="mono-icon inline-btn-icon" />
                            <span>Next</span>
                          </span>
                        </button>
                      </div>
                    </div>

                    <div
                      className="assets-list assets-virtual-list"
                      ref={projectAssetsViewportRef}
                      onScroll={handleProjectAssetsScroll}
                    >
                      <div className="asset-row header-row sticky-header">
                        <span className="col-select">SEL</span>
                        <span className="col-name">Preview / Name</span>
                        <span className="col-type">Type</span>
                        <span className="col-size">Size</span>
                        <span className="col-date">Logged</span>
                        <span className="col-action">Action</span>
                      </div>

                      {projectPagination.items.length === 0 ? (
                        <div className="empty-state">No Matching Media</div>
                      ) : (
                        <>
                          <div className="virtual-spacer" style={{ height: `${projectVirtualSlice.offsetTop}px` }} />
                          {projectVisibleAssets.map((asset) => {
                            const thumbnail = thumbnailMap[asset.id] ?? null

                            return (
                              <div key={asset.id} className="asset-row">
                                <span className="col-select">
                                  <input
                                    type="checkbox"
                                    className="asset-select-checkbox"
                                    checked={selectedProjectAssetIds.includes(asset.id)}
                                    onChange={() => toggleProjectAssetSelection(asset.id)}
                                  />
                                </span>
                                <span className="col-name asset-name-cell">
                                  <span className={`asset-thumb asset-thumb-${asset.mediaType}`}>
                                    {thumbnail ? <img src={thumbnail} alt={asset.name} loading="lazy" /> : asset.mediaType[0].toUpperCase()}
                                  </span>
                                  <span className="asset-name-text">{asset.name}</span>
                                </span>
                                <span className="col-type">{asset.mediaType.toUpperCase()}</span>
                                <span className="col-size">{asset.sizeFormatted}</span>
                                <span className="col-date">{new Date(asset.createdAt).toLocaleDateString()}</span>
                                <button className="asset-delete-btn" onClick={() => handleDeleteProjectAsset(asset.id)}>
                                  <span className="btn-inline-icon-wrap">
                                    <MonoIcon name="trash" className="mono-icon inline-btn-icon" />
                                    <span>Delete</span>
                                  </span>
                                </button>
                              </div>
                            )
                          })}
                          <div className="virtual-spacer" style={{ height: `${projectVirtualSlice.offsetBottom}px` }} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'collection-details' && collectionDetails && (
                  <div className="project-details-view">
                    <div className="project-details-header">
                      <div className="project-toolbar">
                        <button className="back-btn" onClick={() => handleBackToDashboard('collections')}>
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="back" className="mono-icon inline-btn-icon" />
                            <span>Back to Collections</span>
                          </span>
                        </button>
                        <div className="details-actions">
                          <button className="action-cut" onClick={handleImportCollectionMedia}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="import" className="mono-icon inline-btn-icon" />
                              <span>Import to Bin</span>
                            </span>
                          </button>
                          <button className="action-cut" onClick={handleRenameCollection}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="rename" className="mono-icon inline-btn-icon" />
                              <span>Rename Collection</span>
                            </span>
                          </button>
                          <button className="action-cut danger-cut" onClick={handleDeleteCollection}>
                            <span className="btn-inline-icon-wrap">
                              <MonoIcon name="trash" className="mono-icon inline-btn-icon" />
                              <span>Delete Collection</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <h2 className="details-title">{collectionDetails.name}</h2>
                      <div className="details-meta">MANAGED COLLECTION BIN</div>
                    </div>

                    <div className="asset-filters">
                      <input
                        type="text"
                        value={assetQuery}
                        onChange={(event) => handleAssetQueryChange(event.target.value)}
                        placeholder="Search media name"
                      />
                      <select
                        value={assetTypeFilter}
                        onChange={(event) =>
                          handleAssetTypeFilterChange(event.target.value as 'all' | 'video' | 'audio' | 'image' | 'other')
                        }
                      >
                        <option value="all">ALL_TYPES</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="image">Image</option>
                        <option value="other">Other</option>
                      </select>
                      <select value={assetSort} onChange={(event) => handleAssetSortChange(event.target.value as AssetSortMode)}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="name">Name</option>
                        <option value="sizeAsc">Size Asc</option>
                        <option value="sizeDesc">Size Desc</option>
                      </select>
                    </div>

                    <div className="asset-toolbar">
                      <div className="asset-selection-tools">
                        <button className="action-cut mini-cut" onClick={toggleCollectionPageSelection}>
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon
                              name={isCollectionPageFullySelected ? 'close' : 'check'}
                              className="mono-icon inline-btn-icon"
                            />
                            <span>{isCollectionPageFullySelected ? 'Unselect Page' : 'Select Page'}</span>
                          </span>
                        </button>
                        <button
                          className="action-cut mini-cut danger-cut"
                          onClick={handleBulkUnlinkCollectionAssets}
                          disabled={selectedCollectionAssetIds.length === 0}
                        >
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="unlink" className="mono-icon inline-btn-icon" />
                            <span>Unlink Selected ({selectedCollectionAssetIds.length})</span>
                          </span>
                        </button>
                      </div>
                      <div className="asset-pagination">
                        <button
                          className="page-btn"
                          onClick={() => setCollectionPage((prev) => Math.max(1, prev - 1))}
                          disabled={collectionPagination.currentPage <= 1}
                        >
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="left" className="mono-icon inline-btn-icon" />
                            <span>Prev</span>
                          </span>
                        </button>
                        <span>
                          Page {collectionPagination.currentPage} / {collectionPagination.totalPages}
                        </span>
                        <button
                          className="page-btn"
                          onClick={() => setCollectionPage((prev) => Math.min(collectionPagination.totalPages, prev + 1))}
                          disabled={collectionPagination.currentPage >= collectionPagination.totalPages}
                        >
                          <span className="btn-inline-icon-wrap">
                            <MonoIcon name="right" className="mono-icon inline-btn-icon" />
                            <span>Next</span>
                          </span>
                        </button>
                      </div>
                    </div>

                    <div
                      className="assets-list assets-virtual-list"
                      ref={collectionAssetsViewportRef}
                      onScroll={handleCollectionAssetsScroll}
                    >
                      <div className="asset-row header-row sticky-header">
                        <span className="col-select">SEL</span>
                        <span className="col-name">Preview / Name</span>
                        <span className="col-type">Type</span>
                        <span className="col-size">Size</span>
                        <span className="col-date">Logged</span>
                        <span className="col-action">Action</span>
                      </div>

                      {collectionPagination.items.length === 0 ? (
                        <div className="empty-state">No Matching Media</div>
                      ) : (
                        <>
                          <div className="virtual-spacer" style={{ height: `${collectionVirtualSlice.offsetTop}px` }} />
                          {collectionVisibleAssets.map((asset) => {
                            const thumbnail = thumbnailMap[asset.id] ?? null

                            return (
                              <div key={asset.id} className="asset-row">
                                <span className="col-select">
                                  <input
                                    type="checkbox"
                                    className="asset-select-checkbox"
                                    checked={selectedCollectionAssetIds.includes(asset.id)}
                                    onChange={() => toggleCollectionAssetSelection(asset.id)}
                                  />
                                </span>
                                <span className="col-name asset-name-cell">
                                  <span className={`asset-thumb asset-thumb-${asset.mediaType}`}>
                                    {thumbnail ? <img src={thumbnail} alt={asset.name} loading="lazy" /> : asset.mediaType[0].toUpperCase()}
                                  </span>
                                  <span className="asset-name-text">{asset.name}</span>
                                </span>
                                <span className="col-type">{asset.mediaType.toUpperCase()}</span>
                                <span className="col-size">{asset.sizeFormatted}</span>
                                <span className="col-date">{new Date(asset.createdAt).toLocaleDateString()}</span>
                                <button className="asset-delete-btn" onClick={() => handleUnlinkCollectionAsset(asset.id)}>
                                  <span className="btn-inline-icon-wrap">
                                    <MonoIcon name="unlink" className="mono-icon inline-btn-icon" />
                                    <span>Unlink</span>
                                  </span>
                                </button>
                              </div>
                            )
                          })}
                          <div className="virtual-spacer" style={{ height: `${collectionVirtualSlice.offsetBottom}px` }} />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isProjectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>INIT_NEW_PROJECT</h3>
              <button className="close-btn" onClick={() => setIsProjectModalOpen(false)}>
                X
              </button>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>PROJECT_NAME</label>
                <input
                  type="text"
                  placeholder="e.g. VLOG_EP_04"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>PROJECT_STYLE</label>
                <input
                  type="text"
                  placeholder="e.g. Cinematic"
                  value={newProjectStyle}
                  onChange={(event) => setNewProjectStyle(event.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsProjectModalOpen(false)}>
                CANCEL
              </button>
              <button className="btn-primary" onClick={handleCreateProject}>
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}

      {isCollectionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>INIT_NEW_COLLECTION</h3>
              <button className="close-btn" onClick={() => setIsCollectionModalOpen(false)}>
                X
              </button>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>COLLECTION_NAME</label>
                <input
                  type="text"
                  placeholder="e.g. SFX - Impacts"
                  value={newCollectionName}
                  onChange={(event) => setNewCollectionName(event.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsCollectionModalOpen(false)}>
                CANCEL
              </button>
              <button className="btn-primary" onClick={handleCreateCollection}>
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
