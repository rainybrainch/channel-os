'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

type AuthMode = 'login' | 'signup' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const mounted = useRef(true);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
      });
      if (!mounted.current) return;
      if (error) { setError('パスワードリセットメールの送信に失敗しました'); setLoading(false); }
      else { setResetDone(true); }
      return;
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!mounted.current) return;
      if (error) { setError('メールアドレスまたはパスワードが正しくありません'); setLoading(false); }
      else router.push('/');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (!mounted.current) return;
      if (error) {
        setError('登録に失敗しました。別のメールアドレスをお試しください。');
        setLoading(false);
      } else {
        setSignupDone(true);
      }
    }
  };

  const switchMode = (m: AuthMode) => { setMode(m); setError(''); setResetDone(false); };

  const inputClass = 'mt-1.5 w-full rounded-2xl border border-[#2e3148] bg-[#141720] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-[#c9a84c]/60 focus:ring-2 focus:ring-[#c9a84c]/15';

  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: '#12141f' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c9a84c]/15 text-3xl font-bold text-[#c9a84c]">C</div>
          <h1 className="text-2xl font-semibold text-slate-100">Channel OS</h1>
          <p className="mt-1 text-sm text-slate-500">YouTube運営管理OS</p>
        </div>

        {/* 確認メール送信済み（新規登録） */}
        {signupDone ? (
          <div className="rounded-3xl border border-[#2e3148] bg-[#1c1f2e] p-8 text-center shadow-panel">
            <p className="text-2xl">📧</p>
            <p className="mt-3 font-semibold text-slate-100">確認メールを送りました</p>
            <p className="mt-2 text-sm text-slate-500">{email} に届いたメールのリンクをクリックしてください</p>
            <button onClick={() => { switchMode('login'); setSignupDone(false); }}
              className="mt-6 text-sm text-[#c9a84c] underline-offset-2 hover:underline">
              ログイン画面に戻る
            </button>
          </div>

        /* パスワードリセットメール送信済み */
        ) : resetDone ? (
          <div className="rounded-3xl border border-[#2e3148] bg-[#1c1f2e] p-8 text-center shadow-panel">
            <p className="text-2xl">🔑</p>
            <p className="mt-3 font-semibold text-slate-100">リセットメールを送りました</p>
            <p className="mt-2 text-sm text-slate-500">{email} に届いたリンクからパスワードを再設定してください</p>
            <button onClick={() => { switchMode('login'); setResetDone(false); }}
              className="mt-6 text-sm text-[#c9a84c] underline-offset-2 hover:underline">
              ログイン画面に戻る
            </button>
          </div>

        /* ログイン / 新規登録 / リセット フォーム */
        ) : (
          <div className="rounded-3xl border border-[#2e3148] bg-[#1c1f2e] p-8 shadow-panel">

            {mode !== 'reset' && (
              <div role="tablist" aria-label="認証方法" className="mb-6 flex rounded-2xl bg-[#252838] p-1">
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} role="tab" aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${mode === m ? 'bg-[#1c1f2e] text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                    {m === 'login' ? 'ログイン' : '新規登録'}
                  </button>
                ))}
              </div>
            )}

            {mode === 'reset' && (
              <div className="mb-5">
                <button onClick={() => switchMode('login')} className="text-xs text-slate-500 hover:text-slate-300">← ログインに戻る</button>
                <p className="mt-3 font-semibold text-slate-100">パスワードをリセット</p>
                <p className="mt-1 text-sm text-slate-500">登録済みのメールアドレスを入力してください</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5 text-sm text-slate-400">
                メールアドレス
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  autoComplete="email" className={inputClass} />
              </label>

              {mode !== 'reset' && (
                <label className="block space-y-1.5 text-sm text-slate-400">
                  パスワード{mode === 'signup' && <span className="text-slate-600">（8文字以上）</span>}
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'signup' ? 8 : 1}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className={inputClass} />
                </label>
              )}

              {error && <p role="alert" aria-live="assertive" className="rounded-2xl bg-red-900/20 px-4 py-2.5 text-sm text-red-400">{error}</p>}

              <button type="submit" disabled={loading} aria-busy={loading}
                className="w-full rounded-2xl bg-[#c9a84c] py-3 text-sm font-semibold text-[#12141f] transition hover:bg-[#b8963f] disabled:opacity-60">
                {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'signup' ? 'アカウント作成' : 'リセットメールを送る'}
              </button>
            </form>

            {mode === 'login' && (
              <button onClick={() => switchMode('reset')} className="mt-4 w-full text-center text-xs text-slate-600 hover:text-slate-400">
                パスワードを忘れた場合
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
