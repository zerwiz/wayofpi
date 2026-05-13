import React from 'react';

interface KiloProps {
  height?: string;
  width?: string;
  children?: React.ReactNode;
}

export const Kilo = ({ children, height = '200px', width = '100%' }: KiloProps) => {
  return <div style={{ height, width }}>{children}</div>;
};
