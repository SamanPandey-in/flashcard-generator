import React, { useState, useRef } from 'react';
import { Upload, FileText, Mic, Play, RotateCcw, Shuffle, Download, Trash2, Edit3, Check, X, Menu, ChevronLeft, ChevronRight, Square } from 'lucide-react';

const MobileFlashcardGenerator = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const processContent = async (content, type, file = null) => {
    setIsGenerating(true);
    console.log("API URL:", API_URL);

    try {
      let response;

      if (type === 'text') {
        response = await fetch(`${API_URL}/generate-flashcards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, content })
        });
      } else if (type === 'pdf' || type === 'voice') {
        const formData = new FormData();
        formData.append('file', file);

        response = await fetch(`${API_URL}/generate-flashcards/${type}`, {
          method: 'POST',
          body: formData
        });
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      setFlashcards(prev => [...prev, ...data.flashcards]);

    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processContent(textInput, 'text');
      setTextInput('');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      processContent(null, 'pdf', file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-recording.wav', { type: 'audio/wav' });
        processContent(null, 'voice', audioFile);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setAudioChunks([]);
      };

      recorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowAnswer(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCard(0);
    setShowAnswer(false);
    setShowMenu(false);
  };

  const deleteCard = (id) => {
    const filtered = flashcards.filter(card => card.id !== id);
    setFlashcards(filtered);
    if (currentCard >= filtered.length && filtered.length > 0) {
      setCurrentCard(filtered.length - 1);
    }
    setShowAnswer(false);
    setShowMenu(false);
  };

  const startEdit = (card) => {
    setEditingCard(card.id);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setShowMenu(false);
  };

  const saveEdit = () => {
    setFlashcards(prev => prev.map(card => 
      card.id === editingCard 
        ? { ...card, question: editQuestion, answer: editAnswer }
        : card
    ));
    setEditingCard(null);
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const exportFlashcards = () => {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'flashcards.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setShowMenu(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Flashcard Generator</h1>
          <p className="text-sm text-gray-600">Create flashcards from text, PDF, or voice</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'text'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5 mx-auto mb-1" />
            Text
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'pdf'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-5 h-5 mx-auto mb-1" />
            PDF
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'voice'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mic className="w-5 h-5 mx-auto mb-1" />
            Voice
          </button>
        </div>
      </div>

      {/* Content Input Section */}
      <div className="p-4">
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your study material
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your text here (notes, articles, study material)..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isGenerating}
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate Flashcards'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pdf' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Click to upload or drag and drop your PDF file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    {isGenerating ? 'Processing...' : 'Choose File'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Audio
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
                  }`}>
                    {isRecording ? (
                      <Square className="w-8 h-8 text-red-600" />
                    ) : (
                      <Mic className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  {isRecording && (
                    <div className="mb-4">
                      <div className="text-lg font-mono text-red-600 mb-2">
                        {formatTime(recordingTime)}
                      </div>
                      <div className="text-sm text-gray-600">Recording...</div>
                    </div>
                  )}
                  
                  <p className="text-gray-600 mb-4">
                    {isRecording 
                      ? 'Speak clearly into your microphone' 
                      : 'Click to start recording your voice notes'
                    }
                  </p>
                  
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isGenerating}
                    className={`py-3 px-6 rounded-lg font-medium transition-colors ${
                      isRecording
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                  
                  {!isRecording && (
                    <p className="text-xs text-gray-500 mt-2">
                      Tap and hold to record, release to stop
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recording Tips */}
        {activeTab === 'voice' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Recording Tips:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Speak clearly and at a moderate pace</li>
              <li>• Find a quiet environment to minimize background noise</li>
              <li>• Organize your content logically (e.g., "Question: ... Answer: ...")</li>
              <li>• You can record multiple topics in one session</li>
            </ul>
          </div>
        )}
      </div>

      {/* Flashcards Display */}
      {flashcards.length > 0 && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-lg border">
            {/* Card Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">
                  {currentCard + 1} of {flashcards.length}
                </span>
                {flashcards[currentCard]?.difficulty && (
                  <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(flashcards[currentCard].difficulty)}`}>
                    {flashcards[currentCard].difficulty}
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <button
                      onClick={() => startEdit(flashcards[currentCard])}
                      className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Card
                    </button>
                    <button
                      onClick={shuffleCards}
                      className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Shuffle Cards
                    </button>
                    <button
                      onClick={exportFlashcards}
                      className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Cards
                    </button>
                    <button
                      onClick={() => deleteCard(flashcards[currentCard].id)}
                      className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Card
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              {editingCard === flashcards[currentCard]?.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
                    <textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {showAnswer ? 'Answer' : 'Question'}
                    </h3>
                    <p className="text-gray-700 text-base leading-relaxed">
                      {showAnswer ? flashcards[currentCard]?.answer : flashcards[currentCard]?.question}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4 inline mr-2" />
                    {showAnswer ? 'Show Question' : 'Show Answer'}
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className="flex items-center px-4 py-2 text-gray-600 disabled:text-gray-400 hover:text-gray-900 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Previous
              </button>
              
              <button
                onClick={() => {
                  setCurrentCard(0);
                  setShowAnswer(false);
                }}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>

              <button
                onClick={nextCard}
                disabled={currentCard === flashcards.length - 1}
                className="flex items-center px-4 py-2 text-gray-600 disabled:text-gray-400 hover:text-gray-900 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {flashcards.length === 0 && !isGenerating && (
        <div className="p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards yet</h3>
          <p className="text-gray-600">
            Create your first set of flashcards by entering text, uploading a PDF, or recording your voice above.
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileFlashcardGenerator;