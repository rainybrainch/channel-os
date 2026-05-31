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

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0] || null;
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    return null;
  } catch {
    return null;
  }
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

async function fetchYouTubeTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json() as { title?: string };
    return data.title ?? null;
  } catch {
    return null;
  }
}

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
  btnDangerSm: 'rounded-xl px-3 py-1.5 text-xs font-medium text-red-500/70 transition hover:bg-red-900/20 hover:text-red-400',
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
  const [plans, setPlans] = useState<ContentPlan[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const r = localStorage.getItem(PLANS_KEY);
      return r ? JSON.parse(r) : [];
    } catch { return []; }
  });
  const [personas, setPersonas] = useState<CommentPersona[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── 仕分けページ state
  const [sortFilter, setSortFilter] = useState<VideoItem['status'] | 'all'>('all');
  const [videoSearch, setVideoSearch] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCharaName, setQuickCharaName] = useState('');
  const [quickPersonality, setQuickPersonality] = useState<PersonalityType>('考察系');
  const [quickEnergy, setQuickEnergy] = useState<EnergyLevel>('ふつう');

  // ── 動画展開編集 state
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [videoEditDraft, setVideoEditDraft] = useState<Partial<VideoItem>>({});

  // ── 人格ページ state
  const [draftPersona, setDraftPersona] = useState<Partial<CommentPersona>>({
    sourceVideoId:'', name:'', icon:'💬', commentStyle:'short', tone:'', triggerTopics:[], sampleComments:[]
  });
  const [sampleCommentsText, setSampleCommentsText] = useState('');
  const [expandedPersonaId, setExpandedPersonaId] = useState<string | null>(null);
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CommentPersona>>({});

  // ── 投稿管理 state
  const [pubFilter, setPubFilter] = useState<ContentPlan['status'] | 'all'>('all');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanVideoId, setNewPlanVideoId] = useState('');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [planEditDraft, setPlanEditDraft] = useState<Partial<ContentPlan>>({});

  // ── 人格検索 state
  const [personaSearch, setPersonaSearch] = useState('');

  // ── URL自動タイトル取得
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);

  // ── 仕分けページ：人格生成フォームの折りたたみ
  const [showPersonaGen, setShowPersonaGen] = useState(false);

  // ── 認証
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // ── データ取得
  useEffect(() => {
    if (!user) return;
    setLoadError(null);
    const load = async () => {
      const [{ data: vData, error: vErr }, { data: pData, error: pErr }] = await Promise.all([
        supabase.from('videos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('personas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      if (vErr || pErr) {
        setLoadError('データの読み込みに失敗しました。再読み込みしてください。');
        return;
      }
      if (vData) setVideos(vData.map(dbToVideo));
      if (pData) setPersonas(pData.map(dbToPersona));
    };
    load();
  }, [user]);

  useEffect(() => { try { const r = localStorage.getItem(PLANS_KEY); if (r) setPlans(JSON.parse(r)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); }, [plans]);

  // ── キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

      // / → 仕分けページの検索にフォーカス
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        setActivePage('sorting');
        setTimeout(() => document.getElementById('video-search-input')?.focus(), 50);
      }
      // Escape → 展開中パネルを閉じる
      if (e.key === 'Escape') {
        setExpandedVideoId(null);
        setExpandedPersonaId(null);
        setExpandedPlanId(null);
        setNewPlanOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setVideos([]); setPersonas([]); setPlans([]); setActivePage('dashboard');
      router.push('/login');
    }
  };

  const navigateTo = (page: PageKey) => {
    if (page === 'persona') {
      setDraftPersona({ sourceVideoId:'', name:'', icon:'💬', commentStyle:'short', tone:'', triggerTopics:[], sampleComments:[] });
      setSampleCommentsText('');
    }
    setActivePage(page);
  };

  const videoMap = useMemo(() => Object.fromEntries(videos.map(v => [v.id, v])), [videos]);

  const counts = useMemo(() => ({
    reference: videos.filter(v => v.status === 'reference').length,
    idea:      videos.filter(v => v.status === 'idea').length,
    posted:    videos.filter(v => v.status === 'posted').length,
    onHold:    videos.filter(v => v.status === 'onHold').length
  }), [videos]);

  const filteredVideos = useMemo(() => {
    let vids = sortFilter === 'all' ? videos : videos.filter(v => v.status === sortFilter);
    const q = videoSearch.trim().toLowerCase();
    if (q) vids = vids.filter(v => v.title.toLowerCase().includes(q) || v.url.toLowerCase().includes(q) || v.memo.toLowerCase().includes(q));
    return vids;
  }, [videos, sortFilter, videoSearch]);

  const filteredPlans  = useMemo(() => pubFilter === 'all' ? plans : plans.filter(p => p.status === pubFilter), [plans, pubFilter]);

  // ── 動画操作
  const addVideoOnly = async (e: React.MouseEvent) => {
    if (!user || isSubmitting) return;
    const url = quickUrl.trim(); if (!url) return;
    if (videos.some(v => v.url === url)) { alert('同じURLがすでに登録されています'); return; }
    setIsSubmitting(true);
    const next: VideoItem = { id:`video-${Date.now()}`, url, title:quickTitle.trim()||url, summary:'', genre:'', tags:[], memo:'', status:'reference', createdAt:new Date().toISOString() };
    setVideos(prev => [next, ...prev]); setQuickUrl(''); setQuickTitle('');
    const { error } = await supabase.from('videos').insert(videoToDb(next, user.id));
    if (error) setVideos(prev => prev.filter(v => v.id !== next.id));
    setIsSubmitting(false);
  };

  const addVideoAndGeneratePersona = async (e: React.MouseEvent) => {
    if (!user || isSubmitting) return;
    const url = quickUrl.trim(); if (!url) return;
    if (videos.some(v => v.url === url)) { alert('同じURLがすでに登録されています'); return; }
    setIsSubmitting(true);
    const videoId = `video-${Date.now()}`;
    const personaId = `persona-${Date.now() + 1}`;
    const newVideo: VideoItem = { id:videoId, url, title:quickTitle.trim()||url, summary:'', genre:'', tags:[], memo:'', status:'reference', createdAt:new Date().toISOString() };
    const newPersona = { ...generatePersonaMock({ videoId, charaName:quickCharaName, personalityType:quickPersonality, energy:quickEnergy }), id: personaId };
    setVideos(prev => [newVideo, ...prev]); setPersonas(prev => [newPersona, ...prev]); setExpandedPersonaId(newPersona.id);
    setQuickUrl(''); setQuickTitle(''); setQuickCharaName('');
    const [vResult, pResult] = await Promise.all([
      supabase.from('videos').insert(videoToDb(newVideo, user.id)),
      supabase.from('personas').insert(personaToDb(newPersona, user.id))
    ]);
    if (vResult.error) setVideos(prev => prev.filter(v => v.id !== newVideo.id));
    if (pResult.error) setPersonas(prev => prev.filter(p => p.id !== newPersona.id));
    setIsSubmitting(false);
  };

  const updateVideo = async (id: string, updated: Partial<VideoItem>) => {
    if (!user) return;
    const prevVideos = videos;
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updated } : v));
    const d: Record<string,unknown> = {};
    if (updated.status    !== undefined) d.status    = updated.status;
    if (updated.title     !== undefined) d.title     = updated.title;
    if (updated.memo      !== undefined) d.memo      = updated.memo;
    if (updated.summary   !== undefined) d.summary   = updated.summary;
    if (updated.genre     !== undefined) d.genre     = updated.genre;
    if (updated.tags      !== undefined) d.tags      = updated.tags;
    const { error } = await supabase.from('videos').update(d).eq('id', id).eq('user_id', user.id);
    if (error) setVideos(prevVideos);
  };

  const deleteVideo = async (id: string) => {
    if (!user) return;
    if (!window.confirm('この動画を削除しますか？')) return;
    const prevVideos = videos;
    setVideos(prev => prev.filter(v => v.id !== id));
    if (expandedVideoId === id) setExpandedVideoId(null);
    const { error } = await supabase.from('videos').delete().eq('id', id).eq('user_id', user.id);
    if (error) setVideos(prevVideos);
  };

  // 動画詳細展開編集
  const openVideoEdit = (v: VideoItem) => {
    setExpandedVideoId(v.id);
    setVideoEditDraft({ title: v.title, memo: v.memo, summary: v.summary, genre: v.genre, tags: v.tags });
  };

  const saveVideoEdit = async (id: string) => {
    await updateVideo(id, videoEditDraft);
    setExpandedVideoId(null);
  };

  // ── 人格操作
  const updatePlan = (id: string, updated: Partial<ContentPlan>) => setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));

  const updatePersona = async (id: string, updated: Partial<CommentPersona>) => {
    if (!user) return;
    const prevPersonas = personas;
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    const d: Record<string,unknown> = {};
    if (updated.name           !== undefined) d.name            = updated.name;
    if (updated.icon           !== undefined) d.icon            = updated.icon;
    if (updated.tone           !== undefined) d.tone            = updated.tone;
    if (updated.commentStyle   !== undefined) d.comment_style   = updated.commentStyle;
    if (updated.triggerTopics  !== undefined) d.trigger_topics  = updated.triggerTopics;
    if (updated.sampleComments !== undefined) d.sample_comments = updated.sampleComments;
    const { error } = await supabase.from('personas').update(d).eq('id', id).eq('user_id', user.id);
    if (error) setPersonas(prevPersonas);
  };

  const deletePersona = async (id: string) => {
    if (!user) return;
    if (!window.confirm('この人格を削除しますか？')) return;
    const prevPersonas = personas;
    setPersonas(prev => prev.filter(p => p.id !== id));
    if (expandedPersonaId === id) setExpandedPersonaId(null);
    const { error } = await supabase.from('personas').delete().eq('id', id).eq('user_id', user.id);
    if (error) setPersonas(prevPersonas);
  };

  // ── 投稿管理操作
  const addPlan = (titleOverride?: string, videoIdOverride?: string) => {
    const title = titleOverride ?? newPlanTitle.trim();
    if (!title) return;
    const next: ContentPlan = {
      id: `plan-${Date.now()}`,
      sourceVideoId: videoIdOverride ?? newPlanVideoId,
      title,
      hook: '', scriptMemo: '', thumbnailIdea: '', purpose: '',
      priority: 'medium', status: 'idea',
      scheduledDate: '', postedUrl: '', metricsMemo: '', selectedPersonas: []
    };
    setPlans(prev => [next, ...prev]);
    if (!titleOverride) { setNewPlanTitle(''); setNewPlanVideoId(''); setNewPlanOpen(false); }
    else setActivePage('publishing');
  };

  const promoteVideoToPlan = (video: VideoItem) => addPlan(video.title, video.id);

  const deletePlan = (id: string) => {
    if (!window.confirm('この企画を削除しますか？')) return;
    setPlans(prev => prev.filter(p => p.id !== id));
    if (expandedPlanId === id) setExpandedPlanId(null);
  };

  const openPlanEdit = (p: ContentPlan) => {
    setExpandedPlanId(p.id);
    setPlanEditDraft({ hook: p.hook, scriptMemo: p.scriptMemo, thumbnailIdea: p.thumbnailIdea, purpose: p.purpose, scheduledDate: p.scheduledDate, priority: p.priority });
  };

  const savePlanEdit = (id: string) => {
    updatePlan(id, planEditDraft);
    setExpandedPlanId(null);
  };

  const handleUrlBlur = async () => {
    const url = quickUrl.trim();
    if (!url || quickTitle.trim() || !isSafeUrl(url)) return;
    setIsFetchingTitle(true);
    const title = await fetchYouTubeTitle(url);
    if (title) setQuickTitle(title);
    setIsFetchingTitle(false);
  };

  // ── ステータスサイクル（バッジクリック用）
  const STATUS_ORDER: VideoItem['status'][] = ['reference', 'idea', 'onHold', 'posted'];
  const cycleVideoStatus = (video: VideoItem) => {
    const idx = STATUS_ORDER.indexOf(video.status);
    updateVideo(video.id, { status: STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] });
  };

  // ── 人格複製
  const duplicatePersona = async (p: CommentPersona) => {
    if (!user) return;
    const next: CommentPersona = {
      ...p,
      id: `persona-${Date.now()}`,
      name: `${p.name}（コピー）`,
      createdAt: new Date().toISOString()
    };
    setPersonas(prev => [next, ...prev]);
    setExpandedPersonaId(next.id);
    const { error } = await supabase.from('personas').insert(personaToDb(next, user.id));
    if (error) setPersonas(prev => prev.filter(x => x.id !== next.id));
  };

  // ── CSV エクスポート
  function downloadCSV(rows: string[][], filename: string) {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  const exportVideosCSV = () => {
    downloadCSV(
      [
        ['タイトル', 'URL', 'ステータス', 'ジャンル', 'タグ', 'メモ', 'サマリー', '登録日'],
        ...videos.map(v => [v.title, v.url, videoStatusLabels[v.status], v.genre, v.tags.join('|'), v.memo, v.summary, formatDate(v.createdAt)])
      ],
      'channel-os-videos.csv'
    );
  };

  const exportPersonasCSV = () => {
    downloadCSV(
      [
        ['名前', 'アイコン', 'スタイル', '口調', '反応トピック', 'サンプルコメント', '元動画', '作成日'],
        ...personas.map(p => [p.name, p.icon, commentStyleLabels[p.commentStyle], p.tone, p.triggerTopics.join('|'), p.sampleComments.join('|'), videoMap[p.sourceVideoId]?.title ?? '', formatDate(p.createdAt)])
      ],
      'channel-os-personas.csv'
    );
  };

  const goToPersonaForm = (videoId: string) => {
    setDraftPersona({ sourceVideoId:videoId, name:'', icon:'💬', commentStyle:'short', tone:'', triggerTopics:[], sampleComments:[] });
    setSampleCommentsText(''); setActivePage('persona');
  };

  const addPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !draftPersona.name?.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const next: CommentPersona = {
      id:`persona-${Date.now()}`, sourceVideoId:draftPersona.sourceVideoId ?? '', name:draftPersona.name.trim(),
      icon:draftPersona.icon||'💬', commentStyle:draftPersona.commentStyle??'short', tone:draftPersona.tone??'',
      triggerTopics:draftPersona.triggerTopics??[], sampleComments:sampleCommentsText.split('\n').map(s=>s.trim()).filter(Boolean),
      createdAt:new Date().toISOString()
    };
    setPersonas(prev => [next, ...prev]); setExpandedPersonaId(next.id);
    setDraftPersona({ ...draftPersona, name:'', icon:'💬', tone:'', triggerTopics:[], sampleComments:[] }); setSampleCommentsText('');
    const { error } = await supabase.from('personas').insert(personaToDb(next, user.id));
    if (error) setPersonas(prev => prev.filter(p => p.id !== next.id));
    setIsSubmitting(false);
  };

  const startEdit = (p: CommentPersona) => { setEditingPersonaId(p.id); setEditDraft({ name:p.name, icon:p.icon, tone:p.tone, commentStyle:p.commentStyle, triggerTopics:p.triggerTopics }); };
  const saveEdit  = (id: string) => {
    if (!editDraft.name?.trim()) return;
    updatePersona(id, editDraft);
    setEditingPersonaId(null);
    setEditDraft({});
  };

  const exportToVTuber = () => {
    const data = toVTuberFormat(personas, videoMap);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'channel-os-personas.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setExportSuccess(true); setTimeout(() => setExportSuccess(false), 3000);
  };

  const activeLabel = navItems.find(n => n.key === activePage)?.label ?? '';

  if (authLoading) return <main className="flex min-h-screen items-center justify-center"><p className="text-sm text-slate-500">読み込み中...</p></main>;

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
          <nav aria-label="メインナビゲーション" className="space-y-1">
            {navItems.map(item => (
              <button key={item.key}
                onClick={() => navigateTo(item.key)}
                aria-current={activePage === item.key ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${activePage === item.key ? 'bg-[#c9a84c] text-[#12141f]' : 'text-slate-500 hover:bg-[#252838] hover:text-slate-200'}`}>
                <span aria-hidden="true" className="w-4 text-center text-xs">{item.symbol}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-8 space-y-2">
            {[['登録動画', videos.length], ['コメント人格', personas.length], ['企画', plans.length]].map(([label, count]) => (
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

          {loadError && (
            <div className="rounded-2xl border border-red-900/50 bg-red-900/20 px-5 py-3 text-sm text-red-400 flex items-center justify-between">
              <span>{loadError}</span>
              <button aria-label="エラーを閉じる" onClick={() => setLoadError(null)} className="text-red-500 hover:text-red-300">✕</button>
            </div>
          )}

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
              <div className="rounded-2xl bg-[#252838] px-5 py-3 text-center">
                <p className="text-xs text-slate-500">全動画</p>
                <p className="text-xl font-semibold text-slate-100">{videos.length}</p>
              </div>
              <div className="rounded-2xl bg-[#c9a84c]/10 px-5 py-3 text-center">
                <p className="text-xs text-[#c9a84c]">人格</p>
                <p className="text-xl font-semibold text-slate-100">{personas.length}</p>
              </div>
            </div>
          </div>

          {/* ── Dashboard ── */}
          {activePage === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className={`p-6 ${C.card}`}>
                  <h3 className={C.h3}>動画ステータス</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {(['reference','idea','onHold','posted'] as const).map(s => (
                      <button key={s} onClick={() => { setSortFilter(s); navigateTo('sorting'); }}
                        className="rounded-2xl bg-[#252838] p-4 text-left transition hover:bg-[#2e3148]">
                        <p className="text-xs text-slate-500">{videoStatusLabels[s]}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-100">{counts[s]}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setSortFilter('all'); navigateTo('sorting'); }}
                    className="mt-3 w-full rounded-2xl bg-[#c9a84c] py-2.5 text-sm font-medium text-[#12141f] transition hover:bg-[#b8963f]">
                    仕分けページへ
                  </button>
                  {videos.length > 0 && (
                    <div className="mt-4 flex gap-4 border-t border-[#2e3148] pt-4 text-center">
                      <div className="flex-1">
                        <p className={C.muted}>人格/動画比</p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {videos.length > 0 ? (personas.length / videos.length).toFixed(1) : '0'}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className={C.muted}>企画数</p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">{plans.length}</p>
                      </div>
                      <div className="flex-1">
                        <p className={C.muted}>投稿済み</p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">{counts.posted}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-6 ${C.card}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={C.h3}>コメント人格</h3>
                    <button onClick={() => navigateTo('persona')} aria-label="コメント人格をすべて見る" className="text-xs text-slate-500 underline-offset-2 hover:text-[#c9a84c] hover:underline">すべて見る →</button>
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
                        <button onClick={() => navigateTo('sorting')} className="mt-2 text-xs text-[#c9a84c] underline-offset-2 hover:underline">YouTube仕分けから作成する</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 最近の動画 + 進行中企画 */}
              <div className="grid gap-6 lg:grid-cols-2">
                {videos.length > 0 && (
                  <div className={`p-6 ${C.card}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={C.h3}>最近登録した動画</h3>
                      <button onClick={() => navigateTo('sorting')} className="text-xs text-slate-500 underline-offset-2 hover:text-[#c9a84c] hover:underline">すべて見る →</button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {videos.slice(0, 3).map(v => {
                        const linked = personas.filter(p => p.sourceVideoId === v.id);
                        const thumb = getYouTubeThumbnail(v.url);
                        return (
                          <div key={v.id} className="flex items-center gap-3 rounded-2xl bg-[#252838] px-3 py-2.5">
                            {thumb && (
                              <img src={thumb} alt={v.title} width={64} height={36}
                                className="shrink-0 rounded-lg object-cover"
                                style={{ width: 64, height: 36 }}
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-200">{v.title}</p>
                              <p className={C.muted}><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${videoStatusColors[v.status]}`}>{videoStatusLabels[v.status]}</span>{linked.length > 0 && <> · 人格 {linked.length}件</>}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {plans.length > 0 && (
                  <div className={`p-6 ${C.card}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={C.h3}>進行中の企画</h3>
                      <button onClick={() => navigateTo('publishing')} className="text-xs text-slate-500 underline-offset-2 hover:text-[#c9a84c] hover:underline">すべて見る →</button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {plans.filter(p => p.status !== 'published').slice(0, 4).map(p => (
                        <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-[#252838] px-4 py-3">
                          <span className="badge badge-light shrink-0">{planStatusLabels[p.status]}</span>
                          <p className="min-w-0 flex-1 truncate text-sm text-slate-300">{p.title}</p>
                          {p.priority === 'high' && <span className="shrink-0 text-xs text-amber-400">優先</span>}
                        </div>
                      ))}
                      {plans.filter(p => p.status !== 'published').length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[#2e3148] p-5 text-center">
                          <p className="text-sm text-slate-500">進行中の企画なし</p>
                          <button onClick={() => navigateTo('publishing')} className="mt-2 text-xs text-[#c9a84c] underline-offset-2 hover:underline">企画を追加する</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                    <div className="relative flex-[2]">
                      <input value={quickUrl} onChange={e => setQuickUrl(e.target.value)} onBlur={handleUrlBlur} placeholder="https://www.youtube.com/watch?v=..." className={`w-full ${C.input}`} />
                      {isFetchingTitle && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">取得中...</span>}
                    </div>
                    <input value={quickTitle} onChange={e => setQuickTitle(e.target.value)} placeholder={isFetchingTitle ? 'タイトル取得中...' : 'タイトル（URL入力後に自動取得）'} className={`flex-1 ${C.input}`} />
                  </div>

                  {/* 人格生成フォーム（折りたたみ） */}
                  <div className="rounded-2xl border border-[#2e3148] bg-[#141720] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPersonaGen(v => !v)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">コメント人格を同時に生成する（任意）</p>
                      <span className="text-xs text-slate-600">{showPersonaGen ? '▲ 閉じる' : '▼ 開く'}</span>
                    </button>
                    {showPersonaGen && (
                      <div className="space-y-4 px-4 pb-4">
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
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={addVideoOnly} disabled={isSubmitting || !quickUrl.trim()} className="flex-1 rounded-2xl border border-[#2e3148] bg-[#252838] py-3 text-sm font-medium text-slate-400 transition hover:bg-[#2e3148] disabled:opacity-50">URLのみ登録</button>
                    {showPersonaGen
                      ? <button type="button" onClick={addVideoAndGeneratePersona} disabled={isSubmitting || !quickUrl.trim()} className={`flex-[2] ${C.btnGold} disabled:opacity-50`}>{isSubmitting ? '処理中...' : '登録 ＋ 人格を自動生成 →'}</button>
                      : <button type="button" onClick={addVideoOnly} disabled={isSubmitting || !quickUrl.trim()} className={`flex-[2] ${C.btnGold} disabled:opacity-50`}>{isSubmitting ? '処理中...' : '登録'}</button>
                    }
                  </div>
                </div>
              </div>

              {/* 検索 + フィルター */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="video-search-input"
                  value={videoSearch}
                  onChange={e => setVideoSearch(e.target.value)}
                  placeholder="タイトル・URL・メモで検索...（/キーでフォーカス）"
                  className="flex-1 rounded-2xl border border-[#2e3148] bg-[#1c1f2e] px-4 py-2.5 text-sm text-slate-300 outline-none transition focus:border-[#c9a84c]/60"
                />
                <div className="flex flex-wrap gap-2">
                  {(['all','reference','idea','onHold','posted'] as const).map(f => (
                    <button key={f} onClick={() => setSortFilter(f)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sortFilter === f ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#1c1f2e] text-slate-500 ring-1 ring-[#2e3148] hover:bg-[#252838]'}`}>
                      {f === 'all' ? 'すべて' : videoStatusLabels[f]}
                      <span className="ml-1.5 text-xs opacity-60">{f === 'all' ? videos.length : counts[f]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {videoSearch && (
                <p className={C.muted}>「{videoSearch}」の検索結果: {filteredVideos.length}件</p>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                {filteredVideos.map(video => {
                  const linked = personas.filter(p => p.sourceVideoId === video.id);
                  const isExpanded = expandedVideoId === video.id;
                  const thumbnail = getYouTubeThumbnail(video.url);
                  return (
                    <article key={video.id} className={`p-5 ${C.card}`}>
                      {/* ── 通常表示 ── */}
                      <div className="flex items-start gap-3">
                        {thumbnail && (
                          <a href={isSafeUrl(video.url) ? video.url : '#'} target="_blank" rel="noreferrer" className="shrink-0">
                            <img
                              src={thumbnail}
                              alt={video.title}
                              width={100}
                              height={56}
                              className="rounded-xl object-cover"
                              style={{ width: 100, height: 56 }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          </a>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-200">{video.title}</p>
                          <a href={isSafeUrl(video.url) ? video.url : '#'} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs text-slate-600 transition hover:text-slate-400">{video.url}</a>
                          <p className="mt-1 text-xs text-slate-600">{formatDate(video.createdAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-start gap-1">
                          <button
                            onClick={() => cycleVideoStatus(video)}
                            title="クリックしてステータスを変更"
                            className={`rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-70 ${videoStatusColors[video.status]}`}>
                            {videoStatusLabels[video.status]}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(['reference','idea','onHold','posted'] as const).map(s => (
                          <button key={s} onClick={() => updateVideo(video.id, { status:s })}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${video.status === s ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#252838] text-slate-500 hover:bg-[#2e3148]'}`}>
                            {videoStatusLabels[s]}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#2e3148] pt-4">
                        <a href={isSafeUrl(video.url) ? video.url : '#'} target="_blank" rel="noreferrer" className={`text-center ${C.btnSm}`}>開く</a>
                        <button onClick={() => goToPersonaForm(video.id)} className={`${C.btnGold}`}>人格を作る</button>
                        <button onClick={() => promoteVideoToPlan(video)} title="投稿管理に企画として追加" className="rounded-2xl bg-[#252838] px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-[#2e3148]">企画化 ▲</button>
                        <button
                          onClick={() => isExpanded ? setExpandedVideoId(null) : openVideoEdit(video)}
                          aria-label="詳細編集"
                          className={`rounded-2xl px-3 py-2.5 text-xs font-medium transition ${isExpanded ? 'bg-[#c9a84c]/20 text-[#c9a84c]' : 'bg-[#252838] text-slate-400 hover:bg-[#2e3148]'}`}>
                          {isExpanded ? '閉じる' : '編集'}
                        </button>
                        <button onClick={() => deleteVideo(video.id)} aria-label="削除" className={C.btnDangerSm}>削除</button>
                      </div>

                      {/* ── 展開編集フォーム ── */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t border-[#2e3148] pt-4">
                          <label className={C.label}>
                            タイトル
                            <input value={videoEditDraft.title ?? ''} onChange={e => setVideoEditDraft(d => ({ ...d, title: e.target.value }))} className={`mt-1.5 ${C.inputSm}`} />
                          </label>
                          <label className={C.label}>
                            メモ
                            <textarea value={videoEditDraft.memo ?? ''} onChange={e => setVideoEditDraft(d => ({ ...d, memo: e.target.value }))} rows={2} placeholder="参考にしたいポイントなど..." className={`mt-1.5 ${C.inputSm}`} />
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className={C.label}>
                              ジャンル
                              <input value={videoEditDraft.genre ?? ''} onChange={e => setVideoEditDraft(d => ({ ...d, genre: e.target.value }))} placeholder="考察・ゲームなど" className={`mt-1.5 ${C.inputSm}`} />
                            </label>
                            <label className={C.label}>
                              タグ（カンマ区切り）
                              <input value={(videoEditDraft.tags ?? []).join(', ')} onChange={e => setVideoEditDraft(d => ({ ...d, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} placeholder="AI, 分析, ..." className={`mt-1.5 ${C.inputSm}`} />
                            </label>
                          </div>
                          <label className={C.label}>
                            サマリー
                            <textarea value={videoEditDraft.summary ?? ''} onChange={e => setVideoEditDraft(d => ({ ...d, summary: e.target.value }))} rows={2} placeholder="動画の要約..." className={`mt-1.5 ${C.inputSm}`} />
                          </label>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setExpandedVideoId(null)} className={C.btnSm}>キャンセル</button>
                            <button onClick={() => saveVideoEdit(video.id)} className={`${C.btnGold} py-2.5`}>保存</button>
                          </div>
                        </div>
                      )}

                      {/* ── タグ表示 ── */}
                      {!isExpanded && video.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {video.tags.map(t => <span key={t} className="badge badge-light">{t}</span>)}
                        </div>
                      )}

                      {/* ── メモ表示 ── */}
                      {!isExpanded && video.memo && (
                        <p className="mt-3 text-xs text-slate-500 line-clamp-2">{video.memo}</p>
                      )}

                      {/* ── 紐づき人格 ── */}
                      {linked.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-[#2e3148] pt-3">
                          {linked.map(p => (
                            <button key={p.id} onClick={() => { setExpandedPersonaId(p.id); navigateTo('persona'); }}
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
                  <div className="col-span-2 rounded-3xl border border-dashed border-[#2e3148] p-10 text-center text-sm text-slate-600">
                    {videoSearch ? `「${videoSearch}」に一致する動画がありません。` : '動画がありません。URLを登録してください。'}
                  </div>
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
                  <div className="flex justify-end">
                    <button type="submit"
                      disabled={!draftPersona.name?.trim() || isSubmitting}
                      className={`${C.btnGold} disabled:opacity-50`}>
                      {isSubmitting ? '保存中...' : '人格を保存'}
                    </button>
                  </div>
                </form>
              </div>

              <div className={`p-6 ${C.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className={C.h3}>作成済み人格</h3>
                  <span className="badge badge-light">{personas.length} 件</span>
                </div>
                <input
                  value={personaSearch}
                  onChange={e => setPersonaSearch(e.target.value)}
                  placeholder="名前・スタイルで検索..."
                  className={`mt-3 ${C.inputSm}`}
                />
                <div className="mt-4 space-y-4">
                  {personas.filter(p => {
                    const q = personaSearch.trim().toLowerCase();
                    return !q || p.name.toLowerCase().includes(q) || commentStyleLabels[p.commentStyle].includes(q) || p.tone.toLowerCase().includes(q) || p.triggerTopics.some(t => t.toLowerCase().includes(q));
                  }).map(persona => (
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
                              <button onClick={() => duplicatePersona(persona)} title="複製" aria-label={`${persona.name}を複製`} className="rounded-xl px-2 py-1.5 text-xs text-slate-500 transition hover:bg-[#2e3148] hover:text-slate-300">複製</button>
                              <button
                                aria-expanded={expandedPersonaId === persona.id}
                                aria-label={`${persona.name}の詳細を${expandedPersonaId === persona.id ? '閉じる' : '開く'}`}
                                onClick={() => setExpandedPersonaId(expandedPersonaId === persona.id ? null : persona.id)}
                                className="rounded-xl p-2 text-xs text-slate-500 transition hover:bg-[#2e3148]">
                                <span aria-hidden="true">{expandedPersonaId === persona.id ? '▲' : '▼'}</span>
                              </button>
                              <button onClick={() => deletePersona(persona.id)} aria-label={`${persona.name}を削除`} className={C.btnDangerSm}>削除</button>
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
                          <select value={editDraft.commentStyle ?? 'short'} onChange={e => setEditDraft({ ...editDraft, commentStyle:e.target.value as CommentStyle })} className={C.inputSm}>
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
              {/* 企画追加フォーム */}
              {newPlanOpen ? (
                <div className={`p-6 ${C.card}`}>
                  <h3 className={`mb-4 ${C.h3}`}>新しい企画を追加</h3>
                  <div className="space-y-3">
                    <input
                      value={newPlanTitle}
                      onChange={e => setNewPlanTitle(e.target.value)}
                      placeholder="企画タイトル（例：AI活用で動画編集を半自動化する方法）"
                      className={C.input}
                      autoFocus
                    />
                    <select value={newPlanVideoId} onChange={e => setNewPlanVideoId(e.target.value)} className={C.input}>
                      <option value="">元動画を選択（任意）</option>
                      {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setNewPlanOpen(false); setNewPlanTitle(''); setNewPlanVideoId(''); }} className={C.btnSm}>キャンセル</button>
                      <button onClick={() => addPlan()} disabled={!newPlanTitle.trim()} className={`${C.btnGold} disabled:opacity-50`}>企画を追加</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => setNewPlanOpen(true)} className={`w-full rounded-3xl border-2 border-dashed border-[#2e3148] py-4 text-sm font-medium text-slate-500 transition hover:border-[#c9a84c]/40 hover:text-slate-300`}>
                  ＋ 新しい企画を追加
                </button>
              )}

              {/* フィルター */}
              <div className="flex flex-wrap gap-2">
                {(['all','idea','script','production','editing','published','review'] as const).map(f => (
                  <button key={f} onClick={() => setPubFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${pubFilter === f ? 'bg-[#c9a84c] text-[#12141f]' : 'bg-[#1c1f2e] text-slate-500 ring-1 ring-[#2e3148] hover:bg-[#252838]'}`}>
                    {f === 'all' ? 'すべて' : planStatusLabels[f]}
                  </button>
                ))}
              </div>

              {/* 企画カード */}
              <div className="space-y-4">
                {filteredPlans.map(plan => {
                  const isPlanExpanded = expandedPlanId === plan.id;
                  return (
                    <article key={plan.id} className={`p-5 ${C.card}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-200">{plan.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            元動画: {videoMap[plan.sourceVideoId]?.title ?? '未選択'}
                            {plan.scheduledDate && <> · 予定: {formatDate(plan.scheduledDate)}</>}
                            {plan.priority !== 'medium' && <> · <span className={plan.priority === 'high' ? 'text-amber-400' : 'text-slate-600'}>{plan.priority === 'high' ? '優先度高' : '優先度低'}</span></>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={plan.status} onChange={e => updatePlan(plan.id, { status:e.target.value as ContentPlan['status'] })} className="rounded-2xl border border-[#2e3148] bg-[#252838] px-3 py-2 text-xs font-medium text-slate-300 outline-none">
                            {Object.entries(planStatusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <button
                            onClick={() => isPlanExpanded ? setExpandedPlanId(null) : openPlanEdit(plan)}
                            className={`rounded-2xl px-3 py-2 text-xs font-medium transition ${isPlanExpanded ? 'bg-[#c9a84c]/20 text-[#c9a84c]' : 'bg-[#252838] text-slate-400 hover:bg-[#2e3148]'}`}>
                            {isPlanExpanded ? '閉じる' : '詳細'}
                          </button>
                          <button onClick={() => deletePlan(plan.id)} aria-label="この企画を削除" className={C.btnDangerSm}>削除</button>
                        </div>
                      </div>

                      {/* フック・台本メモ（常時表示） */}
                      {!isPlanExpanded && plan.hook && (
                        <p className="mt-3 text-xs text-slate-500 line-clamp-1">フック: {plan.hook}</p>
                      )}

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

                      {/* 展開編集フォーム */}
                      {isPlanExpanded && (
                        <div className="mt-4 space-y-3 border-t border-[#2e3148] pt-4">
                          <label className={C.label}>
                            フック（冒頭で視聴者を引く一言）
                            <input value={planEditDraft.hook ?? ''} onChange={e => setPlanEditDraft(d => ({ ...d, hook: e.target.value }))} placeholder="視聴者が「そういう見方があったか」と思う切り口。" className={`mt-1.5 ${C.inputSm}`} />
                          </label>
                          <label className={C.label}>
                            台本メモ
                            <textarea value={planEditDraft.scriptMemo ?? ''} onChange={e => setPlanEditDraft(d => ({ ...d, scriptMemo: e.target.value }))} rows={3} placeholder="構成・流れ・キーワードなど" className={`mt-1.5 ${C.inputSm}`} />
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className={C.label}>
                              サムネアイデア
                              <input value={planEditDraft.thumbnailIdea ?? ''} onChange={e => setPlanEditDraft(d => ({ ...d, thumbnailIdea: e.target.value }))} placeholder="色・構図・テキスト案..." className={`mt-1.5 ${C.inputSm}`} />
                            </label>
                            <label className={C.label}>
                              目的
                              <input value={planEditDraft.purpose ?? ''} onChange={e => setPlanEditDraft(d => ({ ...d, purpose: e.target.value }))} placeholder="視聴者に何を届けるか" className={`mt-1.5 ${C.inputSm}`} />
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <label className={C.label}>
                              投稿予定日
                              <input type="date" value={planEditDraft.scheduledDate ?? ''} onChange={e => setPlanEditDraft(d => ({ ...d, scheduledDate: e.target.value }))} className={`mt-1.5 ${C.inputSm}`} />
                            </label>
                            <label className={C.label}>
                              優先度
                              <select value={planEditDraft.priority ?? 'medium'} onChange={e => setPlanEditDraft(d => ({ ...d, priority: e.target.value as ContentPlan['priority'] }))} className={`mt-1.5 ${C.inputSm}`}>
                                <option value="high">高い</option>
                                <option value="medium">ふつう</option>
                                <option value="low">低い</option>
                              </select>
                            </label>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setExpandedPlanId(null)} className={C.btnSm}>キャンセル</button>
                            <button onClick={() => savePlanEdit(plan.id)} className={`${C.btnGold} py-2.5`}>保存</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
                {filteredPlans.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-[#2e3148] p-10 text-center text-sm text-slate-600">
                    企画がありません。「＋ 新しい企画を追加」から作成してください。
                  </div>
                )}
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
                    'Gemini APIで「登録＋人格を自動生成」を本物のAI生成に差し替え（lib/mockData.ts の generatePersonaMock を置き換えるだけ）',
                    'Supabase移行済み → 次はStripe月額課金追加（SaaS化）',
                    '雨域Core / 人格実験場との Supabase リアルタイム接続',
                    'YouTube Analytics API でインプレッション・CTR 取得',
                    '人格ごとのコメント生成確率・頻度設定'
                  ].map(item => (
                    <li key={item} className="flex gap-2"><span className="text-[#2e3148]">—</span>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Vercelデプロイ手順 */}
              <div className={`p-6 ${C.card}`}>
                <div className="flex items-center gap-3">
                  <h3 className={C.h3}>Vercelデプロイ手順</h3>
                  <span className="rounded-full bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">未デプロイ</span>
                </div>
                <div className="mt-4 rounded-2xl bg-[#141720] p-4 text-sm space-y-1.5">
                  <ol className="list-decimal space-y-2 pl-5 text-slate-400">
                    <li><a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-[#c9a84c] hover:underline">vercel.com/new</a> で <code className="text-xs bg-[#252838] px-1 rounded">rainybrainch/channel-os</code> をインポート</li>
                    <li>「Environment Variables」に以下を設定：
                      <div className="mt-2 space-y-1">
                        {['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].map(k => (
                          <div key={k} className="rounded-lg bg-[#252838] px-3 py-1.5 font-mono text-xs text-slate-300">{k}</div>
                        ))}
                      </div>
                    </li>
                    <li>「Deploy」をクリック → 自動ビルド完了</li>
                  </ol>
                </div>
                <p className={`mt-3 ${C.muted}`}>将来 Gemini API を追加する際は GEMINI_API_KEY も同様に環境変数へ</p>
              </div>

              {/* CSV エクスポート */}
              <div className={`p-6 ${C.card}`}>
                <h3 className={C.h3}>データエクスポート（CSV）</h3>
                <p className="mt-2 text-sm text-slate-500">登録した動画・人格データをCSVで一括ダウンロードできます。Excelでの分析やバックアップに使えます。</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={exportVideosCSV} disabled={videos.length === 0} className={`${C.btnGold} disabled:opacity-50`}>
                    動画リストをCSV（{videos.length}件）
                  </button>
                  <button onClick={exportPersonasCSV} disabled={personas.length === 0} className={`rounded-2xl border border-[#2e3148] bg-[#252838] px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-[#2e3148] disabled:opacity-50`}>
                    人格リストをCSV（{personas.length}件）
                  </button>
                </div>
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
                  if (!window.confirm('全データを削除します。この操作は元に戻せません。')) return;
                  const [vRes, pRes] = await Promise.all([
                    supabase.from('videos').delete().eq('user_id', user.id),
                    supabase.from('personas').delete().eq('user_id', user.id)
                  ]);
                  if (vRes.error || pRes.error) {
                    alert('削除に失敗しました。再度お試しください。');
                    return;
                  }
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
