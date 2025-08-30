import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    display_name: '',
    avatar_url: ''
  })
  const [loading, setLoading] = useState(false)

  // プロフィールを取得
  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // プロフィールを保存
  const saveProfile = async (displayName) => {
    if (!user) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setProfile(prev => ({ ...prev, display_name: displayName }))
      return { success: true }
    } catch (error) {
      console.error('プロフィール保存エラー:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // ユーザーが変更されたらプロフィールを読み込み
  useEffect(() => {
    if (user) {
      loadProfile()
    } else {
      setProfile({ display_name: '', avatar_url: '' })
    }
  }, [user])

  return {
    profile,
    loading,
    saveProfile,
    loadProfile
  }
}