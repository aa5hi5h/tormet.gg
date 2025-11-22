"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import WalletButton from "./wallet-button"
import Navbar from "./navbar"
import NavigationMenus from "./nav/main"
import { StyledString } from "next/dist/build/swc/types"
import Image from "next/image"
import image from "../../public/valo-mobile-1.webp"
import { ArrowLeft, ArrowRight, Check, Circle, Clock, DollarSign, Dot, Github, Heart, MoveRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Game {
  id: string
  name: string
  icon: string
  gradient: string
  description: string
  category: string
  path: string
}

interface HeroImage {
  alt: string,
  url: string
}

interface GameImageProps{
  name: string,
  url: string
}

const Homepage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [bgImages,setBgImages] = useState<HeroImage[]>([])
  const [currentBgIndex,setCurrentBgIndex] = useState<number>(0)
  const [currentIndex,setCurrentIndex] = useState<number>(0)
  const [progressIndex,setProgressIndex]= useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)



  const games = [
    {
      name: "Brawl Stars",
      url: "/bs-mobile.webp",
      href: 'game/brawl'
    },
    {
      name: "Chess",
      url: "/chess-mobile-1.webp",
      href: 'game/chess'
    },
    {
      name: "Counter Strike",
      url: "/cs-1.jpg",
      href: 'game/csgo'
    },
    {
      name: "Clash of Clans",
      url: "/coc-mobile-3.webp",
      href: 'game/coc'
    },
    {
      name: "Clash Royale",
      url: "coc-mobile-2.webp",
      href: 'game/royale'
    },
    {
      name: "Dota",
      url: "/dota.jpeg",
      href: 'game/dota'
    },
    {
      name: "Fortnite",
      url: "/fortnite-mob-1.webp",
      href: 'game/fortnite'
    },
    {
      name: "League of Legends",
      url: "/lol-2.webp",
      href: 'game/lol'
    },
    {
      name: "Pubg PC",
      url: "/pubg.webp",
      href: 'game/pubg_pc'
    },
    {
      name: "Rocket League",
      url: "/rocket-league.webp",
      href: 'game/rl'
    },
    {
      name: "Valorant",
      url: "/valo-mobile-1.webp",
      href: 'game/valo'
    }
  ]


  const next = () => {
    setCurrentIndex((prev) => (prev + 1)% games.length )
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length ) % games.length)
  }

   const getVisibleGames = (count: number) => {
    const visible = []
    for (let i = 0; i < count; i++) {
      visible.push(games[(currentIndex + i) % games.length])
    }
    return visible
  }

  useEffect(() => {
    const interval = setInterval(() => {
      next()
    },2500)

    return () => clearInterval(interval)
  },[])


  const router = useRouter()


  const heroImages: HeroImage[] = [
    {url: '/coc-1.jpg', alt: 'banner image'},
    {url: '/fortnite-2.jpg', alt: 'banner image'},
    {url: '/fortnite-3.jpg', alt: 'banner image'},
    {url: '/fortnite-4.jpg', alt: 'banner image'},
    {url: '/fortnite-5.jpg', alt: 'banner image'},
    {url: '/fortnite-6.jpg', alt: 'banner image'},
    {url: '/fortnite-7.jpg', alt: 'banner image'},
    {url: '/coc-1.jpg', alt: 'banner image'},
    {url: '/coc-2.jpg', alt: 'banner image'},
    {url: '/coc-3.jpg', alt: 'banner image'},
    {url: '/coc-4.jpg', alt: 'banner image'},
    {url: '/coc-5.jpg', alt: 'banner image'},
    {url: '/coc-6.jpg', alt: 'banner image'},
    {url: '/cr-1.jpg', alt: 'banner image'},
    {url: '/cr-2.jpg', alt: 'banner image'},
    {url: '/cr-3.jpg', alt: 'banner image'},
    {url: '/cr-4.jpg', alt: 'banner image'},
    {url: '/cr-5.jpg', alt: 'banner image'},
    {url: '/cr-6.jpg', alt: 'banner image'},
    {url: '/cr-7.jpg', alt: 'banner image'},
    {url: '/cr-8.jpg', alt: 'banner image'},
    {url: '/cr-9.jpg', alt: 'banner image'},
    {url: '/cr-10.jpg', alt: 'banner image'},
    {url: '/bs-1.jpg', alt: 'banner image'},
    {url: '/bs-2.jpg', alt: 'banner image'},
    {url: '/bs-3.jpg', alt: 'banner image'},
    {url: '/bs-4.jpg', alt: 'banner image'},
    {url: '/csgo-1.jpg', alt: 'banner image'},
    {url: '/csgo-2.jpg', alt: 'banner image'},
    {url: '/csgo-3.jpg', alt: 'banner image'},
    {url: '/csgo-4.jpg', alt: 'banner image'},
    {url: '/csgo-5.jpg', alt: 'banner image'},
    {url: '/csgo-6.jpg', alt: 'banner image'},
    {url: '/csgo-7.jpg', alt: 'banner image'},
    {url: '/csgo-8.jpg', alt: 'banner image'},
    {url: '/csgo-9.jpg', alt: 'banner image'},
  ]

  const shuffledArray = (array:HeroImage[]): HeroImage[] => {
    const shuffled = [...array]
    for(let i = shuffled.length - 1 ; i > 0 ; i-- ){
      const j = Math.floor(Math.random() * (i + 1))

      const temp = shuffled[i]
       shuffled[i] = shuffled[j]
       shuffled[j] = temp
    }
    return shuffled
  }

  useEffect(() => {
    setBgImages(shuffledArray(heroImages))
  },[])

  useEffect(() => {
    if(bgImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgImages.length)
    }, 5000)

    return () => clearInterval(interval)
}, [bgImages.length])

const roadmapItems = [
  {
    version: 0.1,
    title: 'Basic Ui setup & Launch',
    status: 'shipped'
  },
  {
    version: 0.1,
    title: 'Initial Game Integration',
    status: 'shipped'
  },
  {
    version: 0.1,
    title: 'Addedd Escrow Logic',
    status: 'shipped'
  },
  {
    version: 0.2,
    title: 'UI Revmap',
    status: 'In Progress'
  },
  {
    version: 0.3,
    title: 'Support All Games',
    status: 'In Progress'
  },
  {
    version : 0.4,
    title: 'Add The LeaderBoard and Organize Tournaments',
    status: "Not Started"
  },
  {
    version: 1.0,
    title: 'Support Trading Of In Game Items',
    status: 'Not Started'
  }
]

useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      const scrollTop = window.scrollY
      const containerTop = container.offsetTop
      const containerHeight = container.offsetHeight
      const windowHeight = window.innerHeight
      const startScroll = containerTop - windowHeight / 2
      const endScroll = containerTop + containerHeight - windowHeight / 2
      const scrollProgress = Math.max(0, Math.min(1, (scrollTop - startScroll) / (endScroll - startScroll)))
      const newIndex = Math.min(Math.floor(scrollProgress * roadmapItems.length), roadmapItems.length - 1)
      setProgressIndex(Math.max(0, newIndex))
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [roadmapItems.length])

  const getStatusColor = (status: string) => {
    if (status === "shipped") return 'green'
    if (status === 'In Progress') return 'yellow'
    return 'gray'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'shipped') return <Check className="w-3 h-3 text-white" strokeWidth={3} />
    if (status === 'In Progress') return <Clock className="w-3 h-3 text-zinc-900" strokeWidth={3} />
    return <Circle className="w-2 h-2 text-zinc-500" />
  }

  

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden">
        {bgImages.length > 0 && bgImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${image.url})` }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-zinc-900" />
        
        <div className="relative z-10 flex flex-col w-full h-full justify-end pb-4 sm:pb-6">
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {bgImages.slice(0, 6).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBgIndex(index)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  index === currentBgIndex 
                    ? 'bg-white w-6 sm:w-8' 
                    : 'bg-white/50 hover:bg-white/80 w-1.5 sm:w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-8 sm:py-12 md:py-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-center leading-tight">
          Battle. <span className="text-[#7C3AED]">Trade.</span> Conquer.<br />
          <span>Stake.</span> <span className="text-[#A855F7]">Win.</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-400 pt-4 sm:pt-6 text-center max-w-xl mx-auto">
          Tormet is designed to become one step for the gaming peeps whether it&apos;s for fun, competing or trading in game items
        </p>
      </div>

      <div 
        className="bg-[#7C3AED] py-12 sm:py-16 md:py-20 lg:py-24 px-4"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 2px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative flex items-center justify-center">
            <button 
              onClick={prev}
              className="absolute left-0 sm:-left-4 md:-left-8 lg:-left-16 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 z-30 rounded-full bg-[#A855F7] hover:bg-[#A855F7]/60 cursor-pointer text-white flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
             <div className="flex sm:hidden items-center justify-center gap-2 px-6">
              {getVisibleGames(3).map((game, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl overflow-hidden shadow-xl transition-transform duration-300 ${
                    i === 1 ? "w-32 h-44 z-20 scale-105" : "w-24 h-36 opacity-75 z-10"
                  }`}
                >
                  <img
                    src={game.url}
                    alt={game.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => router.push(game.href)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                    <p className="text-white text-center font-semibold text-[10px] leading-tight truncate">{game.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:flex lg:hidden items-center justify-center gap-4">
              {getVisibleGames(3).map((game, i) => (
                <div
                  key={i}
                  className={`relative rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 ${
                    i === 1 ? "w-48 h-72 z-20" : "w-36 h-56 opacity-80 z-10"
                  }`}
                >
                  <img
                    src={game.url}
                    alt={game.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => router.push(game.href)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-center font-semibold text-sm">{game.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:flex items-center justify-center gap-6">
              {getVisibleGames(5).map((game, i) => (
                <div
                  key={i}
                  className={`relative rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 ${
                    i === 2 ? "w-72 h-96 z-20" 
                      : i === 1 || i === 3 ? "w-56 h-80 opacity-90 z-10" 
                      : "w-40 h-64 opacity-80 z-5"
                  }`}
                >
                  <img
                    src={game.url}
                    alt={game.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => router.push(game.href)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-center font-semibold">{game.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={next}
              className="absolute right-0 sm:-right-4 md:-right-8 lg:-right-16 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 z-30 rounded-full bg-[#A855F7] cursor-pointer hover:bg-[#A855F7]/80 text-white flex items-center justify-center transition-colors"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border-t border-b border-white/20 py-8 sm:py-10 md:py-12 px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold max-w-4xl mx-auto text-center leading-tight bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
          From weapon skins to character costumes, your marketplace for every in-game item — coming soon
        </h2>
      </div>
      <div 
        ref={containerRef}
        className="bg-zinc-900 py-16 sm:py-24 md:py-32 lg:py-36 px-4 sm:px-6"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 0.3px, transparent 1px)`,
          backgroundSize: '12px 12px'
        }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl text-center pb-12 sm:pb-16 md:pb-18 font-medium">ROADMAP</h2>
        
        <div className="max-w-3xl mx-auto relative px-4 sm:px-8 md:px-12">
          {/* Timeline line */}
          <div className="absolute left-8 sm:left-12 md:left-16 top-0 bottom-0 w-0.5 bg-zinc-700" />
          <div 
            className="absolute left-8 sm:left-12 md:left-16 top-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ height: `${(progressIndex / (roadmapItems.length - 1)) * 100}%` }}
          />
          
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            {roadmapItems.map((item, index) => {
              const isActive = index <= progressIndex
              const itemStatus = getStatusColor(item.status)
              
              return (
                <div key={index} className="relative pl-12 sm:pl-16 md:pl-20">
                  {/* Timeline dot */}
                  <div 
                    className={`absolute left-6 sm:left-10 md:left-14 top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-3 sm:border-4 transition-all duration-500 flex items-center justify-center ${
                      isActive 
                        ? 'border-zinc-900 bg-gradient-to-br from-blue-500 to-purple-500 scale-110' 
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {getStatusIcon(item.status)}
                  </div>

                  <div className={`transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-2 sm:translate-x-4'}`}>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <div className={`inline-block px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                        itemStatus === 'green' ? 'bg-green-500 text-white' 
                          : itemStatus === 'yellow' ? 'bg-yellow-500 text-zinc-900'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        v{item.version}
                      </div>
                      <div className={`text-sm sm:text-base md:text-lg font-medium ${
                        itemStatus === 'green' ? 'text-green-400' 
                          : itemStatus === 'yellow' ? 'text-yellow-400'
                          : 'text-zinc-600'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                      {item.title}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 p-4 sm:p-6">
        <div className="flex sm:flex-row justify-between items-center gap-4">
          <div 
            onClick={() => router.push('https://x.com/de6a5hi5h')} 
            className="flex cursor-pointer gap-2 items-center hover:text-purple-400 transition-colors"
          >
            <p className="text-sm font-medium">Reach Out</p>
            <MoveRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          
          <div className="flex items-center sm:gap-3">
            <Github 
              onClick={() => router.push('https://github.com/aa5hi5h/tormet.gg')} 
              className="w-6 h-6 sm:w-7 sm:h-7 p-1 cursor-pointer border border-white/30 rounded-full hover:border-purple-400 hover:text-purple-400 transition-colors" 
            />
            <Dot className="" />
            <div className="flex items-center gap-1">
              <span>❤️</span>
              <p className="text-sm">Thanks for Visiting!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Homepage