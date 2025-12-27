import React, { useState } from 'react';
import { MessageCircle, FileText, Brain, X } from 'lucide-react';
import ChatInterface from './ChatInterface';
import SummaryView from './SummaryView';
import QuizView from './QuizView';

const StudySidebar = ({ isOpen, onClose, flashcards, rawContent }) => {
    const [activeView, setActiveView] = useState('menu');
    const [summary, setSummary] = useState('');
    const [quiz, setQuiz] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'https://flashcard-generator-tvst.onrender.com';

    // Prepare context from flashcards or raw content
    const getContext = () => {
        if (flashcards && flashcards.length > 0) {
            return flashcards.map(card => `Q: ${card.question}\nA: ${card.answer}`).join('\n\n');
        }
        return rawContent || '';
    };

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/study/summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: getContext() })
            });
            const data = await response.json();

            if (data.summary) {
                setSummary(data.summary);
                setActiveView('summary');
            } else {
                throw new Error('No summary generated');
            }
        } catch (err) {
            setError('Failed to generate summary. Try again!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/study/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: getContext() })
            });
            const data = await response.json();

            if (data.quiz && Array.isArray(data.quiz)) {
                setQuiz(data.quiz);
                setActiveView('quiz');
            } else {
                throw new Error('No quiz generated');
            }
        } catch (err) {
            setError('Failed to generate quiz. Try again!');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            ></div>

            {/* Sidebar */}
            <div className="relative w-full max-w-md h-full bg-gradient-to-br from-gray-900 to-black shadow-2xl pointer-events-auto animate-fade-in">

                {activeView === 'menu' && (
                    <div className="flex flex-col h-full p-6">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-white">AI Study Buddy</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 flex-1">
                            <button
                                onClick={() => setActiveView('chat')}
                                disabled={!getContext()}
                                className="w-full p-6 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border border-blue-500/30 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <MessageCircle className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-semibold text-white mb-1">Chat</h3>
                                <p className="text-sm text-gray-400">Ask questions about your study material</p>
                            </button>

                            <button
                                onClick={handleGenerateSummary}
                                disabled={isLoading || !getContext()}
                                className="w-full p-6 bg-gradient-to-r from-green-600/20 to-green-500/20 hover:from-green-600/30 hover:to-green-500/30 border border-green-500/30 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <FileText className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-semibold text-white mb-1">Cheat Sheet</h3>
                                <p className="text-sm text-gray-400">Generate a quick summary</p>
                            </button>

                            <button
                                onClick={handleGenerateQuiz}
                                disabled={isLoading || !getContext()}
                                className="w-full p-6 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Brain className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-semibold text-white mb-1">Mock Exam</h3>
                                <p className="text-sm text-gray-400">Test yourself with 10 MCQs</p>
                            </button>
                        </div>

                        {!getContext() && (
                            <p className="text-center text-gray-500 text-sm mt-4">
                                Generate flashcards first to unlock Study Buddy features!
                            </p>
                        )}
                    </div>
                )}

                {activeView === 'chat' && (
                    <ChatInterface context={getContext()} onClose={() => setActiveView('menu')} />
                )}

                {activeView === 'summary' && (
                    <SummaryView summary={summary} onClose={() => setActiveView('menu')} />
                )}

                {activeView === 'quiz' && quiz.length > 0 && (
                    <QuizView quiz={quiz} onClose={() => setActiveView('menu')} />
                )}
            </div>
        </div>
    );
};

export default StudySidebar;
