import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileForm() {
    const { currentUser, updateProfileData } = useAuth();

    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatPhone = (val) => {
        // Basic format E.164 (e.g. +5511999999999)
        let p = val.replace(/\D/g, '');
        return p;
    };

    const handleSavePhone = async (e) => {
        e.preventDefault();
        const cleanPhone = formatPhone(phone);
        if (cleanPhone.length < 10) return setError('Telefone inválido. Inclua DDD.');

        try {
            setError('');
            setLoading(true);

            // +55 Default if missing
            const fullPhone = cleanPhone.startsWith('55') ? `+${cleanPhone}` : `+55${cleanPhone}`;

            await updateProfileData({ phone: fullPhone });
            // App will auto-redirect because userProfile has changed
        } catch (err) {
            console.error(err);
            setError('Erro ao salvar o telefone. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            background: 'var(--bg-dark)'
        }}>
            <div className="profile-card" style={{
                background: 'var(--bg-card)',
                padding: '2rem',
                borderRadius: '16px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)'
            }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', textAlign: 'center' }}>
                    Seu Telefone
                </h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
                    Precisamos do seu WhatsApp para contato e suporte.
                </p>

                {error && <div style={{ color: '#ff4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nome</label>
                        <input
                            type="text"
                            value={currentUser?.displayName || currentUser?.email?.split('@')[0] || ''}
                            disabled
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-secondary)',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>

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
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            background: 'var(--accent-color, #e31e24)',
                            color: '#fff',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Salvando...' : 'Salvar e Continuar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
