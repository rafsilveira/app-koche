import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import { sendMessageToAI } from '../services/aiService';

export default function AssistantModal({ isOpen, onClose, database, onSelectResult }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Olá! Sou seu assistente mecânico. Posso ajudar a encontrar especificações de óleo ou tirar dúvidas sobre problemas de transmissão. Como posso ajudar?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Scroll to bottom on open
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(userMsg, database);

      setMessages(prev => [...prev, { role: 'assistant', text: response.message }]);

      if (response.action === 'SELECT_VEHICLE' && response.target) {
        // Automatically select the vehicle after a short delay
        setTimeout(() => {
          onSelectResult(response.target);
        }, 1500);
      }

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'var(--bg-card)', width: '90%', maxWidth: '600px', height: '80vh',
        borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', border: '1px solid var(--border-color)'
      }}>

        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)' }}>
          <Bot size={24} color="var(--koche-blue)" />
          <h3 style={{ margin: 0, flex: 1, color: 'var(--text-primary)' }}>Assistente Mecânico IA</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <span style={{ fontSize: '0.9rem' }}>Analisando...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Ex: Toro não engata a ré..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
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
    </div>
  );
}
