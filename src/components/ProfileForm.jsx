import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileForm() {
    const { currentUser, updateProfileData, setupRecaptcha, startPhoneVerification } = useAuth();

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatPhone = (val) => {
        // Basic format E.164 (e.g. +5511999999999)
        // Assuming user types plain numbers
        // This is a simple formatter, production might need lighter/libphonenumber
        let p = val.replace(/\D/g, '');
        return p;
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        const cleanPhone = formatPhone(phone);
        if (cleanPhone.length < 10) return setError('Telefone inválido. Inclua DDD.');

        try {
            setError('');
            setLoading(true);

            // +55 Default if missing
            const fullPhone = cleanPhone.startsWith('55') ? `+${cleanPhone}` : `+55${cleanPhone}`;

            const appVerifier = setupRecaptcha('recaptcha-container');
            const result = await startPhoneVerification(fullPhone, appVerifier);

            setConfirmationResult(result);
            setStep('otp');
        } catch (err) {
            console.error(err);
            setError('Erro ao enviar SMS. Verifique o número e tente novamente.');
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) return setError('Código inválido (6 dígitos).');

        try {
            setError('');
            setLoading(true);
            await confirmationResult.confirm(otp);

            // If success, save phone to profile
            // Note: We use the *original input* phone or the result phone
            // result.user.phoneNumber is the verified one
            const finalPhone = confirmationResult.verificationId ? phone : phone;

            await updateProfileData({ phone: finalPhone });
            // App will auto-redirect because userProfile has changed
        } catch (err) {
            console.error(err);
            setError('Código incorreto.');
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
                    {step === 'phone' ? 'Verificar Celular' : 'Digitar Código'}
                </h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
                    {step === 'phone'
                        ? 'Enviaremos um SMS para confirmar seu número.'
                        : `Enviado para ${phone}. Digite o código abaixo.`}
                </p>

                {error && <div style={{ color: '#ff4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                {step === 'phone' ? (
                    <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nome</label>
                            <input
                                type="text"
                                value={currentUser?.displayName || ''}
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

                        <div id="recaptcha-container"></div>

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
                            {loading ? 'Enviando...' : 'Receber SMS'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Código SMS (6 dígitos)</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                required
                                maxLength={6}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-dark)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1.5rem',
                                    textAlign: 'center',
                                    letterSpacing: '0.5rem'
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
                                cursor: loading ? 'wait' : 'pointer'
                            }}
                        >
                            {loading ? 'Validando...' : 'Confirmar Código'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Voltar / Tentar outro número
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
