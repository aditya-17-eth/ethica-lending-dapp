import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import { routes } from './utils/navigation';
import './App.css';

// Lazy load dashboard pages for code splitting
const LenderPage = lazy(() => import('./pages/LenderPage'));
const BorrowerPage = lazy(() => import('./pages/BorrowerPage'));
const LiquidationPage = lazy(() => import('./pages/LiquidationPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path={routes.home} element={<HomePage />} />
              <Route path={routes.lender} element={<LenderPage />} />
              <Route path={routes.borrower} element={<BorrowerPage />} />
              <Route path={routes.liquidation} element={<LiquidationPage />} />
              <Route path={routes.security} element={<SecurityPage />} />
              <Route path="*" element={<Navigate to={routes.home} replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;