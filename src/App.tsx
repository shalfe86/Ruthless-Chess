import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';

// Lazy Load Secondary Pages
const GamePage = lazy(() => import('./pages/GamePage').then(module => ({ default: module.GamePage })));
const ArenaPage = lazy(() => import('./pages/ArenaPage'));
const PricingPage = lazy(() => import('./pages/PricingPage').then(module => ({ default: module.PricingPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(module => ({ default: module.SignupPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const PlayerDashboard = lazy(() => import('./pages/PlayerDashboard').then(module => ({ default: module.PlayerDashboard })));

// Loading Component
const LoadingScreen = () => (
  <div style={{ height: '100vh', width: '100vw', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#dc2626', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>
      INITIALIZING...
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/arena" element={<ArenaPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<PlayerDashboard />} />
          <Route path="/premium" element={<div style={{ padding: '2rem' }}><h1>Premium Payment Stub</h1></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
