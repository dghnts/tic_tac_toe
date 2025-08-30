import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export const useGameHistory = () => {
  const { user } = useAuth()
  const [gameHistory, setGameHistory] = useState([])
  const [loading, setLoading] = useState(false)

  // ゲーム履歴を取得
  const loadGameHistory = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) // 最新50件

      if (error) throw error

      setGameHistory(data || [])
    } catch (error) {
      console.error('ゲーム履歴取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // ユーザーが変更されたら履歴を読み込み
  useEffect(() => {
    if (user) {
      loadGameHistory()
    } else {
      setGameHistory([])
    }
  }, [user])

  return {
    gameHistory,
    loading,
    loadGameHistory
  }
}