"use client";

import api from '@/lib/axios'
import { Challenge } from '@/lib/types';
import { useEffect, useState } from 'react'
import ChallengeCard from '@/components/app/ChallengeCard';
import { Trophy, Activity, Layers, Gauge } from 'lucide-react';

const Page = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stepFilter, setStepFilter] = useState<'all' | 1 | 2>('all')
  const [ddFilter, setDdFilter] = useState<number | null>(null)

  const ddOptions = [6, 8, 10, 12]

  const fetchChallenges = async () => {
    try {
      const result = await api.get('/user/challenges')
      if (result.status === 200) {
        setChallenges(result.data.challenges)
      }
    } catch (error) {
      console.error("Error fetching challenges", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [])

  const filteredChallenges = challenges
    .filter(c => stepFilter === 'all' || (c.steps ?? 1) === stepFilter)
    .filter(c => ddFilter === null || (c.drawdown ?? 10) === ddFilter)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin h-16 w-16"></div>
          <Activity className="h-6 w-6 text-amber-500 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white pb-24 font-sans selection:bg-purple-600/30">
      
      <div className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 pt-12 pb-16 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold tracking-widest uppercase mb-4">
            <Trophy className="w-3 h-3" /> Challenges
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase">
            Choose Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-amber-500 dark:from-[#8254ee] dark:to-[#e7c965]">
              Challenge
            </span>
          </h1>
          <p className="text-gray-500 dark:text-[#82717b] text-lg max-w-xl font-light mt-2">
            Pick the challenge that matches your trading style and goals.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-8 relative z-20">
        <div className="flex items-center gap-4 mb-10 pt-8">
          <Layers className="w-5 h-5 text-gray-400" />
          {(['all', 1, 2] as const).map((val) => (
            <button
              key={val}
              onClick={() => setStepFilter(val)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                stepFilter === val
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
                  : 'bg-white dark:bg-white/5 text-gray-500 dark:text-[#82717b] border border-gray-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-[#8254ee]/50'
              }`}
            >
              {val === 'all' ? 'All' : `${val}-Step`}
            </button>
          ))}
          <div className="ml-auto text-xs text-gray-400 font-mono">
            {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Gauge className="w-5 h-5 text-gray-400" />
          <button
            onClick={() => setDdFilter(null)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              ddFilter === null
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105'
                : 'bg-white dark:bg-white/5 text-gray-500 dark:text-[#82717b] border border-gray-200 dark:border-white/10 hover:border-amber-400'
            }`}
          >
            All DD
          </button>
          {ddOptions.map((dd) => (
            <button
              key={dd}
              onClick={() => setDdFilter(dd)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                ddFilter === dd
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-white dark:bg-white/5 text-gray-500 dark:text-[#82717b] border border-gray-200 dark:border-white/10 hover:border-amber-400'
              }`}
            >
              {dd}% DD
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((x: Challenge) => (
            <ChallengeCard challenge={x} key={x.id} />
          ))}
        </div>
      </div>

    </div>
  )
}

export default Page