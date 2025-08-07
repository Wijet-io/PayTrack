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
import { LogIn, LogOut, Users, Building, DollarSign, Bell, Settings, Eye, Trash2, CheckCircle } from 'lucide-react';
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
        <div className="text-slate-600 text-lg font-medium">Loading...</div>
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
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const initializeAdmin = async () => {
    try {
      const response = await axios.post(`${API}/init-admin`);
      alert(response.data.message + (response.data.user_id ? ` - User ID: ${response.data.user_id}, Password: ${response.data.password}` : ''));
    } catch (error) {
      console.error('Failed to initialize admin:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Payment Tracker</CardTitle>
          <CardDescription className="text-slate-600">Sign in to manage payment entries</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                type="text"
                value={credentials.user_id}
                onChange={(e) => setCredentials(prev => ({ ...prev, user_id: e.target.value }))}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
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
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={initializeAdmin} 
              className="w-full text-sm text-slate-600"
            >
              Initialize Default Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState(
    user.role === 'employee' ? 'entries' : 
    user.role === 'manager' ? 'validation' : 'analytics'
  );

  return (
    <div className="min-h-screen">
      <Header user={user} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-slate-600 mt-2">
            {user.role === 'employee' && 'Manage your payment entries'}
            {user.role === 'manager' && 'Validate payments and manage reminders'}
            {user.role === 'admin' && 'Full system administration'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-8">
            {(user.role === 'employee' || user.role === 'manager' || user.role === 'admin') && (
              <TabsTrigger value="entries" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                My Entries
              </TabsTrigger>
            )}
            {(user.role === 'manager' || user.role === 'admin') && (
              <TabsTrigger value="validation" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Validation
              </TabsTrigger>
            )}
            {user.role === 'admin' && (
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            )}
            {(user.role === 'manager' || user.role === 'admin') && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="entries">
            <PaymentEntriesTab user={user} />
          </TabsContent>
          
          <TabsContent value="validation">
            <ValidationTab user={user} />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab user={user} />
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
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Payment Tracker</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="capitalize">
            {user.role}
          </Badge>
          <span className="text-slate-700 font-medium">{user.name}</span>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

function PaymentEntriesTab({ user }) {
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
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await axios.delete(`${API}/payment-entries/${entryId}`);
      fetchEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete entry. It may already be validated.');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Payment Entries</h2>
        <CreateEntryDialog companies={companies} onSuccess={fetchEntries} />
      </div>
      
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Company</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{entry.company_name}</TableCell>
                  <TableCell>{entry.client_name}</TableCell>
                  <TableCell>{entry.invoice_number}</TableCell>
                  <TableCell>${entry.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {entry.is_validated ? (
                      <Badge className="bg-green-100 text-green-800">Validated</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {!entry.is_validated && entry.created_by === user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No payment entries found. Create your first entry to get started.
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
        <Button className="bg-slate-900 hover:bg-slate-800">
          <DollarSign className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment Entry</DialogTitle>
          <DialogDescription>Add a new payment entry for validation</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company">Company</Label>
            <Select value={entry.company_id} onValueChange={(value) => setEntry(prev => ({ ...prev, company_id: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="client_name">Client Name</Label>
            <Input
              id="client_name"
              value={entry.client_name}
              onChange={(e) => setEntry(prev => ({ ...prev, client_name: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="invoice_number">Invoice Number</Label>
            <Input
              id="invoice_number"
              value={entry.invoice_number}
              onChange={(e) => setEntry(prev => ({ ...prev, invoice_number: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
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
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? 'Creating...' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ValidationTab({ user }) {
  const [pendingEntries, setPendingEntries] = useState([]);
  const [reminders, setReminders] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const fetchPendingEntries = async () => {
    try {
      const response = await axios.get(`${API}/payment-entries/pending`);
      setPendingEntries(response.data);
      // Fetch reminders for each entry
      const reminderPromises = response.data.map(entry => fetchReminders(entry.id));
      await Promise.all(reminderPromises);
    } catch (error) {
      console.error('Failed to fetch pending entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async (entryId) => {
    try {
      const response = await axios.get(`${API}/reminders/${entryId}`);
      setReminders(prev => ({ ...prev, [entryId]: response.data }));
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    }
  };

  const handleValidate = async (entryId) => {
    if (!window.confirm('Are you sure you want to validate this payment entry?')) return;
    
    try {
      await axios.post(`${API}/payment-entries/${entryId}/validate`);
      fetchPendingEntries();
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
      fetchReminders(entryId);
    } catch (error) {
      console.error('Failed to create reminder:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Pending Validations</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {pendingEntries.length} pending
        </Badge>
      </div>

      <div className="grid gap-6">
        {pendingEntries.map((entry) => (
          <Card key={entry.id} className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{entry.company_name}</CardTitle>
                  <CardDescription>
                    Client: {entry.client_name} • Invoice: {entry.invoice_number}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    ${entry.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">
                    By {entry.created_by_name} on {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Reminders */}
                {reminders[entry.id] && reminders[entry.id].length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Previous Reminders:</h4>
                    <div className="space-y-2">
                      {reminders[entry.id].map((reminder) => (
                        <div key={reminder.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium text-blue-900">
                                {reminder.triggered_by_name}
                              </div>
                              {reminder.note && (
                                <div className="text-sm text-blue-800 mt-1">{reminder.note}</div>
                              )}
                            </div>
                            <div className="text-xs text-blue-600">
                              {new Date(reminder.triggered_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleValidate(entry.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate Payment
                  </Button>
                  <ReminderDialog
                    onSubmit={(note) => handleReminder(entry.id, note)}
                    trigger={
                      <Button variant="outline">
                        <Bell className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {pendingEntries.length === 0 && (
          <Card className="shadow-sm border-slate-200">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">All caught up!</h3>
              <p className="text-slate-600">No payment entries pending validation.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
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
          <DialogTitle>Send Follow-up Reminder</DialogTitle>
          <DialogDescription>
            Add an optional note to track this reminder
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="e.g., Called client, waiting for bank confirmation..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              <Bell className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AnalyticsTab({ user }) {
  const [stats, setStats] = useState({
    totalEntries: 0,
    validatedEntries: 0,
    pendingEntries: 0,
    totalAmount: 0,
    validatedAmount: 0
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/payment-entries`);
      const allEntries = response.data;
      setEntries(allEntries);

      const totalEntries = allEntries.length;
      const validatedEntries = allEntries.filter(e => e.is_validated).length;
      const pendingEntries = totalEntries - validatedEntries;
      const totalAmount = allEntries.reduce((sum, e) => sum + e.amount, 0);
      const validatedAmount = allEntries.filter(e => e.is_validated).reduce((sum, e) => sum + e.amount, 0);

      setStats({
        totalEntries,
        validatedEntries,
        pendingEntries,
        totalAmount,
        validatedAmount
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-700">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalEntries}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700">Validated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.validatedEntries}</div>
            <div className="text-sm text-slate-600 mt-1">
              {stats.totalEntries > 0 ? Math.round((stats.validatedEntries / stats.totalEntries) * 100) : 0}% validation rate
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-700">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingEntries}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-700">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              ${stats.totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700">Validated Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${stats.validatedAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-700">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              ${(stats.totalAmount - stats.validatedAmount).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{entry.client_name}</div>
                  <div className="text-sm text-slate-600">
                    {entry.company_name} • #{entry.invoice_number}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900">${entry.amount.toLocaleString()}</div>
                  <div className="text-sm">
                    {entry.is_validated ? (
                      <Badge className="bg-green-100 text-green-800">Validated</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>
                    )}
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

function SettingsTab({ user }) {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCompanies(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

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
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building className="h-4 w-4 mr-2" />
            Companies
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-900">User Management</h3>
            <CreateUserDialog onSuccess={fetchUsers} currentUserRole={user.role} />
          </div>
          
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{u.user_id}</TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="companies" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-900">Company Management</h3>
            {user.role === 'admin' && (
              <CreateCompanyDialog onSuccess={fetchCompanies} />
            )}
          </div>
          
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Company Name</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(company.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateUserDialog({ onSuccess, currentUserRole }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({
    user_id: '',
    name: '',
    role: 'employee',
    password: '',
    company_id: ''
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/users`, user);
      setUser({ user_id: '', name: '', role: 'employee', password: '', company_id: '' });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. User ID might already exist.');
    } finally {
      setLoading(false);
    }
  };

  const allowedRoles = currentUserRole === 'admin' 
    ? ['employee', 'manager', 'admin']
    : ['employee'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800">
          <Users className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new user to the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_id">User ID</Label>
            <Input
              id="user_id"
              value={user.user_id}
              onChange={(e) => setUser(prev => ({ ...prev, user_id: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={user.name}
              onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={user.role} onValueChange={(value) => setUser(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={user.password}
              onChange={(e) => setUser(prev => ({ ...prev, password: e.target.value }))}
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label htmlFor="company">Company (Optional)</Label>
            <Select value={user.company_id} onValueChange={(value) => setUser(prev => ({ ...prev, company_id: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? 'Creating...' : 'Create User'}
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
        <Button className="bg-slate-900 hover:bg-slate-800">
          <Building className="h-4 w-4 mr-2" />
          Create Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>Add a new company to the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default App;