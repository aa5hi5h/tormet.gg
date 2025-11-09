import React from 'react';
import { ShoppingBag, Lock, Bell, Sparkles, Package, Tag, Star, Crown } from 'lucide-react';

const ShopPage = () => {
    return (
        <div className="min-h-screen bg-zinc-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
                {/* Background Image - Blended */}
                <div 
                    className="absolute inset-0 opacity-30 bg-cover bg-center bg-no-repeat mix-blend-luminosity"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80')",
                    }}
                />
                
                {/* Gradient Overlay for better blending */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/50 to-transparent" />
                
                {/* Content Container */}
                <div className="relative container mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Left Section - Text and Stats */}
                        <div className="space-y-8 z-10">
                            {/* Badge */}
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-600/30 backdrop-blur-sm p-2 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                                </div>
                                <span className="bg-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                                    COMING SOON
                                </span>
                            </div>

                            {/* Main Title */}
                            <div>
                                <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                                    EXCLUSIVE<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                        SHOP ITEMS
                                    </span>
                                </h1>
                                <p className="text-purple-200 text-lg">
                                    Get ready for an epic collection of skins, items, and exclusive collectibles.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <Package className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">500+</div>
                                        <div className="text-sm text-purple-300">Items ready</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/30 p-3 rounded-lg backdrop-blur-sm">
                                        <Crown className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white">50+</div>
                                        <div className="text-sm text-purple-300">Exclusive skins</div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Highlights */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-purple-500/20">
                                    <Star className="w-6 h-6 text-yellow-400" />
                                    <span className="text-white font-semibold">Rare & Limited Edition Items</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-purple-500/20">
                                    <Tag className="w-6 h-6 text-green-400" />
                                    <span className="text-white font-semibold">Exclusive Launch Discounts</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notify Me at Launch
                            </button>
                        </div>

                        {/* Right Section - Visual */}
                        <div className="relative h-96 lg:h-[500px] z-10">
                            <img 
                                src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80"
                                alt="Shop Items"
                                className="absolute right-0 h-full object-contain drop-shadow-2xl"
                            />
                            
                            {/* Floating Item Card 1 */}
                            <div className="absolute top-10 right-10 bg-black/60 backdrop-blur-md px-6 py-4 rounded-lg border border-purple-500/50 transform hover:scale-105 transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-12 h-12 rounded-lg flex items-center justify-center">
                                        <ShoppingBag className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-purple-300 mb-1">LEGENDARY</div>
                                        <div className="text-lg font-bold text-white">$24.99</div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Item Card 2 */}
                            <div className="absolute bottom-10 right-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-lg border border-yellow-500/30 transform hover:scale-105 transition-transform">
                                <div className="flex items-center gap-3">
                                    <Crown className="w-8 h-8 text-yellow-400" />
                                    <div>
                                        <div className="text-xl font-bold text-white">Epic Skin</div>
                                        <div className="text-xs text-purple-300">Coming Soon</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Wave Effect */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" className="w-full h-auto">
                        <path 
                            fill="#18181b" 
                            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                        />
                    </svg>
                </div>
            </div>

            {/* Preview Section */}
            <div className="container mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm px-6 py-2 rounded-full border border-purple-500/30 mb-6">
                        <Lock className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-300 font-semibold">SHOP PREVIEW</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        What's Coming to the Shop
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Premium items, exclusive skins, and limited edition collectibles
                    </p>
                </div>

                {/* Item Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        {
                            title: 'Weapon Skins',
                            price: '$2.99 - $49.99',
                            image: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=400&q=80',
                            rarity: 'RARE',
                            color: 'from-blue-600 to-cyan-600'
                        },
                        {
                            title: 'Character Skins',
                            price: '$9.99 - $59.99',
                            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
                            rarity: 'EPIC',
                            color: 'from-purple-600 to-pink-600'
                        },
                        {
                            title: 'Emotes & Dances',
                            price: '$1.99 - $19.99',
                            image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&q=80',
                            rarity: 'COMMON',
                            color: 'from-green-600 to-emerald-600'
                        },
                        {
                            title: 'Battle Pass',
                            price: '$9.99/season',
                            image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&q=80',
                            rarity: 'LEGENDARY',
                            color: 'from-yellow-600 to-orange-600'
                        }
                    ].map((item, index) => (
                        <div key={index} className="group relative bg-zinc-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all cursor-pointer border border-zinc-700 hover:border-purple-500/50">
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden">
                                <div 
                                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity group-hover:scale-110 duration-500"
                                    style={{ backgroundImage: `url('${item.image}')` }}
                                />
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-60`} />
                                
                                {/* Rarity Badge */}
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-white text-xs font-bold">{item.rarity}</span>
                                </div>

                                {/* Lock Icon */}
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm p-2 rounded-full">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-purple-400 font-bold text-sm">{item.price}</span>
                                    <span className="text-gray-500 text-xs">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Featured Item Showcase */}
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-purple-500/20 mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <div className="inline-block bg-yellow-600/20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-500/30 mb-4">
                                <span className="text-yellow-400 font-semibold text-sm">⚡ LAUNCH EXCLUSIVE</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Legendary Starter Pack
                            </h3>
                            <p className="text-purple-200 mb-6">
                                Be among the first to grab our exclusive launch bundle featuring rare skins, items, and premium currency at a special price.
                            </p>
                            <div className="flex items-center gap-6 mb-6">
                                <div>
                                    <div className="text-gray-400 text-sm line-through mb-1">$79.99</div>
                                    <div className="text-3xl font-bold text-white">$49.99</div>
                                </div>
                                <div className="bg-red-600/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/30">
                                    <span className="text-red-400 font-bold">Save 37%</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                                    <Crown className="w-5 h-5 text-yellow-400" />
                                    <span className="text-white text-sm">5 Legendary Skins</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    <span className="text-white text-sm">3000 Premium Coins</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-64 lg:h-80">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-3xl" />
                            <div className="relative h-full flex items-center justify-center">
                                <Lock className="w-32 h-32 text-purple-400/50" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter Signup */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 max-w-3xl mx-auto rounded-2xl via-indigo-900 to-blue-900">
                         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/50 to-transparent" />
                <div className="backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
                    <Bell className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        Get Notified When Shop Goes Live
                    </h3>
                    <p className="text-purple-300 mb-6 max-w-xl mx-auto">
                        Be the first to access exclusive items and launch discounts
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="flex-1 px-6 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg whitespace-nowrap">
                            Notify Me
                        </button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopPage;