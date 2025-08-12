import React from 'react';

function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🏠 Garage Sale Organizer</h1>
      <p>Admin interface is loading...</p>
      <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Quick Test</h2>
        <p>✅ React is working!</p>
        <p>✅ Frontend server is running!</p>
        <p>Next: We'll load the full interface once we fix the build issues.</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Available Endpoints:</h3>
        <ul>
          <li><strong>Backend API:</strong> <a href="http://localhost:3001/api/health">http://localhost:3001/api/health</a></li>
          <li><strong>Backend Home:</strong> <a href="http://localhost:3001/">http://localhost:3001/</a></li>
        </ul>
      </div>
    </div>
  );
}

export default App;