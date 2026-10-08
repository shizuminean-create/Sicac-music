# SICAC Android (GitHub Actions build)

Build APK sepenuhnya di GitHub Actions. Termux hanya dipakai untuk push source; jangan jalankan Gradle di HP.

## Build APK
1. Upload/push semua isi folder ini ke repository GitHub baru atau repository SICAC yang sudah ada.
2. Pastikan workflow berada di `.github/workflows/build-apk.yml` pada branch `main`.
3. Buka repository GitHub → Actions → **Build SICAC Android APK** → **Run workflow** (atau push ke `main`).
4. Setelah job hijau, buka run tersebut → bagian **Artifacts** → unduh `SICAC-debug-APK`.
5. Ekstrak ZIP artifact dan pasang `app-debug.apk` di Android. Jika diminta, izinkan pemasangan aplikasi dari sumber tersebut.

## Termux: push project
Jalankan dari folder project ini setelah mengisi URL repository milikmu:

```sh
git init
git branch -M main
git add .
git commit -m "Build SICAC Android with GitHub Actions"
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Jika repository sudah ada dan remote sudah benar, cukup:

```sh
git add .
git commit -m "Update SICAC Android build"
git push
```

## Catatan penyimpanan
Tema, profil, avatar, dan banner disimpan di localStorage perangkat melalui WebView. Data lokal tetap ada saat aplikasi ditutup/restart selama data aplikasi tidak dihapus dan aplikasi tidak di-uninstall. Foto besar bisa melebihi kuota localStorage browser; gunakan gambar yang ukurannya kecil. localStorage bersifat lokal pada perangkat ini, bukan sinkronisasi cloud.
