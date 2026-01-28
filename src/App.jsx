import { useState, useMemo, useEffect } from 'react'
import Selector from './components/Selector'
import ResultCard from './components/ResultCard'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import ProfileForm from './components/ProfileForm'
import ErrorBoundary from './components/ErrorBoundary'
import { fetchVehicleData } from './services/dataService'
import CourseScreen from './components/CourseScreen'
import { BookOpen, GraduationCap, MessageCircle, LogOut, ChevronLeft } from 'lucide-react';

function Dashboard({ logout, onBack }) {
  const [database, setDatabase] = useState([]); // Empty initially
  const [loading, setLoading] = useState(true);

  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedEngine, setSelectedEngine] = useState('')

  // FETCH DATA ON MOUNT
  useEffect(() => {
    async function loadData() {
      const data = await fetchVehicleData();
      if (data && data.length > 0) {
        setDatabase(data);
      } else {
        console.warn("No data loaded or empty sheet.");
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // 1. Get unique brands
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(database.map(item => item.brand))].filter(Boolean).sort();
    return uniqueBrands;
  }, [database]); // Depend on database

  // 2. Get models for selected brand
  const models = useMemo(() => {
    if (!selectedBrand) return [];
    return [...new Set(database
      .filter(item => item.brand === selectedBrand)
      .map(item => item.model)
    )].filter(Boolean).sort();
  }, [selectedBrand, database]);

  // 3. Get years for selected brand & model
  const years = useMemo(() => {
    if (!selectedBrand || !selectedModel) return [];
    return [...new Set(database
      .filter(item => item.brand === selectedBrand && item.model === selectedModel)
      .map(item => item.year)
    )].filter(Boolean).sort().reverse();
  }, [selectedBrand, selectedModel, database]);

  // 4. Get engines for selected brand & model & year
  const engines = useMemo(() => {
    if (!selectedBrand || !selectedModel || !selectedYear) return [];
    return [...new Set(database
      .filter(item => item.brand === selectedBrand && item.model === selectedModel && item.year === selectedYear)
      .map(item => item.engine)
    )].filter(Boolean).sort();
  }, [selectedBrand, selectedModel, selectedYear, database]);

  // 5. Find the final result
  const result = useMemo(() => {
    if (!selectedBrand || !selectedModel || !selectedYear || !selectedEngine) return null;
    return database.find(item =>
      item.brand === selectedBrand &&
      item.model === selectedModel &&
      item.year === selectedYear &&
      item.engine === selectedEngine
    );
  }, [selectedBrand, selectedModel, selectedYear, selectedEngine, database]);

  const handleBrandChange = (val) => {
    setSelectedBrand(val);
    setSelectedModel('');
    setSelectedYear('');
    setSelectedEngine('');
  };

  const handleModelChange = (val) => {
    setSelectedModel(val);
    setSelectedYear('');
    setSelectedEngine('');
  };

  const handleYearChange = (val) => {
    setSelectedYear(val);
    setSelectedEngine('');
  };

  const handleEngineChange = (val) => {
    setSelectedEngine(val);
  };

  return (
    <div className="container">
      <div className="app-header">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
          <button onClick={onBack} className="btn-outlined" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
            <ChevronLeft size={18} /> Voltar
          </button>

          <button onClick={logout} className="btn-outlined" style={{ padding: '8px 12px', color: 'var(--koche-red)', borderColor: 'var(--koche-red)' }}>
            <LogOut size={18} /> Sair
          </button>
        </div>

        <img src="images/brand/logo-red.svg" alt="Kóche" className="app-logo" />
        <h1 style={{ color: 'var(--koche-blue)' }}>Guia de Transmissão</h1>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <p>Carregando base de dados...</p>
          </div>
        ) : (
          <div className="selectors-grid">
            <Selector
              label="Marca"
              value={selectedBrand}
              options={brands}
              onChange={handleBrandChange}
              placeholder="Selecione a Marca"
            />

            <Selector
              label="Modelo"
              value={selectedModel}
              options={models}
              onChange={handleModelChange}
              disabled={!selectedBrand}
              placeholder="Selecione o Modelo"
            />

            <Selector
              label="Ano"
              value={selectedYear}
              options={years}
              onChange={handleYearChange}
              disabled={!selectedModel}
              placeholder="Selecione o Ano"
            />

            <Selector
              label="Motor"
              value={selectedEngine}
              options={engines}
              onChange={handleEngineChange}
              disabled={!selectedYear}
              placeholder="Selecione o Motor"
            />
          </div>
        )}
      </div>

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <ResultCard data={result} exact={true} />
        </div>
      )}

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} App Kóche. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

function WelcomeScreen({ onStartGuide, onStartCourse }) {
  const handleContact = () => {
    const phone = "551938623362";
    const text = encodeURIComponent("Estou no aplicativo e gostaria de saber mais");
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <img
        src="images/brand/logo-red.svg"
        alt="Kóche"
        className="app-logo"
        style={{ maxWidth: '280px', marginBottom: '3rem' }}
      />

      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', textTransform: 'uppercase', color: 'var(--koche-blue)' }}>Bem-vindo</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* BOTÃO GUIA (Primary Action) */}
          <button
            onClick={onStartGuide}
            className="btn-primary" // Uses Blue
            style={{ padding: '1.25rem' }}
          >
            <BookOpen size={24} /> Acessar Guia
          </button>

          {/* BOTÃO CURSO (Secondary Action) */}
          <button
            onClick={onStartCourse}
            className="btn-elevated" // White elevated
            style={{ padding: '1.25rem' }}
          >
            <GraduationCap size={24} /> Acessar Curso
          </button>

          {/* Spacer */}
          <div style={{ height: '0.5rem' }}></div>

          {/* BOTÃO CONTATO (Support) */}
          <button
            onClick={handleContact}
            className="btn-outlined"
            style={{ justifyContent: 'center' }}
          >
            <MessageCircle size={20} color="#25D366" /> Entrar em Contato
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, userProfile, logout } = useAuth();
  const [currentView, setCurrentView] = useState('welcome'); // 'welcome' | 'guide' | 'course'

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
      />
    );
  }

  if (currentView === 'course') {
    return <CourseScreen onBack={() => setCurrentView('welcome')} />;
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
