import { useState, useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import ProfileForm from './components/ProfileForm'
import ErrorBoundary from './components/ErrorBoundary'
import { fetchVehicleData } from './services/dataService'
import WelcomeScreen from './components/WelcomeScreen';

// Carregadas sob demanda: nenhuma delas aparece na primeira tela (Welcome),
// então não precisam entrar no bundle inicial. AssistantScreen em particular
// carrega o SDK do Gemini, que é pesado.
const CourseScreen = lazy(() => import('./components/CourseScreen'));
const AssistantScreen = lazy(() => import('./components/AssistantScreen'));
const AdminScreen = lazy(() => import('./components/AdminScreen'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const UserArea = lazy(() => import('./components/UserArea'));

function ViewLoading() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '50vh', color: 'var(--text-secondary)'
    }}>
      Carregando...
    </div>
  );
}

function AppContent() {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('welcome'); // 'welcome' | 'guide' | 'course' | 'assistant' | 'admin' | 'profile'

  // Also load database here to pass to Assistant? Or let Assistant fetch it?
  // Ideally, AssistantScreen fetches, but it's small enough to share if logical.

  const [database, setDatabase] = useState([]);
  useEffect(() => {
    fetchVehicleData().then(data => setDatabase(data));
  }, []);

  console.log("AppContent Render:", { currentUser, userProfile, currentView });

  // GUARD: Use must be logged in
  if (!currentUser) {
    console.log("Rendering Login");
    return <Login />;
  }

  // ROUTING
  let routedView;
  if (currentView === 'welcome') {
    routedView = (
      <WelcomeScreen
        onStartGuide={() => setCurrentView('guide')}
        onStartCourse={() => setCurrentView('course')}
        onStartAssistant={() => setCurrentView('assistant')}
        onAdmin={() => setCurrentView('admin')}
        onProfile={() => setCurrentView('profile')}
        isAdmin={isAdmin}
      />
    );
  } else if (currentView === 'course') {
    routedView = <CourseScreen onBack={() => setCurrentView('welcome')} />;
  } else if (currentView === 'assistant') {
    routedView = <AssistantScreen onBack={() => setCurrentView('welcome')} database={database} />;
  } else if (currentView === 'admin' && isAdmin) {
    routedView = <AdminScreen onBack={() => setCurrentView('welcome')} />;
  } else if (currentView === 'profile') {
    routedView = <UserArea onBack={() => setCurrentView('welcome')} />;
  } else {
    // Default: Guide (Dashboard)
    routedView = <Dashboard onBack={() => setCurrentView('welcome')} />;
  }

  // GUARD: User must have profile data (phone) — shown as a mandatory overlay
  // on top of the app instead of replacing it, so the user never feels like
  // they "lost access": the app is still there underneath, just blocked
  // until the phone is provided (required for every account, new or old).
  return (
    <>
      <Suspense fallback={<ViewLoading />}>
        {routedView}
      </Suspense>
      {!userProfile?.phone && <ProfileForm />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App
