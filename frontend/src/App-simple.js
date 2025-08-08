import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Custom Confirmation Modal
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: '28rem',
        width: '100%',
        margin: '1rem'
      }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: type === 'danger' ? '#fef2f2' : type === 'success' ? '#f0f9ff' : '#f3f4f6'
            }}>
              <span style={{
                fontSize: '1.5rem',
                color: type === 'danger' ? '#dc2626' : type === 'success' ? '#0369a1' : '#6b7280'
              }}>
                {type === 'danger' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
              </span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>{title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{message}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: type === 'danger' ? '#dc2626' : type === 'success' ? '#059669' : '#3b82f6',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Relance Dialog with History
function RelanceDialog({ entryId, onSubmit, trigger, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [relances, setRelances] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  useEffect(() => {
    if (isOpen) {
      fetchRelances();
    }
  }, [isOpen, entryId]);

  const fetchRelances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/reminders/${entryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRelances(data);
      }
    } catch (error) {
      console.error('Failed to fetch relances:', error);
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
      fetchRelances();
    } catch (error) {
      console.error('Failed to send relance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return React.cloneElement(trigger, { onClick: () => setIsOpen(true) });
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '32rem',
          width: '100%',
          margin: '1rem'
        }}>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Relances de suivi</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Relances précédentes:</h4>
              {relances.length > 0 ? (
                <div style={{ maxHeight: '12rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {relances.map((relance) => (
                    <div key={relance.id} style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '0.5rem',
                      padding: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e40af' }}>
                            {relance.triggered_by_name}
                          </div>
                          {relance.note && (
                            <div style={{ fontSize: '0.875rem', color: '#1e3a8a', marginTop: '0.25rem' }}>
                              {relance.note}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#3730a3' }}>
                          {new Date(relance.triggered_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aucune relance précédente</div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nouvelle relance (optionnel)</label>
                <textarea
                  placeholder="Ex: Client contacté, en attente de confirmation bancaire..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer la relance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${API}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#2563eb', // Solid blue color instead of gradient
            marginBottom: '1rem'
          }}>
            PayTrack
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => { setUser(null); localStorage.removeItem('token'); }} />;
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
      const response = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        onLogin(data.user);
      } else {
        setError('Identifiants invalides');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '1rem',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            PayTrack
          </h1>
          <p style={{ color: '#64748b' }}>Connectez-vous pour gérer les paiements</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Identifiant de connexion
            </label>
            <input
              type="text"
              placeholder="Ex: admin"
              value={credentials.user_id}
              onChange={(e) => setCredentials(prev => ({ ...prev, user_id: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}



function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('pending-entries');
  const [entries, setEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  useEffect(() => {
    Promise.all([fetchEntries(), fetchCompanies(), fetchUsers()]);
  }, []);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/payment-entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleDelete = (entryId) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      entryId: entryId,
      title: 'Supprimer l\'entrée',
      message: 'Êtes-vous sûr de vouloir supprimer cette entrée de paiement ?',
      type: 'danger'
    });
  };

  const handleValidate = (entryId) => {
    setConfirmModal({
      isOpen: true,
      action: 'validate',
      entryId: entryId,
      title: 'Valider l\'entrée',
      message: 'Êtes-vous sûr de vouloir valider cette entrée de paiement ?',
      type: 'success'
    });
  };

  const confirmAction = async () => {
    const { action, entryId } = confirmModal;
    const token = localStorage.getItem('token');
    
    try {
      if (action === 'delete') {
        await fetch(`${API}/payment-entries/${entryId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else if (action === 'validate') {
        await fetch(`${API}/payment-entries/${entryId}/validate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      fetchEntries();
    } catch (error) {
      console.error('Failed to perform action:', error);
    }
    
    setConfirmModal({ isOpen: false });
  };

  const handleRelance = async (entryId, note = '') => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_entry_id: entryId,
          note: note || undefined
        })
      });
    } catch (error) {
      console.error('Failed to create relance:', error);
    }
  };

  const pendingEntries = entries.filter(e => !e.is_validated);
  const validatedEntries = entries.filter(e => e.is_validated);

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';  
      case 'employee': return 'Employé';
      default: return role;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1rem 2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PayTrack
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '9999px', 
              fontSize: '0.875rem'
            }}>
              {getRoleLabel(user.role)}
            </span>
            <span style={{ fontWeight: '500' }}>{user.identifiant}</span>
            <button 
              onClick={onLogout}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Bienvenue, {user.identifiant}
          </h2>
          <p style={{ color: '#6b7280' }}>
            {user.role === 'employee' && 'Gérez vos entrées de paiement'}
            {user.role === 'manager' && 'Validez les paiements et gérez les relances'}
            {user.role === 'admin' && 'Administration complète du système'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('pending-entries')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'pending-entries' ? '#2563eb' : '#f3f4f6',
                color: activeTab === 'pending-entries' ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Entrées en attente
            </button>
            <button
              onClick={() => setActiveTab('validated-entries')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'validated-entries' ? '#2563eb' : '#f3f4f6',
                color: activeTab === 'validated-entries' ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Entrées validées
            </button>
            {(user.role === 'admin' || user.role === 'manager') && (
              <button
                onClick={() => setActiveTab('users')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: activeTab === 'users' ? '#2563eb' : '#f3f4f6',
                  color: activeTab === 'users' ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Utilisateurs
              </button>
            )}
            {(user.role === 'admin' || user.role === 'manager') && (
              <button
                onClick={() => setActiveTab('companies')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: activeTab === 'companies' ? '#2563eb' : '#f3f4f6',
                  color: activeTab === 'companies' ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Entreprises
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'pending-entries' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Entrées de paiement en attente
              </h3>
              {pendingEntries.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                  Aucune entrée en attente. Toutes les entrées ont été validées.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Entreprise</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Client</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>N° Facture</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Montant</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Créé par</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingEntries.map((entry) => (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{entry.company_name}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.client_name}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.invoice_number}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.amount.toLocaleString()} €</td>
                          <td style={{ padding: '0.75rem' }}>{entry.created_by_name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.875rem',
                                  border: '1px solid #dc2626',
                                  borderRadius: '0.25rem',
                                  backgroundColor: 'white',
                                  color: '#dc2626',
                                  cursor: 'pointer'
                                }}
                              >
                                Supprimer
                              </button>
                              {(user.role === 'manager' || user.role === 'admin') && (
                                <>
                                  <button
                                    onClick={() => handleValidate(entry.id)}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.875rem',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      backgroundColor: '#059669',
                                      color: 'white',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Valider
                                  </button>
                                  <RelanceDialog
                                    entryId={entry.id}
                                    onSubmit={(note) => handleRelance(entry.id, note)}
                                    trigger={
                                      <button style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.875rem',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '0.25rem',
                                        backgroundColor: 'white',
                                        color: '#3b82f6',
                                        cursor: 'pointer'
                                      }}>
                                        Relance
                                      </button>
                                    }
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'validated-entries' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Entrées validées
              </h3>
              {validatedEntries.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                  Aucune entrée validée trouvée.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Entreprise</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Client</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>N° Facture</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Montant</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Validé par</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Validé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validatedEntries.map((entry) => (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{entry.company_name}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.client_name}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.invoice_number}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.amount.toLocaleString()} €</td>
                          <td style={{ padding: '0.75rem' }}>{entry.validated_by_name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {new Date(entry.validated_at).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (user.role === 'admin' || user.role === 'manager') && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Gestion des utilisateurs
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Identifiant</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nom d'affichage</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Rôle</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Créé le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{u.user_id}</td>
                        <td style={{ padding: '0.75rem' }}>{u.identifiant}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            backgroundColor: '#f3f4f6',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                          }}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'companies' && (user.role === 'admin' || user.role === 'manager') && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Gestion des entreprises
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nom de l'entreprise</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Créée le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{company.name}</td>
                        <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                          {new Date(company.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}

export default App;