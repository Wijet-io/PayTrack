import React from 'react';

function App() {
  return React.createElement('div', {
    style: { 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1e3a8a', // Strong blue background
      color: '#ffffff', // White text
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    }
  }, 'PayTrack - React is Working! 🎉');
}

export default App;