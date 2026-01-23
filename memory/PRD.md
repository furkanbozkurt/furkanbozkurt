# TAFF OTOPARK - Otopark Yönetim Sistemi

## Problem Statement
Araç otopark yönetim sistemi. Araç check-in/check-out, test sürüşleri, yakıt takibi, fotoğraf yükleme ve raporlama özellikleri.

## User Personas (5 Kullanıcı Tipi)
| Rol | Kod | Yetkiler |
|-----|-----|----------|
| **Admin** | `admin` | Her şeyi yapabilir, rapor onaylar, silme yetkisi |
| **TAFF Yönetici** | `taff_manager` | Admin ile aynı yetki |
| **TAFF Personel** | `taff_staff` | Araç kullanır, ara rapor yazar, sadece kendi araçlarını görür |
| **Firma Yönetici** | `company_manager` | Kendi firmasının tüm onaylı raporlarını görür |
| **Firma Personel** | `company_staff` | Sadece kendi departmanının onaylı raporlarını görür |

## Rapor Tipleri
1. **İlk Rapor**: Araç teslim alma - herkes açabilir, PDF alınabilir
2. **Ara Rapor (Test Sürüşü)**: Yakıt, KM, arıza notları - sadece TAFF görür
3. **Teslim Raporu**: Admin onayı sonrası firma görür

## Araç Durumları
- `received` → `in_pool` → `in_testing` → `pending_approval` → `delivered`

---

## Implemented Features (22 Jan 2026)

### Session 4 - Kapsamlı Sistem Yeniden Yapılandırma

#### Backend Değişiklikleri
- ✅ **5 Kullanıcı Rolü** sistemi (admin, taff_manager, taff_staff, company_manager, company_staff)
- ✅ **Departman Sistemi** - Firma bazlı departmanlar (Hasar, Mekanik, Lastik Yönetimi vb.)
- ✅ **Tahmini Test KM** - 100, 250, 500, 1000 veya özel değer
- ✅ **Kalan KM Takibi** - Araç kartlarında görünür
- ✅ **Araç Havuzu** (in_pool) - Test sonrası havuza döndürme
- ✅ **Admin Rapor Onayı** - pending_approval → delivered
- ✅ **Erken Teslim** - KM tamamlanmadan teslimde açıklama + fotoğraf zorunluluğu
- ✅ **Arıza Sistemi** - Test sürüşünde arıza fotoğraf/video ekleme
- ✅ **Kullanıcı Silme** - Admin kullanıcı silebilir
- ✅ **Firma/Departman Atama** - Kullanıcılara firma ve departman atama

#### Frontend Değişiklikleri
- ✅ **Dashboard "Yönetim Paneli" butonu** - Admin için
- ✅ **Araç kartlarında kalan KM göstergesi** - Progress bar ile
- ✅ **Tahmini Test KM seçimi** - Araç teslim alma formunda
- ✅ **Durum badge'leri** - Teslimdeki, Havuzda, Test Sürüşünde, Onay Bekliyor
- ✅ **Rol gösterimi** - Header'da kullanıcı rolü

---

## Tech Stack
- **Backend**: FastAPI, Pydantic, MongoDB (Motor), JWT
- **Frontend**: React, axios, react-router-dom, TailwindCSS, shadcn/ui
- **Database**: MongoDB

## API Endpoints
### Auth
- `/api/auth/login`, `/api/auth/register`, `/api/auth/me`

### Users
- `GET /api/users` - Kullanıcı listesi (admin)
- `PUT /api/users/{id}/role` - Rol değiştir
- `PUT /api/users/{id}/company` - Firma/departman ata
- `PUT /api/users/{id}/approve` - Kullanıcı onayla
- `DELETE /api/users/{id}` - Kullanıcı sil

### Departments
- `POST /api/departments` - Departman ekle
- `GET /api/departments` - Departman listesi
- `DELETE /api/departments/{id}` - Departman sil

### Vehicles
- `GET /api/vehicles`, `POST /api/vehicles`
- `GET /api/vehicles/{id}`
- `PUT /api/vehicles/{id}/deliver` - Araç teslim et
- `PUT /api/vehicles/{id}/return-to-pool` - Havuza döndür
- `PUT /api/vehicles/{id}/approve` - Rapor onayla (admin)
- `DELETE /api/vehicles/{id}` - Araç sil

### Reports
- `/api/test-drives`, `/api/interim-reports`
- `/api/vehicles/{id}/final-report`
- `/api/vehicles/{id}/send-report`

## Test Credentials
- Admin: `admin@taff.com` / `admin123`
- TAFF Staff: `demo@taff.com` / `demo123`

---

## Backlog / Future Tasks

### P1 - High Priority
- [ ] Firma Yönetici ve Personel için özel portal/dashboard
- [ ] Video yükleme desteği (max 500MB)
- [ ] Gerçek e-posta entegrasyonu (SendGrid)

### P2 - Medium Priority
- [ ] Onay bekleyen araçlar sayfası (/pending-approvals)
- [ ] Firma yorumları sistemi
- [ ] Excel export

### P3 - Low Priority
- [ ] Dashboard analitikleri
- [ ] QR kod entegrasyonu
- [ ] Mobil uygulama

### Refactoring
- [ ] server.py modüler yapıya ayırma
