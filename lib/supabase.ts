import { createClient } from '@supabase/supabase-js';
import type { VideoItem, CommentPersona } from './mockData';

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
    url: row.url as string,
    title: row.title as string,
    summary: (row.summary as string) || '',
    genre: (row.genre as string) || '',
    tags: (row.tags as string[]) || [],
    memo: (row.memo as string) || '',
    status: row.status as VideoItem['status'],
    createdAt: row.created_at as string
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
    status: video.status,
    created_at: video.createdAt
  };
}

export function dbToPersona(row: Record<string, unknown>): CommentPersona {
  return {
    id: row.id as string,
    sourceVideoId: (row.source_video_id as string) || '',
    name: row.name as string,
    icon: (row.icon as string) || '💬',
    commentStyle: row.comment_style as CommentPersona['commentStyle'],
    tone: (row.tone as string) || '',
    triggerTopics: (row.trigger_topics as string[]) || [],
    sampleComments: (row.sample_comments as string[]) || [],
    createdAt: row.created_at as string
  };
}

export function personaToDb(persona: CommentPersona, userId: string) {
  return {
    id: persona.id,
    user_id: userId,
    source_video_id: persona.sourceVideoId,
    name: persona.name,
    icon: persona.icon,
    comment_style: persona.commentStyle,
    tone: persona.tone,
    trigger_topics: persona.triggerTopics,
    sample_comments: persona.sampleComments,
    created_at: persona.createdAt
  };
}
