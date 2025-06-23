import React, { useState, useRef } from 'react';
import { Upload, FileText, Mic, Play, RotateCcw, Shuffle, Download, Trash2, Edit3, Check, X, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const fileInputRef = useRef(null);

  // Mock LLM processing function
  const processContent = async (content, type) => {
    setIsGenerating(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock flashcard generation based on content type
    let mockCards = [];
    
    if (type === 'text') {
      const sentences = content.split('.').filter(s => s.trim().length > 10);
      mockCards = sentences.slice(0, 5).map((sentence, index) => ({
        id: Date.now() + index,
        question: `What is the key concept in: "${sentence.trim().substring(0, 40)}..."?`,
        answer: sentence.trim(),
        difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)]
      }));
    } else if (type === 'pdf') {
      mockCards = [
        {
          id: Date.now() + 1,
          question: "What are the main topics covered in this document?",
          answer: "The document covers various academic concepts including definitions, examples, and key principles.",
          difficulty: 'Medium'
        },
        {
          id: Date.now() + 2,
          question: "What is the primary focus of Chapter 1?",
          answer: "Chapter 1 introduces fundamental concepts and provides an overview of the subject matter.",
          difficulty: 'Easy'
        }
      ];
    } else if (type === 'voice') {
      mockCards = [
        {
          id: Date.now() + 1,
          question: "What was the main point discussed in the voice note?",
          answer: "The voice note covered important study concepts and key terminology.",
          difficulty: 'Medium'
        }
      ];
    }
    
    setFlashcards(prev => [...prev, ...mockCards]);
    setIsGenerating(false);
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
      processContent(`PDF file: ${file.name}`, 'pdf');
    }
  };

  const handleVoiceRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate recording
      setTimeout(() => {
        setIsRecording(false);
        processContent('Voice recording content', 'voice');
      }, 3000);
    }
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
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Flashcards</h1>
              <p className="text-sm text-gray-500">AI-powered study tool</p>
            </div>
            {flashcards.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-200 w-48 z-50">
                    <button
                      onClick={shuffleCards}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                    >
                      <Shuffle className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Shuffle Cards</span>
                    </button>
                    <button
                      onClick={exportFlashcards}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Export Cards</span>
                    </button>
                    <button
                      onClick={() => startEdit(flashcards[currentCard])}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                    >
                      <Edit3 className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Edit Card</span>
                    </button>
                    <button
                      onClick={() => deleteCard(flashcards[currentCard]?.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Card</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 mt-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'text' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <FileText className="inline w-4 h-4 mr-1" />
              Text
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'pdf' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <Upload className="inline w-4 h-4 mr-1" />
              PDF
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'voice' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <Mic className="inline w-4 h-4 mr-1" />
              Voice
            </button>
          </div>

          {/* Text Input Tab */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your study notes here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? 'Generating...' : 'Create Flashcards'}
              </button>
            </div>
          )}

          {/* PDF Upload Tab */}
          {activeTab === 'pdf' && (
            <div className="space-y-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Tap to upload PDF</p>
                <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {isGenerating && (
                <div className="text-center text-purple-600 font-medium text-sm">
                  Processing PDF...
                </div>
              )}
            </div>
          )}

          {/* Voice Note Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-3">
              <div className="text-center py-6">
                <button
                  onClick={handleVoiceRecording}
                  disabled={isRecording || isGenerating}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-medium transition-all ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse scale-110' 
                      : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
                  } disabled:opacity-50`}
                >
                  <Mic className="w-6 h-6" />
                </button>
                <p className="mt-3 text-sm text-gray-600">
                  {isRecording ? 'Recording...' : 'Tap to record'}
                </p>
                {isGenerating && (
                  <p className="text-purple-600 font-medium mt-2 text-sm">
                    Processing audio...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Flashcards Display */}
        {flashcards.length > 0 && (
          <div className="space-y-4">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between text-sm text-gray-600 px-2">
              <span>{currentCard + 1} of {flashcards.length}</span>
              <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
                />
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(flashcards[currentCard]?.difficulty)}`}>
                {flashcards[currentCard]?.difficulty}
              </span>
            </div>

            {/* Flashcard */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {editingCard === flashcards[currentCard]?.id ? (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full p-3 border rounded-lg resize-none h-20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
                    <textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full p-3 border rounded-lg resize-none h-24 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-center min-h-64 flex flex-col justify-center">
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Question</h3>
                      <p className="text-lg text-gray-800 leading-relaxed">
                        {flashcards[currentCard]?.question}
                      </p>
                    </div>
                    
                    {showAnswer ? (
                      <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Answer</h3>
                        <p className="text-lg text-green-700 leading-relaxed">
                          {flashcards[currentCard]?.answer}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all active:scale-95"
                      >
                        Show Answer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowAnswer(false)}
                className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={nextCard}
                disabled={currentCard === flashcards.length - 1}
                className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {flashcards.length === 0 && !isGenerating && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Create Your First Flashcard</h3>
            <p className="text-gray-500 text-sm px-4">Choose an input method above to get started with AI-generated flashcards</p>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default MobileFlashcardGenerator;
