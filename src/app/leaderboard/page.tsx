

import React from 'react';
import { Trophy, Crown, Medal, TrendingUp, Lock, Bell, Award, Star } from 'lucide-react';

const LeaderBoard = () => {
    return (
        <div className="min-h-screen bg-zinc-900">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
                <div 
                    className="absolute inset-0 opacity-30 bg-cover bg-center bg-no-repeat mix-blend-luminosity"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80')",
                    }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/50 to-transparent" />
                
                <div className="relative container mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="space-y-8 z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-600/30 backdrop-blur-sm p-2 rounded-lg">
                                    <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
                                </div>
                                <span className="bg-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                                    RANKINGS
                                </span>
                            </div>
                            <div>
                                <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                                    CLIMB THE<br />
                                    LEADERBOARD
                                </h1>
                                <p className="text-purple-200 text-lg">
                                    Track your progress and compete with the best players in the arena.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <Trophy className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">1</div>
                                        <div className="text-sm text-purple-300">Active players</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <TrendingUp className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">1</div>
                                        <div className="text-sm text-purple-300">Top ranked</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-purple-500/20">
                                    <div className="bg-yellow-500 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center">
                                        1
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold">Current Top Player</div>
                                        <div className="text-purple-300 text-sm">0 XP</div>
                                    </div>
                                    <Crown className="w-6 h-6 text-yellow-400" />
                                </div>

                                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-purple-500/20 opacity-75">
                                    <div className="bg-gray-400 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold">Runner Up</div>
                                        <div className="text-purple-300 text-sm">0 XP</div>
                                    </div>
                                    <Medal className="w-6 h-6 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <div className="relative h-96 lg:h-[500px] z-10">
                            <img 
                                src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80"
                                alt="Champion"
                                className="absolute right-0 h-full object-contain drop-shadow-2xl"
                            />
                            <div className="absolute top-10 right-10 bg-black/60 backdrop-blur-md px-6 py-4 rounded-lg border border-yellow-500/50">
                                <div className="flex items-center gap-3">
                                    <Crown className="w-10 h-10 text-yellow-400" />
                                    <div>
                                        <div className="text-xs text-purple-300 mb-1">YOUR RANK</div>
                                        <div className="text-3xl font-bold text-white">#0</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-10 right-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-lg border border-purple-500/30">
                                <div className="flex items-center gap-3">
                                    <Star className="w-8 h-8 text-purple-400" />
                                    <div>
                                        <div className="text-2xl font-bold text-white">Level 45</div>
                                        <div className="text-xs text-purple-300">Elite Player</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" className="w-full h-auto">
                        <path 
                            fill="#18181b" 
                            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                        />
                    </svg>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm px-6 py-2 rounded-full border border-purple-500/30 mb-6">
                            <Lock className="w-5 h-5 text-purple-400" />
                            <span className="text-purple-300 font-semibold">COMING SOON</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Full Leaderboard System
                        </h2>
                        <p className="text-gray-400 text-lg">
                            We're building a comprehensive ranking system to showcase the best players
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {[
                            {
                                icon: Trophy,
                                title: 'Global Rankings',
                                description: 'Compete with players worldwide and climb to the top',
                                color: 'text-yellow-400'
                            },
                            {
                                icon: Award,
                                title: 'Seasonal Rewards',
                                description: 'Earn exclusive rewards based on your rank each season',
                                color: 'text-purple-400'
                            },
                            {
                                icon: TrendingUp,
                                title: 'Performance Stats',
                                description: 'Detailed analytics and performance tracking over time',
                                color: 'text-blue-400'
                            },
                            {
                                icon: Medal,
                                title: 'Achievement Badges',
                                description: 'Unlock special badges and titles for reaching milestones',
                                color: 'text-pink-400'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-zinc-800 rounded-xl p-6 border border-purple-500/10 hover:border-purple-500/30 transition-all">
                                <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                                <h3 className="text-white font-bold text-xl mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 max-w-3xl mx-auto rounded-2xl via-indigo-900 to-blue-900">
                         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/50 to-transparent" />
                    <div className=" backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 text-center">
                        <Bell className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">
                            Get Notified When Rankings Go Live
                        </h3>
                        <p className="text-purple-300 mb-6 max-w-xl mx-auto">
                            Be among the first to compete when the leaderboard launches
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="flex-1 px-6 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            />
                            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg whitespace-nowrap">
                                Notify Me
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderBoard;