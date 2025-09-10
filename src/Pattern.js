import React from 'react';

const Pattern = () => {
  const containerStyle = {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    filter: 'blur(6px) saturate(1.05)',
    opacity: 0.85,
    transform: 'scale(1.02)',
    // CSS variables and background expressed via string for complex gradients
    '--s': '194px',
    '--c1': '#f6edb3',
    '--c2': '#acc4a3',
    background:
      'conic-gradient(from 120deg at 50% 87.5%, var(--c1) 120deg, #0000 0), conic-gradient(from 120deg at 50% 87.5%, var(--c1) 120deg, #0000 0) 0 calc(var(--s) / 2), conic-gradient(from 180deg at 75%, var(--c2) 60deg, #0000 0), conic-gradient(from 60deg at 75% 75%, var(--c1) 0 60deg, #0000 0), linear-gradient(150deg, #0000 calc(25% / 3), var(--c1) 0 25%, #0000 0) 0 calc(var(--s) / 2), conic-gradient(at 25% 25%, #0000 50%, var(--c2) 0 240deg, var(--c1) 0 300deg, var(--c2) 0), linear-gradient(-150deg, #0000 calc(25% / 3), var(--c1) 0 25%, #0000 0) #55897c',
    backgroundSize: 'calc(0.866 * var(--s)) var(--s)',
    backgroundPosition: 'center',
    backgroundRepeat: 'repeat',
  };

  return <div style={containerStyle} />;
};

export default Pattern;
