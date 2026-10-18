import React from 'react'
import { Button } from '../ui/button'
import { SendHorizonalIcon } from 'lucide-react'

const MessageBox = () => {
  return (
    <div className=' flex gap-2 items-center min-h-10   '>
        <div className=' flex-1 border border-[#c1cfc1] rounded-lg h-full '>
            <input type="text" className=' w-full rounded-lg h-full px-2 overflow-scroll' />
        </div>
        {/* <div> */}
            <Button className='h-full' >
                <SendHorizonalIcon />
            </Button>
        {/* </div> */}
    </div>
  )
}

export default MessageBox