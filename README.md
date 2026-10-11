# ELENA LUNCHBOX

Aplikasi pemesanan makanan dan minuman mobile-first berbasis React + Vite.

## Instalasi

```bash
npm install
npm run dev
```

Aplikasi akan berjalan di:

```bash
http://localhost:5173
```

## Struktur utama

- `src/App.jsx` — routing, state app, dan komponen utama
- `src/data/config.js` — data produk, voucher, bahasa, dan konfigurasi
- `src/utils/storage.js` — helper localStorage
- `src/styles/global.css` — design system dan styling app

## Catatan

Prototipe ini menggunakan localStorage untuk menyimpan data demo seperti profil, keranjang, alamat, voucher, dan order. Ini adalah penyimpanan lokal browser, bukan database cloud.
