import Image from "next/image"
import logo from "../../../public/tormet-real-logo-removebg-preview.png"
import chesslogo from "../../../public/chess new logo.png"
import { Plus } from "lucide-react"

const Sidebar = () => {

    return (
        <div className="flex flex-col pt-1 h-screen overflow-y-auto items-center">
            <div className="flex flex-col">
            <Image src={logo} alt="website logo" className="w-10 h-10" />
            <div className="border-1 border-gray-400 w-full" />
        </div>
        <div className="flex flex-col pt-4">
            <Image src={chesslogo} alt="chess logo" className="w-8 bg-gray-600 rounded-md h-8" />
            <div className="mt-2 w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
            <Plus size={18} className=" text-white" />
        </div>
        </div>
        </div>
    )
}

export default Sidebar