import React from 'react'

const Navbar = () => {
  return (
    <div className="w-[90%] sticky top-0 flex rounded-md p-2 mt-2 px-4 mx-auto bg-[#5a6882]/30 hover:shadow-md shadow-[#3b353c] backdrop-blur-md">
      <div>
        <p className=" text-3xl font-extrabold text-[#e7c965]">Krypto</p>
      </div>
      <div className="flex-1 "></div>
    </div>
  );
}

export default Navbar