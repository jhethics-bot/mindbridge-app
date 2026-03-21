/**
 * communityStore - NeuBridge Community State (Zustand)
 *
 * Manages caregiver peer support posts, replies, and hearts.
 * Realtime subscription updates the feed automatically.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  category: string;
  heart_count: number;
  reply_count: number;
  has_hearted: boolean;
  created_at: string;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface CommunityState {
  posts: CommunityPost[];
  repliesByPost: Record<string, CommunityReply[]>;
  isLoading: boolean;
  isPosting: boolean;

  // Actions
  loadPosts: (caregiverId: string, category?: string) => Promise<void>;
  loadReplies: (postId: string) => Promise<void>;
  createPost: (caregiverId: string, authorName: string, content: string, category: string) => Promise<void>;
  createReply: (postId: string, caregiverId: string, authorName: string, content: string) => Promise<void>;
  toggleHeart: (postId: string, caregiverId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  repliesByPost: {},
  isLoading: false,
  isPosting: false,

  loadPosts: async (caregiverId, category) => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: posts } = await query;

      // Check which posts the current user has hearted
      const { data: hearts } = await supabase
        .from('community_hearts')
        .select('post_id')
        .eq('caregiver_id', caregiverId);

      const heartedIds = new Set((hearts ?? []).map((h: any) => h.post_id));

      set({
        posts: (posts ?? []).map((p) => ({
          ...p,
          has_hearted: heartedIds.has(p.id),
        })),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  loadReplies: async (postId) => {
    const { data } = await supabase
      .from('community_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    set((state) => ({
      repliesByPost: { ...state.repliesByPost, [postId]: data ?? [] },
    }));
  },

  createPost: async (caregiverId, authorName, content, category) => {
    set({ isPosting: true });
    const { data } = await supabase
      .from('community_posts')
      .insert({ author_id: caregiverId, author_name: authorName, content, category, heart_count: 0, reply_count: 0 })
      .select()
      .single();

    if (data) {
      set((state) => ({
        posts: [{ ...data, has_hearted: false }, ...state.posts],
        isPosting: false,
      }));
    } else {
      set({ isPosting: false });
    }
  },

  createReply: async (postId, caregiverId, authorName, content) => {
    const { data } = await supabase
      .from('community_replies')
      .insert({ post_id: postId, author_id: caregiverId, author_name: authorName, content })
      .select()
      .single();

    if (data) {
      set((state) => ({
        repliesByPost: {
          ...state.repliesByPost,
          [postId]: [...(state.repliesByPost[postId] ?? []), data],
        },
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, reply_count: p.reply_count + 1 } : p
        ),
      }));
    }
  },

  toggleHeart: async (postId, caregiverId) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;

    const nowHearted = !post.has_hearted;

    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, has_hearted: nowHearted, heart_count: p.heart_count + (nowHearted ? 1 : -1) }
          : p
      ),
    }));

    if (nowHearted) {
      await supabase.from('community_hearts').insert({ post_id: postId, caregiver_id: caregiverId });
      await supabase.from('community_posts').update({ heart_count: post.heart_count + 1 }).eq('id', postId);
    } else {
      await supabase.from('community_hearts').delete()
        .eq('post_id', postId).eq('caregiver_id', caregiverId);
      await supabase.from('community_posts').update({ heart_count: Math.max(0, post.heart_count - 1) }).eq('id', postId);
    }
  },
}));
