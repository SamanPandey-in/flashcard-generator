import React from 'react';
import MobileFlashcardGenerator from './MobileFlashcardGenerator';

console.log("API_URL:", process.env.REACT_APP_API_URL); // move this BEFORE export

const App = () => <MobileFlashcardGenerator />;

export default App;
