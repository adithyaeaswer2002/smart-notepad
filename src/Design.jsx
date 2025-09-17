// design.jsx
import React from "react";
import styled from "styled-components";

/* ---------------- WaveInput ---------------- */
export const WaveInput = ({ label, value, onChange, name }) => {
  return (
    <WaveWrapper>
      <div className="wave-group">
        <input
          required
          type="text"
          className="input"
          value={value}
          onChange={onChange}
          name={name}
        />
        <span className="bar" />
        <label className="label">
          {label.split("").map((char, i) => (
            <span key={i} className="label-char" style={{ "--index": i }}>
              {char}
            </span>
          ))}
        </label>
      </div>
    </WaveWrapper>
  );
};

const WaveWrapper = styled.div`
  .wave-group {
    position: relative;
    margin-bottom: 1rem;
  }
  .wave-group .input {
    font-size: 14px;
    padding: 6px 8px 6px 4px;
    display: block;
    width: 100%;
    border: none;
    border-bottom: 1px solid #515151;
    background: transparent;
    box-sizing: border-box;
  }
  .wave-group .input:focus {
    outline: none;
  }
  .wave-group .label {
    color: #999;
    font-size: 16px;
    position: absolute;
    pointer-events: none;
    left: 5px;
    top: 6px;
    display: flex;
  }
  .wave-group .label-char {
    transition: 0.2s ease all;
    transition-delay: calc(var(--index) * 0.05s);
  }
  .wave-group .input:focus ~ .label .label-char,
  .wave-group .input:valid ~ .label .label-char {
    transform: translateY(-18px);
    font-size: 12px;
    color: #5264AE;
  }
  .wave-group .bar {
    position: relative;
    display: block;
    width: 100%;
  }
  .wave-group .bar:before,
  .wave-group .bar:after {
    content: "";
    height: 2px;
    width: 0;
    bottom: 1px;
    position: absolute;
    background: #5264AE;
    transition: 0.2s ease all;
  }
  .wave-group .bar:before {
    left: 50%;
  }
  .wave-group .bar:after {
    right: 50%;
  }
  .wave-group .input:focus ~ .bar:before,
  .wave-group .input:focus ~ .bar:after {
    width: 50%;
  }
`;

/* ---------------- GradientButton ---------------- */
export const GradientButton = ({ children, onClick, active }) => {
  return (
    <ButtonWrapper>
      <button onClick={onClick} className={active ? "active" : ""}>
        <span className="text">{children}</span>
      </button>
    </ButtonWrapper>
  );
};

const ButtonWrapper = styled.div`
  button {
    align-items: center;
    background-image: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
    border: 0;
    border-radius: 8px;
    box-shadow: rgba(151, 65, 252, 0.2) 0 15px 30px -5px;
    color: #ffffff;
    display: flex;
    font-size: 16px;
    justify-content: center;
    min-width: 100px;
    padding: 3px;
    cursor: pointer;
    transition: all 0.3s;
  }
  button span {
    background-color: rgb(5, 6, 45);
    padding: 10px 18px;
    border-radius: 6px;
    width: 100%;
    height: 100%;
    transition: 300ms;
  }
  button:hover span {
    background: none;
  }
  button:active {
    transform: scale(0.95);
  }
  button.active span {
    background: none;
  }
`;

/* ---------------- ShineButton ---------------- */
const ShineButton = ({ active, children, ...props }) => (
  <StyledButton className={active ? 'active' : ''} {...props}>
    <span>{children}</span>
  </StyledButton>
);

const StyledButton = styled.button`
  position: relative;
  margin: 0;
  padding: 5px 15px;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid rgba(22, 76, 167, 0.6);
  border-radius: 10px;
  color: #1d89ff;
  font-weight: 5000;
  font-family: inherit;
  overflow: hidden;
  transition: all 0.3s ease;

  &.active {
    background-color: #1d89ff;
    color: #fff;
  }

  span {
    position: relative;
    z-index: 2;
    letter-spacing: 0.7px;
  }

  &:hover {
    animation: rotate624 0.7s ease-in-out both;
  }

  &:hover span {
    animation: storm1261 0.7s ease-in-out both;
    animation-delay: 0.06s;
  }

  &::after {
    background: #38ef7d;
    content: "";
    height: 155px;
    left: -75px;
    opacity: 0.4;
    position: absolute;
    top: -50px;
    transform: rotate(35deg);
    transition: all 550ms cubic-bezier(0.19, 1, 0.22, 1);
    width: 50px;
    z-index: 1;
  }

  &:hover::after {
    left: 120%;
  }

  @keyframes rotate624 {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(3deg); }
    50% { transform: rotate(-3deg); }
    75% { transform: rotate(1deg); }
    100% { transform: rotate(0deg); }
  }

  @keyframes storm1261 {
    0% { transform: translate3d(0,0,0); }
    25% { transform: translate3d(4px,0,0); }
    50% { transform: translate3d(-3px,0,0); }
    75% { transform: translate3d(2px,0,0); }
    100% { transform: translate3d(0,0,0); }
  }
`;

export default ShineButton;






