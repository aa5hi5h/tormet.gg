
import Navbar from "./navbar"
import Sidebar from "./sidebar"


const NavigationMenus = () => {

    return (
        <div className="flex fixed top-0 left-0 z-50 w-full ">
            <div className="w-[4%] bg-gray-800 h-screen z-50 left-0 top-0 ">
                <Sidebar />
            </div>
            <div className="w-[96%] bg-gray-900 ml-[4%] fixed top-0 right-0 z-40">
                <Navbar />
            </div>
        </div>
    )
}

export default NavigationMenus