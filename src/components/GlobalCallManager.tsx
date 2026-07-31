import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IncomingCallModal } from './IncomingCallModal';
import { CallScreen } from './CallScreen';

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
  };

  return (
    <>
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.caller}
          callType={incomingCall.type}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {activeCall && (
        <CallScreen
          type={activeCall.type}
          channelName={activeCall.channelName}
          isInitiator={activeCall.isInitiator}
          targetUserId={activeCall.targetUserId}
          incomingOffer={activeCall.incomingOffer}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
};
