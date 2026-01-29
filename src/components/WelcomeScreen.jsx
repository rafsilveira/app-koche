import { BookOpen, GraduationCap, MessageCircle, Bot } from 'lucide-react';
import PropTypes from 'prop-types';

function WelcomeScreen({ onStartGuide, onStartCourse, onStartAssistant, onAdmin, isAdmin }) {
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

                    {/* BOTÃO ASSISTENTE (Secondary Action) */}
                    <button
                        onClick={onStartAssistant}
                        className="btn-elevated"
                        style={{ padding: '1.25rem', color: 'var(--koche-blue)', border: '1px solid var(--koche-blue)' }}
                    >
                        <Bot size={24} /> Assistente Virtual
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

                    {/* ADMIN BUTTON (Visible only to Admin) */}
                    {isAdmin && (
                        <>
                            <div style={{ height: '0.5rem' }}></div>
                            <button
                                onClick={onAdmin}
                                className="btn-outlined"
                                style={{ justifyContent: 'center', borderColor: '#333', color: '#666' }}
                            >
                                Painel Admin
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

WelcomeScreen.propTypes = {
    onStartGuide: PropTypes.func.isRequired,
    onStartCourse: PropTypes.func.isRequired,
    onStartAssistant: PropTypes.func.isRequired,
    onAdmin: PropTypes.func.isRequired,
    isAdmin: PropTypes.bool
};

export default WelcomeScreen;
