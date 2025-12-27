import React, { useState } from 'react';
import { Upload, Mic, Square, Loader2, Settings, Sparkles, ChevronDown } from 'lucide-react';

const InputSection = ({
    activeTab,
    textInput,
    setTextInput,
    handleTextSubmit,
    fileInputRef,
    handleFileUpload,
    isRecording,
    startRecording,
    stopRecording,
    recordingTime,
    isGenerating,
    connectionStatus,
    triggerWiggle
}) => {
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        tone: 'Professional',
        quantity: '10',
        level: 'University'
    });

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        }
    };

    const loadExample = () => {
        const exampleText = `Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. Here, we describe the general principles of photosynthesis and highlight how scientists are studying this natural process to help develop clean fuels and sources of renewable energy.

There are two main types of photosynthetic processes: oxygenic photosynthesis and anoxygenic photosynthesis. The general principles of anoxygenic and oxygenic photosynthesis are very similar, but oxygenic photosynthesis is the most common and is seen in plants, algae and cyanobacteria. During oxygenic photosynthesis, light energy transfers electrons from water (H2O) to carbon dioxide (CO2), to produce carbohydrates.`;
        setTextInput(exampleText);
    };

    // Circular Progress Calculation
    const maxChars = 50000;
    const percentage = Math.min((textInput.length / maxChars) * 100, 100);
    const strokeDasharray = 2 * Math.PI * 10; // r=10
    const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

    return (
        <div className={`w-full max-w-2xl mx-auto px-4 perspective-1000 mb-12 ${triggerWiggle ? 'animate-wiggle' : ''}`}>
            <div className="glass-panel rounded-2xl p-1 transition-all duration-300 bg-black/40 border-white/5 relative overflow-visible">

                {/* Advanced Settings Toggle */}
                <div className="absolute -top-10 right-0 flex justify-end">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5"
                    >
                        <Settings className="w-3 h-3" />
                        {showSettings ? 'Hide Options' : 'Options'}
                    </button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md animate-fade-in grid grid-cols-3 gap-4 rounded-t-xl mx-1 mt-1">
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 block">Tone</label>
                            <div className="relative">
                                <select
                                    value={settings.tone}
                                    onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white appearance-none focus:border-blue-500 focus:outline-none"
                                >
                                    <option>Simple</option>
                                    <option>Professional</option>
                                    <option>Academic</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2 top-2 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 block">Quantity</label>
                            <div className="relative">
                                <select
                                    value={settings.quantity}
                                    onChange={(e) => setSettings({ ...settings, quantity: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white appearance-none focus:border-blue-500 focus:outline-none"
                                >
                                    <option>5 Cards</option>
                                    <option>10 Cards</option>
                                    <option>20 Cards</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2 top-2 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 block">Level</label>
                            <div className="relative">
                                <select
                                    value={settings.level}
                                    onChange={(e) => setSettings({ ...settings, level: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white appearance-none focus:border-blue-500 focus:outline-none"
                                >
                                    <option>High School</option>
                                    <option>University</option>
                                    <option>Expert</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2 top-2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Text Input */}
                {activeTab === 'text' && (
                    <div className="p-6">
                        <div className="relative">
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Paste your notes, articles, or study material here..."
                                className="w-full h-48 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-y transition-all custom-scrollbar glass-input leading-relaxed text-sm font-light"
                            />
                            {!textInput && (
                                <button
                                    onClick={loadExample}
                                    className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 transition-all hover:bg-blue-500/20"
                                >
                                    <Sparkles className="w-3 h-3" /> Try Example
                                </button>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-3 text-xs text-gray-500 px-1">
                            <div className="flex items-center gap-2">
                                {/* Circular Progress */}
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-gray-700" />
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className={`text-blue-500 transition-all duration-300 ${textInput.length > 45000 ? 'text-orange-500' : ''}`} />
                                    </svg>
                                </div>
                                <span>{textInput.length} / 50k chars</span>
                            </div>
                        </div>

                        <button
                            onClick={handleTextSubmit}
                            disabled={!textInput.trim() || isGenerating || connectionStatus === 'failed'}
                            className="mt-6 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98] relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] ${!isGenerating ? 'group-hover:block' : 'hidden'}`}></div>
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {isGenerating ? 'Generating Flashcards...' : 'Generate Flashcards'}
                        </button>
                    </div>
                )}

                {/* PDF Input */}
                {activeTab === 'pdf' && (
                    <div
                        className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-white/10 rounded-xl m-2 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] pointer-events-none">
                            <Upload className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2 pointer-events-none">Upload PDF Document</h3>
                        <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed pointer-events-none">
                            Drag & Drop your PDF here, or click to browse. <br /><span className="text-xs opacity-60">Max size: 25MB</span>
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Voice Input */}
                {activeTab === 'voice' && (
                    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                            {/* Simulated Audio Visualizer */}
                            <div className="flex items-center justify-center gap-1 h-12">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 bg-red-500/50 rounded-full transition-all duration-75 ${isRecording ? 'animate-pulse' : 'h-1'}`}
                                        style={{
                                            height: isRecording ? `${Math.random() * 100}%` : '4px',
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 transform ${isRecording ? 'bg-red-500/20 scale-110 shadow-[0_0_40px_rgba(234,67,53,0.3)]' : 'bg-white/5 border border-white/10 hover:scale-105'
                            }`}>
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isGenerating || connectionStatus === 'failed'}
                                className="w-full h-full flex items-center justify-center rounded-full"
                            >
                                {isRecording ? (
                                    <Square className="w-8 h-8 text-red-500 fill-current" />
                                ) : (
                                    <Mic className="w-8 h-8 text-white/50" />
                                )}
                            </button>
                        </div>

                        {isRecording ? (
                            <div className="mb-4">
                                <div className="text-3xl font-mono text-white mb-2 tracking-widest tabular-nums">
                                    {formatTime(recordingTime)}
                                </div>
                                <p className="text-red-400 text-sm animate-pulse font-medium">Recording active...</p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-gray-400 text-sm">Tap to record lecture notes</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InputSection;
