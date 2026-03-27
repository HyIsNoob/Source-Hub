import Database from 'better-sqlite3'
import { join } from 'node:path'

export interface DashboardStat {
  label: string
  value: string
}

export interface PipelineStep {
  name: string
  status: string
  value: string
}

export interface ProjectCard {
  id: number
  name: string
  style: string
  assets: number
  storage: string
  lastUpdate: string
}

export interface DashboardData {
  quickStats: DashboardStat[]
  importPipeline: PipelineStep[]
  projects: ProjectCard[]
  collections: CollectionCard[]
}

export interface CollectionCard {
  id: number
  name: string
  assets: number
  storage: string
  lastUpdate: string
}

export interface AssetData {
  id: number
  name: string
  mediaType: string
  sizeBytes: number
  sizeFormatted: string
  createdAt: string
  sourcePath?: string | null
  managedPath?: string | null
}

export interface ProjectDetails {
  id: number
  name: string
  style: string
  createdAt: string
  updatedAt: string
  watchFolderPath?: string | null
  assets: AssetData[]
}

export interface CollectionDetails {
  id: number
  name: string
  assets: AssetData[]
}

export interface ProjectWatchConfig {
  id: number
  name: string
  watchFolderPath: string
}

interface ProjectRow {
  id: number
  name: string
  style: string
  created_at: string
  updated_at: string
  watch_folder_path: string | null
}

interface AssetRow {
  id: number
  name: string
  media_type: string
  size_bytes: number
  created_at: string
  source_path: string | null
  managed_path: string | null
}

interface LocalDbOptions {
  seedDemoData?: boolean
}

const DEMO_PROJECT_NAMES = ['Launch Teaser 2026', 'Gaming Shorts Batch A', 'Vlog Series Episode 17']
const DEMO_COLLECTION_NAMES = [
  'SFX - Transitions',
  'Music - Tension Build',
  'Overlay - Film Grain',
  'B-Roll - City Night',
]
const DEMO_PIPELINE_NAMES = ['Scan folders', 'Detect duplicates', 'Tag suggestions', 'Link to projects']

const formatBytes = (sizeBytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = sizeBytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const rounded = unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)
  return `${rounded} ${units[unitIndex]}`
}

const formatAgo = (updatedAt: string) => {
  const diffMs = Date.now() - new Date(updatedAt).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export class LocalDb {
  private readonly db: Database.Database
  private readonly seedDemoData: boolean

  constructor(userDataPath: string, options: LocalDbOptions = {}) {
    const dbPath = join(userDataPath, 'source-hub.db')
    this.db = new Database(dbPath)
    this.seedDemoData = options.seedDemoData ?? false
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.setupSchema()
    if (this.seedDemoData) {
      this.seedIfNeeded()
    }
  }

  private setupSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        style TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        name TEXT NOT NULL,
        media_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        duplicate_group TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS import_pipeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        value_text TEXT NOT NULL,
        ordering INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        ordering INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collection_assets (
        collection_id INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (collection_id, asset_id),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS app_metrics (
        metric_key TEXT PRIMARY KEY,
        metric_value TEXT NOT NULL
      );
    `)

    this.ensureAssetsColumns()
    this.ensureProjectsColumns()
  }

  private ensureAssetsColumns() {
    const columns = this.db.prepare("PRAGMA table_info('assets')").all() as Array<{ name: string }>
    const names = new Set(columns.map((column) => column.name))

    if (!names.has('source_path')) {
      this.db.exec('ALTER TABLE assets ADD COLUMN source_path TEXT')
    }

    if (!names.has('managed_path')) {
      this.db.exec('ALTER TABLE assets ADD COLUMN managed_path TEXT')
    }
  }

  private ensureProjectsColumns() {
    const columns = this.db.prepare("PRAGMA table_info('projects')").all() as Array<{ name: string }>
    const names = new Set(columns.map((column) => column.name))

    if (!names.has('watch_folder_path')) {
      this.db.exec('ALTER TABLE projects ADD COLUMN watch_folder_path TEXT')
    }
  }

  private seedIfNeeded() {
    const hasProject = this.db.prepare('SELECT id FROM projects LIMIT 1').get() as { id: number } | undefined
    if (hasProject) {
      return
    }

    const now = new Date().toISOString()

    const insertProject = this.db.prepare(
      `INSERT INTO projects (name, style, status, created_at, updated_at)
       VALUES (@name, @style, 'active', @createdAt, @updatedAt)`
    )

    const insertAsset = this.db.prepare(
      `INSERT INTO assets (project_id, name, media_type, size_bytes, duplicate_group, created_at)
       VALUES (@projectId, @name, @mediaType, @sizeBytes, @duplicateGroup, @createdAt)`
    )

    const insertPipeline = this.db.prepare(
      `INSERT INTO import_pipeline (name, status, value_text, ordering)
       VALUES (@name, @status, @valueText, @ordering)`
    )

    const insertCollection = this.db.prepare(
      `INSERT INTO collections (name, ordering)
       VALUES (@name, @ordering)`
    )

    const insertCollectionAsset = this.db.prepare(
      `INSERT INTO collection_assets (collection_id, asset_id, created_at)
       VALUES (?, ?, ?)`
    )

    const tx = this.db.transaction(() => {
      const teaser = insertProject.run({
        name: 'Launch Teaser 2026',
        style: 'Cinematic',
        createdAt: now,
        updatedAt: now,
      }).lastInsertRowid as number

      const shorts = insertProject.run({
        name: 'Gaming Shorts Batch A',
        style: 'High-Energy',
        createdAt: now,
        updatedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      }).lastInsertRowid as number

      const vlog = insertProject.run({
        name: 'Vlog Series Episode 17',
        style: 'Lifestyle',
        createdAt: now,
        updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      }).lastInsertRowid as number

      const seedAssets = [
        { projectId: teaser, name: 'TEASER_A_CAM01.mov', mediaType: 'video', sizeBytes: 780 * 1024 * 1024, duplicateGroup: null },
        { projectId: teaser, name: 'TEASER_A_CAM02.mov', mediaType: 'video', sizeBytes: 650 * 1024 * 1024, duplicateGroup: 'dup-1' },
        { projectId: teaser, name: 'RISER_03.wav', mediaType: 'audio', sizeBytes: 48 * 1024 * 1024, duplicateGroup: 'dup-1' },
        { projectId: shorts, name: 'SHORTS_PACK_11.mp4', mediaType: 'video', sizeBytes: 390 * 1024 * 1024, duplicateGroup: null },
        { projectId: shorts, name: 'FPS_HIT_07.wav', mediaType: 'audio', sizeBytes: 8 * 1024 * 1024, duplicateGroup: null },
        { projectId: vlog, name: 'VLOG_EP17_A001.mp4', mediaType: 'video', sizeBytes: 520 * 1024 * 1024, duplicateGroup: null },
      ]

      const createdAssetIds: number[] = []

      for (const asset of seedAssets) {
        const rowId = insertAsset.run({
          projectId: asset.projectId,
          name: asset.name,
          mediaType: asset.mediaType,
          sizeBytes: asset.sizeBytes,
          duplicateGroup: asset.duplicateGroup,
          createdAt: now,
        }).lastInsertRowid as number

        createdAssetIds.push(rowId)
      }

      const seedPipeline = [
        { name: 'Scan folders', status: 'Done', valueText: '6 files', ordering: 1 },
        { name: 'Detect duplicates', status: 'Running', valueText: '67%', ordering: 2 },
        { name: 'Tag suggestions', status: 'Queued', valueText: '43 items', ordering: 3 },
        { name: 'Link to projects', status: 'Queued', valueText: '3 projects', ordering: 4 },
      ]

      for (const item of seedPipeline) {
        insertPipeline.run(item)
      }

      const seedCollections = [
        'SFX - Transitions',
        'Music - Tension Build',
        'Overlay - Film Grain',
        'B-Roll - City Night',
      ]

      const createdCollectionIds: number[] = []
      for (let i = 0; i < seedCollections.length; i += 1) {
        const rowId = insertCollection.run({ name: seedCollections[i], ordering: i + 1 }).lastInsertRowid as number
        createdCollectionIds.push(rowId)
      }

      if (createdCollectionIds.length >= 4 && createdAssetIds.length >= 6) {
        insertCollectionAsset.run(createdCollectionIds[0], createdAssetIds[0], now)
        insertCollectionAsset.run(createdCollectionIds[0], createdAssetIds[1], now)
        insertCollectionAsset.run(createdCollectionIds[1], createdAssetIds[2], now)
        insertCollectionAsset.run(createdCollectionIds[1], createdAssetIds[4], now)
        insertCollectionAsset.run(createdCollectionIds[2], createdAssetIds[3], now)
        insertCollectionAsset.run(createdCollectionIds[3], createdAssetIds[5], now)
      }

      this.db
        .prepare('INSERT INTO app_metrics (metric_key, metric_value) VALUES (?, ?)')
        .run('relink_success', '94.8')

      this.setSetting('demo_seeded', '1')
    })

    tx()
  }

  clearSeedDataIfPresent() {
    if (this.getSetting('demo_seed_cleaned') === '1') {
      return false
    }

    const demoSeededFlag = this.getSetting('demo_seeded')
    const relinkMetric = this.getSetting('relink_success')
    const shouldEvaluate = demoSeededFlag === '1' || relinkMetric === '94.8'

    if (!shouldEvaluate) {
      return false
    }

    const projectRows = this.db.prepare('SELECT id, name FROM projects').all() as Array<{ id: number; name: string }>
    if (projectRows.length === 0) {
      this.setSetting('demo_seeded', null)
      return false
    }

    const hasOnlyDemoProjects =
      projectRows.length === DEMO_PROJECT_NAMES.length &&
      projectRows.every((row) => DEMO_PROJECT_NAMES.includes(row.name))

    if (!hasOnlyDemoProjects) {
      return false
    }

    const collectionRows = this.db.prepare('SELECT name FROM collections').all() as Array<{ name: string }>
    const hasOnlyDemoCollections =
      collectionRows.length === DEMO_COLLECTION_NAMES.length &&
      collectionRows.every((row) => DEMO_COLLECTION_NAMES.includes(row.name))

    if (!hasOnlyDemoCollections) {
      return false
    }

    const pipelineRows = this.db
      .prepare('SELECT name FROM import_pipeline ORDER BY ordering ASC')
      .all() as Array<{ name: string }>
    const hasOnlyDemoPipeline =
      pipelineRows.length === DEMO_PIPELINE_NAMES.length &&
      pipelineRows.every((row) => DEMO_PIPELINE_NAMES.includes(row.name))

    if (!hasOnlyDemoPipeline) {
      return false
    }

    const hasExternalSourceAssets = this.db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM assets
         WHERE source_path IS NOT NULL AND TRIM(source_path) <> ''`
      )
      .get() as { total: number }

    if (hasExternalSourceAssets.total > 0) {
      return false
    }

    const clearTx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM collection_assets').run()
      this.db.prepare('DELETE FROM assets').run()
      this.db.prepare('DELETE FROM import_pipeline').run()
      this.db.prepare('DELETE FROM collections').run()
      this.db.prepare('DELETE FROM projects').run()
      this.setSetting('relink_success', null)
      this.setSetting('demo_seeded', null)
      this.setSetting('demo_seed_cleaned', '1')
    })

    clearTx()
    return true
  }

  getDashboardData(): DashboardData {
    const totalAssets = this.db
      .prepare('SELECT COUNT(*) AS total FROM assets')
      .get() as { total: number }

    const duplicateSavings = this.db
      .prepare(
        `SELECT COALESCE(SUM(size_bytes), 0) AS bytes_saved
         FROM assets
         WHERE duplicate_group IS NOT NULL`
      )
      .get() as { bytes_saved: number }

    const activeProjects = this.db
      .prepare("SELECT COUNT(*) AS total FROM projects WHERE status = 'active'")
      .get() as { total: number }

    const relinkMetric = this.db
      .prepare("SELECT metric_value FROM app_metrics WHERE metric_key = 'relink_success'")
      .get() as { metric_value: string } | undefined

    const pipeline = this.db
      .prepare('SELECT name, status, value_text AS value FROM import_pipeline ORDER BY ordering ASC')
      .all() as PipelineStep[]

    const projects = this.db
      .prepare(
        `SELECT p.id,
                p.name,
                p.style,
                p.updated_at,
                COUNT(a.id) AS asset_count,
                COALESCE(SUM(a.size_bytes), 0) AS total_size
         FROM projects p
         LEFT JOIN assets a ON a.project_id = p.id
         WHERE p.status = 'active'
         GROUP BY p.id
         ORDER BY p.updated_at DESC
         LIMIT 8`
      )
      .all() as Array<{
        id: number
        name: string
        style: string
        updated_at: string
        asset_count: number
        total_size: number
      }>

    const collections = this.db
      .prepare(
        `SELECT c.id,
                c.name,
                COUNT(ca.asset_id) AS asset_count,
                COALESCE(SUM(a.size_bytes), 0) AS total_size,
                MAX(a.created_at) AS last_asset_update
         FROM collections c
         LEFT JOIN collection_assets ca ON ca.collection_id = c.id
         LEFT JOIN assets a ON a.id = ca.asset_id
         GROUP BY c.id
         ORDER BY c.ordering ASC`
      )
      .all() as Array<{
        id: number
        name: string
        asset_count: number
        total_size: number
        last_asset_update: string | null
      }>

    const quickStats: DashboardStat[] = [
      { label: 'Total assets', value: totalAssets.total.toLocaleString() },
      { label: 'Duplicate savings', value: formatBytes(duplicateSavings.bytes_saved) },
      { label: 'Active projects', value: activeProjects.total.toString() },
      { label: 'Relink success', value: `${relinkMetric?.metric_value ?? '0'}%` },
    ]

    return {
      quickStats,
      importPipeline: pipeline,
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        style: project.style,
        assets: project.asset_count,
        storage: formatBytes(project.total_size),
        lastUpdate: formatAgo(project.updated_at),
      })),
      collections: collections.map((item) => ({
        id: item.id,
        name: item.name,
        assets: item.asset_count,
        storage: formatBytes(item.total_size),
        lastUpdate: item.last_asset_update ? formatAgo(item.last_asset_update) : 'No assets',
      })),
    }
  }

  createProject(name: string, style: string) {
    const now = new Date().toISOString()
    this.db
      .prepare(
        `INSERT INTO projects (name, style, status, created_at, updated_at)
         VALUES (?, ?, 'active', ?, ?)`
      )
      .run(name, style, now, now)
  }

  updateProject(projectId: number, name: string, style: string) {
    const now = new Date().toISOString()
    this.db
      .prepare(
        `UPDATE projects
         SET name = ?,
             style = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .run(name, style, now, projectId)
  }

  updateProjectWatchFolder(projectId: number, watchFolderPath: string | null) {
    this.db
      .prepare(
        `UPDATE projects
         SET watch_folder_path = ?
         WHERE id = ?`
      )
      .run(watchFolderPath, projectId)
  }

  getSetting(key: string) {
    const row = this.db
      .prepare('SELECT metric_value FROM app_metrics WHERE metric_key = ?')
      .get(key) as { metric_value: string } | undefined

    return row?.metric_value ?? null
  }

  setSetting(key: string, value: string | null) {
    if (value === null) {
      this.db.prepare('DELETE FROM app_metrics WHERE metric_key = ?').run(key)
      return
    }

    this.db
      .prepare(
        `INSERT INTO app_metrics (metric_key, metric_value)
         VALUES (?, ?)
         ON CONFLICT(metric_key) DO UPDATE SET metric_value = excluded.metric_value`
      )
      .run(key, value)
  }

  getWatchEnabled() {
    return this.getSetting('realtime_watch_enabled') === '1'
  }

  setWatchEnabled(enabled: boolean) {
    this.setSetting('realtime_watch_enabled', enabled ? '1' : '0')
  }

  getProjectsWithWatchFolders() {
    const rows = this.db
      .prepare(
        `SELECT id, name, watch_folder_path
         FROM projects
         WHERE watch_folder_path IS NOT NULL AND TRIM(watch_folder_path) <> ''`
      )
      .all() as Array<{ id: number; name: string; watch_folder_path: string }>

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      watchFolderPath: row.watch_folder_path,
    })) as ProjectWatchConfig[]
  }

  addAsset(
    projectId: number | null,
    name: string,
    mediaType: string,
    sizeBytes: number,
    sourcePath: string | null = null,
    managedPath: string | null = null
  ) {
    const now = new Date().toISOString()

    const assetId = this.db
      .prepare(
        `INSERT INTO assets (project_id, name, media_type, size_bytes, duplicate_group, created_at, source_path, managed_path)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`
      )
      .run(projectId, name, mediaType, sizeBytes, now, sourcePath, managedPath).lastInsertRowid as number

    if (projectId !== null) {
      this.db
        .prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
        .run(now, projectId)
    }

    return assetId
  }

  deleteAsset(assetId: number, projectId: number | null) {
    const now = new Date().toISOString()
    this.db.prepare('DELETE FROM assets WHERE id = ?').run(assetId)

    if (projectId !== null) {
      this.db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId)
    }
  }

  createCollection(name: string) {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(ordering), 0) + 1 AS next_order FROM collections')
      .get() as { next_order: number }

    this.db.prepare('INSERT INTO collections (name, ordering) VALUES (?, ?)').run(name, row.next_order)
  }

  renameCollection(collectionId: number, name: string) {
    this.db
      .prepare(
        `UPDATE collections
         SET name = ?
         WHERE id = ?`
      )
      .run(name, collectionId)
  }

  deleteCollection(collectionId: number) {
    this.db.prepare('DELETE FROM collections WHERE id = ?').run(collectionId)
  }

  addAssetToCollection(collectionId: number, assetId: number) {
    const now = new Date().toISOString()
    this.db
      .prepare(
        `INSERT OR IGNORE INTO collection_assets (collection_id, asset_id, created_at)
         VALUES (?, ?, ?)`
      )
      .run(collectionId, assetId, now)
  }

  removeAssetFromCollection(collectionId: number, assetId: number) {
    this.db
      .prepare('DELETE FROM collection_assets WHERE collection_id = ? AND asset_id = ?')
      .run(collectionId, assetId)
  }

  deleteProject(projectId: number) {
    const tx = this.db.transaction((id: number) => {
      this.db.prepare('DELETE FROM assets WHERE project_id = ?').run(id)
      this.db.prepare('DELETE FROM projects WHERE id = ?').run(id)
    })

    tx(projectId)
  }

  getProjectDetails(projectId: number): ProjectDetails {
    const project = this.db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as ProjectRow | undefined

    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    const assets = this.db
      .prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC')
      .all(projectId) as AssetRow[]

    return {
      id: project.id,
      name: project.name,
      style: project.style,
      createdAt: project.created_at,
      updatedAt: formatAgo(project.updated_at),
      watchFolderPath: project.watch_folder_path ?? null,
      assets: assets.map((a) => ({
        id: a.id,
        name: a.name,
        mediaType: a.media_type,
        sizeBytes: a.size_bytes,
        sizeFormatted: formatBytes(a.size_bytes),
        createdAt: a.created_at,
        sourcePath: a.source_path ?? null,
        managedPath: a.managed_path ?? null,
      })),
    }
  }

  getCollectionDetails(collectionId: number): CollectionDetails {
    const collection = this.db
      .prepare('SELECT id, name FROM collections WHERE id = ?')
      .get(collectionId) as { id: number; name: string } | undefined

    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`)
    }

    const assets = this.db
      .prepare(
        `SELECT a.id,
                a.name,
                a.media_type,
                a.size_bytes,
                a.created_at,
                a.source_path,
                a.managed_path
         FROM collection_assets ca
         INNER JOIN assets a ON a.id = ca.asset_id
         WHERE ca.collection_id = ?
         ORDER BY ca.created_at DESC`
      )
      .all(collectionId) as Array<{
        id: number
        name: string
        media_type: string
        size_bytes: number
        created_at: string
        source_path: string | null
        managed_path: string | null
      }>

    return {
      id: collection.id,
      name: collection.name,
      assets: assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        mediaType: asset.media_type,
        sizeBytes: asset.size_bytes,
        sizeFormatted: formatBytes(asset.size_bytes),
        createdAt: asset.created_at,
        sourcePath: asset.source_path,
        managedPath: asset.managed_path,
      })),
    }
  }

  getProjectName(projectId: number) {
    const project = this.db
      .prepare('SELECT name FROM projects WHERE id = ?')
      .get(projectId) as { name: string } | undefined

    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    return project.name
  }

  hasAssetBySourcePath(projectId: number, sourcePath: string) {
    const row = this.db
      .prepare('SELECT id FROM assets WHERE project_id = ? AND source_path = ? LIMIT 1')
      .get(projectId, sourcePath) as { id: number } | undefined

    return Boolean(row)
  }
}
