"use client";

import React from "react";

interface ToggleSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked = false,
  onChange,
  leftLabel = "Supply",
  rightLabel = "Borrow",
}) => {
  return (
    <label className="toggle-container">
      {/* keep this as input not Input */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="toggle-input hidden"
        aria-checked={checked}
        role="switch"
      />
      <div className="toggle-slider" aria-hidden="true">
        <span className={`toggle-label ${!checked ? "active" : ""}`}>
          {leftLabel}
        </span>
        <span className={`toggle-label ${checked ? "active" : ""}`}>
          {rightLabel}
        </span>
        <div className={`toggle-thumb ${checked ? "right" : "left"}`} />
      </div>
      <style jsx>{`
        .toggle-container {
          display: inline-block;
          position: relative;
          user-select: none;
        }
        .toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }
        .toggle-slider {
          display: flex;
          align-items: center;
          background-color: var(--background);
          border-radius: 20px;
          cursor: pointer;
          padding: 4px;
          width: 200px;
          position: relative;
          font-family: sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--foreground);
          gap: 4px;
        }
        .toggle-label {
          flex: 1;
          text-align: center;
          transition: color 0.3s ease;
          z-index: 2;
          padding: 0 8px;
        }
        .toggle-label.active {
          color: var(--background);
        }
        .toggle-thumb {
          position: absolute;
          top: 4px;
          bottom: 4px;
          width: calc(50% - 4px);
          padding: 0;
          background-color: var(--foreground);
          border-radius: 20px;
          transition: left 0.3s ease;
          z-index: 1;
        }
        .toggle-thumb.left {
          left: 4px;
        }
        .toggle-thumb.right {
          left: 50%;
          right: auto;
        }
      `}</style>
    </label>
  );
};

export default ToggleSwitch;
