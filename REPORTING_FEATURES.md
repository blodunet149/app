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

## Penggunaan untuk Tim Dapur

Tim dapur dapat menggunakan endpoint ini untuk:

1. **Merencanakan produksi harian** - Gunakan endpoint `/for-cooking` untuk melihat semua order yang harus diproses pada tanggal tertentu
2. **Memfokuskan pada order yang sudah dibayar** - Gunakan endpoint `/for-cooking-paid` untuk memprioritaskan order yang sudah lunas
3. **Mengelola instruksi khusus pelanggan** - Setiap order menyertakan specialInstructions untuk dipertimbangkan saat memasak
4. **Melihat ringkasan keuangan** - Gunakan endpoint `/summary` untuk melihat total pendapatan dan distribusi pembayaran

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
```

Endpoint ini dirancang untuk memberikan visibilitas penuh atas operasional catering, dari sisi pembayaran hingga produksi di dapur.