import { createClient } from '@supabase/supabase-js';
import type { VideoItem, CommentPersona, ContentPlan } from './mockData';

const VALID_COMMENT_STYLES = ['short', 'long', 'question', 'reaction', 'analysis'] as const;
const VALID_VIDEO_STATUSES  = ['reference', 'idea', 'posted', 'onHold'] as const;
const VALID_PLAN_STATUSES   = ['idea', 'script', 'production', 'editing', 'published', 'review'] as const;
const VALID_PRIORITIES      = ['low', 'medium', 'high'] as const;

function safeCommentStyle(v: unknown): CommentPersona['commentStyle'] {
  return VALID_COMMENT_STYLES.includes(v as CommentPersona['commentStyle']) ? (v as CommentPersona['commentStyle']) : 'short';
}
function safeVideoStatus(v: unknown): VideoItem['status'] {
  return VALID_VIDEO_STATUSES.includes(v as VideoItem['status']) ? (v as VideoItem['status']) : 'reference';
}
function safePlanStatus(v: unknown): ContentPlan['status'] {
  return VALID_PLAN_STATUSES.includes(v as ContentPlan['status']) ? (v as ContentPlan['status']) : 'idea';
}
function safePriority(v: unknown): ContentPlan['priority'] {
  return VALID_PRIORITIES.includes(v as ContentPlan['priority']) ? (v as ContentPlan['priority']) : 'medium';
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase環境変数が未設定です。.env.local を確認してください。');
}
export const supabase = createClient(supabaseUrl, supabaseKey);

// DB(snake_case) ↔ TypeScript(camelCase) 変換
export function dbToVideo(row: Record<string, unknown>): VideoItem {
  return {
    id: row.id as string,
    url: (row.url as string) || '',
    title: (row.title as string) || '',
    summary: (row.summary as string) || '',
    genre: (row.genre as string) || '',
    tags: (row.tags as string[]) || [],
    memo: (row.memo as string) || '',
    status: safeVideoStatus(row.status),
    createdAt: (row.created_at as string) || new Date().toISOString()
  };
}

export function videoToDb(video: VideoItem, userId: string) {
  return {
    id: video.id,
    user_id: userId,
    url: video.url,
    title: video.title,
    summary: video.summary,
    genre: video.genre,
    tags: video.tags,
    memo: video.memo,
    status: video.status
    // created_at はDB側のDEFAULT now()に任せる（クライアント時刻を送らない）
  };
}

export function dbToPersona(row: Record<string, unknown>): CommentPersona {
  return {
    id: row.id as string,
    sourceVideoId: (row.source_video_id as string) || '',
    name: (row.name as string) || '',
    icon: (row.icon as string) || '💬',
    commentStyle: safeCommentStyle(row.comment_style),
    tone: (row.tone as string) || '',
    triggerTopics: (row.trigger_topics as string[]) || [],
    sampleComments: (row.sample_comments as string[]) || [],
    createdAt: (row.created_at as string) || new Date().toISOString()
  };
}

export function personaToDb(persona: CommentPersona, userId: string) {
  return {
    id: persona.id,
    user_id: userId,
    source_video_id: persona.sourceVideoId || null, // 空文字はFKエラーになるのでnullに変換
    name: persona.name,
    icon: persona.icon,
    comment_style: persona.commentStyle,
    tone: persona.tone,
    trigger_topics: persona.triggerTopics,
    sample_comments: persona.sampleComments
    // created_at はDB側のDEFAULT now()に任せる
  };
}

export function dbToContentPlan(row: Record<string, unknown>): ContentPlan {
  return {
    id: row.id as string,
    sourceVideoId: (row.source_video_id as string) || '',
    title: (row.title as string) || '',
    hook: (row.hook as string) || '',
    scriptMemo: (row.script_memo as string) || '',
    thumbnailIdea: (row.thumbnail_idea as string) || '',
    purpose: (row.purpose as string) || '',
    priority: safePriority(row.priority),
    status: safePlanStatus(row.status),
    scheduledDate: (row.scheduled_date as string) || '',
    postedUrl: (row.posted_url as string) || '',
    metricsMemo: (row.metrics_memo as string) || '',
    selectedPersonas: (row.selected_personas as string[]) || []
  };
}

export function contentPlanToDb(plan: ContentPlan, userId: string) {
  return {
    id: plan.id,
    user_id: userId,
    source_video_id: plan.sourceVideoId,
    title: plan.title,
    hook: plan.hook,
    script_memo: plan.scriptMemo,
    thumbnail_idea: plan.thumbnailIdea,
    purpose: plan.purpose,
    priority: plan.priority,
    status: plan.status,
    scheduled_date: plan.scheduledDate,
    posted_url: plan.postedUrl,
    metrics_memo: plan.metricsMemo,
    selected_personas: plan.selectedPersonas
  };
}
