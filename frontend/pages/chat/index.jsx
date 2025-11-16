import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoom, fetchMessages, sendMessage } from '../../lib/chat';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';

export default function ChatPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const [active, setActive] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [liveMsg, setLiveMsg] = useState(null);
  const [presence, setPresence] = useState(0);
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);

  const { data: messages } = useQuery({ queryKey: ['chat','messages', active], queryFn: ()=> active ? fetchMessages(active) : [], enabled: !!active });

  const createRoomMut = useMutation({ mutationFn: createRoom, onSuccess: (r)=> { toast.push({ type: 'success', message: `Room created. Code: ${r.id}` }); setActive(r.id); } });
  const sendMut = useMutation({ mutationFn: ({ roomId, message }) => sendMessage(roomId, message), onSuccess: ()=> qc.invalidateQueries({ queryKey: ['chat','messages', active] }) });

  useEffect(()=>{
    const socket = getSocket();
    if (active) socket.emit('join', active);
    const handler = (msg) => {
      if (msg.roomId === active) {
        setLiveMsg(msg);
      }
    };
    const presenceHandler = (p) => { if (p.roomId === active) setPresence(p.count); };
    const typingHandler = (t) => { if (t.roomId === active) { setTyping(true); setTimeout(()=>setTyping(false), 1200); } };
    socket.on('chat:message', handler);
    socket.on('chat:presence', presenceHandler);
    socket.on('chat:typing', typingHandler);
    return () => socket.off('chat:message', handler);
  }, [active]);

  useEffect(()=>{
    if (liveMsg) {
      // Scroll to bottom on live message
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [liveMsg, messages]);

  const onCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName) return;
    const r = await createRoomMut.mutateAsync(roomName);
    setRoomName('');
  };

  const onSend = async (e) => {
    e.preventDefault();
    if (!message || !active) return;
    await sendMut.mutateAsync({ roomId: active, message });
    setMessage('');
  };

  const onJoin = (e) => {
    e.preventDefault();
    if (!joinCode) return;
    setActive(joinCode.trim());
  };

  const onTyping = () => {
    const socket = getSocket();
    if (active) socket.emit('chat:typing', { roomId: active, userId: user?.id });
  };

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-5xl px-6 grid md:grid-cols-3 gap-6">
        <section className="md:col-span-1 card p-4">
          <div className="font-semibold mb-2">Join room by code</div>
          <form onSubmit={onJoin} className="flex gap-2">
            <input className="flex-1 px-3 py-2" placeholder="Enter room code" value={joinCode} onChange={(e)=>setJoinCode(e.target.value)} />
            <button className="btn btn-outline" disabled={!joinCode}>Join</button>
          </form>
          <div className="mt-4 font-semibold mb-2">Or create a room</div>
          <form onSubmit={onCreateRoom} className="flex gap-2">
            <input className="flex-1 px-3 py-2" placeholder="New room name" value={roomName} onChange={(e)=>setRoomName(e.target.value)} />
            <button className="btn btn-primary" disabled={!roomName || createRoomMut.isPending}>{createRoomMut.isPending ? '...' : 'Create'}</button>
          </form>
          {active && (
            <div className="mt-4 text-xs text-gray-400">Current room code: <span className="text-gray-100">{active}</span></div>
          )}
        </section>

        <section className="md:col-span-2 card p-4 flex flex-col h-[70vh]">
          {!active ? (
            <div className="text-sm text-gray-400">Select a room to start chatting.</div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <div>People here: {presence}</div>
                {typing && <div>Someone is typing...</div>}
              </div>
              <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
                {(messages||[]).concat(liveMsg ? [liveMsg] : []).map((m)=> (
                  <div key={m.id || `${m.roomId}-${m.createdAt}-${m.message}`} className={`max-w-[80%] ${m.senderId===user?.id ? 'ml-auto' : ''}`}>
                    <div className={`px-3 py-2 rounded ${m.senderId===user?.id ? 'bg-green-500 text-black' : 'bg-neutral-800 text-gray-100'}`}>
                      <div className="text-sm leading-snug">{m.message}</div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={onSend} className="mt-3 flex gap-2">
                <input className="flex-1 px-3 py-2" placeholder="Type a message" value={message} onChange={(e)=>{ setMessage(e.target.value); onTyping(); }} />
                <button className="btn btn-primary" disabled={!message || sendMut.isPending}>{sendMut.isPending ? 'Sending...' : 'Send'}</button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
