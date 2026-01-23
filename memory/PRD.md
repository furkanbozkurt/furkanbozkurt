# TAFF OTOPARK - Otopark Yönetim Sistemi

## Problem Statement
Araç otopark yönetim sistemi. Araç check-in/check-out, test sürüşleri, yakıt takibi, fotoğraf yükleme ve raporlama özellikleri.

## User Personas (5 Kullanıcı Tipi)
| Rol | Kod | Yetkiler |
|-----|-----|----------|
| **Admin** | `admin` | Her şeyi yapabilir, rapor onaylar, silme yetkisi |
| **TAFF Yönetici** | `taff_manager` | Admin ile aynı yetki |
| **TAFF Personel** | `taff_staff` | Araç kullanır, ara rapor yazar, tüm TAFF personelinin verilerini görür |
| **Firma Yönetici** | `company_manager` | Kendi firmasının tüm onaylı raporlarını görür |
| **Firma Personel** | `company_staff` | Sadece kendi departmanının onaylı raporlarını görür |

## Rapor Tipleri
1. **İlk Rapor**: Araç teslim alma - herkes açabilir, PDF alınabilir
2. **Ara Rapor (Test Sürüşü)**: Yakıt, KM, arıza notları - sadece TAFF görür
3. **Teslim Raporu**: Admin onayı sonrası firma görür

## Araç Durumları
- `received` → `in_pool` → `in_testing` → `pending_approval` → `delivered`

---

## Implemented Features (23 Jan 2026)

### Session 5 - Bug Fixes & Feature Completion

#### Bug Fixes
- ✅ **Erken Teslim Akışı**: Tahmini test KM tamamlanmadan teslimde zorunlu açıklama alanı eklendi
- ✅ **TAFF Staff Görünürlüğü**: Tüm TAFF personeli birbirinin test sürüşlerini görebiliyor
- ✅ **Onay Bekleyenler Sayfası**: `/pending-approvals` artık çalışıyor ve araçları listliyor
- ✅ **Kullanıcı Yönetimi**: AdminReports.jsx tamamen çalışır durumda

#### Verified Features (Testing Agent - 100% Pass)
1. Admin login ve yönlendirme
2. Dashboard istatistikleri (Toplam, Aktif, Onay Bekleyen, Teslim Edilen)
3. Onay Bekleyenler sayfası
4. Admin paneli Kullanıcı Yönetimi
5. Kullanıcı Düzenleme dialogu (Rol, Firma, Departman)
6. Araç detay Teslim Et butonu
7. Teslim dialogu Tahmini/Kalan KM gösterimi
8. Erken teslim uyarısı ve zorunlu açıklama
9. Yeni kullanıcı kaydı
10. Test sürüşü formunda otomatik KM doldurma

### Session 4 - Kapsamlı Sistem Yeniden Yapılandırma

#### Backend Değişiklikleri
- ✅ **5 Kullanıcı Rolü** sistemi (admin, taff_manager, taff_staff, company_manager, company_staff)
- ✅ **Departman Sistemi** - Firma bazlı departmanlar
- ✅ **Tahmini Test KM** - 100, 250, 500, 1000 veya özel değer
- ✅ **Kalan KM Takibi** - Araç kartlarında progress bar ile
- ✅ **Araç Havuzu** (in_pool) - Test sonrası havuza döndürme
- ✅ **Admin Rapor Onayı** - pending_approval → delivered

---

## Tech Stack
- **Backend**: FastAPI, Pydantic, MongoDB (Motor), JWT
- **Frontend**: React, axios, react-router-dom, TailwindCSS, shadcn/ui
- **Database**: MongoDB

## API Endpoints
### Auth
- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`

### Users
- `GET /api/users` - Kullanıcı listesi (admin)
- `PUT /api/users/{id}/role` - Rol değiştir
- `PUT /api/users/{id}/company` - Firma/departman ata
- `PUT /api/users/{id}/approve` - Kullanıcı onayla
- `DELETE /api/users/{id}` - Kullanıcı sil

### Vehicles
- `GET /api/vehicles`, `POST /api/vehicles`
- `GET /api/vehicles/{id}`
- `PUT /api/vehicles/{id}/deliver` - Araç teslim et (erken teslim açıklama desteği)
- `PUT /api/vehicles/{id}/return-to-pool` - Havuza döndür
- `PUT /api/vehicles/{id}/approve` - Rapor onayla (admin)
- `DELETE /api/vehicles/{id}` - Araç sil

### Test Drives & Reports
- `POST /api/test-drives` - Test sürüşü ekle
- `GET /api/test-drives/vehicle/{id}` - Araç test sürüşleri (TAFF personeli tümünü görür)
- `GET /api/vehicles/{id}/final-report` - Final rapor

## Test Credentials
- Admin: `admin@taff.com` / `admin123`
- TAFF Staff: `demo@taff.com` / `demo123`

---

## Backlog / Future Tasks

### P1 - High Priority
- [ ] Firma Yönetici ve Personel için özel portal/dashboard
- [ ] Video yükleme desteği (max 500MB)
- [ ] Gerçek e-posta entegrasyonu (SendGrid/Resend)

### P2 - Medium Priority
- [ ] Excel export
- [ ] Fotoğraf yükleme FormData'ya çevrilmeli (Base64 yerine)

### P3 - Low Priority
- [ ] Dashboard analitikleri
- [ ] QR kod entegrasyonu
- [ ] Mobil uygulama

### Refactoring (Technical Debt)
- [ ] server.py modüler yapıya ayırma (1100+ satır)

---

## Test Reports
- `/app/test_reports/iteration_3.json` - En son test (100% pass)
- `/app/backend/tests/test_taff_otopark_api.py` - 19 backend test

## Mocked APIs
- `/api/vehicles/{id}/send-report` - Email gönderme MOCK (gerçek email gönderilmiyor)
