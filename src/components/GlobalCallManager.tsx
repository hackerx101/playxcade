import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IncomingCallModal } from './IncomingCallModal';
import { CallScreen } from './CallScreen';
import { PhoneCall } from 'lucide-react';

export const GlobalCallManager: React.FC = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<{
    type: 'video' | 'voice';
    caller: string;
    roomId: string;
    offer?: RTCSessionDescriptionInit;
    senderId?: string;
  } | null>(null);

  const [activeCall, setActiveCall] = useState<{
    type: 'video' | 'voice';
    channelName: string;
    isInitiator: boolean;
    targetUserId?: string;
    incomingOffer?: RTCSessionDescriptionInit;
  } | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!user) return;

    let ws: WebSocket | null = null;
    let pingInterval: any = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            type: 'register',
            userId: user.user_id,
            username: user.username,
            roomId: 'global',
          })
        );

        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'call-offer') {
            if (data.senderId !== user.user_id) {
              setIncomingCall({
                type: data.callType || 'video',
                caller: data.senderUsername || 'Community Member',
                roomId: data.roomId || 'General',
                offer: data.offer,
                senderId: data.senderId,
              });
            }
          } else if (data.type === 'call-end') {
            setIncomingCall(null);
          }
        } catch (e) {
          console.warn('GlobalCallManager WS message error:', e);
        }
      };

      ws.onclose = () => {
        clearInterval(pingInterval);
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user?.user_id]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      type: incomingCall.type,
      channelName: incomingCall.roomId,
      isInitiator: false,
      targetUserId: incomingCall.senderId,
      incomingOffer: incomingCall.offer,
    });
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setIsMinimized(false);
    setCallDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Status Indicator when Call is Minimized */}
      {activeCall && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full shadow-lg transition-transform active:scale-95"
          title="Return to active call"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping"></span>
            <PhoneCall className="relative w-4 h-4" />
          </div>
          <span className="text-sm font-bold font-mono">
            {formatTime(callDuration)}
          </span>
        </button>
      )}

      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.caller}
          channelName={incomingCall.roomId || 'Direct Call'}
          type={incomingCall.type}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {activeCall && (
        <CallScreen
          type={activeCall.type}
          channelId={activeCall.channelName || 'global_call'}
          channelName={activeCall.channelName}
          isInitiator={activeCall.isInitiator}
          targetUserId={activeCall.targetUserId}
          incomingOffer={activeCall.incomingOffer}
          onEndCall={handleEndCall}
          isMinimized={isMinimized}
          onMinimize={() => setIsMinimized(true)}
          onDurationChange={setCallDuration}
        />
      )}
    </>
  );
};
