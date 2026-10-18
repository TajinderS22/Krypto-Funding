"use client"

import { BadgeDollarSign, Headset, Loader, Loader2, X } from 'lucide-react'
import React, { useState } from 'react'
import MessageArea from './MessageArea'

const Aichat = () => {

    const [isChatOpened,setIsChatOpened] = useState(false)

  return (
    isChatOpened?<div className='fixed flex  flex-col border-purple-300 rounded-xl border duration-500 ease-in-out  bottom-0 right-0 z-50 bg-gray-950/40  h-[40%] w-[25%] min-h-80 minw-60 m-10'>
        {/* <Loader2 className='animate-spin' size={48}/> */}
        
        <div className=' flex bg-purple-800 rounded-t-xl p-2 justify-between gap-2'>

            <div className='flex  items-center gap-2'>
                
                <div className='bg-green-300 animate-ping  h-2 w-2  rounded-full'></div>
                <p className=' uppercase font-bold tracking-wide '>Krypto bot</p>
            </div>

            <button onClick={()=>{
                setIsChatOpened(false)
            }}>
                <X/>
            </button>
        </div>

        <div className=' flex min-h-0 flex-col  flex-1'>
            <MessageArea/>
        </div>

    </div>:
    <div onClick={()=>{
        setIsChatOpened(true)
    }} className=' bg-amber-300 duration-300 w-20 h-20 fixed p-2 flex m-10 items-center ease-in-out justify-center text-xl font-bold text-black  border-indigo-200 rounded-4xl border  bottom-0 right-0 z-50  '>
        <Headset className='animate-caret-blink ' size={36} />
    </div>
  )
}

export default Aichat