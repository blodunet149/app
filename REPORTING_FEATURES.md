# Laporan dan Rekapitulasi Order untuk Admin

## Endpoint Baru

### 1. Laporan Ringkasan Order
**Endpoint:** `GET /api/order/summary`
**Akses:** Admin saja
**Deskripsi:** Mendapatkan rekapitulasi order dengan berbagai filter

**Parameter Query (opsional):**
- `startDate` - Tanggal awal (format: YYYY-MM-DD)
- `endDate` - Tanggal akhir (format: YYYY-MM-DD)
- `paymentStatus` - Filter berdasarkan status pembayaran (paid, pending, unpaid, cancelled)

**Contoh Penggunaan:**
```
GET /api/order/summary?startDate=2025-01-01&endDate=2025-12-31&paymentStatus=paid
```

**Contoh Response:**
```json
{
  "summary": {
    "totalOrders": 10,
    "totalPaidOrders": 7,
    "totalUnpaidOrders": 3,
    "totalRevenue": 750000,
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    }
  },
  "orders": [
    // Array of order objects with user and menu details
  ]
}
```

### 2. Jadwal Memasak (Semua Order)
**Endpoint:** `GET /api/order/for-cooking`
**Akses:** Admin saja
**Deskripsi:** Mendapatkan daftar order yang perlu dimasak pada tanggal tertentu (sudah dibayar dan belum dibayar)

**Parameter Query (opsional):**
- `date` - Tanggal order (format: YYYY-MM-DD), default ke tanggal hari ini

**Contoh Penggunaan:**
```
GET /api/order/for-cooking?date=2025-11-25
```

**Contoh Response:**
```json
{
  "date": "2025-11-25",
  "totalOrders": 5,
  "menuBreakdown": [
    {
      "menuName": "Nasi Goreng",
      "totalQuantity": 3,
      "orders": [...],
      "specialInstructions": [...]
    }
  ],
  "orders": [
    // Array of order objects
  ]
}
```

### 3. Jadwal Memasak (Hanya Order yang Sudah Dibayar)
**Endpoint:** `GET /api/order/for-cooking-paid`
**Akses:** Admin saja
**Deskripsi:** Mendapatkan daftar order yang sudah dibayar dan perlu dimasak pada tanggal tertentu

**Parameter Query (opsional):**
- `date` - Tanggal order (format: YYYY-MM-DD), default ke tanggal hari ini

**Contoh Penggunaan:**
```
GET /api/order/for-cooking-paid?date=2025-11-25
```

**Contoh Response:**
```json
{
  "date": "2025-11-25",
  "totalOrders": 3,
  "menuBreakdown": [
    // Hanya order yang sudah dibayar
  ],
  "paidOrders": [
    // Array of paid order objects
  ]
}
```

### 4. Laporan Harian untuk Dapur
**Endpoint:** `GET /api/order/daily-report/:date`
**Akses:** Admin saja
**Deskripsi:** Mendapatkan laporan harian lengkap untuk tanggal tertentu

**Parameter Path:**
- `date` - Tanggal laporan (format: YYYY-MM-DD)

**Contoh Penggunaan:**
```
GET /api/order/daily-report/2025-11-25
```

**Contoh Response:**
```json
{
  "date": "2025-11-25",
  "statistics": {
    "totalOrders": 10,
    "totalQuantities": 15,
    "totalRevenue": 1000000,
    "totalPaidOrders": 8,
    "unpaidOrders": 2,
    "statusCounts": {
      "confirmed": 3,
      "preparing": 4,
      "ready": 2,
      "delivered": 1
    }
  },
  "menuBreakdown": [
    // Grouped by menu item with quantities and orders
  ],
  "orders": [
    // Complete list of orders for the date
  ]
}
```

### 5. Update Status Order
**Endpoint:** `PUT /api/order/:id/status`
**Akses:** Admin saja
**Deskripsi:** Mengupdate status order (untuk workflow dapur)

**Parameter Path:**
- `id` - ID order

**Body:**
- `status` - Status baru (pending, confirmed, preparing, ready, delivered, cancelled)

**Contoh Penggunaan:**
```
PUT /api/order/123/status
{
  "status": "preparing"
}
```

### 6. Tandai Order Siap Dikirim
**Endpoint:** `PUT /api/order/:id/ready`
**Akses:** Admin saja
**Deskripsi:** Khusus menandai order sebagai siap dikirim (dari status 'preparing' ke 'ready')

**Parameter Path:**
- `id` - ID order

**Contoh Penggunaan:**
```
PUT /api/order/123/ready
```

## Penggunaan untuk Tim Dapur

Tim dapur dapat menggunakan endpoint ini untuk:

1. **Merencanakan produksi harian** - Gunakan endpoint `/for-cooking` untuk melihat semua order yang harus diproses pada tanggal tertentu
2. **Memfokuskan pada order yang sudah dibayar** - Gunakan endpoint `/for-cooking-paid` untuk memprioritaskan order yang sudah lunas
3. **Mengelola instruksi khusus pelanggan** - Setiap order menyertakan specialInstructions untuk dipertimbangkan saat memasak
4. **Melihat ringkasan keuangan** - Gunakan endpoint `/summary` untuk melihat total pendapatan dan distribusi pembayaran
5. **Memantau status produksi** - Gunakan endpoint `/daily-report/:date` untuk laporan lengkap harian
6. **Memperbarui status order** - Gunakan endpoint `/order/:id/status` atau `/order/:id/ready` untuk memperbarui status order saat diproses

## Alur Kerja untuk Tim Dapur

1. **Pagi Hari**: Tim dapur bisa memeriksa order untuk hari itu:
   ```
   GET /api/order/for-cooking?date=2025-11-25
   ```

2. **Prioritaskan Pembayaran**: Fokus ke order yang sudah dibayar:
   ```
   GET /api/order/for-cooking-paid?date=2025-11-25
   ```

3. **Saat Mulai Memasak**: Update status order dari 'confirmed' ke 'preparing':
   ```
   PUT /api/order/123/status
   {
     "status": "preparing"
   }
   ```

4. **Saat Selesai Memasak**: Tandai order sebagai siap:
   ```
   PUT /api/order/123/ready
   ```

5. **Akhir Hari**: Lihat laporan harian:
   ```
   GET /api/order/daily-report/2025-11-25
   ```

## Contoh Implementasi untuk Admin Dashboard

```javascript
// Mendapatkan jadwal memasak untuk hari ini
const cookingSchedule = await fetch('/api/order/for-cooking', {
  headers: {
    'Cookie': adminAuthCookie
  }
}).then(res => res.json());

// Mendapatkan hanya order yang sudah dibayar untuk hari ini
const paidOrdersForCooking = await fetch('/api/order/for-cooking-paid', {
  headers: {
    'Cookie': adminAuthCookie
  }
}).then(res => res.json());

// Mendapatkan rekapitulasi minggu ini
const weeklySummary = await fetch('/api/order/summary?startDate=2025-11-18&endDate=2025-11-24', {
  headers: {
    'Cookie': adminAuthCookie
  }
}).then(res => res.json());

// Mendapatkan laporan harian untuk tanggal tertentu
const dailyReport = await fetch('/api/order/daily-report/2025-11-25', {
  headers: {
    'Cookie': adminAuthCookie
  }
}).then(res => res.json());

// Memperbarui status order
const updateOrderStatus = async (orderId, newStatus) => {
  const response = await fetch(`/api/order/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminAuthCookie
    },
    body: JSON.stringify({ status: newStatus })
  });
  return response.json();
};

// Menandai order sebagai siap
const markOrderReady = async (orderId) => {
  const response = await fetch(`/api/order/${orderId}/ready`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminAuthCookie
    }
  });
  return response.json();
};
```

Endpoint ini dirancang untuk memberikan visibilitas penuh atas operasional catering, dari sisi pembayaran hingga produksi di dapur.

## Manfaat Utama Sistem

1. **Efisiensi Operasional**: Tim dapur bisa melihat semua order yang harus diproses dalam satu tampilan
2. **Prioritas Pembayaran**: Memastikan order yang sudah dibayar diproses lebih dulu
3. **Manajemen Instruksi Khusus**: Instruksi pelanggan tidak terlewatkan
4. **Pelaporan Real-time**: Admin bisa mendapatkan laporan harian secara otomatis
5. **Workflow Terstruktur**: Alur kerja dari konfirmasi ke persiapan hingga pengiriman jelas dan terlacak
6. **Pemantauan Kinerja**: Dengan data statistik, bisa mengevaluasi kinerja harian, mingguan, atau bulanan

Fitur ini meningkatkan koordinasi antara tim penjualan, admin, dan tim dapur, memastikan order diproses secara efisien dan akurat.