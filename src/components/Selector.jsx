
import React from 'react';

const Selector = ({ label, value, options, onChange, disabled, placeholder = "Select..." }) => {
    return (
        <div className="form-group">
            <label>{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Selector;
