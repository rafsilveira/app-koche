import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, Bot, Loader2, Info } from 'lucide-react';
import { sendMessageToAI } from '../services/aiService';

export default function AssistantScreen({ onBack, database }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Olá! Sou a IA da Kóche. Em breve estarei pronta para tirar todas as suas dúvidas sobre transmissões.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const response = await sendMessageToAI(userMsg, database);
            setMessages(prev => [...prev, { role: 'assistant', text: response.message }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Desculpe, ocorreu um erro de conexão.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="container" style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div className="app-header" style={{ flex: '0 0 auto', paddingBottom: '1rem' }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <button onClick={onBack} className="btn-outlined" style={{ padding: '8px 12px', fontSize: '0.9rem', border: 'none' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h2 style={{ marginLeft: '1rem', color: 'var(--koche-blue)', margin: 0 }}>Assistente Kóche</h2>
                </div>
            </div>

            {/* BANNER EM BREVE (Overlay or Top Banner) */}
            <div style={{
                backgroundColor: '#FFF4E5',
                color: '#663C00',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #FFCC80'
            }}>
                <Info size={20} />
                <span style={{ fontWeight: 600 }}>Em Breve:</span>
                <span>A Inteligência Artificial ainda está aprendendo.</span>
            </div>

            {/* Chat Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: 'var(--bg-card)',
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
            }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        backgroundColor: msg.role === 'user' ? 'var(--koche-blue)' : 'var(--bg-secondary)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                        borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                    }}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && (
                    <div style={{ alignSelf: 'flex-start', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Loader2 size={16} className="spin" />
                        <span style={{ fontSize: '0.9rem' }}>Digitando...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Digite sua dúvida..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1, padding: '12px',
                            borderRadius: '8px', border: '1px solid var(--border-color)',
                            fontSize: '1rem', outline: 'none', background: 'var(--bg-input)',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="btn-primary"
                        style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
