

const Homepage = () => {

    return (
        <div className="p-2 h-full w-full">
            <div className="flex flex-col w-full  h-full pt-4 md:pt-32 justify-center">
            <div className="max-w-3xl  mx-auto ">
                <div className="text-5xl font-extrabold">Join Games , Play matches </div>
                <div className="text-4xl text-center font-bold"> Organize tournaments  , Earn sol </div>
            </div>
            <div className="flex justify-center items-center w-full pt-4 gap-4">
                <button className="p-2 w-[20vw] md:w-[10vw] rounded-2xl border  bg-slate-400 hover:cursor-pointer hover:bg-slate-300">Explore</button>
                <button className="p-2 w-[20vw] md:w-[10vw] rounded-2xl border bg-blue-400 hover:cursor-pointer hover:bg-blue-300 ">Create</button>
            </div>
            </div>
            </div>
    )
}

export default Homepage