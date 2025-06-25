import React from 'react';
import MobileFlashcardGenerator from './MobileFlashcardGenerator';

console.log("API_URL:", process.env.REACT_APP_API_URL); // move this BEFORE export

const App = () => {
  return (
    <div style={{ padding: '50px', fontSize: '24px' }}>
      Frontend is working! ✅
    </div>
  );
};

export default App;
