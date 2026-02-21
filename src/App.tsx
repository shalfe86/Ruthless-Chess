import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { createVisit, updateVisit } from './lib/database';

// Lazy Load Secondary Pages
const GamePage = lazy(() => import('./pages/GamePage').then(module => ({ default: module.GamePage })));

// Loading Component
const LoadingScreen = () => (
  <div style={{ height: '100vh', width: '100vw', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#dc2626', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>
      INITIALIZING...
    </div>
  </div>
);

function App() {
  const [visitId, setVisitId] = useState<string | null>(null);

  useEffect(() => {
    let visitorId = localStorage.getItem('ruthless_visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('ruthless_visitor_id', visitorId);
    }

    // Create the visit record
    createVisit({ visitor_id: visitorId }).then(data => {
      if (data) {
        setVisitId(data.id);
      }
    });
  }, []);

  // Heartbeat every 30 seconds
  useEffect(() => {
    if (!visitId) return;

    const interval = setInterval(() => {
      updateVisit(visitId, { last_active_at: new Date().toISOString() });
    }, 30000);

    return () => clearInterval(interval);
  }, [visitId]);

  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
