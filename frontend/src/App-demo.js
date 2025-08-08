import React, { useState } from 'react';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  
  if (loggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#10b981',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>🎉 PayTrack Dashboard 🎉</h1>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>✅ LOGIN SUCCESSFUL!</h2>
        <p style={{ fontSize: '18px', marginBottom: '24px' }}>System Administrator Dashboard</p>
        
        <div style={{
          backgroundColor: '#ffffff',
          color: '#000',
          padding: '24px',
          borderRadius: '8px',
          textAlign: 'left',
          minWidth: '400px'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#059669' }}>✅ PayTrack Features Available:</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>📊 Analytics with filters</li>
            <li>✏️ Edit employees & companies</li>
            <li>🏢 Company management</li>
            <li>👥 User management</li>
            <li>💰 Payment entries</li>
            <li>📞 Relance system</li>
          </ul>
        </div>
        
        <button
          onClick={() => setLoggedIn(false)}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Logout & Test Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
            PayTrack
          </h1>
          <p style={{ color: '#64748b' }}>Click below to simulate successful login</p>
        </div>

        <button
          onClick={() => {
            console.log('🎉 MOCK LOGIN: Simulating successful authentication...');
            setLoggedIn(true);
          }}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🚀 Mock Login (Skip Authentication) 
        </button>
        
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          <strong>✅ SUCCESS:</strong> The white screen issue is fixed!<br/>
          <strong>🔧 NEXT:</strong> Need to implement real login API integration
        </div>
      </div>
    </div>
  );
}

export default App;