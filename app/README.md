# Source Hub

Desktop asset management app built with Electron + React + TypeScript.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Build Windows Installer

```bash
npm run dist:win
```

Installer output:

- `release/Source Hub-Setup-<version>.exe`
- `release/Source Hub-Setup-<version>.exe.blockmap`

## Publish To GitHub Releases

This repository includes workflow `release-windows.yml`.

1. Push code to GitHub.
2. Create and push a version tag (format `v*`), for example:

```bash
git tag v0.1.0
git push origin v0.1.0
```

3. GitHub Actions will:
- Build Windows installer.
- Upload artifacts.
- Publish a GitHub Release with installer files.

## Demo Data In Production

Production build does not auto-seed demo data anymore.

- Dev mode: demo seed enabled.
- Production: demo seed disabled.
- Override manually (if needed): `SOURCE_HUB_SEED_DEMO=1`.
