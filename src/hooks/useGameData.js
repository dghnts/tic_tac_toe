import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export const useGameData = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total_games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    total_play_time: 0
  })

  // ゲーム結果を保存
  const saveGame = async (winner, movesCount, gameData, durationSeconds) => {
    if (!user) return

    try {
      // 1. ゲーム結果を保存
      const { error: gameError } = await supabase
        .from('games')
        .insert({
          user_id: user.id,
          winner,
          moves_count: movesCount,
          game_data: gameData,
          duration_seconds: durationSeconds
        })

      if (gameError) throw gameError

      // 2. 統計情報を更新
      await updateStats(winner, durationSeconds)

    } catch (error) {
      console.error('ゲーム保存エラー:', error)
    }
  }

  // 統計情報を更新
  const updateStats = async (winner, durationSeconds = 0) => {
    if (!user) return

    try {
      // 現在の統計を取得
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const newStats = {
        user_id: user.id,
        total_games: (currentStats?.total_games || 0) + 1,
        wins: currentStats?.wins || 0,
        losses: currentStats?.losses || 0,
        draws: currentStats?.draws || 0,
        total_play_time: (currentStats?.total_play_time || 0) + durationSeconds
      }

      // 勝敗に応じて統計を更新
      if (winner === 'X') newStats.wins += 1
      else if (winner === 'O') newStats.losses += 1
      else if (winner === 'draw') newStats.draws += 1

      // データベースに保存（upsert: 存在しない場合は作成、存在する場合は更新）
      const { error } = await supabase
        .from('user_stats')
        .upsert(newStats)

      if (error) throw error

      // ローカル状態を更新
      setStats(newStats)

    } catch (error) {
      console.error('統計更新エラー:', error)
    }
  }

  // 統計情報を取得
  const loadStats = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setStats(data)
      }
    } catch (error) {
      console.error('統計取得エラー:', error)
    }
  }

  // ユーザーが変更されたら統計を読み込み
  useEffect(() => {
    if (user) {
      loadStats()
    } else {
      setStats({ total_games: 0, wins: 0, losses: 0, draws: 0, total_play_time: 0 })
    }
  }, [user])

  return {
    stats,
    saveGame,
    loadStats
  }
}