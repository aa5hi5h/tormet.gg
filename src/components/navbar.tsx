import { redirect } from "next/dist/server/api-utils"
import WalletButton from "./wallet-button"
import Link from "next/link"


const Navbar = () => {


    return (
        <div>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href={"/"}>
                        <div className="flex items-center gap-2 group cursor-pointer">
                          <div className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                            ⚔️
                          </div>
                          <span className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                            TORMET
                          </span>
                        </div>
                        </Link>
            
                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-8">
                          <a href="#games-section" className="text-gray-300 hover:text-white transition-colors font-medium">
                            Games
                          </a>
                          <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors font-medium">
                            How It Works
                          </a>
                          <a href="#tournaments" className="text-gray-300 hover:text-white transition-colors font-medium">
                            Tournaments
                          </a>
                          <a href="#leaderboard" className="text-gray-300 hover:text-white transition-colors font-medium">
                            Leaderboard
                          </a>
                        </div>
            
                        {/* Connect Wallet Button */}
                        <div className="flex items-center gap-4">
                            <WalletButton />
                          
                          {/* Mobile Menu Button */}
                          <button className="md:hidden p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </nav>
        </div>
    )
}

export default Navbar