import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import ProfileForm from './components/ProfileForm'
import ErrorBoundary from './components/ErrorBoundary'
import { fetchVehicleData } from './services/dataService'
import CourseScreen from './components/CourseScreen'
import AssistantScreen from './components/AssistantScreen';
import AdminScreen from './components/AdminScreen';
import Dashboard from './components/Dashboard';
import WelcomeScreen from './components/WelcomeScreen';

function AppContent() {
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('welcome'); // 'welcome' | 'guide' | 'course' | 'assistant' | 'admin'

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

  // GUARD: User must have profile data (phone)
  if (!userProfile?.phone) {
    console.log("Rendering ProfileForm", userProfile);
    return <ProfileForm />;
  }

  // ROUTING
  if (currentView === 'welcome') {
    return (
      <WelcomeScreen
        onStartGuide={() => setCurrentView('guide')}
        onStartCourse={() => setCurrentView('course')}
        onStartAssistant={() => setCurrentView('assistant')}
        onAdmin={() => setCurrentView('admin')}
        isAdmin={isAdmin}
      />
    );
  }

  if (currentView === 'course') {
    return <CourseScreen onBack={() => setCurrentView('welcome')} />;
  }

  if (currentView === 'assistant') {
    return <AssistantScreen onBack={() => setCurrentView('welcome')} database={database} />;
  }

  if (currentView === 'admin' && isAdmin) {
    return <AdminScreen onBack={() => setCurrentView('welcome')} />;
  }

  // Default: Guide (Dashboard)
  return <Dashboard logout={logout} onBack={() => setCurrentView('welcome')} />;
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
