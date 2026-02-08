/**
 * AKULAS BACKEND API ENDPOINTS
 * Base URL: http://localhost:3003/api/v1
 *
 * Authentication: Tüm endpoint'ler (health hariç) Bearer token gerektirir
 * Header: { "Authorization": "Bearer <firebase-token>" }
 */

// API Base Configuration
const API_CONFIG = {
  BASE_URL: 'http://localhost:3003',
  API_PREFIX: '/api/v1',
  FULL_URL: 'http://localhost:3003/api/v1'
};

// API Endpoints
const API_ENDPOINTS = {
  // ============================================
  // HEALTH CHECK (No Auth Required)
  // ============================================
  HEALTH: '/health',

  // ============================================
  // VEHICLES
  // ============================================
  VEHICLES: {
    // GET - Tüm araçları listele
    GET_ALL: '/vehicles',

    // GET - Belirli bir aracı getir
    // Kullanım: GET_BY_ID.replace(':id', vehicleId)
    GET_BY_ID: '/vehicles/:id',

    // GET - Hat bazında araçları listele
    // Kullanım: GET_BY_LINE.replace(':lineName', 'Makas')
    GET_BY_LINE: '/vehicles/line/:lineName',

    // POST - Yeni araç ekle (Admin/Supervisor)
    CREATE: '/vehicles',

    // PUT - Araç güncelle (Admin/Supervisor)
    // Kullanım: UPDATE.replace(':id', vehicleId)
    UPDATE: '/vehicles/:id',

    // DELETE - Araç sil (Admin only)
    // Kullanım: DELETE.replace(':id', vehicleId)
    DELETE: '/vehicles/:id'
  },

  // ============================================
  // HAKEDIS (Hakediş Kayıtları)
  // ============================================
  HAKEDIS: {
    // GET - Tüm hakediş kayıtlarını listele
    // Query params: ?type=HAFTALIK&startDate=2026-01-01&endDate=2026-01-31
    GET_ALL: '/hakedis',

    // GET - Belirli bir hakediş kaydını getir
    // Kullanım: GET_BY_ID.replace(':id', hakedisId)
    GET_BY_ID: '/hakedis/:id',

    // POST - Yeni hakediş oluştur (Admin/Supervisor/Responsible)
    // Body: { date, type, routes, vehicles, raporal, sistem }
    CREATE: '/hakedis',

    // PUT - Hakediş güncelle (Admin/Supervisor)
    // Kullanım: UPDATE.replace(':id', hakedisId)
    UPDATE: '/hakedis/:id',

    // DELETE - Hakediş sil (Admin only)
    // Kullanım: DELETE.replace(':id', hakedisId)
    DELETE: '/hakedis/:id',

    // GET - Haftalık hakediş özeti (banka için)
    // Query params: ?startDate=2026-01-01&endDate=2026-01-07
    WEEKLY_SUMMARY: '/hakedis/weekly-summary'
  },

  // ============================================
  // RECORDS (Günlük Kayıtlar - Legacy)
  // ============================================
  RECORDS: {
    // GET - Tüm kayıtları listele
    // Query params: ?startDate=2026-01-01&endDate=2026-01-31&type=WEEKLY
    GET_ALL: '/records',

    // GET - Belirli bir kaydı getir
    // Kullanım: GET_BY_ID.replace(':id', recordId)
    GET_BY_ID: '/records/:id',

    // GET - Tarihe göre kayıtları getir
    // Kullanım: GET_BY_DATE.replace(':date', '2026-01-10')
    GET_BY_DATE: '/records/date/:date',

    // POST - Yeni kayıt oluştur (Admin/Supervisor/Desk)
    CREATE: '/records',

    // PUT - Kayıt güncelle (Admin/Supervisor)
    // Kullanım: UPDATE.replace(':id', recordId)
    UPDATE: '/records/:id',

    // DELETE - Kayıt sil (Admin only)
    // Kullanım: DELETE.replace(':id', recordId)
    DELETE: '/records/:id'
  },

  // ============================================
  // REPORTS (Raporlar)
  // ============================================
  REPORTS: {
    // GET - Tarih aralığı raporu (Hakediş kayıtları)
    // Query params: ?startDate=2026-01-01&endDate=2026-01-31&type=HAFTALIK
    DATE_RANGE: '/reports/date-range',

    // GET - Özet rapor
    // Query params (opsiyonel): ?startDate=2026-01-01&endDate=2026-01-31
    SUMMARY: '/reports/summary',

    // GET - Araç raporu (Haftalık gruplama ile)
    // Kullanım: VEHICLE.replace(':vehicleNumber', '68')
    // Query params (opsiyonel): ?startDate=2026-01-01&endDate=2026-01-31
    VEHICLE: '/reports/vehicle/:vehicleNumber',

    // GET - Hat raporu
    // Kullanım: ROUTE.replace(':routeName', 'Makas3')
    // Query params (opsiyonel): ?startDate=2026-01-01&endDate=2026-01-31
    ROUTE: '/reports/route/:routeName',

    // DEPRECATED - Geriye dönük uyumluluk için
    LINE: '/reports/line/:routeName'
  },

  // ============================================
  // DESK (Gişe İşlemleri)
  // ============================================
  DESK: {
    // POST - Taslak olarak kaydet (Desk users only)
    SAVE_DRAFT: '/desk/save',

    // POST - Sorumluya teslim et (Desk users only)
    SUBMIT: '/desk/submit',

    // GET - Teslim edilen kayıtları listele
    // Query params: ?startDate=2026-01-01&endDate=2026-01-31&status=submitted
    GET_SUBMITTED: '/desk/submitted',

    // GET - Tarihe göre taslak getir (Desk users only)
    // Kullanım: GET_DRAFT.replace(':date', '2026-01-21')
    GET_DRAFT: '/desk/draft/:date',

    // GET - Tek kayıt detayı
    // Kullanım: GET_BY_ID.replace(':id', recordId)
    GET_BY_ID: '/desk/submitted/:id',

    // PATCH - Kaydı onayla/reddet (Admin/Supervisor/Responsible only)
    // Kullanım: REVIEW.replace(':id', recordId)
    REVIEW: '/desk/submitted/:id/review',

    // PUT - Kayıt güncelle (revize için)
    // Kullanım: UPDATE.replace(':id', recordId)
    UPDATE: '/desk/submitted/:id',

    // DELETE - Kayıt sil
    // Kullanım: DELETE.replace(':id', recordId)
    DELETE: '/desk/submitted/:id'
  },

  // ============================================
  // BAYI DOLUM (Bayi Dolum İşlemleri)
  // ============================================
  BAYI_DOLUM: {
    // POST - Bayi dolum teslim et
    SUBMIT: '/bayi-dolum/submit',

    // GET - Teslim edilen kayıtları listele
    GET_SUBMITTED: '/bayi-dolum/submitted',

    // GET - Tek kayıt detayı
    // Kullanım: GET_BY_ID.replace(':id', recordId)
    GET_BY_ID: '/bayi-dolum/submitted/:id',

    // PATCH - Kaydı onayla/reddet
    // Kullanım: REVIEW.replace(':id', recordId)
    REVIEW: '/bayi-dolum/submitted/:id/review',

    // PUT - Kayıt güncelle
    // Kullanım: UPDATE.replace(':id', recordId)
    UPDATE: '/bayi-dolum/submitted/:id',

    // DELETE - Kayıt sil
    // Kullanım: DELETE.replace(':id', recordId)
    DELETE: '/bayi-dolum/submitted/:id'
  },

  // ============================================
  // LEAVE (İzin Yönetimi)
  // ============================================
  LEAVE: {
    // Employees
    GET_ALL_EMPLOYEES: '/leave/employees',
    GET_EMPLOYEE_BY_ID: '/leave/employees/:id',
    CREATE_EMPLOYEE: '/leave/employees',
    UPDATE_EMPLOYEE: '/leave/employees/:id',
    DELETE_EMPLOYEE: '/leave/employees/:id',

    // Leave Requests
    GET_LEAVE_REQUESTS: '/leave/requests',
    CREATE_LEAVE_REQUEST: '/leave/requests',
    REVIEW_LEAVE_REQUEST: '/leave/requests/:id/review',
    CANCEL_LEAVE_REQUEST: '/leave/requests/:id/cancel',

    // Entitlements
    GET_ENTITLEMENTS_BY_EMPLOYEE: '/leave/entitlements/:employeeId',
    GET_ALL_ENTITLEMENTS: '/leave/entitlements'
  },

  // ============================================
  // AUTH
  // ============================================
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_TOKEN: '/auth/verify'
  },

  // ============================================
  // USERS
  // ============================================
  USERS: {
    GET_ALL: '/users',
    GET_BY_ID: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id'
  }
};

// Helper Functions
const buildUrl = (endpoint) => {
  return `${API_CONFIG.FULL_URL}${endpoint}`;
};

const buildHeaders = (token) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Request Examples
const EXAMPLES = {
  // Vehicle Create Example
  CREATE_VEHICLE: {
    url: buildUrl(API_ENDPOINTS.VEHICLES.CREATE),
    method: 'POST',
    body: {
      vehicleNumber: 68,
      plateNumber: '68HO1111',
      routeName: 'Makas3',
      driverName: 'Ahmet Yılmaz',
      ownerName: 'Mehmet Demir',
      iban: 'TR330006100519786457841326',
      taxId: '12345678901',
      contactInfo: '+90 555 123 4567'
    }
  },

  // Hakediş Create Examples
  CREATE_HAKEDIS_WEEKLY: {
    url: buildUrl(API_ENDPOINTS.HAKEDIS.CREATE),
    method: 'POST',
    body: {
      date: '2026-01-19',
      type: 'HAFTALIK',
      routes: {
        'Makas3': 1000,
        'Sanayi': 1500
      },
      vehicles: {},
      raporal: 2500,
      sistem: 2400
    }
  },

  CREATE_HAKEDIS_CREDIT_CARD: {
    url: buildUrl(API_ENDPOINTS.HAKEDIS.CREATE),
    method: 'POST',
    body: {
      date: '2026-01-19',
      type: 'KREDI_KARTI',
      routes: {
        'Makas3': 1000
      },
      vehicles: {
        '68': 500
      },
      raporal: 1500,
      sistem: 1450
    }
  },

  // Desk Submit Example
  DESK_SUBMIT: {
    url: buildUrl(API_ENDPOINTS.DESK.SUBMIT),
    method: 'POST',
    body: {
      date: '2026-01-21',
      products: {
        dolum: 150,
        tamKart: 20,
        indirimliKart: 15,
        serbestKart: 10,
        serbestVize: 30,
        indirimliVize: 25,
        kartKilifi: 5
      },
      categoryCreditCards: {
        dolum: 3530,
        kart: 600,
        vize: 150,
        kartKilifi: 0
      },
      payments: {
        gunbasiNakit: 720,
        bankayaGonderilen: 0,
        ertesiGuneBirakilan: 0
      },
      banknotes: {
        dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
        kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
        vize: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 }
      },
      bankSentCash: {
        dolum: 0,
        kart: 0,
        vize: 0,
        totalSent: 0
      }
    }
  },

  // Report Query Examples
  GET_VEHICLE_REPORT: {
    url: buildUrl(API_ENDPOINTS.REPORTS.VEHICLE.replace(':vehicleNumber', '68')) +
         '?startDate=2026-01-01&endDate=2026-01-31',
    method: 'GET'
  },

  GET_ROUTE_REPORT: {
    url: buildUrl(API_ENDPOINTS.REPORTS.ROUTE.replace(':routeName', 'Makas3')) +
         '?startDate=2026-01-01&endDate=2026-01-31',
    method: 'GET'
  }
};

// Enums
const ENUMS = {
  USER_ROLES: {
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    RESPONSIBLE: 'responsible',
    DESK: 'desk'
  },

  HAKEDIS_TYPES: {
    HAFTALIK: 'HAFTALIK',
    KREDI_KARTI: 'KREDI_KARTI'
  },

  DESK_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING_REVISION: 'pending_revision',
    REVISED: 'revised'
  },

  LEAVE_TYPES: {
    ANNUAL: 'annual',
    SICK: 'sick',
    UNPAID: 'unpaid',
    MATERNITY: 'maternity'
  },

  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },

  // DEPRECATED - Geriye dönük uyumluluk
  RECORD_TYPES: {
    WEEKLY: 'WEEKLY',
    CREDIT_CARD: 'CREDIT_CARD'
  }
};

// CommonJS export
module.exports = {
  API_CONFIG,
  API_ENDPOINTS,
  buildUrl,
  buildHeaders,
  EXAMPLES,
  ENUMS
};
