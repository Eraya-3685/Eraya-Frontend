import React, { useRef, useEffect } from 'react';

const OTPInput = ({ value = ['', '', '', '', '', ''], onChange, focusColor = '#0d1117', autoFocus = true }) => {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newDigits = [...value];
    newDigits[index] = val.substring(val.length - 1);
    onChange(newDigits);
    
    // Auto-focus next input
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newDigits = [...value];
      if (value[index]) {
        newDigits[index] = '';
        onChange(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        onChange(newDigits);
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (text) {
      const newDigits = [...value];
      for (let i = 0; i < text.length; i++) {
        newDigits[i] = text[i];
      }
      onChange(newDigits);
      const nextFocus = Math.min(text.length, 5);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }} onPaste={handlePaste}>
      {value.map((digit, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={digit}
          ref={el => inputsRef.current[index] = el}
          onChange={e => handleChange(e, index)}
          onKeyDown={e => handleKeyDown(e, index)}
          style={{
            width: '44px', height: '54px', background: '#f8fafc',
            border: '2px solid transparent', borderRadius: '0.75rem',
            textAlign: 'center', fontSize: '1.65rem', fontWeight: 900,
            color: '#0d1117', outline: 'none', transition: 'all 0.2s',
            boxShadow: '0 0 0 1px #e8ecf0'
          }}
          onFocus={e => { e.currentTarget.style.borderColor = focusColor; e.currentTarget.style.background = '#fff'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#f8fafc'; }}
        />
      ))}
    </div>
  );
};

export default OTPInput;
