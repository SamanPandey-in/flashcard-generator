import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Menu, Shuffle, Download, Trash2, Edit3 } from 'lucide-react';
import Flashcard from './Flashcard';

const FlashcardDeck = ({
    flashcards,
    currentCard,
    setCurrentCard,
    nextCard,
    prevCard,
    shuffleCards,
    deleteCard,
    startEdit,
    exportFlashcards
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Reset flip when card changes
    useEffect(() => {
        setIsFlipped(false);
    }, [currentCard, flashcards]);

    if (!flashcards.length) return null;

    const card = flashcards[currentCard];

    return (
        <div className="w-full max-w-2xl mx-auto px-4 pb-20">
            {/* Deck Controls Header */}
            <div className="flex items-center justify-between mb-4 text-gray-400">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                        Card {currentCard + 1} <span className="text-gray-600">/</span> {flashcards.length}
                    </span>
                    {card.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded border ${card.difficulty === 'Easy' ? 'border-green-500/30 text-green-500' :
                                card.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-500' :
                                    'border-red-500/30 text-red-500'
                            }`}>
                            {card.difficulty}
                        </span>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-white"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-xl border border-white/10 z-20 py-2 bg-[#1a1a1e]">
                            <button onClick={() => { startEdit(card); setShowMenu(false); }} className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                <Edit3 className="w-4 h-4 mr-3" /> Edit Card
                            </button>
                            <button onClick={() => { shuffleCards(); setShowMenu(false); }} className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                <Shuffle className="w-4 h-4 mr-3" /> Shuffle Deck
                            </button>
                            <button onClick={() => { exportFlashcards(); setShowMenu(false); }} className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                <Download className="w-4 h-4 mr-3" /> Export JSON
                            </button>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button onClick={() => { deleteCard(card.id); setShowMenu(false); }} className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="w-4 h-4 mr-3" /> Delete Card
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* The Flashcard */}
            <Flashcard
                card={card}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
            />

            {/* Navigation Bar */}
            <div className="flex items-center justify-between mt-8">
                <button
                    onClick={prevCard}
                    disabled={currentCard === 0}
                    className="glass-button p-4 rounded-full disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
                </button>

                <button
                    onClick={() => { setCurrentCard(0); setIsFlipped(false); }}
                    className="glass-button px-6 py-3 rounded-full flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-all"
                >
                    <RotateCcw className="w-4 h-4" /> Reset Deck
                </button>

                <button
                    onClick={nextCard}
                    disabled={currentCard === flashcards.length - 1}
                    className="glass-button p-4 rounded-full disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
                </button>
            </div>
        </div>
    );
};

export default FlashcardDeck;
