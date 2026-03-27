<div align="center">
	<img src="./icon.png" alt="Source Hub Logo" width="120" />
<h1>Source Hub</h1>
<p>Smart media asset management for creators — built with Electron, React, and local-first architecture.</p>

<p>
	<a href="https://github.com/HyIsNoob/Source-Hub"><img alt="Repo" src="https://img.shields.io/badge/GitHub-Source--Hub-000?logo=github" /></a>
	<img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue" />
	<img alt="License" src="https://img.shields.io/badge/license-MIT-green" />
	<img alt="Electron" src="https://img.shields.io/badge/Electron-41.x-47848F?logo=electron" />
</p>
</div>

---

## Overview

Source Hub is a lightweight yet powerful desktop app designed for video editors, producers, and creative professionals who need to organize, manage, and access media assets efficiently. With support for projects, collections, and intelligent asset management, Source Hub streamlines the workflow from file import to production.

<figure align="center">
	<img width="1917" height="986" alt="Source Hub dashboard overview" src="https://github.com/user-attachments/assets/bc90438e-154f-4c1e-b3d9-077cd9e95c65" />
	<figcaption><em>Dashboard overview with projects, collections, and quick controls.</em></figcaption>
</figure>

### Key Features

- **Project & Collection Management** – Create projects to organize assets by category, and use collections for flexible grouping
- **Fast Asset Import** – Drag-and-drop or batch import media files with automatic categorization
- **Intelligent Filtering & Sorting** – Search, filter by media type, and sort by name, date, or file size
- **Real-Time Synchronization** – Watch folders for automatic asset detection and updates
- **Thumbnail Caching** – Quick preview generation with smart caching for performance
- **Virtual List Rendering** – Seamless handling of thousands of assets without lag
- **Local Database** – All data stored locally using SQLite3 for privacy and offline access
- **Windows Installer** – Professional NSIS-based installer for easy deployment

<figure align="center">
	<img width="1913" height="982" alt="Source Hub project details view" src="https://github.com/user-attachments/assets/3099b8cd-16ae-47c8-923a-0085b2afadbc" />
	<figcaption><em>Project details view with asset list, filters, and bulk actions.</em></figcaption>
</figure>

<figure align="center">
	<img width="1919" height="988" alt="Source Hub collections screen" src="https://github.com/user-attachments/assets/28c68850-7f7b-4604-8c91-7ddfcbf140ba" />
	<figcaption><em>Collections screen for organizing media across multiple projects.</em></figcaption>
</figure>

<figure align="center">
	<img width="1919" height="984" alt="Source Hub settings panel" src="https://github.com/user-attachments/assets/376c56c2-39be-4dde-a1a8-6900984e858e" />
	<figcaption><em>Settings panel with paths, update controls, and performance options.</em></figcaption>
</figure>

## System Requirements

- **Node.js**: 22.x or higher
- **npm**: 10.x or higher
- **Operating System**: Windows 10 or later (for building installers)
- **RAM**: 4GB minimum recommended
- **Disk Space**: 200MB for app + dependencies

## Installation & Quick Start

### For Users
Download the latest installer from [GitHub Releases](https://github.com/HyIsNoob/Source-Hub/releases) and run `Source Hub-Setup-*.exe`.

## Project Structure

```
source-hub/
├── src/                      # React UI components
├── electron/                 # Electron main process & database
│   ├── main.ts               # Electron app bootstrap & IPC
│   ├── preload.ts            # Preload script for IPC security
│   └── local-db.ts           # SQLite3 database management
├── public/                   # Static assets (icons, images)
├── .github/                  # CI/CD workflows
│   └── workflows/
│       └── release-windows.yml
├── package.json             # Dependencies & scripts
└── README.md                # This file
```

## Configuration

### Environment Variables

**Development Mode Demo Data**
- Dev mode automatically seeds demo data by default
- Production builds do not include demo data

To force demo data in production:
```bash
SOURCE_HUB_SEED_DEMO=1 npm run dist:win
```

### Database

- **Location**: `%APPDATA%/Source Hub/source-hub.db` (Windows)
- **Type**: SQLite3 with WAL mode for concurrency
- **Schema**: Auto-migrated on first run

## Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Electron 41, Node.js
- **Database**: better-sqlite3
- **Build**: Vite + Electron Builder
- **Styling**: Custom CSS with Neobrutalism design
- **Linting**: ESLint + TypeScript ESLint

## Architecture Notes

- **Virtual List Rendering**: Large asset lists use virtualization to maintain 60 FPS performance
- **Thumbnail Caching**: First-run thumbnails are cached; updates invalidate cache entries
- **IPC Security**: Preload script validates and filters all main ↔ renderer communication
- **Local-First**: All data persists locally; no external API calls required
