"use client";

import Link from "next/link";
import { Fragment, startTransition, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from "react";
import { ArrowLeftIcon, ArrowUpIcon } from "@/components/ui/icons";
import { getConversationAction, loadMessagesAction, markReadAction, sendMessageAction } from "@/features/messages/actions/messaging";
import { MessageAvatar } from "@/features/messages/components/message-avatar";
import { useMessaging } from "@/features/messages/components/messages-shell";
import { mergeMessages, messageDate, messageTime } from "@/features/messages/services/message-state";
import type { Conversation, Message, MessagePage, ReadState } from "@/features/messages/types";

export function ConversationView({ conversation, initialPage }: { conversation: Conversation; initialPage: MessagePage }) {
  const { user, listeners, notify, online } = useMessaging();
  const [messages, setMessages] = useState(initialPage.messages);
  const [hasMore, setHasMore] = useState(initialPage.has_more);
  const [reads, setReads] = useState(conversation.read_states);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();
  const [loading, startLoading] = useTransition();
  const viewport = useRef<HTMLDivElement>(null);
  const known = useRef(initialPage.messages);
  const catchupCursor = useRef(initialPage.messages.at(-1)?.id);
  const atBottom = useRef(true);
  const scrollBottom = useRef(true);
  const restore = useRef<{ height: number; top: number } | null>(null);
  const mounted = useRef(true);
  const catchupRunning = useRef(false);
  const catchupAgain = useRef(false);
  const readRunning = useRef(false);
  const wantedRead = useRef(0);
  const ownRead = useRef(conversation.read_states.find((state) => state.user_id === user.id)?.last_read_message_id || 0);
  const retryMessage = useRef<{ body: string; uuid: string } | null>(null);

  function updateReads(readState: ReadState) {
    if (readState.user_id === user.id) ownRead.current = Math.max(ownRead.current, readState.last_read_message_id);
    setReads((current) => {
      const previous = current.find((state) => state.user_id === readState.user_id);
      if (previous && previous.last_read_message_id >= readState.last_read_message_id) return current;
      return [...current.filter((state) => state.user_id !== readState.user_id), readState];
    });
  }

  function merge(incoming: Message[], ownSend = false) {
    if (!mounted.current) return;
    if (incoming.some((message) => !known.current.some((previous) => previous.id === message.id))) {
      scrollBottom.current = ownSend || atBottom.current;
    }
    known.current = mergeMessages(known.current, incoming);
    setMessages(known.current);
  }

  function catchUp() {
    catchupAgain.current = true;
    if (catchupRunning.current) return;
    catchupRunning.current = true;
    startTransition(async () => {
      try {
        while (catchupAgain.current && mounted.current) {
          catchupAgain.current = false;
          let cursor = catchupCursor.current;
          let more = true;
          while (more && mounted.current) {
            const result = await loadMessagesAction(conversation.id, cursor ? { after: cursor } : {});
            if (!mounted.current) return;
            if (!result.data) { setLoadError(result.error); return; }
            merge(result.data.messages);
            const fetchedLast = result.data.messages.at(-1)?.id;
            if (fetchedLast) catchupCursor.current = fetchedLast;
            if (!cursor) { setHasMore(result.data.has_more); more = false; }
            else {
              const nextCursor = result.data.messages.at(-1)?.id;
              more = result.data.has_more && nextCursor !== undefined && nextCursor > cursor;
              cursor = nextCursor;
            }
            setLoadError(null);
          }
          const latest = await getConversationAction(conversation.id);
          if (latest.data && mounted.current) latest.data.read_states.forEach(updateReads);
        }
      } catch { if (mounted.current) setLoadError("Impossible de récupérer les nouveaux messages."); }
      finally { catchupRunning.current = false; }
    });
  }

  function readVisible() {
    const container = viewport.current;
    if (!container || document.visibilityState !== "visible") return;
    const bounds = container.getBoundingClientRect();
    if (bounds.height <= 0 || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
    let latest = ownRead.current;
    for (const element of container.querySelectorAll<HTMLElement>("[data-incoming-id]")) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > Math.max(bounds.top, 0) && rect.top < Math.min(bounds.bottom, window.innerHeight)) latest = Math.max(latest, Number(element.dataset.incomingId));
    }
    wantedRead.current = Math.max(wantedRead.current, latest);
    if (readRunning.current || latest <= ownRead.current) return;
    readRunning.current = true;
    startTransition(async () => {
      try {
        while (mounted.current && wantedRead.current > ownRead.current && document.visibilityState === "visible") {
          const result = await markReadAction(conversation.id, wantedRead.current);
          if (!result.data) return;
          ownRead.current = Math.max(ownRead.current, result.data.last_read_message_id);
          if (mounted.current) {
            updateReads(result.data);
            notify({ type: "read", conversation_id: conversation.id, read_state: result.data });
          }
        }
      } finally { readRunning.current = false; }
    });
  }

  const receiveEvent = useEffectEvent((event: Parameters<typeof notify>[0]) => {
      if (event.type === "connected") catchUp();
      if (event.type === "message" && event.message.conversation_id === conversation.id) {
        catchUp();
      }
      if (event.type === "read" && event.conversation_id === conversation.id) updateReads(event.read_state);
  });
  const visibilityEvent = useEffectEvent(() => { if (document.visibilityState === "visible") { catchUp(); readVisible(); } });
  const readVisibleEvent = useEffectEvent(readVisible);
  const catchUpEvent = useEffectEvent(catchUp);

  useEffect(() => {
    mounted.current = true;
    const receive = (event: Parameters<typeof notify>[0]) => receiveEvent(event);
    const visibility = () => visibilityEvent();
    const resized = () => readVisibleEvent();
    listeners.add(receive);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resized);
    catchUpEvent();
    return () => {
      mounted.current = false;
      listeners.delete(receive);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resized);
    };
  }, [conversation.id, listeners]);

  useLayoutEffect(() => {
    const container = viewport.current;
    if (!container) return;
    if (restore.current) {
      container.scrollTop = restore.current.top + container.scrollHeight - restore.current.height;
      restore.current = null;
    } else if (scrollBottom.current) container.scrollTop = container.scrollHeight;
    scrollBottom.current = false;
    const frame = requestAnimationFrame(() => readVisibleEvent());
    return () => cancelAnimationFrame(frame);
  }, [messages]);

  function loadOlder() {
    const first = known.current[0]?.id;
    if (!first || loading) return;
    startLoading(async () => {
      const result = await loadMessagesAction(conversation.id, { before: first });
      if (!mounted.current) return;
      if (!result.data) { setLoadError(result.error); return; }
      if (viewport.current) restore.current = { height: viewport.current.scrollHeight, top: viewport.current.scrollTop };
      scrollBottom.current = false;
      merge(result.data.messages);
      setHasMore(result.data.has_more);
      setLoadError(null);
    });
  }

  function send() {
    if (pending || !draft.trim()) return;
    const input = retryMessage.current || { body: draft, uuid: crypto.randomUUID() };
    retryMessage.current = input;
    startSending(async () => {
      setSendError(null);
      try {
        const result = await sendMessageAction(conversation.id, input.body, input.uuid);
        if (!mounted.current) return;
        if (!result.data) { setSendError(result.error); return; }
        retryMessage.current = null;
        scrollBottom.current = true;
        merge([result.data], true);
        setDraft("");
        notify({ type: "message", message: result.data });
      } catch { if (mounted.current) setSendError("Envoi non confirmé. Réessayez avec le même message."); }
    });
  }

  const peerCursor = reads.find((state) => state.user_id === conversation.peer.id)?.last_read_message_id || 0;
  return <>
    <header className="flex shrink-0 items-center gap-3 border-b border-neutral-dark-grey/15 bg-neutral-white px-4 py-4 md:px-6">
      <Link href="/messages" aria-label="Retour vers la liste des messages" title="Retour aux messages" className="flex size-8 shrink-0 items-center justify-center md:hidden"><ArrowLeftIcon className="size-5" /></Link>
      <MessageAvatar user={conversation.peer} small />
      <h2 className="min-w-0 flex-1 truncate text-lg font-medium">{conversation.peer.name}</h2>
    </header>
    {!online && <p role="status" className="shrink-0 px-4 py-2 text-xs text-neutral-dark-grey">Hors connexion temps réel</p>}
    <div ref={viewport} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 md:px-6" onScroll={() => {
      const container = viewport.current!;
      atBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < 64;
      readVisible();
    }} aria-label="Historique des messages">
      {hasMore && <button disabled={loading} onClick={loadOlder} className="mb-4 w-full text-sm underline disabled:opacity-50">{loading ? "Chargement..." : "Messages précédents"}</button>}
      {loadError && <p role="alert" className="mb-4 text-sm">{loadError}<button onClick={catchUp} className="ml-2 underline">Réessayer</button></p>}
      {!messages.length && <p className="py-8 text-center text-sm text-neutral-dark-grey">Aucun message dans cette conversation.</p>}
      {messages.map((message, index) => {
        const own = message.sender_id === user.id;
        const sender = own ? user : conversation.peer;
        const date = messageDate(message.created_at);
        const showDate = index === 0 || messageDate(messages[index - 1].created_at) !== date;
        return <Fragment key={message.id}>
          {showDate && <div className="my-5 flex items-center gap-3 text-xs text-neutral-dark-grey"><span className="h-px flex-1 bg-neutral-dark-grey/15" /><span>{date}</span><span className="h-px flex-1 bg-neutral-dark-grey/15" /></div>}
          <div data-incoming-id={!own ? message.id : undefined} className={`mb-5 flex items-end gap-2 ${own ? "flex-row-reverse" : ""}`}>
            <MessageAvatar user={sender} small />
            <div className="min-w-0 max-w-[85%] md:max-w-[75%]">
              <div className={`mb-1 flex flex-wrap items-center gap-x-2 text-xs text-neutral-dark-grey ${own ? "justify-end" : ""}`}><span className="font-medium">{sender.name}</span><time dateTime={message.created_at}>{messageTime(message.created_at)}</time></div>
              <p className={`whitespace-pre-wrap break-words rounded-md px-3 py-2.5 text-sm [overflow-wrap:anywhere] ${own ? "rounded-br-none bg-brand-main-red text-neutral-white" : "rounded-bl-none border border-neutral-dark-grey/10 bg-neutral-white text-neutral-black"}`}>{message.body}</p>
              {own && <p className="mt-1 text-right text-xs text-neutral-dark-grey">{message.id <= peerCursor ? "Lu" : "Envoyé"}</p>}
            </div>
          </div>
        </Fragment>;
      })}
    </div>
    <form className="shrink-0 border-t border-neutral-dark-grey/15 bg-neutral-white p-3 md:p-5" onSubmit={(event) => { event.preventDefault(); send(); }}>
      {sendError && <p role="alert" className="mb-2 text-sm text-brand-main-red">{sendError}<button type="button" disabled={pending} onClick={send} className="ml-2 underline">Réessayer</button></p>}
      <div className="flex items-end gap-3">
        <label className="min-w-0 flex-1"><span className="sr-only">Votre message</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={pending || sendError !== null} maxLength={4000} rows={2} placeholder="Votre message..." className="block max-h-40 min-h-14 w-full resize-y rounded-md border border-neutral-dark-grey/20 p-3 text-sm outline-brand-main-red disabled:opacity-60" /></label>
        <button type="submit" disabled={pending || !draft.trim()} aria-label={pending ? "Envoi en cours" : "Envoyer"} title="Envoyer" className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-main-red text-neutral-white hover:bg-brand-dark-orange disabled:opacity-40"><ArrowUpIcon className="size-5" /></button>
      </div>
      {pending && <p role="status" className="mt-2 text-xs text-neutral-dark-grey">Envoi en cours...</p>}
    </form>
  </>;
}