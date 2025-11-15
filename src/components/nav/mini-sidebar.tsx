"use client"

import Image from "next/image"
import userPic from "../../../public/pic-10.webp"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { House, Megaphone, Swords, Trophy } from "lucide-react"
import { usePathname } from "next/navigation"


const MiniSidebar = () => {

    const [key, setKey] = useState<PublicKey>()
    const [url,setUrl] = useState()

    const {publicKey} = useWallet()

    useEffect(() => {
        if(publicKey){
        setKey(publicKey)
    }
    },[publicKey])

    const shortenKey = (k:string) => {
        return `${k.slice(0,4)}....${k.slice(-4)}`
    }

    const pathname = usePathname()


    return (
        <div className="flex fixed w-[220px] h-screen overflow-y-auto flex-col bg-[#A855F7] gap-4">
            <div className="pt-12">
                <div className=" pl-4 flex flex-col gap-2 mx-2  border-b-2 pb-4  border-white">
                    <Image
                    src={userPic}
                    alt="Profile picture"
                    width={100}
                    height={100}
                    className="w-16 h-16 rounded-full" />
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-gray-200">Good Morning.</p>
                        {
                            publicKey && key
                            ? 
                            <div className="text-medium text-white">
                                {shortenKey(key.toBase58())}
                            </div> : 
                            <div className="text-medium text-white">
                                Wallet not connected.
                            </div>
                        }
                    </div>
                </div>
                <div className="flex items-center gap-1 cursor-pointer mx-2 text-white border-b-2 border-white py-4 px-4">
                    <House size={18} />
                    <p className="">Dashboard</p>
                </div>
                <div className="flex flex-col  gap-2 border-b-2 py-4 border-white mx-2">
                    <div className={`flex items-center max-w-max  rounded-xl gap-1 px-4 py-2 cursor-pointer text-white
                        ${pathname.includes('tournaments') ? "border-1 border-[#c084fc]" : ""}`}>
                        <Swords  size={18}/>
                        <p className="">Tournamnet</p>
                    </div>
                    <div className={`flex items-center px-4 py-2 gap-1 cursor-pointer text-white
                        ${pathname.includes('leaderboard') ? "border-1 border-[#c084fc]" : ""}`}>
                        <Trophy size={18} />
                        <p className="">Leaderboard</p>
                    </div>
                    <div className={`flex items-center gap-1 px-4 py-2 cursor-pointer text-white
                        ${pathname.includes('organize') ? "border-1 border-[#c084fc]" :  ""}`}>
                        <Megaphone size={18} />
                        <p className="">Host</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MiniSidebar