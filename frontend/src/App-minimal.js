import React from 'react';

function App() {
  return React.createElement(
    'div',
    { 
      style: { 
        backgroundColor: '#ff0000',  // Red background  
        color: '#ffffff',            // White text
        padding: '20px',
        minHeight: '100vh',
        fontSize: '24px'
      }
    },
    'MINIMAL REACT TEST - PayTrack Debug'
  );
}

export default App;