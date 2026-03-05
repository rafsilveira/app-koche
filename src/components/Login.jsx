import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Login() {
    const { loginGoogle, loginEmailPassword, signupEmailPassword } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            return setError('Preencha email e senha.');
        }

        if (!isLogin && !name) {
            return setError('Preencha o nome.');
        }

        try {
            setError('');
            setLoading(true);

            if (isLogin) {
                await loginEmailPassword(email, password);
            } else {
                await signupEmailPassword(email, password, name);
            }
            // App.js handles Auth state change
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está em uso.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('E-mail ou senha incorretos.');
            } else if (err.code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else {
                setError(isLogin ? 'Falha ao fazer login. Verifique os dados.' : 'Falha ao criar conta.');
            }
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
                <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    {isLogin ? 'Bem-vindo' : 'Criar Conta'}
                </h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {isLogin ? 'Faça login para acessar o app.' : 'Preencha os dados para criar sua conta.'}
                </p>

                {error && <div style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nome Completo *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                                required={!isLogin}
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
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>E-mail *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
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

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Senha *</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
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
                            marginTop: '0.5rem',
                            background: 'var(--accent-color, #e31e24)',
                            color: '#fff',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            marginTop: '0.5rem'
                        }}
                    >
                        {isLogin ? 'Não tem conta? Crie uma aqui.' : 'Já tem conta? Faça login.'}
                    </button>
                </form>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    <span style={{ padding: '0 10px' }}>ou</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    type="button"
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
                        transition: 'transform 0.2s',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: 20 }} />
                    {isLogin ? 'Entrar com Google' : 'Cadastrar com Google'}
                </button>
            </div>
        </div>
    );
}
