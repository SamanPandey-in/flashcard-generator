import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import InputSection from './components/InputSection';
import FlashcardDeck from './components/FlashcardDeck';

const MobileFlashcardGenerator = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://flashcard-generator-tvst.onrender.com';

  // Test API connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log("Testing connection to:", API_URL);
      const response = await fetch(`${API_URL}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('failed');
      setError(`Cannot connect to server at ${API_URL}.`);
    }
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 8000);
  };

  const processContent = async (content, type, file = null) => {
    setIsGenerating(true);
    setError(null);
    console.log("Processing content:", { type, contentLength: content?.length, fileName: file?.name });

    try {
      let response;
      let url;

      if (type === 'text') {
        url = `${API_URL}/generate-flashcards`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ content })
        });
      } else if (type === 'pdf' || type === 'voice') {
        const formData = new FormData();
        formData.append('file', file);
        url = `${API_URL}/generate-flashcards/${type}`;
        response = await fetch(url, {
          method: 'POST',
          body: formData
        });
      }

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
          if (errorData.details) errorMessage += ` - ${errorData.details}`;
        } catch {
          errorMessage = `Server error (${response.status}): ${responseText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response format from server");
      }

      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error("Invalid response: missing or invalid flashcards array");
      }

      if (data.flashcards.length === 0) {
        throw new Error("No flashcards were generated. Try providing more detailed content.");
      }

      const validFlashcards = data.flashcards.filter(card =>
        card && card.question && card.answer && card.id
      );

      if (validFlashcards.length === 0) {
        throw new Error("Generated flashcards have invalid format");
      }

      setFlashcards(prev => [...prev, ...validFlashcards]);
      // Scroll to flashcards (optional but good UX)
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 500);

    } catch (error) {
      console.error('Error generating flashcards:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showError(`Network error: Cannot reach server at ${API_URL}. Please check if your backend is running.`);
      } else if (error.message.includes('429')) {
        showError("Rate limit exceeded. Please wait a moment before trying again.");
      } else if (error.message.includes('401')) {
        showError("Authentication error. Please check your API key configuration.");
      } else if (error.message.includes('timeout')) {
        showError("Request timed out. Please try with shorter content.");
      } else {
        showError(error.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      showError("Please enter some text content first.");
      return;
    }
    if (textInput.length > 50000) {
      showError("Text is too long. Please limit to 50,000 characters or less.");
      return;
    }
    processContent(textInput, 'text');
    setTextInput('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showError("Please select a PDF file only.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showError("File is too large. Please select a PDF smaller than 25MB.");
      return;
    }

    processContent(null, 'pdf', file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      const localChunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };

      recorder.onstop = () => {
        clearInterval(recordingTimerRef.current);
        const blob = new Blob(localChunks, { type: 'audio/wav' });
        const file = new File([blob], 'voice-recording.wav', { type: 'audio/wav' });

        if (file.size < 1000) {
          showError("Recording too short or empty. Please try again.");
        } else {
          processContent(null, 'voice', file);
        }

        stream.getTracks().forEach(track => track.stop());
        setAudioChunks([]);
      };

      recorder.start();
    } catch (err) {
      showError(`Could not access mic: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Card Management Functions
  const nextCard = () => {
    if (currentCard < flashcards.length - 1) setCurrentCard(currentCard + 1);
  };

  const prevCard = () => {
    if (currentCard > 0) setCurrentCard(currentCard - 1);
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCard(0);
  };

  const deleteCard = (id) => {
    const filtered = flashcards.filter(card => card.id !== id);
    setFlashcards(filtered);
    if (currentCard >= filtered.length && filtered.length > 0) {
      setCurrentCard(filtered.length - 1);
    }
  };

  const startEdit = (card) => {
    // Current simple implementation: just prompt for now or separate logic
    // Or we can implement a modal.
    // Given the new structure, implementing a full edit modal is better UX but 'prompt' is quick.
    // Let's use window.prompt for simplicity in this refactor unless we built a modal.
    // Original used inline state. New structure: pass edit capability to Deck?
    // Let's implement a simple inline update for now using prompts to avoid complex modal state lifting.
    const newQuestion = window.prompt("Edit Question:", card.question);
    if (newQuestion === null) return;
    const newAnswer = window.prompt("Edit Answer:", card.answer);
    if (newAnswer === null) return;

    setFlashcards(prev => prev.map(c =>
      c.id === card.id ? { ...c, question: newQuestion, answer: newAnswer } : c
    ));
  };

  const exportFlashcards = () => {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'flashcards.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]"></div>
      </div>

      <Header connectionStatus={connectionStatus} />

      <main className="relative z-10 pt-24 px-4 pb-12 max-w-4xl mx-auto">

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 mb-6 rounded-xl backdrop-blur-sm animate-fade-in flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <InputSection
          activeTab={activeTab}
          textInput={textInput}
          setTextInput={setTextInput}
          handleTextSubmit={handleTextSubmit}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          recordingTime={recordingTime}
          isGenerating={isGenerating}
          connectionStatus={connectionStatus}
        />

        {flashcards.length > 0 && (
          <div className="mt-12 border-t border-white/5 pt-12 animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
                Your Flashcards
              </h2>
              <span className="ml-3 px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-400 border border-white/5">
                {flashcards.length}
              </span>
            </div>

            <FlashcardDeck
              flashcards={flashcards}
              currentCard={currentCard}
              setCurrentCard={setCurrentCard}
              nextCard={nextCard}
              prevCard={prevCard}
              shuffleCards={shuffleCards}
              deleteCard={deleteCard}
              startEdit={startEdit}
              exportFlashcards={exportFlashcards}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default MobileFlashcardGenerator;
