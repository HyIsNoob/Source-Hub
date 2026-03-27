# Source Hub

Ứng dụng desktop quản lý media asset cho workflow edit video, xây dựng bằng Electron + React + TypeScript.

## Mục tiêu dự án

Source Hub giúp gom và quản lý asset theo project/collection, hỗ trợ import nhanh, lọc/sắp xếp, xem trước danh sách lớn và phát hành dưới dạng app cài đặt Windows.

## Cấu trúc repository

Repository hiện đã được đưa toàn bộ mã nguồn lên root để hiển thị đúng trên GitHub.

- `src`: UI React
- `electron`: main process, preload, local database
- `.github/workflows`: CI/CD build và publish release
- `public`: static asset

## Yêu cầu môi trường

- Node.js 22+
- npm 10+
- Windows (khuyến nghị khi đóng gói installer `.exe`)

## Cài đặt và chạy local

```bash
npm install
npm run dev
```

## Các lệnh quan trọng

```bash
npm run dev
npm run build
npm run lint
npm run dist
npm run dist:win
```

Giải thích nhanh:

- `dev`: chạy môi trường phát triển
- `build`: build frontend + electron bundle
- `lint`: kiểm tra code style/rule
- `dist`: đóng gói app
- `dist:win`: build installer NSIS cho Windows

## Output khi build installer

Sau khi chạy `npm run dist:win`, file sẽ nằm trong thư mục `release`:

- `Source Hub-Setup-<version>.exe`
- `Source Hub-Setup-<version>.exe.blockmap`

## Quy trình phát hành lên GitHub

Repository đã có workflow: `.github/workflows/release-windows.yml`.

Khi push tag dạng `v*` (ví dụ `v0.1.0`), GitHub Actions sẽ:

1. Cài dependency
2. Build installer Windows
3. Upload artifact
4. Tạo GitHub Release và đính kèm file cài đặt

Lệnh publish cơ bản:

```bash
git add .
git commit -m "release: v0.1.0"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

## Dữ liệu demo trong production

Mặc định bản production không tự seed dữ liệu demo.

- Dev mode: có seed demo
- Production: không seed demo
- Có thể bật thủ công bằng biến môi trường:

```bash
SOURCE_HUB_SEED_DEMO=1
```

## Ghi chú cho phát triển

- Tránh commit thư mục build (`dist`, `dist-electron`, `release`)
- Nếu thay đổi schema hoặc logic DB trong `electron/local-db.ts`, nên test lại luồng import/link/unlink asset
- Nên tăng version trong `package.json` trước khi tạo tag release mới
