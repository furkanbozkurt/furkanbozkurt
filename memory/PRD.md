# TAFF OTOPARK - Otopark Yönetim Sistemi

## Problem Statement
Araç otopark yönetim sistemi. Araç check-in/check-out, test sürüşleri, yakıt takibi, fotoğraf yükleme ve raporlama özellikleri.

## User Personas
- **Admin**: Tam yetki - kullanıcı yönetimi, firma/marka/lokasyon yönetimi, araç silme, tüm raporları görme
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

### Session 1 - Bug Fixes
- ✅ **P0**: PrivateRoute roller düzeltildi (raporlar açılmıyor sorunu)
- ✅ Dashboard'da received_by_name gösterimi
- ✅ Admin araç silme yetkisi

### Session 2 - Admin Raporları İyileştirmesi
- ✅ **Admin Panelinde "Araç Raporları" sekmesi** - Tüm araçlar tablo halinde
  - Plaka, Marka/Model, Firma, Teslim Alan, Durum, KM bilgileri
  - Plakaya tıklayınca araç detayına gitme
  - Final Rapor butonuyla PDF görüntüleme
- ✅ **Araç Detayında "Kullanım Özeti" bölümü**
  - Test Sürüşü sayısı
  - Farklı Kullanıcı sayısı
  - Toplam Test KM
  - Toplam Yakıt
  - Kullanıcı bazlı detay tablosu
- ✅ **Araç detayında "Teslim Alan" bilgisi**
- ✅ **Final Rapor sayfası** - PDF olarak kaydetme özelliği

---

## Tech Stack
- **Backend**: FastAPI, Pydantic, MongoDB (Motor), JWT
- **Frontend**: React, axios, react-router-dom, TailwindCSS, shadcn/ui
- **Database**: MongoDB

## API Endpoints
- `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- `/api/vehicles`, `/api/vehicles/{id}`, `/api/vehicles/{id}/deliver`
- `/api/vehicles/{id}` DELETE (admin only)
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
- [ ] Fotoğraf yükleme iyileştirmesi: Chunked upload veya cloud storage

### P2 - Medium Priority
- [ ] Excel export
- [ ] Rapor hız optimizasyonu (database indexleri)

### P3 - Low Priority
- [ ] Dashboard analitikleri (grafikler)
- [ ] QR kod entegrasyonu
- [ ] Mobil uygulama

### Refactoring
- [ ] server.py dosyasını modüler yapıya ayırma (routes/, models/, services/)
