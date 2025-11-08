"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import WalletButton from "./wallet-button"
import Navbar from "./navbar"
import NavigationMenus from "./nav/main"
import { StyledString } from "next/dist/build/swc/types"
import Image from "next/image"
import image from "../../public/valo-mobile-1.webp"
import { ArrowLeft, ArrowRight } from "lucide-react"

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



  const games = [
    {
      name: "Brawl Stars",
      url: "/bs-mobile.webp"
    },
    {
      name: "Chess",
      url: "/chess-mobile-1.webp"
    },
    {
      name: "Counter Strike",
      url: "/cs-1.jpg"
    },
    {
      name: "Clash of Clans",
      url: "/coc-mobile-2.webp"
    },
    {
      name: "Clash Royale",
      url: "coc-mobile-3.webp"
    },
    {
      name: "Dota",
      url: "/dota.jpeg"
    },
    {
      name: "Fortnite",
      url: "/fortnite-mob-1.webp"
    },
    {
      name: "League of Legends",
      url: "/lol-2.webp"
    },
    {
      name: "Pubg PC",
      url: "/pubg.webp"
    },
    {
      name: "Rocket League",
      url: "/rocket-league.webp"
    },
    {
      name: "Valorant",
      url: "/valo-mobile-1.webp"
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
       
  
  <div className="bg-[#7C3AED] p-24 flex flex-col justify-center items-center px-4">
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

<div>
  helllo there 
  </div>       
    </div>
  )
}

export default Homepage