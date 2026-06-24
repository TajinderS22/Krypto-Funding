import { Challenge } from '@/lib/types'
import React from 'react'
import Link from 'next/link'
import { ChevronRight, TrendingUp, DollarSign, Layers, Gauge, Target } from 'lucide-react'

const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
  return (
    <div className="group relative">
      <div className="absolute -inset-[1.5px] bg-gradient-to-br from-amber-500 via-purple-600 to-amber-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md group-hover:blur-lg pointer-events-none" />
      <div className="absolute -inset-[1.5px] bg-gradient-to-br from-amber-500 via-purple-600 to-amber-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

      <div className="relative bg-white dark:bg-[#0c0c0c] rounded-lg p-8 border border-gray-200 dark:border-white/5 group-hover:border-transparent transition-all duration-500 h-full flex flex-col shadow-sm hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(130,84,238,0.08)]">
        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-br from-purple-500/[0.03] to-amber-500/[0.03] rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-black text-2xl uppercase tracking-tight text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-amber-500 dark:group-hover:from-[#8254ee] dark:group-hover:to-[#e7c965] transition-all duration-500">
              {challenge.title}
            </h3>
            <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          <p className="text-gray-500 dark:text-[#82717b] text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
            {challenge.description}
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-black/40 rounded-lg border border-gray-100 dark:border-white/5">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Price
              </span>
              <span className="text-xl font-black text-amber-500">${challenge.price?.toLocaleString() ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-black/40 rounded-lg border border-gray-100 dark:border-white/5">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Value
              </span>
              <span className="text-xl font-black">${challenge.value?.toLocaleString() ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-black/40 rounded-lg border border-gray-100 dark:border-white/5">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" /> Drawdown
              </span>
              <span className="text-xl font-black">{challenge.drawdown ?? '-'}%</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-black/40 rounded-lg border border-gray-100 dark:border-white/5">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Target
              </span>
              <span className="text-xl font-black">{challenge.target ?? '-'}%</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-black/40 rounded-lg border border-gray-100 dark:border-white/5">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Steps
              </span>
              <span className="text-sm font-mono font-bold">
                {challenge.steps ?? 1}-Step
              </span>
            </div>
          </div>

          <Link
            href={`/challenges/${challenge.id}`}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-amber-500 hover:text-black group/btn"
          >
            <span className="relative z-10">Start Challenge</span>
            <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 animate-pulse opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ChallengeCard