import React from 'react';
import { Trophy, Target, Users, Award } from 'lucide-react';

const MatchPage = () => {
    return (
        <div className="min-h-screen bg-zinc-900">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
                <div 
                    className="absolute inset-0 opacity-40 bg-cover bg-center bg-no-repeat mix-blend-luminosity"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/50 to-transparent" />

                <div className="relative container mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="space-y-8 z-10">
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded">
                                    LIVE NOW
                                </span>
                                <span className="text-purple-300 text-sm">Season 1</span>
                            </div>

                            <div>
                                <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                                    COMPETE IN<br />
                                    EPIC MATCHES
                                </h1>
                                <p className="text-purple-200 text-lg">
                                    Compete in epic games on Tormet&apos;s Arena.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <Trophy className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">12</div>
                                        <div className="text-sm text-purple-300">Matches played</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <Target className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">3</div>
                                        <div className="text-sm text-purple-300">Tournaments held</div>
                                    </div>
                                </div>
                            </div>
                            <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                                Join Tournament
                            </button>
                        </div>

                        <div className="relative h-96 lg:h-[500px] z-10">
                            <img 
                                src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80"
                                alt="Gaming Character"
                                className="absolute right-0 h-full object-contain drop-shadow-2xl"
                            />

                            <div className="absolute bottom-10 right-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-lg border border-purple-500/30">
                                <div className="flex items-center gap-3">
                                    <Award className="w-8 h-8 text-yellow-400" />
                                    <div>
                                        <div className="text-2xl font-bold text-white">565</div>
                                        <div className="text-xs text-purple-300">Your Rank</div>
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
                <h2 className="text-3xl font-bold text-white mb-8">Featured Tournaments</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="bg-zinc-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all cursor-pointer">
                            <div className="relative h-48 bg-gradient-to-br from-purple-600 to-blue-600">
                                
                                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                    LIVE
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-white font-bold mb-2">Winter 2025 Tournament</h3>
                                <p className="text-gray-400 text-sm mb-4">Compete with your friends</p>
                                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded transition-colors">
                                    Join Tournament
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MatchPage;