'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  commentStyleLabels,
  mockPlans,
  planStatusLabels,
  videoStatusLabels,
  type CommentPersona,
  type CommentStyle,
  type ContentPlan,
  type VideoItem
} from '../lib/mockData';
import { supabase, dbToVideo, dbToPersona, videoToDb, personaToDb } from '../lib/supabase';

const PLANS_KEY = 'channel-os-plans';

type PageKey = 'dashboard' | 'sorting' | 'persona' | 'publishing' | 'settings';

const navItems: { key: PageKey; label: string; symbol: string }[] = [
  { key: 'dashboard', label: 'ダッシュボード', symbol: '◈' },
  { key: 'sorting',   label: 'YouTube仕分け',  symbol: '▤' },
  { key: 'persona',   label: 'コメント人格',   symbol: '◎' },
  { key: 'publishing',label: '投稿管理',       symbol: '▲' },
  { key: 'settings',  label: '設定',           symbol: '◌' }
];

const videoStatusColors: Record<VideoItem['status'], string> = {
  reference: 'bg-[#1e2a24] text-[#4ade80]',
  idea:      'bg-[#1a2040] text-[#60a5fa]',
  posted:    'bg-[#2a1840] text-[#a78bfa]',
  onHold:    'bg-[#2a2010] text-[#fb923c]'
};

type PersonalityType = '考察系' | 'ツッコミ系' | '応援系' | 'ネタ系' | '癒し系';
const PERSONALITY_TYPES: PersonalityType[] = ['考察系', 'ツッコミ系', '応援系', 'ネタ系', '癒し系'];
type EnergyLevel = '高い' | 'ふつう' | 'クール';
const ENERGY_LEVELS: EnergyLevel[] = ['高い', 'ふつう', 'クール'];

const PERSONALITY_PRESETS: Record<PersonalityType, {
  style: CommentStyle; icon: string; toneBase: string;
  energyHigh: string; energyCool: string; topics: string[]; comments: string[];
}> = {
  '考察系':    { style:'analysis',  icon:'🔍', toneBase:'論理的で丁寧。情報を整理しながらコメントする。',         energyHigh:'興奮気味で素早く反応。',    energyCool:'冷静に短く鋭くまとめる。',   topics:['仕組み','根拠','比較','構造','分析'],           comments:['なるほど、そういう仕組みか','ここの構造が面白い','これ深掘りしたい'] },
  'ツッコミ系': { style:'reaction',  icon:'😅', toneBase:'ユーモアと鋭さを持つ。意外な展開に即反応する。',         energyHigh:'勢いよく大きくリアクション。',energyCool:'淡々と短くツッコむ。',       topics:['意外な展開','ミス','面白い発見','ボケ'],         comments:['それはアカンて笑','え待って、それ本当？','草'] },
  '応援系':    { style:'short',     icon:'💪', toneBase:'温かく肯定的。挑戦や成長に全力で反応する。',             energyHigh:'全力で熱く応援。',           energyCool:'そっと励ます感じ。',         topics:['挑戦','成長','頑張り','努力','継続'],           comments:['がんばってー！','応援してる','すごい！いける！'] },
  'ネタ系':    { style:'reaction',  icon:'🤣', toneBase:'軽快でユーモアあり。面白い展開に即反応する。',           energyHigh:'爆発的に笑う。絵文字多め。', energyCool:'静かに笑いを収める。',       topics:['面白い','笑える','ネタ','ギャグ','ボケ'],       comments:['それは草www','笑いこらえられんw','面白すぎてｗ'] },
  '癒し系':    { style:'short',     icon:'🌸', toneBase:'穏やかで癒し系。ほっこりする場面に反応する。',           energyHigh:'明るく元気よく癒しを届ける。',energyCool:'そっと静かに癒しを届ける。', topics:['癒し','ほっこり','かわいい','やさしい','ゆるい'],comments:['ほっこりする〜','やさしい世界…','これ好きすぎる'] }
};

const STYLE_COLORS: Record<CommentStyle, string> = {
  analysis: '#5c8a91', reaction: '#f97316', short: '#a78bfa', long: '#4ade80', question: '#60a5fa'
};

function toVTuberFormat(personas: CommentPersona[], videoMap: Record<string, VideoItem>) {
  return personas.map(p => ({
    id: p.id, name: p.name,
    color: STYLE_COLORS[p.commentStyle] ?? '#c9a84c',
    tone: p.tone,
    length: p.commentStyle === 'long' ? 'long' : p.commentStyle === 'short' ? 'short' : 'medium',
    enabled: true,
    theme: p.triggerTopics.slice(0, 3).join('・'),
    tags: p.triggerTopics,
    source: videoMap[p.sourceVideoId]?.url ?? '',
    examples: p.sampleComments,
    createdAt: p.createdAt, updatedAt: p.createdAt
  }));
}

// TODO: ここをGemini APIに差し替える
function generatePersonaMock(opts: { videoId: string; charaName: string; personalityType: PersonalityType; energy: EnergyLevel }): CommentPersona {
  const preset = PERSONALITY_PRESETS[opts.personalityType];
  const energySuffix = opts.energy === '高い' ? preset.energyHigh : opts.energy === 'クール' ? preset.energyCool : '';
  return {
    id: `persona-${Date.now()}`,
    sourceVideoId: opts.videoId,
    name: opts.charaName.trim() || `${opts.personalityType}キャラ`,
    icon: preset.icon,
    commentStyle: preset.style,
    tone: preset.toneBase + (energySuffix ? ' ' + energySuffix : ''),
    triggerTopics: preset.topics,
    sampleComments: preset.comments,
    createdAt: new Date().toISOString()
  };
}

function formatDate(value?: string) {
  if (!value) return '未設定';
  return new Date(value).toLocaleDateString('ja-JP');
}

// ── スタイル定数 ────────────────────────────────────────
const C = {
  card:    'rounded-3xl border border-[#2e3148] bg-[#1c1f2e] shadow-panel',
  input:   'w-full rounded-2xl border border-[#2e3148] bg-[#141720] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-[#c9a84c]/60 focus:ring-2 focus:ring-[#c9a84c]/15',
  inputSm: 'w-full rounded-2xl border border-[#2e3148] bg-[#141720] px-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-[#c9a84c]/60',
  btnGold: 'rounded-2xl bg-[#c9a84c] px-6 py-3 text-sm font-semibold text-[#12141f] transition hover:bg-[#b8963f]',
  btnSm:   'rounded-2xl bg-[#252838] px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-[#2e3148]',
  btnDanger:'rounded-2xl border border-red-900/50 bg-red-900/20 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-900/40',
  label:   'block space-y-1.5 text-sm text-slate-400',
  h3:      'font-semibold text-slate-100',
  muted:   'text-xs text-slate-500',
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [plans, setPlans] = useState<ContentPlan[]>(mockPlans);
  const [personas, setPersonas] = useState<CommentPersona[]>([]);

  const [sortFilter, setSortFilter] = useState<VideoItem['status'] | 'all'>('all');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCharaName, setQuickCharaName] = useState('');
  const [quickPersonality, setQuickPersonality] = useState<PersonalityType>('考察系');
  const [quickEnergy, setQuickEnergy] = useState<EnergyLevel>('ふつう');

  const [draftPersona, setDraftPersona] = useState<Partial<CommentPersona>>({
    sourceVideoId:'', name:'', icon:'💬', commentStyle:'short', tone:'', triggerTopics:[], sampleComments:[]
  });
  const [sampleCommentsText, setSampleCommentsText] = useState('');
  const [expandedPersonaId, setExpandedPersonaId] = useState<string | null>(null);
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CommentPersona>>({});

  const [pubFilter, setPubFilter] = useState<ContentPlan['status'] | 'all'>('all');
  const [exportSuccess, setExportSuccess] = useState(false);

  // 認証
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // データ取得
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: vData }, { data: pData }] = await Promise.all([
        supabase.from('videos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('personas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      if (vData) setVideos(vData.map(dbToVideo));
      if (pData) setPersonas(pData.map(dbToPersona));
    };
    load();
  }, [user]);

  useEffect(() => { try { const r = localStorage.getItem(PLANS_KEY); if (r) setPlans(JSON.parse(r)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); }, [plans]);

  const signOut = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const videoMap = useMemo(() => Object.fromEntries(videos.map(v => [v.id, v])), [videos]);

  const counts = useMemo(() => ({
    reference: videos.filter(v => v.status === 'reference').length,
    idea:      videos.filter(v => v.status === 'idea').length,
    posted:    videos.filter(v => v.status === 'posted').length,
    onHold:    videos.filter(v => v.status === 'onHold').length
  }), [videos]);

  const filteredVideos = useMemo(() => sortFilter === 'all' ? videos : videos.filter(v => v.status === sortFilter), [videos, sortFilter]);
  const filteredPlans  = useMemo(() => pubFilter === 'all'  ? plans  : plans.filter(p => p.status === pubFilter),   [plans, pubFilter]);

  const addVideoOnly = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    const url = quickUrl.trim(); if (!url) return;
    const next: VideoItem = { id:`video-${Date.now()}`, url, title:quickTitle.trim()||url, summary:'', genre:'', tags:[], memo:'', status:'reference', createdAt:new Date().toISOString() };
    setVideos([next, ...videos]); setQuickUrl(''); setQuickTitle('');
    await supabase.from('videos').insert(videoToDb(next, user.id));
  };

  const addVideoAndGeneratePersona = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    const url = quickUrl.trim(); if (!url) return;
    const videoId = `video-${Date.now()}`;
    const newVideo: VideoItem = { id:videoId, url, title:quickTitle.trim()||url, summary:'', genre:'', tags:[], memo:'', status:'reference', createdAt:new Date().toISOString() };
    const newPersona = generatePersonaMock({ videoId, charaName:quickCharaName, personalityType:quickPersonality, energy:quickEnergy });
    setVideos([newVideo, ...videos]); setPersonas([newPersona, ...personas]); setExpandedPersonaId(newPersona.id);
    setQuickUrl(''); setQuickTitle(''); setQuickCharaName('');
    await Promise.all([supabase.from('videos').insert(videoToDb(newVideo, user.id)), supabase.from('personas').insert(personaToDb(newPersona, user.id))]);
  };

  const updateVideo = async (id: string, updated: Partial<VideoItem>) => {
    setVideos(videos.map(v => v.id === id ? { ...v, ...updated } : v));
    if (!user) return;
    const d: Record<string,unknown> = {};
    if (updated.status !== undefined) d.status = updated.status;
    if (updated.title  !== undefined) d.title  = updated.title;
    await supabase.from('videos').update(d).eq('id', id).eq('user_id', user.id);
  };

  const updatePlan = (id: string, updated: Partial<ContentPlan>) => setPlans(plans.map(p => p.id === id ? { ...p, ...updated } : p));

  const updatePersona = async (id: string, updated: Partial<CommentPersona>) => {
    setPersonas(personas.map(p => p.id === id ? { ...p, ...updated } : p));
    if (!user) return;
    const d: Record<string,unknown> = {};
    if (updated.name          !== undefined) d.name           = updated.name;
    if (updated.icon          !== undefined) d.icon           = updated.icon;
    if (updated.tone          !== undefined) d.tone           = updated.tone;
    if (updated.commentStyle  !== undefined) d.comment_style  = updated.commentStyle;
    if (updated.triggerTopics !== undefined) d.trigger_topics = updated.triggerTopics;
    await supabase.from('personas').update(d).eq('id', id).eq('user_id', user.id);
  };

  const goToPersonaForm = (videoId: string) => {
    setDraftPersona({ sourceVideoId:videoId, name:'', icon:'💬', commentStyle:'short', tone:'', triggerTopics:[], sampleComments:[] });
    setSampleCommentsText(''); setActivePage('persona');
  };

  const addPersona = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user || !draftPersona.name?.trim() || !draftPersona.sourceVideoId) return;
    const next: CommentPersona = {
      id:`persona-${Date.now()}`, sourceVideoId:draftPersona.sourceVideoId, name:draftPersona.name.trim(),
      icon:draftPersona.icon||'💬', commentStyle:draftPersona.commentStyle??'short', tone:draftPersona.tone??'',
      triggerTopics:draftPersona.triggerTopics??[], sampleComments:sampleCommentsText.split('\n').map(s=>s.trim()).filter(Boolean),
      createdAt:new Date().toISOString()
    };
    setPersonas([next, ...personas]); setExpandedPersonaId(next.id);
    setDraftPersona({ ...draftPersona, name:'', icon:'💬', tone:'', triggerTopics:[], sampleComments:[] }); setSampleCommentsText('');
    await supabase.from('personas').insert(personaToDb(next, user.id));
  };

  const startEdit = (p: CommentPersona) => { setEditingPersonaId(p.id); setEditDraft({ name:p.name, icon:p.icon, tone:p.tone, commentStyle:p.commentStyle, triggerTopics:p.triggerTopics }); };
  const saveEdit  = (id: string) => { updatePersona(id, editDraft); setEditingPersonaId(null); setEditDraft({}); };

  const exportToVTuber = () => {
    const data = toVTuberFormat(personas, videoMap);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'channel-os-personas.json'; a.click();
    URL.revokeObjectURL(url); setExportSuccess(true); setTimeout(() => setExportSuccess(false), 3000);
  };

  const activeLabel = navItems.find(n => n.key === activePage)?.label ?? '';

  // ── 認証ローディング ──
  if (authLoading) return <main className="flex min-h-screen items-center justify-center"><p className="text-sm text-slate-500">読み込み中...</p></main>;

  // ── 未ログイン ──
  if (!user) return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c9a84c]/15 text-3xl font-bold text-[#c9a84c]">C</div>
        <h1 className="text-2xl font-semibold text-slate-100">Channel OS</h1>
        <p className="mt-2 text-sm text-slate-500">YouTube運営管理OS</p>
        <button onClick={() => router.push('/login')} className="mt-6 w-full rounded-2xl bg-[#c9a84c] py-3 text-sm font-semibold text-[#12141f] transition hover:bg-[#b8963f]">
          ログイン / 新規登録
        </button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 md:flex-row md:px-8">

        {/* ── Sidebar ── */}
        <aside className={`w-full shrink-0 p-6 ${C.card} md:w-[260px] lg:w-[280px]`}>
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a84c]/15 text-xl font-bold text-[#c9a84c]">C</div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">YouTube運営管理OS</p>
              <h1 className="text-lg font-semibold text-slate-100">Channel OS</h1>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setActivePage(item.key)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${activePage === item.key ? 'bg-[#c9a84c] text-[#12141f]' : 'text-slate-500 hover:bg-[#252838] hover:text-slate-200'}`}>
                <span className="w-4 text-center text-xs">{item.symbol}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-8 space-y-2">
            {[['登録動画', videos.length], ['コメント人格', personas.length]].map(([label, count]) => (
              <div key={label as string} className="flex items-center justify-between rounded-2xl bg-[#252838] px-4 py-3 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-200">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[#2e3148] pt-5">
            <p className="truncate text-xs text-slate-600">{user.email}</p>
            <button onClick={signOut} className="mt-2 w-full rounded-2xl bg-[#252838] py-2.5 text-xs font-medium text-slate-500 transition hover:bg-[#2e3148] hover:text-slate-300">
              ログアウト
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <section className="flex-1 space-y-6">

          {/* Header */}
          <div className={`flex flex-col gap-4 p-6 ${C.card} sm:flex-row sm:items-center sm:justify-between`}>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-600">{activeLabel}</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-100">Channel OS</h2>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-[#252838] px-5 py-3 text-center">
                <p className="text-xs text-slate-500">企画候補</p>
                <p className="text-xl font-semibold text-slate-100">{counts.idea}</p>
              </div>
              <div className="rounded-2xl bg-[#c9a84c]/10 px-5 py-3 text-center">
                <p className="text-xs text-[#c9a84c]">コメント人格</p>
                <p className="text-xl font-semibold text-slate-100">{personas.length}</p>
              </div>
            </div>
          </div>

          {/* ── Dashboard ── */}
          {activePage === 'dashboard' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={`p-6 ${C.card}`}>
                <h3 className={C.h3}>動画ステータス</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(['reference','idea','onHold','posted'] as const).map(s => (
                    <button key={s} onClick={() => { setSortFilter(s); setActivePage('sorting'); }}
                      className="rounded-2xl bg-[#252838] p-4 text-left transition hover:bg-[#2e3148]">
                      <p className="text-xs text-slate-500">{videoStatusLabels[s]}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">{counts[s]}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setSortFilter('all'); setActivePage('sorting'); }}
                  className="mt-3 w-full rounded-2xl bg-[#c9a84c] py-2.5 text-sm font-medium text-[#12141f] transition hover:bg-[#b8963f]">
                  仕分けページへ
                </button>
              </div>

              <div className={`p-6 ${C.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className={C.h3}>コメント人格</h3>
                  <button onClick={() => setActivePage('persona')} className="text-xs text-slate-500 underline-offset-2 hover:text-[#c9a84c] hover:underline">すべて見る →</button>
                </div>
                <div className="mt-4 space-y-3">
                  {personas.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-[#252838] px-4 py-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">{commentStyleLabels[p.commentStyle]} · {videoMap[p.sourceVideoId]?.title ?? '動画未設定'}</p>
                      </div>
                    </div>
                  ))}
                  {personas.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#2e3148] p-5 text-center">
                      <p className="text-sm text-slate-500">まだ人格がありません</p>
                      <button onClick={() => setActivePage('sorting')} className="mt-2 text-xs text-[#c9a84c] underline-offset-2 hover:underline">YouTube仕分けから作成する</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── YouTube仕分け ── */}
          {activePage === 'sorting' && (
            <div className="space-y-5">
              <div className={`p-6 ${C.card}`}>
                <h3 className={C.h3}>YouTube URLを登録</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input value={quickUrl} onChange={e => setQuickUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={`flex-[2] ${C.input}`} />
                    <input value={quickTitle} onChange={e => setQuickTitle(e.target.value)} placeholder="タイトル（省略可）" className={`flex-1 ${C.input}`} />
                  </div>

                  <div className="rounded-2xl border border-[#2e3148] bg-[#141720] p-4 space-y-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-600">コメント人格を同時に生成する（任意）</p>
                    <input value={quickCharaName} onChange={e => setQuickCharaName(e.target.value)} placeholder="キャラ名（省略すると自動生成）" className={C.input} />
                    <div>
                      <p className="mb-2 text-xs text-slate-500">性格タイプ</p>
                      <div className="flex flex-wrap gap-2">
                        {PERSONALITY_TYPES.map(t => (
                          <button key={t} type="button" onClick={() => setQuickPersonality(t)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${quickPersonality === t ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#252838] text-slate-400 hover:bg-[#2e3148]'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs text-slate-500">熱量</p>
                      <div className="flex gap-2">
                        {ENERGY_LEVELS.map(e => (
                          <button key={e} type="button" onClick={() => setQuickEnergy(e)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${quickEnergy === e ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#252838] text-slate-400 hover:bg-[#2e3148]'}`}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={addVideoOnly} className="flex-1 rounded-2xl border border-[#2e3148] bg-[#252838] py-3 text-sm font-medium text-slate-400 transition hover:bg-[#2e3148]">URLのみ登録</button>
                    <button onClick={addVideoAndGeneratePersona} className={`flex-[2] ${C.btnGold}`}>登録 ＋ 人格を自動生成 →</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['all','reference','idea','onHold','posted'] as const).map(f => (
                  <button key={f} onClick={() => setSortFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sortFilter === f ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#1c1f2e] text-slate-500 ring-1 ring-[#2e3148] hover:bg-[#252838]'}`}>
                    {f === 'all' ? 'すべて' : videoStatusLabels[f]}
                    <span className="ml-1.5 text-xs opacity-60">{f === 'all' ? videos.length : counts[f]}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {filteredVideos.map(video => {
                  const linked = personas.filter(p => p.sourceVideoId === video.id);
                  return (
                    <article key={video.id} className={`p-5 ${C.card}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-200">{video.title}</p>
                          <a href={video.url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs text-slate-600 transition hover:text-slate-400">{video.url}</a>
                          <p className="mt-1 text-xs text-slate-600">{formatDate(video.createdAt)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${videoStatusColors[video.status]}`}>{videoStatusLabels[video.status]}</span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(['reference','idea','onHold','posted'] as const).map(s => (
                          <button key={s} onClick={() => updateVideo(video.id, { status:s })}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${video.status === s ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#252838] text-slate-500 hover:bg-[#2e3148]'}`}>
                            {videoStatusLabels[s]}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2 border-t border-[#2e3148] pt-4">
                        <a href={video.url} target="_blank" rel="noreferrer" className={`flex-1 text-center ${C.btnSm}`}>動画を開く</a>
                        <button onClick={() => goToPersonaForm(video.id)} className={`flex-[2] ${C.btnGold}`}>コメント人格を作る →</button>
                      </div>

                      {linked.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-[#2e3148] pt-3">
                          {linked.map(p => (
                            <button key={p.id} onClick={() => { setExpandedPersonaId(p.id); setActivePage('persona'); }}
                              className="flex items-center gap-1.5 rounded-full bg-[#c9a84c]/10 px-3 py-1 text-xs font-medium text-[#c9a84c] transition hover:bg-[#c9a84c]/20">
                              {p.icon} {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
                {filteredVideos.length === 0 && (
                  <div className="col-span-2 rounded-3xl border border-dashed border-[#2e3148] p-10 text-center text-sm text-slate-600">動画がありません。URLを登録してください。</div>
                )}
              </div>
            </div>
          )}

          {/* ── コメント人格 ── */}
          {activePage === 'persona' && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
              <div className={`p-6 ${C.card}`}>
                <h3 className={C.h3}>人格を手動で作成</h3>
                {draftPersona.sourceVideoId && videoMap[draftPersona.sourceVideoId] && (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#c9a84c]/10 px-4 py-2.5">
                    <span className="text-xs text-[#c9a84c]">元動画：</span>
                    <span className="truncate text-xs font-medium text-[#c9a84c]">{videoMap[draftPersona.sourceVideoId].title}</span>
                  </div>
                )}
                <form onSubmit={addPersona} className="mt-5 space-y-4">
                  <label className={C.label}>
                    元動画
                    <select value={draftPersona.sourceVideoId} onChange={e => setDraftPersona({ ...draftPersona, sourceVideoId:e.target.value })} className={`mt-1.5 ${C.input}`}>
                      <option value="">動画を選択...</option>
                      {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-[1fr_72px] gap-3">
                    <label className={C.label}>
                      人格名
                      <input value={draftPersona.name??''} onChange={e => setDraftPersona({ ...draftPersona, name:e.target.value })} placeholder="考察おじさん、ツッコミちゃん…" className={`mt-1.5 ${C.input}`} />
                    </label>
                    <label className={C.label}>
                      アイコン
                      <input value={draftPersona.icon??'💬'} onChange={e => setDraftPersona({ ...draftPersona, icon:e.target.value })} className={`mt-1.5 ${C.input} px-2 text-center text-xl`} />
                    </label>
                  </div>
                  <label className={C.label}>
                    コメントスタイル
                    <select value={draftPersona.commentStyle} onChange={e => setDraftPersona({ ...draftPersona, commentStyle:e.target.value as CommentStyle })} className={`mt-1.5 ${C.input}`}>
                      {Object.entries(commentStyleLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label className={C.label}>
                    口調メモ
                    <textarea value={draftPersona.tone??''} onChange={e => setDraftPersona({ ...draftPersona, tone:e.target.value })} rows={2} placeholder="「〜ですね」「草」など特徴的な口調" className={`mt-1.5 ${C.input}`} />
                  </label>
                  <label className={C.label}>
                    反応するトピック（カンマ区切り）
                    <input value={(draftPersona.triggerTopics??[]).join(', ')} onChange={e => setDraftPersona({ ...draftPersona, triggerTopics:e.target.value.split(',').map(t=>t.trim()).filter(Boolean) })} placeholder="トレンド, 比較, 驚き" className={`mt-1.5 ${C.input}`} />
                  </label>
                  <label className={C.label}>
                    サンプルコメント（1行 = 1コメント）
                    <textarea value={sampleCommentsText} onChange={e => setSampleCommentsText(e.target.value)} rows={4} placeholder={'この動画めちゃわかりやすい！\nここもっと詳しく知りたい'} className={`mt-1.5 ${C.input}`} />
                  </label>
                  <div className="flex justify-end"><button type="submit" className={C.btnGold}>人格を保存</button></div>
                </form>
              </div>

              <div className={`p-6 ${C.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className={C.h3}>作成済み人格</h3>
                  <span className="badge badge-light">{personas.length} 件</span>
                </div>
                <div className="mt-5 space-y-4">
                  {personas.map(persona => (
                    <article key={persona.id} className="rounded-3xl border border-[#2e3148] bg-[#252838] p-4">
                      {editingPersonaId !== persona.id ? (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{persona.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-200">{persona.name}</p>
                              <p className="text-xs text-slate-500">{commentStyleLabels[persona.commentStyle]}{videoMap[persona.sourceVideoId] && <> · {videoMap[persona.sourceVideoId].title}</>}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(persona)} className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-[#2e3148] hover:text-slate-300">編集</button>
                              <button onClick={() => setExpandedPersonaId(expandedPersonaId === persona.id ? null : persona.id)} className="rounded-xl p-2 text-xs text-slate-500 transition hover:bg-[#2e3148]">{expandedPersonaId === persona.id ? '▲' : '▼'}</button>
                            </div>
                          </div>
                          {expandedPersonaId === persona.id && (
                            <div className="mt-4 space-y-4 border-t border-[#2e3148] pt-4">
                              {persona.tone && <div><p className={C.muted}>口調</p><p className="mt-1 text-sm text-slate-300">{persona.tone}</p></div>}
                              {persona.triggerTopics.length > 0 && (
                                <div><p className={C.muted}>反応トピック</p>
                                  <div className="mt-2 flex flex-wrap gap-1.5">{persona.triggerTopics.map(t => <span key={t} className="badge badge-light">{t}</span>)}</div>
                                </div>
                              )}
                              {persona.sampleComments.length > 0 && (
                                <div><p className={C.muted}>サンプルコメント</p>
                                  <ul className="mt-2 space-y-2">{persona.sampleComments.map((c,i) => <li key={i} className="rounded-2xl bg-[#1c1f2e] px-4 py-2.5 text-sm text-slate-300">{c}</li>)}</ul>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-[1fr_72px] gap-2">
                            <input value={editDraft.name??''} onChange={e => setEditDraft({ ...editDraft, name:e.target.value })} className={C.inputSm} />
                            <input value={editDraft.icon??''} onChange={e => setEditDraft({ ...editDraft, icon:e.target.value })} className={`${C.inputSm} px-2 text-center text-xl`} />
                          </div>
                          <select value={editDraft.commentStyle} onChange={e => setEditDraft({ ...editDraft, commentStyle:e.target.value as CommentStyle })} className={C.inputSm}>
                            {Object.entries(commentStyleLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <textarea value={editDraft.tone??''} onChange={e => setEditDraft({ ...editDraft, tone:e.target.value })} rows={2} placeholder="口調メモ" className={C.inputSm} />
                          <input value={(editDraft.triggerTopics??[]).join(', ')} onChange={e => setEditDraft({ ...editDraft, triggerTopics:e.target.value.split(',').map(t=>t.trim()).filter(Boolean) })} placeholder="反応トピック（カンマ区切り）" className={C.inputSm} />
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(persona.id)} className={`flex-1 ${C.btnGold} py-2.5`}>保存</button>
                            <button onClick={() => { setEditingPersonaId(null); setEditDraft({}); }} className={`flex-1 ${C.btnSm}`}>キャンセル</button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                  {personas.length === 0 && <div className="rounded-3xl border border-dashed border-[#2e3148] p-8 text-center text-sm text-slate-500">まだ人格がありません</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── 投稿管理 ── */}
          {activePage === 'publishing' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {(['all','idea','script','production','editing','published','review'] as const).map(f => (
                  <button key={f} onClick={() => setPubFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${pubFilter === f ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#1c1f2e] text-slate-500 ring-1 ring-[#2e3148] hover:bg-[#252838]'}`}>
                    {f === 'all' ? 'すべて' : planStatusLabels[f]}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredPlans.map(plan => (
                  <article key={plan.id} className={`p-5 ${C.card}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-200">{plan.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">元動画: {videoMap[plan.sourceVideoId]?.title ?? '未選択'}{plan.scheduledDate && <> · 予定: {formatDate(plan.scheduledDate)}</>}</p>
                      </div>
                      <select value={plan.status} onChange={e => updatePlan(plan.id, { status:e.target.value as ContentPlan['status'] })} className="rounded-2xl border border-[#2e3148] bg-[#252838] px-3 py-2 text-xs font-medium text-slate-300 outline-none">
                        {Object.entries(planStatusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs text-slate-500">
                        投稿URL
                        <input value={plan.postedUrl} onChange={e => updatePlan(plan.id, { postedUrl:e.target.value })} placeholder="https://youtu.be/..." className={`mt-1.5 ${C.inputSm}`} />
                      </label>
                      <label className="block text-xs text-slate-500">
                        反応メモ
                        <input value={plan.metricsMemo} onChange={e => updatePlan(plan.id, { metricsMemo:e.target.value })} placeholder="再生数、コメント傾向など" className={`mt-1.5 ${C.inputSm}`} />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ── 設定 ── */}
          {activePage === 'settings' && (
            <div className="space-y-6">
              <div className={`p-6 ${C.card}`}>
                <h3 className={C.h3}>今後の拡張案</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  {[
                    'Gemini APIで「登録＋人格を自動生成」を本物のAI生成に差し替え（generatePersonaMock関数を置き換えるだけ）',
                    'YouTube oEmbed でURLからタイトル・サムネを自動取得',
                    '人格データをJSON/CSVで配信画面にエクスポート',
                    'Supabase移行済み → 次はStripe月額課金追加',
                    '雨域Core / 人格実験場との API 接続'
                  ].map(item => (
                    <li key={item} className="flex gap-2"><span className="text-[#2e3148]">—</span>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 p-6 shadow-panel">
                <div className="flex items-center gap-3">
                  <h3 className={C.h3}>VTuber配信画面への接続</h3>
                  <span className="rounded-full bg-[#c9a84c]/20 px-2.5 py-0.5 text-xs font-medium text-[#c9a84c]">接続可能</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">作成したコメント人格を <code className="rounded bg-[#252838] px-1.5 py-0.5 text-xs text-slate-300">ai-comment-personas.html</code> に読み込める形式でエクスポートします。</p>
                <div className="mt-4 rounded-2xl bg-[#1c1f2e] p-4 text-sm text-slate-400 space-y-1.5">
                  <p className="font-medium text-slate-300">接続手順</p>
                  <ol className="list-decimal space-y-1 pl-5 text-slate-500">
                    <li>下のボタンで <code className="text-xs bg-[#252838] px-1 rounded text-slate-300">channel-os-personas.json</code> をダウンロード</li>
                    <li>VTuberフォルダの <code className="text-xs bg-[#252838] px-1 rounded text-slate-300">ai-comment-personas.html</code> を開く</li>
                    <li>「インポート」ボタンからそのJSONを読み込む</li>
                  </ol>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={exportToVTuber} className={C.btnGold}>人格をエクスポート（{personas.length}件）</button>
                  {exportSuccess && <span className="text-sm font-medium text-emerald-400">✓ ダウンロードしました</span>}
                </div>
              </div>

              <div className={`p-6 ${C.card}`}>
                <h3 className={C.h3}>データリセット</h3>
                <p className="mt-2 text-sm text-slate-500">Supabaseとlocalのデータを削除します。</p>
                <button onClick={async () => {
                  if (!user) return;
                  await Promise.all([
                    supabase.from('videos').delete().eq('user_id', user.id),
                    supabase.from('personas').delete().eq('user_id', user.id)
                  ]);
                  localStorage.removeItem(PLANS_KEY);
                  setVideos([]); setPersonas([]); setPlans(mockPlans);
                }} className={`mt-4 ${C.btnDanger}`}>
                  データをリセット
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
