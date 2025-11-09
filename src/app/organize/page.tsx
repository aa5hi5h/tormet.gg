import React from 'react';
import { Users, Calendar, Trophy, Settings, Zap, Shield, BarChart3, Crown, Bell, Lock } from 'lucide-react';

const Organize = () => {
    return (
        <div className="min-h-screen bg-zinc-900">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
                <div 
                    className="absolute inset-0 opacity-30 bg-cover bg-center bg-no-repeat mix-blend-luminosity"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&q=80')",
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
                                    COMING SOON
                                </span>
                            </div>
                            <div>
                                <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                                    HOST YOUR<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                        TOURNAMENTS
                                    </span>
                                </h1>
                                <p className="text-purple-200 text-lg">
                                    Create and manage private tournaments for your community with powerful tools and complete control.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <Users className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">5+</div>
                                        <div className="text-sm text-purple-300">Organizers</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <Trophy className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">0</div>
                                        <div className="text-sm text-purple-300">Events hosted</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-purple-500/20">
                                    <Zap className="w-6 h-6 text-yellow-400" />
                                    <span className="text-white font-semibold">Quick Setup - Launch in minutes</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-purple-500/20">
                                    <Shield className="w-6 h-6 text-green-400" />
                                    <span className="text-white font-semibold">Full Control - Your rules, your way</span>
                                </div>
                            </div>

                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Get Notified at Launch
                            </button>
                        </div>

                        <div className="relative h-96 lg:h-[500px] z-10">
                            <img 
                                src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80"
                                alt="Tournament Organizer"
                                className="absolute right-0 h-full object-contain drop-shadow-2xl"
                            />
                            
                            <div className="absolute top-10 right-10 bg-black/60 backdrop-blur-md px-6 py-4 rounded-lg border border-purple-500/50">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-10 h-10 text-purple-400" />
                                    <div>
                                        <div className="text-xs text-purple-300 mb-1">NEXT EVENT</div>
                                        <div className="text-2xl font-bold text-white">Tomorrow</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-10 right-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-lg border border-green-500/30">
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-8 h-8 text-green-400" />
                                    <div>
                                        <div className="text-2xl font-bold text-white">5 Active</div>
                                        <div className="text-xs text-purple-300">Tournaments</div>
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
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Everything You Need to Host
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Powerful tools to create, manage, and grow your gaming community
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {[
                        {
                            icon: Calendar,
                            title: 'Easy Scheduling',
                            description: 'Set up tournaments with flexible dates, times, and formats that work for your community',
                            color: 'from-purple-600 to-purple-800'
                        },
                        {
                            icon: Users,
                            title: 'Player Management',
                            description: 'Invite players, manage registrations, and organize teams with built-in tools',
                            color: 'from-blue-600 to-blue-800'
                        },
                        {
                            icon: Settings,
                            title: 'Custom Rules',
                            description: 'Configure game modes, scoring systems, and tournament brackets to match your vision',
                            color: 'from-indigo-600 to-indigo-800'
                        },
                        {
                            icon: BarChart3,
                            title: 'Real-time Analytics',
                            description: 'Track participant engagement, match results, and tournament statistics live',
                            color: 'from-pink-600 to-pink-800'
                        },
                        {
                            icon: Shield,
                            title: 'Private & Secure',
                            description: 'Keep your tournaments private or public with customizable privacy settings',
                            color: 'from-violet-600 to-violet-800'
                        },
                        {
                            icon: Trophy,
                            title: 'Prize Management',
                            description: 'Set up prize pools, distribute rewards, and manage winners automatically',
                            color: 'from-fuchsia-600 to-fuchsia-800'
                        }
                    ].map((feature, index) => (
                        <div key={index} className="group relative bg-zinc-800 rounded-xl p-6 hover:transform hover:scale-105 transition-all cursor-pointer border border-zinc-700 hover:border-purple-500/50">
                            <div className="absolute top-4 right-4">
                                <Lock className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className={`bg-gradient-to-br ${feature.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform opacity-50`}>
                                <feature.icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.description}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-gradient-to-br from-[#7C3AED] to-[#A855F7] backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-purple-500/20">
                    <h3 className="text-3xl font-bold text-white text-center mb-12">
                        Start Hosting in 3 Simple Steps
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Create Your Event',
                                description: 'Choose your game, set the format, and configure tournament settings',
                                icon: Calendar
                            },
                            {
                                step: '02',
                                title: 'Invite Players',
                                description: 'Share your tournament link or send invites directly to participants',
                                icon: Users
                            },
                            {
                                step: '03',
                                title: 'Manage & Track',
                                description: 'Monitor matches, update scores, and crown your champions',
                                icon: Trophy
                            }
                        ].map((step, index) => (
                            <div key={index} className="flex flex-col items-center gap-2 text-center">
                                <div className="bg-zinc-800 rounded-xl p-8 border border-purple-500/10">
                                    <step.icon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                                    <h4 className="text-white font-bold text-xl mb-3">{step.title}</h4>
                                    <p className="text-gray-400">{step.description}</p>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>


                <div className="mt-16 text-center">
                     <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 max-w-3xl mx-auto rounded-2xl via-indigo-900 to-blue-900">
                         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/50 to-transparent" />
                    <div className=" backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm px-6 py-2 rounded-full border border-purple-500/30 mb-6">
                            <Lock className="w-5 h-5 text-purple-400" />
                            <span className="text-purple-300 font-semibold">COMING SOON</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Be Among the First to Host
                        </h3>
                        <p className="text-purple-200 text-lg mb-8 max-w-xl mx-auto">
                            Sign up to get early access when tournament hosting launches
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-4">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="flex-1 px-6 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            />
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg whitespace-nowrap flex items-center justify-center gap-2">
                                <Bell className="w-5 h-5" />
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

export default Organize;