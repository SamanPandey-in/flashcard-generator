import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SummaryView = ({ summary, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-black/40 text-white rounded-xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-semibold text-green-400">Cheat Sheet Summary</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">Close</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-gray-200 leading-relaxed">
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-blue-300 mb-3 mt-5" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-green-300 mb-2 mt-4" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 my-4 ml-2" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 my-4 ml-2" {...props} />,
                                li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-3 text-gray-200" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                em: ({ node, ...props }) => <em className="italic text-blue-200" {...props} />,
                                code: ({ node, ...props }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-blue-300" {...props} />,
                            }}
                        >
                            {summary}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryView;
