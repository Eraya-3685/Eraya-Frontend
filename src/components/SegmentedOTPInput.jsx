import React, { useRef, useEffect } from 'react';

/**
 * A segmented OTP input component with 6 separate boxes.
 * Handles auto-focus, backspace, and pasting.
 */
const SegmentedOTPInput = ({ value, onChange, disabled }) => {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (!val) return;

    // Only take the last character if multiple are entered
    const digit = val[val.length - 1];
    
    const newOtp = value.split('');
    newOtp[index] = digit;
    const finalOtp = newOtp.join('');
    
    onChange(finalOtp);

    // Focus next input
    if (digit && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current box is empty, move back and clear previous
        inputs.current[index - 1].focus();
        const newOtp = value.split('');
        newOtp[index - 1] = '';
        onChange(newOtp.join(''));
      } else {
        // Clear current
        const newOtp = value.split('');
        newOtp[index] = '';
        onChange(newOtp.join(''));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasteData);
    
    // Focus the last filled input or the next empty one
    const nextIndex = Math.min(pasteData.length, 5);
    inputs.current[nextIndex].focus();
  };

  // Ensure value is always 6 chars (padded with empty strings) for mapping
  const otpArray = value.padEnd(6, ' ').split('').slice(0, 6);

  return (
    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabled}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all"
        />
      ))}
    </div>
  );
};

export default SegmentedOTPInput;
