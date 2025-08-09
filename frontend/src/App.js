import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card.jsx';
import { Input } from './components/ui/input.jsx';
import { Label } from './components/ui/label.jsx';
import { Badge } from './components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table.jsx';
import { Textarea } from './components/ui/textarea.jsx';
import { Alert, AlertDescription } from './components/ui/alert.jsx';
import { 
  LogIn, 
  LogOut, 
  Users, 
  Building, 
  DollarSign, 
  Bell, 
  Eye, 
  Trash2, 
  CheckCircle, 
  Edit,
  BarChart3,
  TrendingUp,
  Calendar,
  UserCheck,
  Building2,
  X,
  AlertTriangle
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Custom Confirmation Modal Component
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              type === 'danger' ? 'bg-red-100' : type === 'success' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                type === 'danger' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={onConfirm}
              className={type === 'danger' ? 'bg-red-600 hover:bg-red-700' : type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 APP DEBUG: useEffect triggered, token:', token);
    if (token) {
      console.log('🔍 APP DEBUG: Token found, setting axios header and fetching user');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      console.log('🔍 APP DEBUG: No token found, setting loading to false');
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    console.log('🔍 APP DEBUG: fetchCurrentUser called');
    try {
      const response = await axios.get(`${API}/me`);
      console.log('🔍 APP DEBUG: User fetch successful:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('🔍 APP DEBUG: Failed to fetch user:', error);
      handleLogout();
    } finally {
      console.log('🔍 APP DEBUG: fetchCurrentUser finally block, setting loading false');
      setLoading(false);
    }
  };

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#475569', fontSize: '18px', fontWeight: '500' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          {!user ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <Dashboard user={user} onLogout={handleLogout} />
          )}
        </div>
      </BrowserRouter>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({ user_id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/login`, credentials);
      onLogin(response.data.access_token, response.data.user);
    } catch (error) {
      console.error('Login failed:', error);
      setError('Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <Card style={{ width: '100%', maxWidth: '28rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}>
        <CardHeader style={{ textAlign: 'center', paddingBottom: '32px' }}>
          <div style={{ margin: '0 auto 16px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb' }}>
              PayTrack
            </h1>
          </div>
          <CardDescription style={{ color: '#64748b' }}>Connectez-vous pour gérer les paiements</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="user_id">Identifiant de connexion</Label>
              <Input
                id="user_id"
                type="text"
                placeholder="Ex: ADMIN1"
                value={credentials.user_id}
                onChange={(e) => setCredentials(prev => ({ ...prev, user_id: e.target.value }))}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="mt-2"
                required
              />
            </div>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('pending-entries');

  return (
    <div className="min-h-screen">
      <Header user={user} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Bienvenue, {user.identifiant}
          </h1>
          <p className="text-slate-600 mt-2">
            {user.role === 'employee' && 'Gérez vos entrées de paiement'}
            {user.role === 'manager' && 'Validez les paiements et gérez les rappels'}
            {user.role === 'admin' && 'Administration complète du système'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-8">
            <TabsTrigger value="pending-entries" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Entrées en attente
            </TabsTrigger>
            <TabsTrigger value="validated-entries" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Entrées validées
            </TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analyses
              </TabsTrigger>
            )}
            {(user.role === 'manager' || user.role === 'admin') && (
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Entreprises
              </TabsTrigger>
            )}
            {(user.role === 'manager' || user.role === 'admin') && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pending-entries">
            <PendingEntriesTab user={user} />
          </TabsContent>
          
          <TabsContent value="validated-entries">
            <ValidatedEntriesTab user={user} />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab user={user} />
          </TabsContent>
          
          <TabsContent value="companies">
            <CompaniesTab user={user} />
          </TabsContent>
          
          <TabsContent value="users">
            <UsersTab user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Header({ user, onLogout }) {
  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'employee': return 'Employé';
      default: return role;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-blue-600">
            PayTrack
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="capitalize">
            {getRoleLabel(user.role)}
          </Badge>
          <span className="text-slate-700 font-medium">{user.identifiant}</span>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}

function PendingEntriesTab({ user }) {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, entryId: null });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Promise.all([fetchEntries(), fetchCompanies()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, selectedCompany, startDate, endDate]);

  const applyFilters = () => {
    let filtered = [...entries];

    // Text search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Company filter
    if (selectedCompany && selectedCompany !== 'all') {
      filtered = filtered.filter(entry => entry.company_id === selectedCompany);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(entry => new Date(entry.created_at) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(entry => new Date(entry.created_at) <= new Date(endDate + 'T23:59:59'));
    }

    setFilteredEntries(filtered);
  };

  useEffect(() => {
    Promise.all([fetchEntries(), fetchCompanies()]).finally(() => setLoading(false));
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API}/payment-entries`);
      // Filter only pending entries
      setEntries(response.data.filter(entry => !entry.is_validated));
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleDelete = (entryId) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      entryId: entryId,
      title: 'Supprimer l\'entrée',
      message: 'Êtes-vous sûr de vouloir supprimer cette entrée de paiement ?'
    });
  };

  const handleValidate = (entryId) => {
    setConfirmModal({
      isOpen: true,
      action: 'validate',
      entryId: entryId,
      title: 'Valider l\'entrée',
      message: 'Êtes-vous sûr de vouloir valider cette entrée de paiement ?',
      type: 'confirm'
    });
  };

  const confirmAction = async () => {
    const { action, entryId } = confirmModal;
    
    try {
      if (action === 'delete') {
        await axios.delete(`${API}/payment-entries/${entryId}`);
      } else if (action === 'validate') {
        await axios.post(`${API}/payment-entries/${entryId}/validate`);
      }
      fetchEntries();
    } catch (error) {
      console.error('Failed to perform action:', error);
      alert('Erreur lors de l\'opération');
    }
    
    setConfirmModal({ isOpen: false, action: null, entryId: null });
  };

  const handleRelance = async (entryId, note = '') => {
    try {
      await axios.post(`${API}/reminders`, {
        payment_entry_id: entryId,
        note: note || undefined
      });
      // Show success with custom modal - no alert()
    } catch (error) {
      console.error('Failed to create relance:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Entrées de paiement en attente</h2>
        <CreateEntryDialog companies={companies} onSuccess={fetchEntries} />
      </div>
      
      {/* Filter Section */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                type="text"
                placeholder="Entreprise, client, facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Toutes les entreprises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entreprises</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Date début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Date fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          {(searchTerm || selectedCompany !== 'all' || startDate || endDate) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {filteredEntries.length} entrée(s) trouvée(s) sur {entries.length}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCompany('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Entreprise</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>N° Facture</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Créé par</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{entry.company_name}</TableCell>
                  <TableCell>{entry.client_name}</TableCell>
                  <TableCell>{entry.invoice_number}</TableCell>
                  <TableCell>{entry.amount.toLocaleString()} €</TableCell>
                  <TableCell>{entry.created_by_name}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditEntryDialog entry={entry} companies={companies} onSuccess={fetchEntries} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {(user.role === 'manager' || user.role === 'admin') && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleValidate(entry.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                          <RelanceDialog
                            entryId={entry.id}
                            onSubmit={(note) => handleRelance(entry.id, note)}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Bell className="h-4 w-4 mr-1" />
                                Relance
                              </Button>
                            }
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Aucune entrée en attente. Toutes les entrées ont été validées.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, entryId: null })}
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}

function ValidatedEntriesTab({ user }) {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Promise.all([fetchValidatedEntries(), fetchCompanies()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, selectedCompany, startDate, endDate]);

  const applyFilters = () => {
    let filtered = [...entries];

    // Text search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.validated_by && entry.validated_by.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Company filter
    if (selectedCompany && selectedCompany !== 'all') {
      filtered = filtered.filter(entry => entry.company_id === selectedCompany);
    }

    // Date range filter (validation date)
    if (startDate) {
      filtered = filtered.filter(entry => new Date(entry.validated_at) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(entry => new Date(entry.validated_at) <= new Date(endDate + 'T23:59:59'));
    }

    setFilteredEntries(filtered);
  };

  const fetchValidatedEntries = async () => {
    try {
      const response = await axios.get(`${API}/payment-entries?validated_only=true`);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch validated entries:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Entrées validées</h2>
      
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Entreprise</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>N° Facture</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Créé par</TableHead>
                <TableHead>Validé par</TableHead>
                <TableHead>Validé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{entry.company_name}</TableCell>
                  <TableCell>{entry.client_name}</TableCell>
                  <TableCell>{entry.invoice_number}</TableCell>
                  <TableCell>{entry.amount.toLocaleString()} €</TableCell>
                  <TableCell>{entry.created_by_name}</TableCell>
                  <TableCell>{entry.validated_by_name}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(entry.validated_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Aucune entrée validée trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsTab({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchCompanies(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Chargement...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-slate-500">Erreur lors du chargement des analyses</div>;
  }

  // Filter data based on selected filters
  const getFilteredData = () => {
    let data = { ...analytics };
    
    if (companyFilter !== 'all') {
      data.by_company = data.by_company.filter(item => item.name === companyFilter);
    }
    
    if (employeeFilter !== 'all') {
      data.by_employee = data.by_employee.filter(item => item.name === employeeFilter);
    }
    
    return data;
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Tableau de bord analytique</h2>
        
        <div className="flex gap-4">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par entreprise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les entreprises</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.name}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par employé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les employés</SelectItem>
              {users.filter(u => u.role === 'employee').map((user) => (
                <SelectItem key={user.id} value={user.identifiant}>{user.identifiant}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total des entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{analytics.total_entries}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{analytics.validated_entries}</div>
            <div className="text-sm text-slate-600 mt-1">
              {analytics.total_entries > 0 ? Math.round((analytics.validated_entries / analytics.total_entries) * 100) : 0}% de validation
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-700 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{analytics.pending_entries}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-700">Montant total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {analytics.total_amount.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Analyse par entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredData.by_company.map((company, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{company.name}</div>
                    <div className="text-sm text-slate-600">
                      {company.validated}/{company.count} validées
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-900">{company.amount.toLocaleString()} €</div>
                    <div className="text-sm text-slate-600">
                      {company.count > 0 ? Math.round((company.validated / company.count) * 100) : 0}% validé
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Analyse par employé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredData.by_employee.map((employee, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{employee.name}</div>
                    <div className="text-sm text-slate-600">
                      {employee.count} entrées • {employee.validated} validées
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-900">{employee.amount.toLocaleString()} €</div>
                    <div className="text-sm text-slate-600">
                      {employee.count > 0 ? Math.round((employee.validated / employee.count) * 100) : 0}% validé
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Évolution dans le temps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.by_month
              .sort((a, b) => b.name.localeCompare(a.name))
              .slice(0, 6)
              .map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{month.name}</div>
                  <div className="text-sm text-slate-600">
                    {month.count} entrées • {month.validated} validées
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900">{month.amount.toLocaleString()} €</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${month.count > 0 ? (month.validated / month.count) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CompaniesTab({ user }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestion des entreprises</h2>
        <CreateCompanyDialog onSuccess={fetchCompanies} />
      </div>
      
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nom de l'entreprise</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(company.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <EditCompanyDialog company={company} onSuccess={fetchCompanies} />
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                    Aucune entreprise trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'employee': return 'Employé';
      default: return role;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestion des utilisateurs</h2>
        <CreateUserDialog onSuccess={fetchUsers} currentUserRole={user.role} />
      </div>
      
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Identifiant</TableHead>
                <TableHead>Nom d'affichage</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Créé le</TableHead>
                {user.role === 'admin' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{u.user_id}</TableCell>
                  <TableCell>{u.identifiant}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {getRoleLabel(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  {user.role === 'admin' && (
                    <TableCell>
                      <EditUserDialog user={u} onSuccess={fetchUsers} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateEntryDialog({ companies, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState({
    company_id: '',
    client_name: '',
    invoice_number: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/payment-entries`, {
        ...entry,
        amount: parseFloat(entry.amount)
      });
      setEntry({ company_id: '', client_name: '', invoice_number: '', amount: '' });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <DollarSign className="h-4 w-4 mr-2" />
          Nouvelle entrée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une entrée de paiement</DialogTitle>
          <DialogDescription>Ajouter une nouvelle entrée de paiement pour validation</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company">Entreprise</Label>
            <Select value={entry.company_id} onValueChange={(value) => setEntry(prev => ({ ...prev, company_id: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="client_name">Nom du client</Label>
            <Input
              id="client_name"
              value={entry.client_name}
              onChange={(e) => setEntry(prev => ({ ...prev, client_name: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="invoice_number">Numéro de facture</Label>
            <Input
              id="invoice_number"
              value={entry.invoice_number}
              onChange={(e) => setEntry(prev => ({ ...prev, invoice_number: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={entry.amount}
              onChange={(e) => setEntry(prev => ({ ...prev, amount: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {loading ? 'Création...' : 'Créer l\'entrée'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditEntryDialog({ entry, companies, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [entryData, setEntryData] = useState({
    company_id: entry.company_id,
    client_name: entry.client_name,
    invoice_number: entry.invoice_number,
    amount: entry.amount.toString()
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API}/payment-entries/${entry.id}`, {
        ...entryData,
        amount: parseFloat(entryData.amount)
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to update entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'entrée de paiement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company">Entreprise</Label>
            <Select value={entryData.company_id} onValueChange={(value) => setEntryData(prev => ({ ...prev, company_id: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="client_name">Nom du client</Label>
            <Input
              id="client_name"
              value={entryData.client_name}
              onChange={(e) => setEntryData(prev => ({ ...prev, client_name: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="invoice_number">Numéro de facture</Label>
            <Input
              id="invoice_number"
              value={entryData.invoice_number}
              onChange={(e) => setEntryData(prev => ({ ...prev, invoice_number: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={entryData.amount}
              onChange={(e) => setEntryData(prev => ({ ...prev, amount: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RelanceDialog({ entryId, onSubmit, trigger }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [relances, setRelances] = useState([]);
  const [loadingRelances, setLoadingRelances] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  useEffect(() => {
    if (open) {
      fetchRelances();
    }
  }, [open, entryId]);

  const fetchRelances = async () => {
    setLoadingRelances(true);
    try {
      const response = await axios.get(`${API}/reminders/${entryId}`);
      setRelances(response.data);
    } catch (error) {
      console.error('Failed to fetch relances:', error);
    } finally {
      setLoadingRelances(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: 'Enregistrer la relance',
      message: note ? 'Êtes-vous sûr de vouloir enregistrer cette relance avec la note ?' : 'Êtes-vous sûr de vouloir enregistrer cette relance ?',
      type: 'success'
    });
  };

  const confirmRelance = async () => {
    setLoading(true);
    setConfirmModal({ isOpen: false });

    try {
      await onSubmit(note);
      setNote('');
      fetchRelances(); // Refresh relances after adding new one
    } catch (error) {
      console.error('Failed to send relance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Relances de suivi</DialogTitle>
            <DialogDescription>
              Historique des relances et ajout d'une nouvelle relance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Previous Relances */}
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Relances précédentes:</h4>
              {loadingRelances ? (
                <div className="text-sm text-slate-500">Chargement des relances...</div>
              ) : relances.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {relances.map((relance) => (
                    <div key={relance.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-blue-900">
                            {relance.triggered_by_name}
                          </div>
                          {relance.note && (
                            <div className="text-sm text-blue-800 mt-1">{relance.note}</div>
                          )}
                        </div>
                        <div className="text-xs text-blue-600">
                          {new Date(relance.triggered_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Aucune relance précédente</div>
              )}
            </div>

            {/* New Relance Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="note">Nouvelle relance (optionnel)</Label>
                <Textarea
                  id="note"
                  placeholder="Ex: Client contacté, en attente de confirmation bancaire..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  <Bell className="h-4 w-4 mr-2" />
                  {loading ? 'Enregistrement...' : 'Enregistrer la relance'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={confirmRelance}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </>
  );
}

function CreateUserDialog({ onSuccess, currentUserRole }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({
    identifiant: '',
    role: 'employee',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/users`, user);
      setUser({ identifiant: '', role: 'employee', password: '' });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Échec de la création de l\'utilisateur.');
    } finally {
      setLoading(false);
    }
  };

  const allowedRoles = currentUserRole === 'admin' 
    ? ['employee', 'manager', 'admin']
    : ['employee'];

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'employee': return 'Employé';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Users className="h-4 w-4 mr-2" />
          Créer un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>Un identifiant de connexion sera généré automatiquement</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifiant">Nom d'affichage</Label>
            <Input
              id="identifiant"
              value={user.identifiant}
              onChange={(e) => setUser(prev => ({ ...prev, identifiant: e.target.value }))}
              className="mt-2"
              placeholder="Nom complet de l'utilisateur"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Rôle</Label>
            <Select value={user.role} onValueChange={(value) => setUser(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={user.password}
              onChange={(e) => setUser(prev => ({ ...prev, password: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {loading ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState({
    identifiant: user.identifiant,
    password: '',
    role: user.role
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = { ...userData };
      if (!updateData.password) {
        delete updateData.password;
      }
      await axios.put(`${API}/users/${user.id}`, updateData);
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Échec de la modification de l\'utilisateur.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'employee': return 'Employé';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>Identifiant: {user.user_id}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifiant">Nom d'affichage</Label>
            <Input
              id="identifiant"
              value={userData.identifiant}
              onChange={(e) => setUserData(prev => ({ ...prev, identifiant: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Rôle</Label>
            <Select value={userData.role} onValueChange={(value) => setUserData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['employee', 'manager', 'admin'].map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password">Nouveau mot de passe (optionnel)</Label>
            <Input
              id="password"
              type="password"
              value={userData.password}
              onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
              className="mt-2"
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateCompanyDialog({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/companies`, { name });
      setName('');
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Building className="h-4 w-4 mr-2" />
          Créer une entreprise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle entreprise</DialogTitle>
          <DialogDescription>Ajouter une nouvelle entreprise au système</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de l'entreprise</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {loading ? 'Création...' : 'Créer l\'entreprise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCompanyDialog({ company, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(company.name);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API}/companies/${company.id}`, { name });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to update company:', error);
      alert('Échec de la modification de l\'entreprise.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'entreprise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de l'entreprise</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default App;