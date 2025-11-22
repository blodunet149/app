## Panduan Penyelesaian Deployment Admin Dashboard

Jika fitur admin tidak muncul setelah login, lakukan langkah-langkah berikut:

### 1. Troubleshooting Browser
- **Hard refresh**: Tekan `Ctrl+Shift+R` atau `Cmd+Shift+R`
- **Buka di incognito/private window**: Untuk menghindari cache
- **Clear browser data**: Hapus cache, cookies, dan storage untuk domain `catering.hijrah-attauhid.or.id`

### 2. Verifikasi Deployment di Cloudflare
- Buka Cloudflare Dashboard
- Cari project `catering-app-frontend`
- Cek section Deployments
- Jika deployment belum selesai atau gagal, Anda perlu trigger ulang

### 3. Trigger Deployment Manual
Jika deployment tidak otomatis terpicu, Anda bisa:
- Buka Cloudflare Pages Dashboard
- Pilih project Anda
- Klik "Build & deployments" 
- Klik "Trigger deployment" untuk memicu rebuild dari branch terbaru

### 4. Verifikasi File-file yang Ditambahkan
File-file berikut sudah ditambahkan ke repository dan harus muncul di build:
- `components/admin/AdminLayout.tsx`
- `components/admin/OrderStatusManager.tsx`
- `components/admin/StatusChart.tsx`
- `pages/admin/AdminDashboard.tsx`
- `pages/admin/reports/OrderSummaryPage.tsx`
- `pages/admin/reports/CookingSchedulePage.tsx`
- `pages/admin/reports/DailyReportPage.tsx`
- `src/api/admin/reports.ts`

### 5. Verifikasi Route di App.tsx
Route-route admin berikut sudah ditambahkan:
- `/admin/dashboard`
- `/admin/reports/summary`
- `/admin/reports/cooking-schedule`
- `/admin/reports/daily-report`

### 6. Verifikasi Admin Access
- Pastikan Anda login sebagai admin (role: "admin")
- Akun contoh yang dibuat: `admin_new@hijrah-attauhid.or.id`
- Jika tidak bisa login dengan akun ini, buat akun admin baru dengan role "admin"

### 7. Tanda-tanda Deployment Berhasil
Setelah deployment, Anda akan melihat:
- Sidebar dengan menu admin
- Link-link ke halaman dashboard, reports
- Fungsi update status langsung di tabel order
- Grafik distribusi status order
- Filter tanggal dan status di halaman reports

Jika setelah mencoba semua langkah di atas masih belum muncul:
1. Cek console browser (F12) untuk error
2. Pastikan tidak ada error network di tab Network
3. Hubungi administrator untuk verifikasi status deployment di Cloudflare