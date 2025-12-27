import React from 'react';
import { RotateCcw } from 'lucide-react';

const Flashcard = ({ card, isFlipped, onFlip }) => {
    return (
        <div className="w-full h-[28rem] perspective-1000 cursor-pointer group" onClick={onFlip}>
            <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* Front Face (Question) */}
                <div className="absolute w-full h-full glass-panel rounded-2xl p-8 flex flex-col justify-between backface-hidden shadow-2xl shadow-black/50 border border-white/10 group-hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            QUESTION
                        </span>
                        <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                    </div>

                    <div className="flex-1 flex items-center justify-center my-4">
                        <h3 className="text-2xl md:text-3xl font-medium text-white leading-relaxed text-center glow-text">
                            {card.question}
                        </h3>
                    </div>

                    <div className="flex justify-center">
                        <span className="text-xs text-gray-500 flex items-center gap-2">
                            <RotateCcw className="w-3 h-3" /> Tap to reveal answer
                        </span>
                    </div>
                </div>

                {/* Back Face (Answer) */}
                <div className="absolute w-full h-full glass-panel rounded-2xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl shadow-black/50 border-t-4 border-t-green-500 bg-black/40">
                    <div className="flex justify-between items-start">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                            ANSWER
                        </span>
                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>

                    <div className="flex-1 flex items-center justify-center my-4 overflow-y-auto custom-scrollbar">
                        <p className="text-lg md:text-xl text-gray-200 leading-relaxed text-center px-4">
                            {card.answer}
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <span className="text-xs text-gray-500">
                            Tap to see question
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Flashcard;
