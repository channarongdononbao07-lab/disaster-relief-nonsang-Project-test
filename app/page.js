'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppHeader from '../components/AppHeader';
import { ToastProvider } from '../components/Toast';
import HomePage from './pages/HomePage';

function PageLoadingSkeleton() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
      <div
        className="spinner"
        style={{
          margin: '0 auto 16px',
          width: 36,
          height: 36,
          borderColor: 'rgba(234, 88, 12, 0.2)',
          borderTopColor: 'var(--primary-600)',
        }}
      ></div>
      <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>กำลังโหลดหน้าจอ...</p>
    </div>
  );
}

// Dynamically code-split secondary pages so initial bundle is super lightweight & loads instantly
const NewRequestPage = dynamic(() => import('./pages/NewRequestPage'), {
  loading: () => <PageLoadingSkeleton />,
});

const RegistryPage = dynamic(() => import('./pages/RegistryPage'), {
  loading: () => <PageLoadingSkeleton />,
});

const RequestDetailPage = dynamic(() => import('./pages/RequestDetailPage'), {
  loading: () => <PageLoadingSkeleton />,
});

const LoginPage = dynamic(() => import('./pages/LoginPage'), {
  loading: () => <PageLoadingSkeleton />,
});

const AdminPage = dynamic(() => import('./pages/AdminPage'), {
  loading: () => <PageLoadingSkeleton />,
});

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [officerUser, setOfficerUser] = useState(null);

  useEffect(() => {
    // Check saved officer login session from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('disaster_officer_user');
      if (saved) {
        try {
          setOfficerUser(JSON.parse(saved));
        } catch (e) {
          localStorage.removeItem('disaster_officer_user');
        }
      }

      // Prefetch heavy pages in background idle time for zero-latency clicks
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          import('./pages/NewRequestPage');
          import('./pages/RegistryPage');
        });
      } else {
        setTimeout(() => {
          import('./pages/NewRequestPage');
          import('./pages/RegistryPage');
        }, 1500);
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setOfficerUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('disaster_officer_user', JSON.stringify(user));
    }
    if (user.role === 'superadmin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('registry');
    }
  };

  const handleLogout = () => {
    setOfficerUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('disaster_officer_user');
    }
    setCurrentPage('home');
  };

  const handleNavigate = useCallback((page, data) => {
    if (page === 'request-detail' && data) {
      setSelectedRequestId(data);
    }
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} officerUser={officerUser} />;
      case 'new-request':
        return <NewRequestPage onNavigate={handleNavigate} officerUser={officerUser} />;
      case 'registry':
        return <RegistryPage onNavigate={handleNavigate} officerUser={officerUser} />;
      case 'request-detail':
        return <RequestDetailPage requestId={selectedRequestId} onNavigate={handleNavigate} officerUser={officerUser} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminPage officerUser={officerUser} onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} officerUser={officerUser} />;
    }
  };

  return (
    <ToastProvider>
      <div className="app-container">
        <AppHeader
          currentPage={currentPage}
          onNavigate={handleNavigate}
          officerUser={officerUser}
          onLogout={handleLogout}
        />
        <main>
          {renderPage()}
        </main>
      </div>
    </ToastProvider>
  );
}
