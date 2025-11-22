
import Navbar from "./navbar"
import Sidebar from "./sidebar"


const NavigationMenus = () => {

    return (
         <div className="flex w-full"> 
            <div className="hidden lg:block w-[4%] fixed top-0 left-0 z-50 bg-gray-800 h-screen">
                <Sidebar />
            </div>
            <div className="w-full lg:w-[96%] ml-[4%] fixed top-0 right-0 z-40 bg-transparent"> 
                <Navbar />
            </div>
        </div>
    )
}

export default NavigationMenus