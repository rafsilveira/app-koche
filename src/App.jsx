import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import ProfileForm from './components/ProfileForm'
import ErrorBoundary from './components/ErrorBoundary'
import CourseScreen from './components/CourseScreen'
import LearningPlatformScreen from './components/LearningPlatformScreen'
import AssistantScreen from './components/AssistantScreen';
import AdminScreen from './components/AdminScreen';
import Dashboard from './components/Dashboard';
import WelcomeScreen from './components/WelcomeScreen';
import UserArea from './components/UserArea';

function AppContent() {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('welcome'); // 'welcome' | 'guide' | 'course' | 'learning-platform' | 'assistant' | 'admin' | 'profile'
  const [guidePrefill, setGuidePrefill] = useState(null);

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
          onStartGuide={() => {
            setGuidePrefill(null);
            setCurrentView('guide');
          }}
          onStartCourse={() => setCurrentView('course')}
          onStartLearningPlatform={() => setCurrentView('learning-platform')}
          onStartAssistant={() => setCurrentView('assistant')}
          onAdmin={() => setCurrentView('admin')}
          onProfile={() => setCurrentView('profile')}
        isAdmin={isAdmin}
      />
    );
  }

  if (currentView === 'course') {
    return <CourseScreen onBack={() => setCurrentView('welcome')} />;
  }

  if (currentView === 'learning-platform') {
    return <LearningPlatformScreen onBack={() => setCurrentView('welcome')} />;
  }

  if (currentView === 'assistant') {
    return (
      <AssistantScreen
        onBack={() => setCurrentView('welcome')}
        onOpenGuide={(guideAction) => {
          setGuidePrefill(guideAction);
          setCurrentView('guide');
        }}
      />
    );
  }

  if (currentView === 'admin' && isAdmin) {
    return <AdminScreen onBack={() => setCurrentView('welcome')} />;
  }

  if (currentView === 'profile') {
    return <UserArea onBack={() => setCurrentView('welcome')} />;
  }

  // Default: Guide (Dashboard)
  return <Dashboard onBack={() => setCurrentView('welcome')} initialSelection={guidePrefill} />;
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
