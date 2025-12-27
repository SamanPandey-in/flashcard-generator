import React from 'react';
import { FileText, Upload, Mic } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'text', label: 'Text', icon: FileText },
        { id: 'pdf', label: 'PDF', icon: Upload },
        { id: 'voice', label: 'Voice', icon: Mic },
    ];

    return (
        <div className="flex justify-center mb-8 relative z-10">
            <div className="glass-panel p-1.5 rounded-full flex space-x-1 relative">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`relative flex items-center px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 z-10 ${isActive
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] -z-10 animate-fade-in"></div>
                            )}
                            <Icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TabNavigation;
