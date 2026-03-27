# Source Hub

**A desktop application for managing media assets with advanced filtering, organization, and real-time synchronization.**

> Built with Electron, React, and TypeScript for high-performance asset management workflows.

![Screenshot placeholder - Main interface](https://via.placeholder.com/1200x700?text=Source+Hub+Main+Interface)

## Overview

Source Hub is a lightweight yet powerful desktop app designed for video editors, producers, and creative professionals who need to organize, manage, and access media assets efficiently. With support for projects, collections, and intelligent asset management, Source Hub streamlines the workflow from file import to production.

### Key Features

- **Project & Collection Management** – Create projects to organize assets by category, and use collections for flexible grouping
- **Fast Asset Import** – Drag-and-drop or batch import media files with automatic categorization
- **Intelligent Filtering & Sorting** – Search, filter by media type, and sort by name, date, or file size
- **Real-Time Synchronization** – Watch folders for automatic asset detection and updates
- **Thumbnail Caching** – Quick preview generation with smart caching for performance
- **Virtual List Rendering** – Seamless handling of thousands of assets without lag
- **Local Database** – All data stored locally using SQLite3 for privacy and offline access
- **Windows Installer** – Professional NSIS-based installer for easy deployment

![Screenshot placeholder - Project view](https://via.placeholder.com/1200x700?text=Source+Hub+Project+View)
![Screenshot placeholder - Collections](https://via.placeholder.com/1200x700?text=Source+Hub+Collections)

## System Requirements

- **Node.js**: 22.x or higher
- **npm**: 10.x or higher
- **Operating System**: Windows 10 or later (for building installers)
- **RAM**: 4GB minimum recommended
- **Disk Space**: 200MB for app + dependencies

## Installation & Quick Start

### For Users
Download the latest installer from [GitHub Releases](https://github.com/HyIsNoob/Editing-Manager/releases) and run `Source Hub-Setup-*.exe`.

### For Developers

```bash
# Clone repository
git clone https://github.com/HyIsNoob/Editing-Manager.git
cd Editing-Manager

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will start in development mode with hot module reloading enabled.

## Development Commands

```bash
npm run dev          # Start development environment with HMR
npm run build        # Build frontend and Electron bundle
npm run lint         # Run ESLint code quality checks
npm run dist         # Package app bundle
npm run dist:win     # Build Windows NSIS installer
npm run rebuild-native  # Rebuild native modules (better-sqlite3)
```

## Building & Distribution

### Development Build
```bash
npm run build
```

Output in `dist/` and `dist-electron/`

### Production Installer
```bash
npm run dist:win
```

Generates Windows installer in `release/`:
- `Source Hub-Setup-0.1.0.exe`
- `Source Hub-Setup-0.1.0.exe.blockmap`

## Release Process

This project uses GitHub Actions for automated release builds. To publish a new version:

1. **Update version** in `package.json`
2. **Commit changes**:
   ```bash
   git add .
   git commit -m "chore: bump version to v0.2.0"
   ```
3. **Create release tag**:
   ```bash
   git tag v0.2.0 -m "Release: Source Hub v0.2.0"
   ```
4. **Push to GitHub**:
   ```bash
   git push origin main
   git push origin v0.2.0
   ```

GitHub Actions will automatically:
- Install dependencies
- Build the Windows installer
- Upload artifacts
- Create a GitHub Release with installer files

Monitor progress at: [GitHub Actions](https://github.com/HyIsNoob/Editing-Manager/actions)

## Project Structure

```
source-hub/
├── src/                      # React UI components
├── electron/                 # Electron main process & database
│   ├── main.ts              # Electron app bootstrap & IPC
│   ├── preload.ts           # Preload script for IPC security
│   └── local-db.ts          # SQLite3 database management
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

## Development Guidelines

- **Code Style**: Follow ESLint rules; run `npm run lint` before commits
- **Database Changes**: If modifying schema in `electron/local-db.ts`, test import/link/unlink flows
- **Version Bumps**: Always update `package.json` version before creating a release tag
- **Build Artifacts**: Never commit `dist/`, `dist-electron/`, or `release/` folders

## Troubleshooting

### Build Fails with `better-sqlite3` Error
```bash
npm run rebuild-native
npm run build
```

### Dev Server Not Starting
```bash
rm -r node_modules dist dist-electron
npm install
npm run dev
```

### Installer Build Issues
Ensure Node.js 22+ and npm 10+ are installed:
```bash
node --version  # Should be v22.x+
npm --version   # Should be 10.x+
```

## License

This project is open source and available under the MIT License.

## Support & Feedback

For issues, feature requests, or feedback:
- Open an issue on [GitHub Issues](https://github.com/HyIsNoob/Editing-Manager/issues)
- Check existing discussions in [GitHub Discussions](https://github.com/HyIsNoob/Editing-Manager/discussions)

---

**Made with ❤️ for creators and developers**
