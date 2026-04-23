/**
 * TerminalInput - Real inline terminal editing
 * Tracks cursor position and handles keyboard events
 */

import React, { useState, useRef, useEffect } from 'react';

/**
 * TerminalInput Component
 * Tracks cursor position and handles keyboard events
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
   * Move cursor left
   */
  const [cursorOffset, setCursorOffset] = useState(value.length - prompt.length);

  /**
   * Move cursor right
   */
  const handleArrowRight = () => {
    const newValue = value.slice(0, cursorOffset) + ' ' + value.slice(cursorOffset);
    setCursorOffset(cursorOffset + 1);
  };

  /**
   * Move cursor left
   */
  const handleArrowLeft = () => {
    const newValue = value.slice(0, cursorOffset - 1) + ' ' + value.slice(cursorOffset - 1);
    setCursorOffset(cursorOffset - 1);
  };

  /**
   * Handle input changes for text input
   */
  const handleInputChange = (text) => {
    const newValue = value + text;
    onInput(newValue, { x: newValue.length - prompt.length, y: 0 });
  };

  /**
   * Handle backspace
   */
  const handleBackspace = () => {
    const newValue = value.slice(0, value.length - 1) + value.slice(value.length);
    onInput(newValue, { x: value.length - 2 - prompt.length, y: 0 });
  };

  /**
   * Handle Enter (execute command)
   */
  const [executeValue, setExecuteValue] = useState('');

  /**
   * Execute command
   */
  const handleExecute = () => {
    if (executeValue) {
      onExecute(executeValue);
    }
  };

  /**
   * Cancel command
   */
  const handleCancel = () => {
    onCancel();
  };

  /**
   * Move cursor to beginning
   */
  const handleHome = () => {
    setCursorOffset(0);
  };

  /**
   * Move cursor to end
   */
  const handleEnd = () => {
    setCursorOffset(value.length - prompt.length);
  };

  return (
    <div className="terminal-prompt">
      <span>{prompt}</span>
      <textarea
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') handleArrowLeft();
          if (e.key === 'ArrowRight') handleArrowRight();
          if (e.key === 'Backspace') handleBackspace();
          if (e.key === 'Home') handleHome();
          if (e.key === 'End') handleEnd();
          if (e.key === 'Enter') handleExecute();
          if (e.ctrlKey && e.key === 'c') handleCancel();
        }}
        onFocus={setCursorOffset}
        disabled={disabled}
        className="terminal-input"
      />
    </div>
  );
};

export default TerminalInput;