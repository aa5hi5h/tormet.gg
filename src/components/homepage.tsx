"use client"
import { useState } from "react"
import Link from "next/link"

interface Game {
  id: string
  name: string
  icon: string
  gradient: string
  description: string
  category: string
  path: string
}

const Homepage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const games: Game[] = [
    // Battle Royale
    {
      id: 'pubg',
      name: 'PUBG PC',
      icon: '🎯',
      gradient: 'from-amber-700 via-orange-600 to-yellow-600',
      description: 'Battle Royale • Survival • Winner Winner',
      category: 'Battle Royale',
      path: '/pubg_pc'
    },
    {
      id: 'fortnite',
      name: 'Fortnite',
      icon: '🏗️',
      gradient: 'from-purple-700 via-blue-600 to-cyan-500',
      description: 'Build • Battle • Victory Royale',
      category: 'Battle Royale',
      path: '/fortnite'
    },
    
    // FPS/Shooters
    {
      id: 'csgo',
      name: 'CS:GO / CS2',
      icon: '🔫',
      gradient: 'from-orange-600 via-yellow-500 to-red-600',
      description: 'Tactical FPS • Competitive • Strategic',
      category: 'FPS',
      path: '/csgo'
    },
    {
      id: 'valorant',
      name: 'Valorant',
      icon: '⚡',
      gradient: 'from-red-600 via-pink-500 to-rose-600',
      description: 'Tactical Shooter • Abilities • Precision',
      category: 'FPS',
      path: '/valo'
    },
    
    // MOBA
    {
      id: 'lol',
      name: 'League of Legends',
      icon: '⚔️',
      gradient: 'from-blue-700 via-cyan-600 to-teal-500',
      description: 'MOBA • Strategy • Teamwork',
      category: 'MOBA',
      path: '/lol'
    },
    {
      id: 'dota2',
      name: 'Dota 2',
      icon: '🛡️',
      gradient: 'from-red-700 via-orange-600 to-amber-500',
      description: 'MOBA • Complex • Competitive',
      category: 'MOBA',
      path: '/dota'
    },
    
    // Mobile Games
    {
      id: 'clashroyale',
      name: 'Clash Royale',
      icon: '👑',
      gradient: 'from-blue-600 via-purple-600 to-pink-500',
      description: 'Strategy • Cards • Real-time',
      category: 'Mobile',
      path: '/royale'
    },
    {
      id: 'clashofclans',
      name: 'Clash of Clans',
      icon: '🏰',
      gradient: 'from-orange-600 via-yellow-600 to-amber-700',
      description: 'Clan Wars • Strategy • Build',
      category: 'Mobile',
      path: '/coc'
    },
    {
      id: 'brawlstars',
      name: 'Brawl Stars',
      icon: '🌟',
      gradient: 'from-yellow-500 via-orange-500 to-red-600',
      description: 'Action • Brawlers • Fast-paced',
      category: 'Mobile',
      path: '/brawl'
    },
    
    // Sports/Racing
    {
      id: 'rocketleague',
      name: 'Rocket League',
      icon: '🚗',
      gradient: 'from-blue-600 via-cyan-500 to-green-500',
      description: 'Soccer • Cars • Aerial Goals',
      category: 'Sports',
      path: '/rl'
    },
    
    // Strategy
    {
      id: 'chess',
      name: 'Chess',
      icon: '♟️',
      gradient: 'from-gray-800 via-gray-600 to-gray-900',
      description: 'Strategy • Classic • Timeless',
      category: 'Strategy',
      path: '/chess'
    }
  ]

  const categories = ['all', 'Battle Royale', 'FPS', 'MOBA', 'Mobile', 'Sports', 'Strategy']

  const filteredGames = selectedCategory === 'all' 
    ? games 
    : games.filter(game => game.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="p-2 h-[60vh] w-full">
        <div className="flex flex-col w-full h-full pt-4 md:pt-32 justify-center">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Join Games, Play Matches
            </div>
            <div className="text-2xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Organize Tournaments, Earn SOL
            </div>
            <p className="text-lg text-gray-300 mb-8">
              Compete in your favorite games, wager SOL, and win big! 🎮
            </p>
          </div>
          
          <div className="flex justify-center items-center w-full gap-4">
            <button 
              onClick={() => document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="p-3 px-8 rounded-2xl border border-slate-400 bg-slate-400 hover:cursor-pointer hover:bg-slate-300 font-semibold transition-all hover:scale-105"
            >
              Explore Games
            </button>
            <button className="p-3 px-8 rounded-2xl border border-blue-400 bg-blue-400 hover:cursor-pointer hover:bg-blue-300 font-semibold transition-all hover:scale-105">
              Create Match
            </button>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div id="games-section" className="max-w-7xl mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Choose Your Game</h2>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <Link
              key={game.id}
              href={game.path}
              className="group"
            >
              <div className={`
                relative overflow-hidden rounded-2xl p-6 h-48
                bg-gradient-to-br ${game.gradient}
                border border-white/10
                transform transition-all duration-300
                hover:scale-105 hover:shadow-2xl
                cursor-pointer
              `}>
                {/* Icon */}
                <div className="absolute top-4 right-4 text-6xl opacity-20 group-hover:opacity-40 transition-opacity">
                  {game.icon}
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{game.icon}</span>
                      <div>
                        <h3 className="text-2xl font-bold">{game.name}</h3>
                        <p className="text-xs text-white/80 mt-1">{game.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      {game.category}
                    </span>
                    <span className="text-sm font-semibold group-hover:translate-x-1 transition-transform">
                      Play Now →
                    </span>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {games.length}+
            </div>
            <div className="text-gray-400 mt-2">Games Available</div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              24/7
            </div>
            <div className="text-gray-400 mt-2">Auto Winner Detection</div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              5%
            </div>
            <div className="text-gray-400 mt-2">Platform Fee</div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎮</div>
              <div className="font-semibold mb-2">1. Choose Game</div>
              <div className="text-sm text-gray-400">Select from {games.length}+ supported games</div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <div className="font-semibold mb-2">2. Set Wager</div>
              <div className="text-sm text-gray-400">Create or join a match with SOL</div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">⚔️</div>
              <div className="font-semibold mb-2">3. Play & Compete</div>
              <div className="text-sm text-gray-400">Battle it out in your game</div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">🏆</div>
              <div className="font-semibold mb-2">4. Win SOL</div>
              <div className="text-sm text-gray-400">Auto payout to winner instantly</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Homepage