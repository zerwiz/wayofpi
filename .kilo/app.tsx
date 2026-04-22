import React from 'react';
import { KiloProps, Kilo } from './kilo';

const App: React.FC = () => {
  return (
    <div>
      <h1>Welcome to Pi Way-of-pi</h1>
      <Kilo<KiloProps> height="300px">
        <p>🖥️ Display Area Ready!</p>
      </Kilo>
    </div>
  );
};

export default App;
