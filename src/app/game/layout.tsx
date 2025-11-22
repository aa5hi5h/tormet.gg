import MiniSidebar from "@/components/nav/mini-sidebar"
import React from "react"


const GameLayout = ({children}:{children:React.ReactNode}) => {

    return (
        <div>
            <div className="flex ">
                <div className="hidden lg:block">
                <MiniSidebar />
                </div>
                <div className="w-full lg:ml-[220px]">
            {children}
            </div>
            </div>
        </div>
    )
}

export default GameLayout