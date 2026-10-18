import React from 'react'
import MessageBox from './MessageBox'
import MessagePill from './MessagePill'

const MessageArea = () => {

    const messageData = {
        message: "hello tajinder Singh "
    }

    return (
        <div className='flex h-full min-h-0 flex-col gap-2 p-2'>
            <div
                role='log'
                aria-label='Chat messages'
                className='scrollbar-hidden flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-2 py-3'
            >
                <MessagePill message={messageData.message} type='received'  />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='sent' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='sent' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='sent' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='sent' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='received' />
                <MessagePill message={messageData.message} type='sent' />
            </div>
            <div className='shrink-0'>
                <MessageBox />
            </div>

        </div>


    )
}

export default MessageArea