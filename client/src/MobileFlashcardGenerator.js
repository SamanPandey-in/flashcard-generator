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

  const API_URL = process.env.REACT_APP_API_URL;

  const processContent = async (content, type, file = null) => {
    setIsGenerating(true);

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

      const data = await response.json();
      setFlashcards(prev => [...prev, ...data.flashcards]);
    } catch (error) {
      console.error('Error generating flashcards:', error);
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

  const handleVoiceRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const mockVoiceFile = new File(["voice content"], "voice.wav", { type: "audio/wav" });
        processContent(null, 'voice', mockVoiceFile);
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
      {/* Header and tabs as in your original code */}
      {/* Rest of the UI components (tabs, text/pdf/voice inputs, flashcard rendering) remain unchanged */}
    </div>
  );
};

export default MobileFlashcardGenerator;
