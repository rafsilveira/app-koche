import { useState, useEffect } from 'react';
import { addVehicle, getAdmins, addAdmin, removeAdmin, searchUsers, getAllUsers, updateVehicle, deleteVehicle, fetchVehicleData } from '../services/dataService';
import { ChevronLeft, ChevronDown, ChevronUp, Database, Plus, Save, AlertTriangle, CheckCircle, Users, Trash, Download, Search, Edit, X } from 'lucide-react';

export default function AdminScreen({ onBack }) {

    // Form State
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        year: '',
        engine: '',
        transmission: '',
        fluid: '',
        fluid_capacities: {
            raw: '',
            partial_change: '',
            total_capacity: '',
            dialysis_capacity: ''
        },
        filter: '',
        connection: '',
        image_connector_url: '',
        image_location_url: '',
        videolink: ''
    });

    // TAB STATE
    const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'admins'

    const [activeSection, setActiveSection] = useState(null); // 'add' | 'edit'

    // ADMIN MANAGEMENT STATE
    const [admins, setAdmins] = useState([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    // User Search State
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    // Load Admins on mount or tab switch
    useEffect(() => {
        if (activeTab === 'admins') {
            fetchAdmins();
        }
    }, [activeTab]);

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const list = await getAdmins();
            setAdmins(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleAdminInputChange = async (e) => {
        const val = e.target.value;
        setNewAdminEmail(val);

        if (val.length >= 3) {
            setSearchingUsers(true);
            try {
                const results = await searchUsers(val);
                setUserSuggestions(results);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchingUsers(false);
            }
        } else {
            setUserSuggestions([]);
        }
    };

    const selectUser = (email) => {
        setNewAdminEmail(email);
        setUserSuggestions([]); // Close dropdown
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!newAdminEmail) return;
        setLoading(true);
        try {
            await addAdmin(newAdminEmail);
            setMsg({ type: 'success', text: `Admin ${newAdminEmail} adicionado!` });
            setNewAdminEmail('');
            fetchAdmins();
        } catch (error) {
            setMsg({ type: 'error', text: 'Erro ao adicionar admin.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAdmin = async (id, email) => {
        if (!confirm(`Remover acesso de ${email}?`)) return;
        try {
            await removeAdmin(id);
            fetchAdmins();
        } catch (error) {
            console.error(error);
        }
    };

    // Leads Export State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        // Load last export date from localStorage
        const lastExport = localStorage.getItem('koche_last_lead_export');
        if (lastExport) {
            // Default start date = last export date
            setStartDate(new Date(lastExport).toISOString().split('T')[0]);
        } else {
            // Default = 1st day of current month (or any reasonable default)
            // Let's leave empty to mean "All Time" initially, or maybe 1 month back like the user requested standard behavior.
            // User requested: "defaults to new leads" (since last export context).
            // If never exported, maybe show all? Let's leave clear so user decides or we can default to 30 days ago.
            // Let's default empty string (All Time) if no last export exists.
        }

        // Default end date = Today
        setEndDate(new Date().toISOString().split('T')[0]);
    }, []);

    const handleExportLeads = async () => {
        if (!confirm("Confirmar exportação dos leads filtrados?")) return;

        setLoading(true);
        try {
            // Convert strings to Date objects for Firestore (start at 00:00, end at 23:59)
            const start = startDate ? new Date(startDate + "T00:00:00") : null;
            const end = endDate ? new Date(endDate + "T23:59:59") : null;

            const users = await getAllUsers(start, end);

            if (users.length === 0) {
                setMsg({ type: 'error', text: 'Nenhum lead encontrado neste período.' });
                setLoading(false);
                return;
            }

            // CSV Header
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Nome,Email,Telefone,UID,Data Cadastro\n";

            users.forEach(u => {
                const phone = u.phone || "";
                const date = u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : "";
                const row = `"${u.name || ''}","${u.email || ''}","${phone}","${u.id}","${date}"`;
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `koche_leads_${startDate || 'inicio'}_ate_${endDate || 'hoje'}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Save this export date as the new "Last Export"
            localStorage.setItem('koche_last_lead_export', new Date().toISOString());

            setMsg({ type: 'success', text: `${users.length} leads exportados com sucesso!` });
        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: 'Erro ao exportar leads.' });
        } finally {
            setLoading(false);
        }
    };

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'success'|'error', text: '' }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };


    // --- EDIT VEHICLE LOGIC ---
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [searchVehicleQuery, setSearchVehicleQuery] = useState('');
    const [vehicleResults, setVehicleResults] = useState([]);
    const [isSearchingVehicles, setIsSearchingVehicles] = useState(false);

    // Search vehicles (client-side filtering for simplicity as we can fetch all or use existing search logic)
    // For admin, let's fetch all once and filter to avoid many reads, OR just search on demand.
    // Given 700 items, fetching all is fine.
    useEffect(() => {
        const doSearch = async () => {
            if (searchVehicleQuery.length < 2) {
                setVehicleResults([]);
                return;
            }
            setIsSearchingVehicles(true);
            // We reuse the main fetch which has cache
            const allVehicles = await fetchVehicleData();
            const lower = searchVehicleQuery.toLowerCase();
            const filtered = allVehicles.filter(v =>
                (v.brand && v.brand.toLowerCase().includes(lower)) ||
                (v.model && v.model.toLowerCase().includes(lower))
            ).slice(0, 50); // Limit to 50
            setVehicleResults(filtered);
            setIsSearchingVehicles(false);
        };
        const timeout = setTimeout(doSearch, 500);
        return () => clearTimeout(timeout);
    }, [searchVehicleQuery]);

    const startEditing = (vehicle) => {
        setEditingId(vehicle.id);
        // Populate form
        setFormData({
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            year: vehicle.year || '',
            engine: vehicle.engine || '',
            transmission: vehicle.transmission || '',
            fluid: vehicle.fluid || '',
            fluid_capacities: vehicle.fluid_capacities || { raw: '', partial_change: '', total_capacity: '', dialysis_capacity: '' },
            filter: vehicle.filter || '',
            connection: vehicle.connection || '',
            image_connector_url: vehicle.image_connector_url || '',
            image_location_url: vehicle.image_location_url || '',
            videolink: vehicle.videolink || ''
        });
        setVehicleResults([]);
        setSearchVehicleQuery('');
        setDeleteConfirm(false); // Reset delete confirm on new edit
        window.scrollTo({ top: document.getElementById('vehicle-form').offsetTop - 100, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setFormData({
            brand: '',
            model: '',
            year: '',
            engine: '',
            transmission: '',
            fluid: '',
            fluid_capacities: { raw: '', partial_change: '', total_capacity: '', dialysis_capacity: '' },
            filter: '',
            connection: '',
            image_connector_url: '',
            image_location_url: '',
            videolink: ''
        });
    };

    const handleDelete = async () => {
        if (!editingId) return;

        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }

        setLoading(true);
        try {
            await deleteVehicle(editingId);
            setMsg({ type: 'success', text: 'Veículo excluído com sucesso!' });
            cancelEditing();
        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Erro ao excluir. Tente novamente.' });
        } finally {
            setLoading(false);
            setDeleteConfirm(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        // Basic validation
        if (!formData.brand || !formData.model) {
            setMsg({ type: 'error', text: 'Marca e Modelo são obrigatórios.' });
            setLoading(false);
            return;
        }

        try {
            // Construct fluid_capacities raw text if empty
            let finalData = { ...formData };
            if (!finalData.fluid_capacities.raw) {
                finalData.fluid_capacities.raw = `Parcial(Carter): ${finalData.fluid_capacities.partial_change || '-'} LITROS\nTotal para Nível: ${finalData.fluid_capacities.total_capacity || '-'} LITROS\nDiálise: ${finalData.fluid_capacities.dialysis_capacity || '-'} LITROS`;
            }

            if (editingId) {
                await updateVehicle(editingId, finalData);
                setMsg({ type: 'success', text: 'Veículo atualizado com sucesso!' });
                setEditingId(null); // Exit edit mode? Or stay? Usually exit.
                cancelEditing();
            } else {
                await addVehicle(finalData);
                setMsg({ type: 'success', text: 'Veículo adicionado com sucesso!' });
                cancelEditing(); // Clears form
            }

        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Erro ao salvar. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    const renderVehicleForm = () => (
        <form id="vehicle-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '8px' }}>

            <div className="form-group">
                <label>Marca *</label>
                <input name="brand" value={formData.brand} onChange={handleChange} required placeholder="Ex: AUDI" className="admin-input" />
            </div>

            <div className="form-group">
                <label>Modelo *</label>
                <input name="model" value={formData.model} onChange={handleChange} required placeholder="Ex: A3" className="admin-input" />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Ano</label>
                    <input name="year" value={formData.year} onChange={handleChange} placeholder="Ex: 2015-2020" className="admin-input" />
                </div>
                <div className="form-group">
                    <label>Motor</label>
                    <input name="engine" value={formData.engine} onChange={handleChange} placeholder="Ex: 2.0 TFSI" className="admin-input" />
                </div>
            </div>

            <div className="form-group">
                <label>Transmissão</label>
                <input name="transmission" value={formData.transmission} onChange={handleChange} placeholder="Ex: DQ250" className="admin-input" />
            </div>

            <div className="form-group">
                <label>Fluido</label>
                <input name="fluid" value={formData.fluid} onChange={handleChange} placeholder="Especificação do fluido" className="admin-input" />
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Capacidades (Litros)</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>Parcial</label>
                        <input name="fluid_capacities.partial_change" value={formData.fluid_capacities.partial_change} onChange={handleChange} className="admin-input" />
                    </div>
                    <div className="form-group">
                        <label>Total</label>
                        <input name="fluid_capacities.total_capacity" value={formData.fluid_capacities.total_capacity} onChange={handleChange} className="admin-input" />
                    </div>
                    <div className="form-group">
                        <label>Diálise</label>
                        <input name="fluid_capacities.dialysis_capacity" value={formData.fluid_capacities.dialysis_capacity} onChange={handleChange} className="admin-input" />
                    </div>
                </div>
            </div>

            <div className="form-group">
                <label>Filtro</label>
                <textarea name="filter" value={formData.filter} onChange={handleChange} placeholder="Info do filtro" className="admin-input" rows="2" />
            </div>

            <div className="form-group">
                <label>Conexão</label>
                <input name="connection" value={formData.connection} onChange={handleChange} placeholder="Info da conexão" className="admin-input" />
            </div>

            <div className="form-group">
                <label>Link Imagem Conector (Google Drive)</label>
                <input name="image_connector_url" value={formData.image_connector_url} onChange={handleChange} className="admin-input" />
            </div>

            <div className="form-group">
                <label>Link Imagem Localização (Google Drive)</label>
                <input name="image_location_url" value={formData.image_location_url} onChange={handleChange} className="admin-input" />
            </div>

            <div className="form-group">
                <label>Link Vídeo (YouTube)</label>
                <input name="videolink" value={formData.videolink} onChange={handleChange} placeholder="https://youtube.com/..." className="admin-input" />
            </div>


            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, background: editingId ? 'var(--koche-red)' : '' }}>
                    {loading ? 'Salvando...' : editingId ? <><Save size={18} /> Atualizar Veículo</> : <><Plus size={18} /> Adicionar Veículo</>}
                </button>

                {editingId && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="btn-outlined"
                        style={{
                            borderColor: '#ff4444',
                            color: deleteConfirm ? '#fff' : '#ff4444',
                            background: deleteConfirm ? '#ff4444' : 'transparent',
                            flex: deleteConfirm ? 0.6 : 0.3,
                            transition: 'all 0.3s ease'
                        }}
                        onBlur={() => setTimeout(() => setDeleteConfirm(false), 200)} // Reset if clicked away
                    >
                        {deleteConfirm ? 'Confirmar Exclusão' : <Trash size={18} />}
                    </button>
                )}
            </div>

        </form>
    );

    return (
        <div className="container" style={{ paddingBottom: '4rem', minHeight: '100vh', background: '#121212', color: '#fff' }}>
            <div className="app-header">
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <button onClick={onBack} className="btn-outlined" style={{ padding: '8px 12px', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                        <ChevronLeft size={18} /> Voltar
                    </button>
                    <h2 style={{ marginLeft: '1rem', color: '#fff', fontSize: '1.2rem', margin: '0 auto 0 1rem' }}>Painel Admin</h2>
                </div>
            </div>

            {/* TABS HEADER */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333' }}>
                <button
                    onClick={() => setActiveTab('vehicles')}
                    style={{
                        padding: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'vehicles' ? 'var(--koche-red)' : '#666',
                        borderBottom: activeTab === 'vehicles' ? '2px solid var(--koche-red)' : 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <Database size={18} /> Base de Dados
                </button>
                <button
                    onClick={() => setActiveTab('admins')}
                    style={{
                        padding: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'admins' ? 'var(--koche-red)' : '#666',
                        borderBottom: activeTab === 'admins' ? '2px solid var(--koche-red)' : 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <Users size={18} /> Gerenciar Admins
                </button>
                <button
                    onClick={() => setActiveTab('leads')}
                    style={{
                        padding: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'leads' ? 'var(--koche-red)' : '#666',
                        borderBottom: activeTab === 'leads' ? '2px solid var(--koche-red)' : 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <Download size={18} /> Leads (Exportar)
                </button>
            </div>

            {/* MESSAGE TOAST */}
            {msg && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    background: msg.type === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.2)',
                    border: `1px solid ${msg.type === 'success' ? 'green' : 'red'} `,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {msg.text}
                </div>
            )}

            {activeTab === 'vehicles' ? (
                <>

                    {/* DATABASE SECTION */}
                    <div style={{ marginBottom: '2rem' }}>


                        {/* ACCORDION: ADD VEHICLE */}
                        <div className="card" style={{ marginBottom: '1rem', padding: 0, overflow: 'hidden' }}>
                            <button
                                onClick={() => {
                                    if (activeSection === 'add') setActiveSection(null);
                                    else {
                                        setActiveSection('add');
                                        cancelEditing(); // Ensure clear state
                                    }
                                }}
                                style={{
                                    width: '100%', padding: '1.5rem', background: 'transparent', border: 'none',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'white'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={20} color="var(--koche-red)" />
                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Adicionar Veículo</span>
                                </div>
                                {activeSection === 'add' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {activeSection === 'add' && (
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #333' }}>
                                    {renderVehicleForm()}
                                </div>
                            )}
                        </div>

                        {/* ACCORDION: EDIT VEHICLE */}
                        <div className="card" style={{ padding: 0 }}>
                            <button
                                onClick={() => {
                                    if (activeSection === 'edit') setActiveSection(null);
                                    else {
                                        setActiveSection('edit');
                                        cancelEditing(); // Start fresh
                                    }
                                }}
                                style={{
                                    width: '100%', padding: '1.5rem', background: 'transparent', border: 'none',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'white'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Edit size={20} color="orange" />
                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Editar Veículo</span>
                                </div>
                                {activeSection === 'edit' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {activeSection === 'edit' && (
                                <div style={{ padding: '1.5rem', borderTop: '1px solid #333' }}>
                                    {/* SEARCH TO EDIT */}
                                    <div style={{ marginBottom: '2rem', position: 'relative' }}>
                                        <label style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>Buscar Veículo para Editar:</label>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                            <input
                                                type="text"
                                                className="admin-input"
                                                style={{ paddingLeft: '35px', width: '100%' }}
                                                placeholder="Digite Marca ou Modelo..."
                                                value={searchVehicleQuery}
                                                onChange={e => setSearchVehicleQuery(e.target.value)}
                                            />
                                        </div>

                                        {/* RESULTS DROPDOWN */}
                                        {vehicleResults.length > 0 && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                background: '#222', border: '1px solid #444', borderRadius: '0 0 8px 8px',
                                                zIndex: 200, maxHeight: '400px', overflowY: 'auto', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                                            }}>
                                                {vehicleResults.map(v => (
                                                    <div
                                                        key={v.id}
                                                        onClick={() => startEditing(v)}
                                                        style={{
                                                            padding: '12px', borderBottom: '1px solid #333', cursor: 'pointer',
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#333'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <div>
                                                            <strong style={{ color: 'white' }}>{v.brand} {v.model}</strong>
                                                            <span style={{ color: '#888', marginLeft: '10px', fontSize: '0.9rem' }}>{v.year} - {v.engine}</span>
                                                        </div>
                                                        <Edit size={16} color="var(--koche-red)" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Show form only if editingId is set */}
                                    {editingId && renderVehicleForm()}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : activeTab === 'admins' ? (
                <>
                    {/* ADMINS MANAGEMENT SECTION */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                            <Users size={20} /> Lista de Administradores
                        </h3>

                        <div style={{ marginBottom: '2rem', position: 'relative' }}>
                            <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        className="admin-input"
                                        style={{ width: '100%' }}
                                        placeholder="Pesquisar usuário ou digitar email..."
                                        value={newAdminEmail}
                                        onChange={handleAdminInputChange}
                                        type="text" // changed from email to allow typing names for search eventually, but we search by email prefix
                                        required
                                        autoComplete="off"
                                    />

                                    {/* SEARCH SUGGESTIONS */}
                                    {searchingUsers && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: '#333', border: '1px solid #555', borderRadius: '0 0 8px 8px',
                                            maxHeight: '200px', overflowY: 'auto', zIndex: 10
                                        }}>
                                            <div style={{ padding: '10px', color: '#ccc', fontStyle: 'italic', fontSize: '0.9rem' }}>Buscando...</div>
                                        </div>
                                    )}

                                    {userSuggestions.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: '#222', border: '1px solid #444', borderRadius: '0 0 8px 8px',
                                            maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                                        }}>
                                            {userSuggestions.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => selectUser(user.email)}
                                                    style={{
                                                        padding: '10px',
                                                        borderBottom: '1px solid #333',
                                                        cursor: 'pointer',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#333'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{user.email}</span>
                                                    {user.name && <span style={{ color: '#888', fontSize: '0.8rem' }}>{user.name}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="btn-elevated" disabled={loading}>
                                    <Plus size={18} /> Adicionar
                                </button>
                            </form>
                        </div>

                        {loadingAdmins ? (
                            <p style={{ color: '#666' }}>Carregando...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {/* Always show Super Admin */}
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ color: 'var(--koche-red)', fontWeight: 'bold' }}>rafsilveira@gmail.com</span>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Super Admin</span>
                                </div>

                                {admins.map(admin => (
                                    <div key={admin.id} style={{
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <span>{admin.email}</span>
                                        <button
                                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                                            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                                            title="Remover acesso"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                ))}

                                {admins.length === 0 && (
                                    <p style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>Nenhum admin adicional cadastrado.</p>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* LEADS EXPORT SECTION */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                            <Download size={20} /> Exportação de Leads
                        </h3>

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ color: '#ccc', marginBottom: '1rem' }}>
                                Exporte a lista completa de usuários cadastrados no aplicativo. O arquivo será gerado no formato <strong>.CSV</strong>, compatível com Excel, Google Sheets e CRM (Kommo).
                            </p>

                            <div style={{ padding: '15px', background: 'rgba(255, 165, 0, 0.1)', border: '1px solid orange', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <AlertTriangle size={18} color="orange" />
                                    <strong style={{ color: 'orange' }}>Aviso de Privacidade e LGPD</strong>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#ddd' }}>
                                    Ao exportar estes dados, você se torna responsável pelo tratamento e segurança das informações pessoais (nome, email, telefone) dos usuários, conforme a Lei Geral de Proteção de Dados (LGPD).
                                    Utilize estes dados apenas para fins de contato legítimo e não os compartilhe com terceiros sem consentimento.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>De (Data Inicial)</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="admin-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Até (Data Final)</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="admin-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {startDate && (
                                <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>
                                    * Filtrando leads criados entre <strong>{new Date(startDate + "T00:00:00").toLocaleDateString('pt-BR')}</strong> e <strong>{new Date(endDate + "T00:00:00").toLocaleDateString('pt-BR')}</strong>
                                </p>
                            )}

                            <button
                                onClick={handleExportLeads}
                                className="btn-primary"
                                disabled={loading}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {loading ? 'Gerando arquivo...' : <><Download size={20} /> Baixar Planilha de Leads (.csv)</>}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .form-group { display: flex; flexDirection: column; gap: 0.3rem; }
                .form-row { display: flex; gap: 1rem; }
                .form-row .form-group { flex: 1; }
                .admin-input {
                    background: #1a1a1a;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 10px;
                    border-radius: 8px;
                    color: white;
                    font-size: 1rem;
                }
                .admin-input:focus {
                    outline: none;
                    border-color: var(--koche-red);
                }
                /* Fix for Chrome/Safari Autofill white background */
                .admin-input:-webkit-autofill,
                .admin-input:-webkit-autofill:hover,
                .admin-input:-webkit-autofill:focus,
                .admin-input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #1a1a1a inset !important;
                    -webkit-text-fill-color: white !important;
                }
                label {
                    font-size: 0.9rem;
                    color: #ffffff;
                    font-weight: 600;
                    margin-left: 2px;
                }
                .card {
                    background: #1e1e1e;
                    border: 1px solid #333;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }
            `}</style>
        </div>
    );
}
