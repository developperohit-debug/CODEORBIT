'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { initials, timeAgo } from '@/lib/format';
import type { Profile, Message } from '@/lib/types';

interface ConversationItem {
  conversation_id: string;
  other_user: Profile | null;
  last_message?: Message;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const activeConv = searchParams.get('c');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(activeConv);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!parts || parts.length === 0) { setConversations([]); setLoading(false); return; }

    const items: ConversationItem[] = [];
    for (const p of parts) {
      const { data: otherParts } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', p.conversation_id)
        .neq('user_id', user.id);
      const otherId = otherParts?.[0]?.user_id;
      let otherUser: Profile | null = null;
      if (otherId) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', otherId).maybeSingle();
        otherUser = prof as Profile | null;
      }
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', p.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      items.push({ conversation_id: p.conversation_id, other_user: otherUser, last_message: lastMsg as Message | undefined });
    }
    setConversations(items);
    setLoading(false);
  }, [user]);

  const loadMessages = useCallback(async () => {
    if (!activeId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
  }, [activeId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (activeConv) setActiveId(activeConv);
  }, [activeConv]);
  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` }, () => {
        loadMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!user || !activeId || !input.trim()) return;
    setSending(true);
    setInput('');
    const { error } = await supabase.from('messages').insert({ conversation_id: activeId, sender_id: user.id, content: input });
    setSending(false);
    if (error) { setInput(input); return; }
    loadMessages();
    loadConversations();
  }

  const activeConvData = conversations.find((c) => c.conversation_id === activeId);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-muted-foreground">Private conversations with other developers.</p>
      </div>

      <div className="grid h-[600px] gap-4 lg:grid-cols-3">
        {/* Conversation list */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="border-b border-border/60 p-3 text-sm font-medium">Conversations</div>
            <div className="max-h-[540px] overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : conversations.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet. Start one from a developer&apos;s profile.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.conversation_id}
                    onClick={() => setActiveId(c.conversation_id)}
                    className={`flex w-full items-center gap-3 border-b border-border/40 p-3 text-left transition-colors ${activeId === c.conversation_id ? 'bg-primary/10' : 'hover:bg-elevated'}`}
                  >
                    <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/20 text-xs text-primary">{c.other_user ? initials(c.other_user.full_name) : '?'}</AvatarFallback></Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">{c.other_user?.full_name || 'Unknown'}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.last_message?.content || 'No messages yet'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card className="lg:col-span-2">
          <CardContent className="flex h-full flex-col p-0">
            {activeId && activeConvData ? (
              <>
                <div className="flex items-center gap-3 border-b border-border/60 p-3">
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/20 text-xs text-primary">{activeConvData.other_user ? initials(activeConvData.other_user.full_name) : '?'}</AvatarFallback></Avatar>
                  <span className="font-medium">{activeConvData.other_user?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
                  ) : messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-elevated'}`}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p className={`mt-1 text-[10px] ${m.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{timeAgo(m.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex items-center gap-2 border-t border-border/60 p-3">
                  <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !input.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Select a conversation to start chatting.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
