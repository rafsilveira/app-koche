import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Login() {
    const { loginGoogle } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginGoogle();
            // Auth state change will redirect in App.js
        } catch (err) {
            setError('Falha ao fazer login com Google.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            background: 'var(--bg-dark)'
        }}>
            <div className="login-card" style={{
                background: 'var(--bg-card)',
                padding: '2rem',
                borderRadius: '16px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)'
            }}>
                <img src="images/brand/logo-silver.svg" alt="Kóche" style={{ height: '60px', marginBottom: '1.5rem' }} />
                <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Bem-vindo</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                    Faça login para acessar o Guia de Transmissão.
                </p>

                {error && <div style={{ color: '#ff4444', marginBottom: '1rem' }}>{error}</div>}

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                        background: '#fff',
                        color: '#333',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: loading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        transition: 'transform 0.2s'
                    }}
                >
                    {loading ? 'Entrando...' : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: 20 }} />
                            Entrar com Google
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
