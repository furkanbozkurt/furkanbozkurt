import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { LogOut, Car, PlusCircle, Trash2, MapPin, Settings, Eye, FileText, Edit, Building2, Users } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'taff_manager'];
const VALID_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'taff_manager', label: 'TAFF Yönetici' },
  { value: 'taff_staff', label: 'TAFF Personel' },
  { value: 'company_manager', label: 'Firma Yönetici' },
  { value: 'company_staff', label: 'Firma Personel' }
];

const AdminReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vehicles');
  const [users, setUsers] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCompany, setNewCompany] = useState({ name: '', contact_person: '', phone: '', email: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '', company_id: '' });
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({ role: '', company_id: '', department_id: '' });
  const user = JSON.parse(localStorage.getItem('valetpro_user') || '{}');

  useEffect(() => {
    if (!ADMIN_ROLES.includes(user.role)) {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, brandsRes, locationsRes, usersRes, companiesRes, vehiclesRes, deptsRes] = await Promise.all([
        api.get('/reports/user-summary'),
        api.get('/brands'),
        api.get('/locations'),
        api.get('/users'),
        api.get('/companies'),
        api.get('/vehicles'),
        api.get('/departments')
      ]);
      setUserReports(reportsRes.data);
      setBrands(brandsRes.data);
      setLocations(locationsRes.data);
      setUsers(usersRes.data);
      setCompanies(companiesRes.data);
      setVehicles(vehiclesRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setEditUserData({
      role: u.role,
      company_id: u.company_id || '',
      department_id: u.department_id || ''
    });
  };

  const handleSaveUser = async () => {
    try {
      // Update role
      await api.put(`/users/${editingUser.id}/role?role=${editUserData.role}`);
      
      // Update company and department
      await api.put(`/users/${editingUser.id}/company`, {
        company_id: editUserData.company_id || null,
        department_id: editUserData.department_id || null
      });
      
      toast.success('Kullanıcı güncellendi');
      setEditingUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Güncelleme başarısız');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      toast.success('Kullanıcı silindi');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme başarısız');
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDepartment.name.trim() || !newDepartment.company_id) {
      toast.error('Departman adı ve firma seçimi gerekli');
      return;
    }
    
    try {
      await api.post('/departments', newDepartment);
      toast.success('Departman eklendi');
      setNewDepartment({ name: '', company_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Departman eklenemedi');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    try {
      await api.delete(`/departments/${deptId}`);
      toast.success('Departman silindi');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme başarısız');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.trim()) return;

    try {
      await api.post('/brands', { name: newBrand.trim() });
      toast.success('Marka eklendi');
      setNewBrand('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Marka eklenemedi');
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!confirm('Bu markayı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/brands/${brandId}`);
      toast.success('Marka silindi');
      fetchData();
    } catch (error) {
      toast.error('Marka silinemedi');
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    try {
      await api.post('/locations', { name: newLocation.trim() });
      toast.success('Lokasyon eklendi');
      setNewLocation('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lokasyon eklenemedi');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/locations/${locationId}`);
      toast.success('Lokasyon silindi');
      fetchData();
    } catch (error) {
      toast.error('Lokasyon silinemedi');
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;

    try {
      await api.post('/companies', newCompany);
      toast.success('Firma eklendi');
      setNewCompany({ name: '', contact_person: '', phone: '', email: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Firma eklenemedi');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!confirm('Bu firmayı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/companies/${companyId}`);
      toast.success('Firma silindi');
      fetchData();
    } catch (error) {
      toast.error('Firma silinemedi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('valetpro_token');
    localStorage.removeItem('valetpro_user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-sm">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Yönetici Paneli</h1>
                <p className="text-xs text-slate-500">TAFF OTOPARK</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">Yönetici</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="vehicles">Araç Raporları</TabsTrigger>
            <TabsTrigger value="users">Kullanıcı Yönetimi</TabsTrigger>
            <TabsTrigger value="companies">Firma Yönetimi</TabsTrigger>
            <TabsTrigger value="reports">Kullanıcı Raporları</TabsTrigger>
            <TabsTrigger value="brands">Marka Yönetimi</TabsTrigger>
            <TabsTrigger value="locations">Lokasyon Yönetimi</TabsTrigger>
          </TabsList>

          {/* Vehicles Tab - NEW */}
          <TabsContent value="vehicles">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Tüm Araçlar ({vehicles.length})
                </CardTitle>
                <CardDescription>Araç plakasına tıklayarak detay ve süreç takibi yapabilirsiniz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-3 px-2">Plaka</th>
                        <th className="text-left py-3 px-2">Marka/Model</th>
                        <th className="text-left py-3 px-2">Firma</th>
                        <th className="text-left py-3 px-2">Teslim Alan</th>
                        <th className="text-left py-3 px-2">Durum</th>
                        <th className="text-right py-3 px-2">KM</th>
                        <th className="text-center py-3 px-2">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((v) => {
                        const statusConfig = {
                          'received': { label: 'Teslimdeki', class: 'bg-green-100 text-green-700' },
                          'in_pool': { label: 'Havuzda', class: 'bg-blue-100 text-blue-700' },
                          'in_testing': { label: 'Test Sürüşünde', class: 'bg-yellow-100 text-yellow-700' },
                          'pending_approval': { label: 'Onay Bekliyor', class: 'bg-orange-100 text-orange-700' },
                          'delivered': { label: 'Teslim Edildi', class: 'bg-slate-100 text-slate-700' }
                        };
                        const status = statusConfig[v.status] || { label: v.status, class: 'bg-slate-100' };
                        
                        return (
                        <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2">
                            <button
                              onClick={() => navigate(`/vehicle/${v.id}`)}
                              className="font-mono font-bold text-primary hover:underline"
                            >
                              {v.plate}
                            </button>
                          </td>
                          <td className="py-3 px-2">{v.brand} {v.model}</td>
                          <td className="py-3 px-2">{v.company}</td>
                          <td className="py-3 px-2">{v.received_by_name}</td>
                          <td className="py-3 px-2">
                            <Badge className={status.class}>{status.label}</Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {v.km_start?.toLocaleString('tr-TR')}
                            {v.km_end && ` → ${v.km_end?.toLocaleString('tr-TR')}`}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/vehicle/${v.id}`)}
                                title="Detay Görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(v.status === 'delivered' || v.status === 'pending_approval') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(`/vehicle/${v.id}/final-report`, '_blank')}
                                  title="Final Rapor"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tüm Kullanıcılar ({users.length})
                </CardTitle>
                <CardDescription>Kullanıcı yetkilerini, firma ve departman atamasını düzenleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-3 px-2">Ad Soyad</th>
                        <th className="text-left py-3 px-2">E-posta</th>
                        <th className="text-left py-3 px-2">Rol</th>
                        <th className="text-left py-3 px-2">Firma</th>
                        <th className="text-left py-3 px-2">Departman</th>
                        <th className="text-left py-3 px-2">Durum</th>
                        <th className="text-center py-3 px-2">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const roleLabel = VALID_ROLES.find(r => r.value === u.role)?.label || u.role;
                        return (
                          <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-2 font-medium">{u.name}</td>
                            <td className="py-3 px-2 text-slate-600">{u.email}</td>
                            <td className="py-3 px-2">
                              <Badge className={
                                u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                u.role === 'taff_manager' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'taff_staff' ? 'bg-blue-100 text-blue-700' :
                                u.role === 'company_manager' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                              }>
                                {roleLabel}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">{u.company_name || '-'}</td>
                            <td className="py-3 px-2">{u.department_name || '-'}</td>
                            <td className="py-3 px-2">
                              {u.approved ? (
                                <Badge className="bg-green-100 text-green-700">Onaylı</Badge>
                              ) : (
                                <Badge className="bg-orange-100 text-orange-700">Bekliyor</Badge>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {!u.approved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await api.put(`/users/${u.id}/approve`);
                                        toast.success('Kullanıcı onaylandı');
                                        fetchData();
                                      } catch (error) {
                                        toast.error('Onaylama başarısız');
                                      }
                                    }}
                                  >
                                    Onayla
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditUser(u)}
                                  title="Düzenle"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {u.id !== user.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteUser(u.id)}
                                    title="Sil"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Companies */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Firmalar ({companies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCompany} className="flex gap-2 mb-4">
                    <Input
                      placeholder="Firma adı"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                      className="flex-1"
                    />
                    <Button type="submit">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ekle
                    </Button>
                  </form>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {companies.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium">{c.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCompany(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Departments */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Departmanlar ({departments.length})</CardTitle>
                  <CardDescription>Firma seçip departman ekleyin</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddDepartment} className="flex gap-2 mb-4">
                    <select
                      value={newDepartment.company_id}
                      onChange={(e) => setNewDepartment({ ...newDepartment, company_id: e.target.value })}
                      className="flex h-10 w-40 rounded-sm border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Firma Seç</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Departman adı"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                      className="flex-1"
                    />
                    <Button type="submit">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ekle
                    </Button>
                  </form>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {departments.map((d) => {
                      const comp = companies.find(c => c.id === d.company_id);
                      return (
                        <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <span className="font-medium">{d.name}</span>
                            <span className="text-xs text-slate-500 ml-2">({comp?.name || 'Bilinmeyen'})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteDepartment(d.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Kullanıcı Bazlı Raporlar</h2>
              {userReports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-slate-500">Henüz rapor bulunmuyor</p>
                  </CardContent>
                </Card>
              ) : (
                userReports.map((report) => (
                  <Card key={report.user_id} className="border-slate-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{report.user_name}</CardTitle>
                        <div className="flex gap-4">
                          <Badge variant="outline">{report.total_vehicles} Araç</Badge>
                          <Badge variant="outline">{report.total_km?.toLocaleString('tr-TR')} km</Badge>
                          <Badge variant="outline">₺{report.total_fuel?.toLocaleString('tr-TR')} Yakıt</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-slate-700">Araç Detayları:</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200">
                                <th className="text-left py-2">Plaka</th>
                                <th className="text-left py-2">Marka/Model</th>
                                <th className="text-right py-2">Başlangıç KM</th>
                                <th className="text-right py-2">Bitiş KM</th>
                                <th className="text-right py-2">Toplam KM</th>
                                <th className="text-right py-2">Yakıt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.vehicles.map((v, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                  <td className="py-2 font-mono font-bold">{v.plate}</td>
                                  <td className="py-2">{v.brand} {v.model}</td>
                                  <td className="text-right py-2">{v.km_start?.toLocaleString('tr-TR')}</td>
                                  <td className="text-right py-2">{v.km_end?.toLocaleString('tr-TR')}</td>
                                  <td className="text-right py-2 font-bold">{v.total_km?.toLocaleString('tr-TR')}</td>
                                  <td className="text-right py-2">₺{v.total_fuel?.toLocaleString('tr-TR')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Yeni Marka Ekle</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddBrand} className="flex gap-4">
                    <Input
                      placeholder="Marka adı (örn: Tesla)"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="h-12"
                    />
                    <Button type="submit" className="h-12">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ekle
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Mevcut Markalar ({brands.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-sm">
                        <span className="font-medium">{brand.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Yeni Lokasyon Ekle</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddLocation} className="flex gap-4">
                    <Input
                      placeholder="Lokasyon adı (örn: D Kapı)"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="h-12"
                    />
                    <Button type="submit" className="h-12">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ekle
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Mevcut Lokasyonlar ({locations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{location.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocation(location.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminReports;
