import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setMessage(error.message)
      } else if (!isLogin) {
        setMessage('確認メールを送信しました。メールをチェックしてください。')
      }
    } catch (error) {
      setMessage('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'ログイン' : 'サインアップ'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? '処理中...' : (isLogin ? 'ログイン' : 'サインアップ')}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
        
        <p>
          {isLogin ? 'アカウントをお持ちでない方は' : '既にアカウントをお持ちの方は'}
          <button 
            type="button" 
            className="link-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'サインアップ' : 'ログイン'}
          </button>
        </p>
      </div>
    </div>
  )
}