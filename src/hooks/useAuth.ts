import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null)

  // 認証監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { session, logout }
}
