# TAFF OTOPARK - Otopark Yönetim Sistemi

## Problem Statement
Araç otopark yönetim sistemi. Araç check-in/check-out, test sürüşleri, yakıt takibi, fotoğraf yükleme ve raporlama özellikleri.

## User Personas
- **Admin**: Tam yetki - kullanıcı yönetimi, firma/marka/lokasyon yönetimi, araç silme
- **TAFF Staff**: Araç teslim alma/teslim etme, test sürüşü, ara rapor oluşturma
- **Company (Firma)**: Sadece kendi firmalarının araçlarını görüntüleme

## Core Requirements
1. ✅ Kullanıcı kimlik doğrulama (JWT)
2. ✅ Rol tabanlı erişim kontrolü (admin, taff_staff, company)
3. ✅ Araç teslim alma/teslim etme workflow'u
4. ✅ Test sürüşü kayıtları
5. ✅ Ara rapor oluşturma
6. ✅ Fotoğraf yükleme (Base64)
7. ✅ Final rapor (print/PDF)
8. ✅ Kullanıcı onay sistemi
9. ✅ Admin paneli (firma/marka/lokasyon yönetimi)
10. ✅ KM doğrulama (artan)

---

## Implemented Features (22 Jan 2026)

### Critical Bug Fixes
- ✅ **P0**: Raporlar ve araç detayları açılmıyor sorunu **ÇÖZÜLDÜ**
  - Sorun: PrivateRoute'daki varsayılan roller yanlış ayarlanmıştı (`staff`, `customer` yerine `admin`, `taff_staff`, `company` olmalıydı)
  - Çözüm: App.js'de PrivateRoute default allowedRoles düzeltildi

### New Features
- ✅ Dashboard'da araç kartlarında kullanıcı adı (received_by_name) gösterimi
- ✅ Admin için araç silme yetkisi ve butonu
- ✅ Teslim edilen araçlarda düzenleme kilidi (admin hariç)
- ✅ Vehicle model'e company ve received_by_name alanları eklendi

### Backend Updates
- Vehicle model: `received_by_name`, `company` alanları eklendi
- `DELETE /api/vehicles/{id}` endpoint (admin only)
- Test sürüşü/ara rapor: delivered araçlara sadece admin ekleyebilir kuralı

### Test Results
- Backend: 19/19 test başarılı (100%)
- Frontend: Tüm özellikler çalışıyor (100%)

---

## Tech Stack
- **Backend**: FastAPI, Pydantic, MongoDB (Motor), JWT
- **Frontend**: React, axios, react-router-dom, TailwindCSS, shadcn/ui
- **Database**: MongoDB

## API Endpoints
- `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- `/api/vehicles`, `/api/vehicles/{id}`, `/api/vehicles/{id}/deliver`
- `/api/users`, `/api/users/{id}/approve`, `/api/users/{id}/role`
- `/api/companies`, `/api/brands`, `/api/locations`
- `/api/test-drives`, `/api/interim-reports`
- `/api/reports/user-summary`
- `/api/vehicles/{id}/final-report`

## Test Credentials
- Admin: `admin@taff.com` / `admin123`
- TAFF Staff: `demo@taff.com` / `demo123`

---

## Backlog / Future Tasks

### P1 - High Priority
- [ ] PDF Export: Gerçek PDF dosyası oluşturma (şu an window.print() kullanılıyor)
- [ ] Fotoğraf yükleme iyileştirmesi: Chunked upload veya cloud storage

### P2 - Medium Priority
- [ ] Admin rapor UI yeniden tasarımı
- [ ] Yakıt geçmişi görüntüleme
- [ ] Excel export
- [ ] Rapor hız optimizasyonu (database indexleri)

### P3 - Low Priority
- [ ] Dashboard analitikleri (grafikler)
- [ ] QR kod entegrasyonu
- [ ] Mobil uygulama

### Refactoring
- [ ] server.py dosyasını modüler yapıya ayırma (routes/, models/, services/)
