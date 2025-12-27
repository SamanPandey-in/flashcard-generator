import React from 'react';

const SkeletonLoader = () => {
    return (
        <div className="w-full max-w-2xl mx-auto px-4 perspective-1000 mt-12 animate-fade-in">
            <div className="relative w-full h-[28rem] glass-panel rounded-2xl p-8 flex flex-col justify-between border border-white/5">

                {/* Header Skeleton */}
                <div className="flex justify-between items-start">
                    <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-white/5 animate-pulse"></div>
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse"></div>
                </div>

                {/* Footer Skeleton */}
                <div className="flex justify-center">
                    <div className="h-3 w-32 bg-white/5 rounded animate-pulse"></div>
                </div>
            </div>

            {/* Controls Skeleton */}
            <div className="flex items-center justify-between mt-8">
                <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse"></div>
                <div className="w-32 h-12 rounded-full bg-white/5 animate-pulse"></div>
                <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse"></div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
