import React from 'react';
import { Clock, User } from 'lucide-react';

const Header = ({ connectionStatus }) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
            <div className="max-w-4xl mx-auto glass-panel rounded-xl px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <span className="font-mono text-sm">FG</span>
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">FlashGen</span>
                </h1>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5 transition-all hover:bg-black/30">
                        <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-breathe' :
                                connectionStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                            {connectionStatus === 'connected' ? 'System Online' :
                                connectionStatus === 'failed' ? 'Offline' : 'Connecting'}
                        </span>
                    </div>

                    <div className="w-px h-4 bg-white/10 mx-2"></div>

                    <button className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                        <Clock className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                        <User className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;
