import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, LogOut, Save, User } from 'lucide-react';
import PropTypes from 'prop-types';

export default function UserArea({ onBack }) {
    const { currentUser, userProfile, updateProfileData, logout } = useAuth();

    // Fallbacks if data is still loading or partially empty
    const initialName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
    const initialPhone = userProfile?.phone || '';
    const email = currentUser?.email || '';

    const [name, setName] = useState(initialName);
    const [phone, setPhone] = useState(initialPhone);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasSyncedProfile, setHasSyncedProfile] = useState(false);

    // userProfile chega de forma assíncrona do Firestore e pode ainda não
    // estar pronto quando este componente monta pela primeira vez - sem
    // isso, o campo fica travado vazio até a tela ser desmontada/remontada.
    useEffect(() => {
        if (!hasSyncedProfile && userProfile) {
            setName(userProfile.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '');
            setPhone(userProfile.phone || '');
            setHasSyncedProfile(true);
        }
    }, [userProfile, hasSyncedProfile, currentUser]);

    const formatPhone = (val) => {
        return val.replace(/\D/g, '');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const cleanPhone = formatPhone(phone);

        if (!name.trim()) {
            return setError('O nome não pode estar vazio.');
        }
        if (cleanPhone.length < 10) {
            return setError('Telefone inválido. Inclua o DDD.');
        }

        try {
            setError('');
            setSuccess('');
            setLoading(true);

            // Add +55 if local number
            const fullPhone = cleanPhone.startsWith('55') ? `+${cleanPhone}` : `+55${cleanPhone}`;

            await updateProfileData({ name: name.trim(), phone: fullPhone });

            setSuccess('Dados atualizados com sucesso!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);

        } catch (err) {
            console.error(err);
            setError('Erro ao salvar os dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Header */}
            <div className="app-header" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <button onClick={onBack} className="btn-outlined" style={{ padding: '8px 12px' }}>
                    <ChevronLeft size={18} /> Voltar
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--koche-blue)' }}>
                    <User size={24} />
                    <h2 style={{ margin: 0 }}>Minha Conta</h2>
                </div>
                <div style={{ width: '80px' }}></div> {/* Spacer to keep title centered */}
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                {error && <div style={{ color: '#ff4444', marginBottom: '1rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>{error}</div>}
                {success && <div style={{ color: '#00C851', marginBottom: '1rem', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(0,200,81,0.1)', borderRadius: '8px' }}>{success}</div>}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Email (Read Only) */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>E-mail (Fixo)</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'rgba(0,0,0,0.05)',
                                color: 'var(--text-secondary)',
                                cursor: 'not-allowed',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Nome Completo *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome"
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Telefone (com DDD) *</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="11999999999"
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '12px' }}
                        >
                            <Save size={20} />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>

                {/* Separator area before Logout */}
                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Deseja sair da sua conta?
                    </p>
                    <button
                        onClick={logout}
                        className="btn-outlined"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            color: 'var(--koche-red)',
                            borderColor: 'var(--koche-red)',
                            backgroundColor: 'rgba(227, 30, 36, 0.05)'
                        }}
                    >
                        <LogOut size={20} /> Sair do Aplicativo
                    </button>
                </div>

            </div>
        </div>
    );
}

UserArea.propTypes = {
    onBack: PropTypes.func.isRequired,
};
