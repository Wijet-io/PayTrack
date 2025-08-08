import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Textarea } from './components/ui/textarea';
import { Alert, AlertDescription } from './components/ui/alert';
import { 
  LogIn, 
  LogOut, 
  Users, 
  Building, 
  DollarSign, 
  Bell, 
  Settings, 
  Eye, 
  Trash2, 
  CheckCircle, 
  Edit,
  BarChart3,
  TrendingUp,
  Calendar,
  UserCheck,
  Building2
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      handleLogout();
    } finally {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg font-medium">Chargement...</div>
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <div className="text-white font-bold text-xl">PT</div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">PayTrack</CardTitle>
          <CardDescription className="text-slate-600">Connectez-vous pour gérer les paiements</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="user_id">Code utilisateur</Label>
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
  const [activeTab, setActiveTab] = useState(
    user.role === 'admin' ? 'all-entries' : 'all-entries'
  );

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
          <TabsList className="grid grid-cols-6 w-full max-w-4xl mb-8">
            <TabsTrigger value="all-entries" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Toutes les entrées
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
            {user.role === 'admin' && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all-entries">
            <AllEntriesTab user={user} />
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
          
          <TabsContent value="settings">
            <SettingsTab user={user} />
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
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <div className="text-white font-bold text-lg">PT</div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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

function AllEntriesTab({ user }) {
  const [entries, setEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchEntries(), fetchCompanies()]).finally(() => setLoading(false));
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API}/payment-entries`);
      setEntries(response.data);
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

  const handleDelete = async (entryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;
    
    try {
      await axios.delete(`${API}/payment-entries/${entryId}`);
      fetchEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Impossible de supprimer cette entrée. Elle pourrait déjà être validée.');
    }
  };

  const handleValidate = async (entryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir valider cette entrée de paiement ?')) return;
    
    try {
      await axios.post(`${API}/payment-entries/${entryId}/validate`);
      fetchEntries();
    } catch (error) {
      console.error('Failed to validate entry:', error);
    }
  };

  const handleReminder = async (entryId, note = '') => {
    try {
      await axios.post(`${API}/reminders`, {
        payment_entry_id: entryId,
        note: note || undefined
      });
      alert('Rappel envoyé avec succès');
    } catch (error) {
      console.error('Failed to create reminder:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Chargement...</div>;
  }

  const pendingEntries = entries.filter(e => !e.is_validated);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Toutes les entrées de paiement</h2>
        <div className="flex gap-3">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {entries.length} total
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1 border-yellow-300 text-yellow-700">
            {pendingEntries.length} en attente
          </Badge>
          <CreateEntryDialog companies={companies} onSuccess={fetchEntries} />
        </div>
      </div>
      
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
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    {entry.is_validated ? (
                      <Badge className="bg-green-100 text-green-800">Validé</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-300 text-yellow-700">En attente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!entry.is_validated && (
                        <>
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
                              <ReminderDialog
                                onSubmit={(note) => handleReminder(entry.id, note)}
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <Bell className="h-4 w-4 mr-1" />
                                    Rappel
                                  </Button>
                                }
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Aucune entrée de paiement trouvée. Créez votre première entrée pour commencer.
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

function ValidatedEntriesTab({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchValidatedEntries();
  }, []);

  const fetchValidatedEntries = async () => {
    try {
      const response = await axios.get(`${API}/payment-entries?validated_only=true`);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch validated entries:', error);
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
        <h2 className="text-2xl font-bold text-slate-900">Entrées validées</h2>
        <Badge className="text-lg px-3 py-1 bg-green-100 text-green-800">
          {entries.length} validées
        </Badge>
      </div>
      
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
  const [viewMode, setViewMode] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Chargement...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-slate-500">Erreur lors du chargement des analyses</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Tableau de bord analytique</h2>
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Vue d'ensemble</SelectItem>
            <SelectItem value="company">Par entreprise</SelectItem>
            <SelectItem value="employee">Par employé</SelectItem>
            <SelectItem value="time">Par mois</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-700">Montant validé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {analytics.validated_amount.toLocaleString()} €
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-yellow-700">Montant en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {analytics.pending_amount.toLocaleString()} €
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'company' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Analyse par entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.by_company.map((company, index) => (
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
                      {Math.round((company.validated / company.count) * 100)}% validé
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'employee' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Analyse par employé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.by_employee.map((employee, index) => (
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
                      {Math.round((employee.validated / employee.count) * 100)}% validé
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'time' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Analyse par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.by_month
                .sort((a, b) => b.name.localeCompare(a.name))
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
                    <div className="text-sm text-slate-600">
                      {Math.round((month.validated / month.count) * 100)}% validé
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(company.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-slate-500">
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
                <TableHead>Code utilisateur</TableHead>
                <TableHead>Identifiant</TableHead>
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

function SettingsTab({ user }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Paramètres système</h2>
      
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
          <CardDescription>Configuration et informations sur PayTrack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Version</span>
            <Badge variant="outline">1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Environnement</span>
            <Badge variant="outline">Production</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Base de données</span>
            <Badge className="bg-green-100 text-green-800">Connectée</Badge>
          </div>
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

function ReminderDialog({ onSubmit, trigger }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(note);
      setNote('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer un rappel de suivi</DialogTitle>
          <DialogDescription>
            Ajouter une note optionnelle pour suivre ce rappel
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="note">Note (optionnel)</Label>
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
              {loading ? 'Envoi...' : 'Envoyer le rappel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
          <DialogDescription>Ajouter un nouvel utilisateur au système</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifiant">Identifiant</Label>
            <Input
              id="identifiant"
              value={user.identifiant}
              onChange={(e) => setUser(prev => ({ ...prev, identifiant: e.target.value }))}
              className="mt-2"
              placeholder="Nom d'affichage de l'utilisateur"
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
          <DialogDescription>Code: {user.user_id}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifiant">Identifiant</Label>
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

export default App;