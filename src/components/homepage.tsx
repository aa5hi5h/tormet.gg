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
      href: '/brawl'
    },
    {
      name: "Chess",
      url: "/chess-mobile-1.webp",
      href: '/chess'
    },
    {
      name: "Counter Strike",
      url: "/cs-1.jpg",
      href: '/csgo'
    },
    {
      name: "Clash of Clans",
      url: "/coc-mobile-3.webp",
      href: '/coc'
    },
    {
      name: "Clash Royale",
      url: "coc-mobile-2.webp",
      href: '/royale'
    },
    {
      name: "Dota",
      url: "/dota.jpeg",
      href: '/dota'
    },
    {
      name: "Fortnite",
      url: "/fortnite-mob-1.webp",
      href: '/fortnite'
    },
    {
      name: "League of Legends",
      url: "/lol-2.webp",
      href: '/lol'
    },
    {
      name: "Pubg PC",
      url: "/pubg.webp",
      href: '/pubg_pc'
    },
    {
      name: "Rocket League",
      url: "/rocket-league.webp",
      href: '/rl'
    },
    {
      name: "Valorant",
      url: "/valo-mobile-1.webp",
      href: '/valo'
    }
  ]


  const next = () => {
    setCurrentIndex((prev) => (prev + 1)% games.length )
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length ) % games.length)
  }

  const getVisibleGames = () => {
    const visible = []
    for ( let i = 0 ; i < 5 ; i++){
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
    if (!containerRef.current) return;
    const container = containerRef.current
    const scrollTop = window.scrollY
    const containerTop = container.offsetTop;
     const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;

    const startScroll = containerTop - windowHeight / 2;
      const endScroll = containerTop + containerHeight - windowHeight / 2;
      const scrollProgress = Math.max(0, Math.min(1, (scrollTop - startScroll) / (endScroll - startScroll)));

      const newIndex = Math.min(
        Math.floor(scrollProgress * roadmapItems.length),
        roadmapItems.length - 1 
      );
      
      setProgressIndex(Math.max(0,newIndex))
  }
   window.addEventListener('scroll', handleScroll);
   handleScroll()

   return () => window.removeEventListener('scroll', handleScroll)
},[roadmapItems.length])


const getStatusColor = (status:string) => {
  if(status === "shipped") return 'green';
  if(status === 'In Progress') return 'yellow';
  return 'gray'
}

const getStatusIcon = (status: string) => {
  if(status === 'shipped') return <Check className="w-3 h-3 text-white" strokeWidth={3} />;
  if(status === 'In Progress') return <Clock className="w-3 h-3 text-zinc-900" strokeWidth={3} />;
  return <Circle className="w-2 h-2 text-zinc-500" />
}

  return (
    <div className="min-h-screen  bg-zinc-900 text-white">
      <div className="relative  p-2 h-[80vh] rounded w-full overflow-hidden">
        {bgImages.length > 0 && bgImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentBgIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${image.url})`,
            }}
          />
        ))}

        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

        {/* Content */}
        <div className="relative z-10  flex flex-col w-full h-full pt-4  justify-center">
          {/* Background Indicator Dots */}
          <div className="flex justify-center gap-2 pb-4 mt-auto ">
            {bgImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBgIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentBgIndex 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="text-5xl pt-4 md:text-6xl font-semibold tracking-tight text-center leading-tight">
  Battle. <span className="text-[#7C3AED]">Trade.</span> Conquer.<br />
  <span>Stake.</span> <span className="text-[#A855F7]">Win.</span><br />
</div>
<p className="text-xl text-gray-400 p-4 pb-12 text-center max-w-xl mx-auto">Tormet is designed to become one step for the gaming peeps wether it&apos;s for fun,competing or trading in game items</p>
       
  
  <div className="bg-[#7C3AED] p-24 flex flex-col justify-center items-center px-4"
  style={{
    backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 2px, transparent 1px)`,
    backgroundSize: '24px 24px'
  }}>
    <div className="max-w-5xl mx-auto">
      <div className="relative flex items-center gap-6">
        <button onClick={prev}
        className="absolute -left-16 w-12 h-12 z-10 rounded-full bg-[#A855F7] hover:bg-[#A855F7]/60 cursor-pointer text-white flex items-center justify-center transition-colors">
          <ArrowLeft />
          </button>
          <div className="flex items-center w-full gap-6 justify-center">
            {getVisibleGames().map((game,_) => (
               <div
                key={_}
                className= {`relative  rounded-3xl overflow-hidden shadow-2xl  hover:scale-105 transition-transform duration-300
                  ${_ === 2 ? "w-72 h-96 z-20" 
                    : _ === 1 || _ === 3
                  ? "w-56 h-80 opacity-90 z-10" :  " w-40 h-64 opacity-80 z-5"}`}
              >
                <img
                  src={game.url}
                  alt={game.name}
                  className="w-full h-full cursor-pointer object-cover"
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
          className="absolute -right-16 w-12 h-12 z-10 rounded-full bg-[#A855F7] cursor-pointer hover:bg-[#A855F7]/80 text-white flex items-center justify-center transition-colors">
            <ArrowRight />
          </button>
      </div>
    </div>
  </div>

  <div className="bg-zinc-900 border-t-1 border-b-1 border-white p-12">
    <h1 className="text-4xl md:text-3xl font-bold max-w-4xl mx-auto text-center leading-tight bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
  From weapon skins to character  costumes, your marketplace for every in-game item — coming soon
</h1>
  </div>

<div className="bg-zinc-900  pt-36 pb-36 p-12 "
ref={containerRef}
style={{
    backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 0.3px, transparent 1px)`,
    backgroundSize: '12px 12px'
  }}>
  <h2 className="text-5xl text-center pb-18 font-medium">ROADMAP</h2>
  <div className="max-w-3xl justify-center pt-12 pl-44 mx-auto relative">
          <div className="absolute left-52 top-0 bottom-0 w-0.5 bg-zinc-700" />
          <div 
            className="absolute left-52 top-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ 
              height: `${(progressIndex / (roadmapItems.length - 1)) * 100}%`
            }}
          />
          <div className="space-y-12">
            {roadmapItems.map((item, index) => {
              const isActive = index <= progressIndex;
              const isCurrent = index === progressIndex;
               const itemStatus = getStatusColor(item.status);
              const isScrollActive = index <= progressIndex;
              
              return (
                <div key={index} className="relative pl-24">
<div 
                    className={`absolute left-6 top-2 w-5 h-5 rounded-full border-4 transition-all duration-500 ${
                      isActive 
                        ? 'border-zinc-900 bg-gradient-to-br from-blue-500 to-purple-500 scale-110' 
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {getStatusIcon(item.status)}
                    </div>
                  </div>

                  <div 
                    className={`transition-all duration-500 ${
                      isActive ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-4'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        itemStatus === 'green'
                          ? 'bg-green-500 text-white' 
                          : itemStatus === 'yellow'
                          ? 'bg-yellow-500 text-zinc-900'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        v{item.version}
                      </div>
                      <div className={`text-lg font-medium ${
                        itemStatus === 'green'
                          ? 'text-green-400' 
                          : itemStatus === 'yellow'
                          ? 'text-yellow-400'
                          : 'text-zinc-600'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    <h3 className={`text-2xl font-bold ${
                      isActive ? 'text-white' : 'text-zinc-600'
                    }`}>
                      {item.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
  </div>      
  <div className="border-t-1 p-6 border-white">
    <div className="flex justify-between   items-center">
      <div onClick={() => router.push('https://x.com/de6a5hi5h')} className="flex cursor-pointer gap-2 items-center">
        <p className="text-sm font-medium">Reach Out</p><span><MoveRight className="w-6 h-6" /></span>
        </div>
         <div className="flex items-center gap-2">
      <Github onClick={() => router.push('https://github.com/aa5hi5h/tormet.gg')} className="w-7 h-7 p-1 cursor-pointer border-1 rounded-full " />
      <Dot />
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