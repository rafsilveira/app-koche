
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Selector = ({ label, value, options, onChange, disabled, placeholder = "Selecione..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOpen = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
            <label>{label}</label>
            <div
                onClick={toggleOpen}
                style={{
                    backgroundColor: disabled ? '#F3F4F6' : 'var(--surface-card)',
                    border: isOpen ? '2px solid var(--koche-blue)' : '1px solid var(--koche-silver)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.8 : 1,
                    transition: 'all 0.2s',
                    color: value ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
            >
                <span style={{ fontSize: '1rem' }}>{value || placeholder}</span>
                <ChevronDown
                    size={20}
                    color="var(--text-secondary)"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                />
            </div>

            {isOpen && !disabled && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--koche-silver)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--elevation-2)',
                    zIndex: 100,
                    marginTop: '4px'
                }}>
                    {options.length > 0 ? (
                        options.map((option) => (
                            <div
                                key={option}
                                onClick={() => handleSelect(option)}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #F3F4F6',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#F8F9FA'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                {option}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px 16px', color: 'var(--text-disabled)' }}>
                            Sem opções
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Selector;
