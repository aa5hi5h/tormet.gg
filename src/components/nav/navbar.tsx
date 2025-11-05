import { Bell, Gamepad2, Heart, Megaphone, Store, Sword, Swords, Trophy } from "lucide-react"
import WalletButton from "../wallet-button"


const nav = [
    {
        name:"Matches",
        icon: <Gamepad2 size={18} />
    },
    {
        name:"Tournaments",
        icon: <Swords size={18} />
    },
    {
        name: "Shop",
        icon: <Store  size= {18}/>
    },
    {
        name: "LeaderBoard",
        icon: <Trophy size={18} />
    },
    {
        name: "Organize",
        icon: <Megaphone size={18}/>
    }
]

const endOptions = [
    {
        icon: <Heart size={18}/>
    },
    {
        icon: <Bell size={18} />
    }
]


const Navbar = () => {
    return (
        <div className="bg-zinc-600 rounded-lg ml-0.5 h-12 flex items-center justify-between px-6">
            <div className="text-gray-400 font-semibold">Arena</div>
            <div className="flex  items-center ">{nav.map((item,_) => (
                <div className="flex p-3  text-white gap-1 items-center" key={_}>
                    {item.icon}
                    {item.name}
                </div>
            ))}</div>

            <div className="flex items-center ">
                {endOptions.map((item,_) => (
                    <div key={_} className="text-white p-1 ">
                        {item.icon}
                    </div>
                ))}
                <div className="m-2">
                    <WalletButton />
                </div>
            </div>
            
        </div>
    )
}

export default Navbar