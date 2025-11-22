"use client"
import { useState } from "react"
import { Bell, Gamepad2, Heart, Menu, Megaphone, Store, Swords, Trophy, X } from "lucide-react"
import WalletButton from "../wallet-button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import logo from "../../../public/tormet-real-logo-removebg-preview.png"
import Image from "next/image"

const nav = [
    { name: "Matches", icon: <Gamepad2 size={18} />, href: '/match' },
    { name: "Tournaments", icon: <Swords size={18} />, href: '/tournament' },
    { name: "Shop", icon: <Store size={18}/>, href: '/shop' },
    { name: "LeaderBoard", icon: <Trophy size={18} />, href: '/leaderboard' },
    { name: "Organize", icon: <Megaphone size={18}/>, href: '/organize' }
]

const endOptions = [
    { icon: <Heart size={18}/> },
    { icon: <Bell size={18} /> }
]

const Navbar = () => {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <>
            <div className="bg-transparent backdrop-blur-xs ml-0.5 h-12 flex items-center justify-between px-4 lg:px-6">
                <div className="hidden lg:block text-zinc-400 font-semibold">Arena</div>
                
                <div className="lg:hidden">
                    <Link href={'/'}>
                        <Image src={logo} alt="website logo" className="w-10 h-10" />
                    </Link>
                </div>
                <div className="hidden lg:flex ml-4 items-center">
                    {nav.map((item, i) => (
                        <Link 
                            href={item.href} 
                            className={`flex p-3 font-medium gap-1 text-sm items-center ${pathname === item.href ? "text-yellow-500" : "text-white"}`} 
                            key={i}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center">
                        {endOptions.map((item, i) => (
                            <div key={i} className="text-white p-1">
                                {item.icon}
                            </div>
                        ))}
                    </div>
                    
                    <div className="block m-2">
                        <WalletButton />
                    </div>
                    <button 
                        className="lg:hidden text-white p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="lg:hidden bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
                    <div className="flex flex-col">
                        {nav.map((item, i) => (
                            <Link 
                                href={item.href} 
                                className={`flex p-4 font-medium gap-3 text-sm items-center border-b border-gray-800 ${pathname === item.href ? "text-yellow-500 bg-gray-800/50" : "text-white"}`} 
                                key={i}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}

export default Navbar