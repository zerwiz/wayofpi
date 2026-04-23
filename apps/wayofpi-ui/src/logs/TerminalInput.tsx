/**
 * TerminalInput - Real inline terminal editing
 * Tracks cursor position and handles keyboard events
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * TerminalInput Component
 * Handles all keyboard events for terminal-like input
 */
export const TerminalInput = ({
  value = '',
  cursorPosition = { x: 0, y: 0 },
  onInput,
  onExecute,
  onBackspace,
  onArrowLeft,
  onArrowRight,
  onCancel,
  disabled = false,
  prompt = '$ ',
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = value;
    }
  }, [value]);

  /**
   * Handle keydown events
   */
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleArrowLeft();
      return;
    }
    
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleArrowRight();
      return;
    }
    
    if (event.key === 'Home') {
      event.preventDefault();
      handleHome();
      return;
    }
    
    if (event.key === 'End') {
      event.preventDefault();
      handleEnd();
      return;
    }
    
    if (event.key === 'Backspace') {
      event.preventDefault();
      handleBackspace();
      return;
    }
    
    if (event.key === 'Delete') {
      event.preventDefault();
      handleDelete();
      return;
    }
    
    if (event.key === 'Enter') {
      event.preventDefault();
      handleExecute();
      return;
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    const newPos = event.target.selectionStart - prompt.length;
    
    onInput(newValue, newPos);
  };

  return (
    <div className="terminal-prompt">
      <span>{prompt}</span>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // Reset cursor to position after prompt
          const promptLen = prompt.length;
          textareaRef.current.focus();
        }}
        disabled={disabled}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          cursor: 'text',
          outline: 'none',
          border: 'none',
          resize: 'none',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default TerminalInput;