import React from 'react'

type MessagePillType = {
    message: string,
    type: "sent" | "received",
    className?: string
}

const MessagePill = (data: MessagePillType) => {
    return (
        <div className={`flex w-full ${data.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`w-fit max-w-[82%] break-words rounded-2xl px-3 py-2 text-sm leading-5 whitespace-pre-wrap ${
                    data.type === 'sent'
                        ? 'rounded-br-md bg-purple-600 text-white'
                        : 'rounded-bl-md bg-slate-800 text-slate-100'
                } ${data.className ?? ''}`}
            >
                {data.message}
            </div>
        </div>
    )
}

export default MessagePill