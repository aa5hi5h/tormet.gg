"use client"
import Image from "next/image"
import logo from "../../../public/tormet-real-logo-removebg-preview.png"
import chesslogo from "../../../public/chess new logo.png"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const Sidebar = () => {

    const router = useRouter()

    return (
        <div className="flex flex-col pt-1 bg-zinc-900 border-r border-gray-400 h-screen overflow-y-auto items-center">
            <div className="flex flex-col">
                <Link href={'/'}>
            <Image src={logo} alt="website logo" className="w-10 h-10" />
            </Link>
            <div className="border-1 border-gray-400 w-full" />
        </div>
        <div className="flex flex-col pt-4">
            <Image onClick={() => router.push('/game/chess')} src={chesslogo} alt="chess logo" className="w-8 bg-gray-600 cursor-pointer rounded-md h-8" />
        </div>
        </div>
    )
}

export default Sidebar