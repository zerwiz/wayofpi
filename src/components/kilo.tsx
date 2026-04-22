import React from 'react';

interface KiloProps {
  height?: string;
  width?: string;
  children?: React.ReactNode;
}

export const Kilo: React.FC<KiloProps> = ({ children, height = '200px', width = '100%' }) => {
  return <div className="kilo" style={{ height, width }}>{children}</div>;
};
