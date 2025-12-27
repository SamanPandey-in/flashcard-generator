import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Award } from 'lucide-react';

const QuizView = ({ quiz, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);

    const handleAnswer = (questionId, answer) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (currentQuestion < quiz.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResults(true);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const calculateScore = () => {
        let correct = 0;
        quiz.forEach(q => {
            if (selectedAnswers[q.id] === q.correctAnswer) correct++;
        });
        return correct;
    };

    const score = calculateScore();
    const percentage = Math.round((score / quiz.length) * 100);

    if (showResults) {
        return (
            <div className="flex flex-col h-full bg-black/40 text-white rounded-xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-md">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-semibold text-purple-400 flex items-center gap-2">
                        <Award className="w-5 h-5" /> Quiz Results
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">Close</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="text-center mb-8">
                        <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {percentage}%
                        </div>
                        <p className="text-gray-400">You scored {score} out of {quiz.length}</p>
                    </div>

                    <div className="space-y-4">
                        {quiz.map((q, idx) => {
                            const userAnswer = selectedAnswers[q.id];
                            const isCorrect = userAnswer === q.correctAnswer;

                            return (
                                <div key={q.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-start gap-2 mb-2">
                                        {isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium mb-1">Q{idx + 1}: {q.question}</p>
                                            <p className="text-xs text-gray-400">Your answer: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{userAnswer || 'Not answered'}</span></p>
                                            {!isCorrect && <p className="text-xs text-green-400">Correct answer: {q.correctAnswer}</p>}
                                            <p className="text-xs text-gray-300 mt-2 italic">{q.explanation}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const question = quiz[currentQuestion];
    const selectedAnswer = selectedAnswers[question.id];

    return (
        <div className="flex flex-col h-full bg-black/40 text-white rounded-xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-semibold text-purple-400">Mock Exam</h3>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">Question {currentQuestion + 1}/{quiz.length}</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">Close</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h4 className="text-lg font-medium mb-4">{question.question}</h4>

                <div className="space-y-2">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(question.id, option)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${selectedAnswer === option
                                    ? 'bg-blue-600/20 border-blue-500 text-white'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                }`}
                        >
                            <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                    Previous
                </button>
                <button
                    onClick={handleNext}
                    disabled={!selectedAnswer}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {currentQuestion === quiz.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default QuizView;
