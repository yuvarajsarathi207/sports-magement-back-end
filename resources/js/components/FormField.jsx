import { useState } from 'react';

/** Labeled text/password/email field with optional show/hide for passwords. */
export default function FormField({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
    autoComplete,
    hint,
    name,
}) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && show ? 'text' : type;

    return (
        <label className="field ui-field">
            {label && (
                <span className="field-label-row">
                    {label}
                    {required && <span className="required-mark" aria-hidden>*</span>}
                </span>
            )}
            <div className={`ui-input-wrap${isPassword ? ' has-toggle' : ''}`}>
                <input
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    autoComplete={autoComplete}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="ui-input-toggle"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? 'Hide password' : 'Show password'}
                    >
                        {show ? 'Hide' : 'Show'}
                    </button>
                )}
            </div>
            {hint && <small className="field-hint">{hint}</small>}
        </label>
    );
}
