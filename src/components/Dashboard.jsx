import { useState, useMemo, useEffect } from 'react';
import Selector from './Selector';
import ResultCard from './ResultCard';
import { fetchVehicleData } from '../services/dataService';
import { LogOut, ChevronLeft } from 'lucide-react';
import PropTypes from 'prop-types';

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
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>v1.3 (AI Assistant)</span>
            </footer>
        </div>
    )
}

Dashboard.propTypes = {
    logout: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
};

export default Dashboard;
