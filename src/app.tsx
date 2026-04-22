import React from 'react';
import { Kilo } from './components/kilo';

const App: React.FC = () => {
  return (
    <div>
      <h1>Welcome to Pi Way-of-pi</h1>
      <Kilo height="300px">
        <p>🖥️ Display Area Ready!</p>
        <p>Just a simple display component.</p>
      </Kilo>
    </div>
  );
};

export default App;