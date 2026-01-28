import { useState, useMemo, useEffect } from 'react'
// import database from './data/database.json'
import Selector from './components/Selector'
import ResultCard from './components/ResultCard'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import ProfileForm from './components/ProfileForm'
import ErrorBoundary from './components/ErrorBoundary'
import { fetchVehicleData } from './services/dataService'
import CourseScreen from './components/CourseScreen'

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
      <div className="app-header" style={{ position: 'relative', width: '100%' }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '5px 10px',
            zIndex: 10
          }}
        >
          ← Voltar
        </button>

        <button
          onClick={logout}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            zIndex: 10
          }}
        >
          Sair
        </button>

        <img src="images/brand/logo-silver.svg" alt="Kóche" className="app-logo" />
        <h1>Guia de Transmissão</h1>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Atualizando base de dados...</p>
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
        <ResultCard data={result} exact={true} />
      )}

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} App Kóche. Todos os direitos reservados.</p>
        <img src="images/brand/logo-silver.svg" alt="Kóche" className="footer-logo" />
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
      <img src="images/brand/logo-silver.svg" alt="Kóche" className="app-logo" style={{ maxWidth: '300px', marginBottom: '3rem' }} />

      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Bem-vindo</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* BOTÃO GUIA */}
          <button
            onClick={onStartGuide}
            style={{
              background: 'var(--brand-silver)',
              color: 'var(--brand-dark)',
              border: 'none',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            📘 Acessar Guia
          </button>

          {/* BOTÃO CURSO */}
          <button
            onClick={onStartCourse}
            style={{
              background: 'transparent',
              border: '1px solid var(--brand-silver)',
              color: 'var(--brand-silver)',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            🎓 Acessar Curso
          </button>

          {/* BOTÃO CONTATO */}
          <button
            onClick={handleContact}
            style={{
              marginTop: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              textDecoration: 'underline'
            }}
          >
            <span>💬</span> Entrar em Contato
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
