import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface Participant {
  id: string;
  userId: string | null;
  name: string;
  muted: boolean;
  cameraOff: boolean;
  handRaised: boolean;
  sharingScreen: boolean;
  isOwner: boolean;
}

interface Waiting {
  id: string;
  userId: string | null;
  name: string;
  muted: boolean;
  cameraOff: boolean;
}

interface Room {
  ownerKey: string | null;
  ownerSocketId: string | null;
  participants: Map<string, Participant>;
  waiting: Map<string, Waiting>;
  endTimer: ReturnType<typeof setTimeout> | null;
}

const OWNER_GRACE_MS = 12000;

@WebSocketGateway({
  namespace: '/meet',
  cors: { origin: true, credentials: true },
})
export class MeetingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('MeetingGateway');
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly jwtService: JwtService) { }

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');
    try {
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.userName = payload.name;
      this.logger.log(`Client connected: ${client.id} (${payload.name})`);
    } catch {
      this.logger.warn(`Rejected unauthenticated socket ${client.id}`);
      client.emit('unauthorized', { message: 'Please sign in to join meetings' });
      client.disconnect(true);
    }
  }

  getActiveRooms() {
    return [...this.rooms.entries()].map(([roomId, room]) => ({
      roomId,
      participants: room.participants.size,
      waiting: room.waiting.size,
      hasOwner: !!room.ownerSocketId,
      people: [...room.participants.values()].map((p) => ({
        name: p.name,
        isOwner: p.isOwner,
        muted: p.muted,
        cameraOff: p.cameraOff,
      })),
    }));
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.handleLeave(client);
  }


  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      name: string;
      muted?: boolean;
      cameraOff?: boolean;
      ownerKey?: string | null;
    },
  ) {
    const roomId = (payload.roomId || '').trim();
    const name = (payload.name || 'Guest').trim().slice(0, 40);
    if (!roomId) {
      client.emit('error-message', { message: 'Room id is required' });
      return;
    }

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        ownerKey: null,
        ownerSocketId: null,
        participants: new Map(),
        waiting: new Map(),
        endTimer: null,
      });
    }
    const room = this.rooms.get(roomId);

    client.data.roomId = roomId;
    client.data.name = name;

    const userId: string | null = client.data.userId || null;
    let previousWasOwner = false;
    let previousAdmitted = false;
    if (userId) {
      for (const [sid, p] of room.participants) {
        if (p.userId !== userId) continue;
        previousWasOwner = p.isOwner;
        previousAdmitted = true;
        room.participants.delete(sid);
        if (room.ownerSocketId === sid) room.ownerSocketId = null;
        this.server.to(roomId).emit('user-left', { id: sid });
        const old = this.nspSocket(sid);
        if (old && old.id !== client.id) {
          old.emit('session-replaced');
          old.leave(roomId);
          old.data.roomId = undefined;
        }
        break;
      }
      for (const [sid, w] of room.waiting) {
        if (w.userId !== userId) continue;
        room.waiting.delete(sid);
        const old = this.nspSocket(sid);
        if (old && old.id !== client.id) {
          old.emit('session-replaced');
          old.data.roomId = undefined;
        }
        break;
      }
    }

    const key = (payload.ownerKey || '').trim() || null;
    let isOwner = previousWasOwner;
    if (key) {
      if (room.ownerKey === null) {
        room.ownerKey = key;
        isOwner = true;
      } else if (room.ownerKey === key && room.ownerSocketId === null) {
        isOwner = true;
      }
    }

    if (isOwner) {
      if (room.endTimer) {
        clearTimeout(room.endTimer);
        room.endTimer = null;
      }
      room.ownerSocketId = client.id;
      this.admitToRoom(client, room, roomId, name, payload, true);
      client.emit('waiting-list', { users: [...room.waiting.values()] });
      this.logger.log(`OWNER ${name} (${client.id}) joined "${roomId}"`);
      return;
    }

    if (previousAdmitted) {
      this.admitToRoom(client, room, roomId, name, payload, false);
      this.logger.log(`${name} (${client.id}) switched session in "${roomId}"`);
      return;
    }

    const w: Waiting = {
      id: client.id,
      userId,
      name,
      muted: !!payload.muted,
      cameraOff: !!payload.cameraOff,
    };
    room.waiting.set(client.id, w);
    client.data.waiting = true;
    client.emit('waiting', { ownerPresent: !!room.ownerSocketId });
    if (room.ownerSocketId) {
      this.server.to(room.ownerSocketId).emit('join-request', { user: w });
    }
    this.logger.log(`${name} (${client.id}) is waiting for "${roomId}"`);
  }

  @SubscribeMessage('admit')
  handleAdmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string },
  ) {
    const room = this.ownerRoom(client);
    if (!room) return;
    const w = room.waiting.get(payload.id);
    if (!w) return;
    room.waiting.delete(payload.id);

    const target = this.nspSocket(payload.id);
    if (!target) return;
    target.emit('admitted');
    this.admitToRoom(
      target,
      room,
      client.data.roomId,
      w.name,
      { muted: w.muted, cameraOff: w.cameraOff },
      false,
    );
    this.broadcastWaiting(room);
  }

  @SubscribeMessage('deny')
  handleDeny(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string },
  ) {
    const room = this.ownerRoom(client);
    if (!room) return;
    if (room.waiting.delete(payload.id)) {
      this.server.to(payload.id).emit('denied');
      this.broadcastWaiting(room);
    }
  }

  @SubscribeMessage('remove-participant')
  handleRemove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string },
  ) {
    const room = this.ownerRoom(client);
    if (!room) return;
    if (payload.id === room.ownerSocketId) return;
    const p = room.participants.get(payload.id);
    if (!p) return;
    room.participants.delete(payload.id);
    const roomId = client.data.roomId;
    this.server.to(payload.id).emit('removed');
    this.server.to(roomId).emit('user-left', { id: payload.id });
    const target = this.nspSocket(payload.id);
    if (target) {
      target.leave(roomId);
      target.data.roomId = undefined;
    }
    this.logger.log(`Owner removed ${p.name} (${payload.id}) from "${roomId}"`);
  }

  @SubscribeMessage('end-meeting')
  handleEndMeeting(@ConnectedSocket() client: Socket) {
    const room = this.ownerRoom(client);
    if (!room) return;
    this.endMeeting(client.data.roomId, room, 'The host ended the meeting');
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    this.handleLeave(client);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { to: string; sdp: any },
  ) {
    this.server.to(payload.to).emit('offer', { from: client.id, sdp: payload.sdp });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { to: string; sdp: any },
  ) {
    this.server.to(payload.to).emit('answer', { from: client.id, sdp: payload.sdp });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { to: string; candidate: any },
  ) {
    this.server
      .to(payload.to)
      .emit('ice-candidate', { from: client.id, candidate: payload.candidate });
  }


  @SubscribeMessage('chat-message')
  handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string },
  ) {
    const roomId = client.data.roomId;
    if (!roomId || client.data.waiting) return;
    const text = (payload.message || '').toString().slice(0, 2000);
    if (!text.trim()) return;
    this.server.to(roomId).emit('chat-message', {
      from: client.id,
      name: client.data.name || 'Guest',
      message: text,
    });
  }

  @SubscribeMessage('media-state')
  handleMediaState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { muted?: boolean; cameraOff?: boolean },
  ) {
    const p = this.getParticipant(client);
    if (!p) return;
    if (typeof payload.muted === 'boolean') p.muted = payload.muted;
    if (typeof payload.cameraOff === 'boolean') p.cameraOff = payload.cameraOff;
    client.to(client.data.roomId).emit('media-state', {
      id: client.id,
      muted: p.muted,
      cameraOff: p.cameraOff,
    });
  }

  @SubscribeMessage('hand-raise')
  handleHandRaise(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { raised: boolean },
  ) {
    const p = this.getParticipant(client);
    if (!p) return;
    p.handRaised = !!payload.raised;

    client.to(client.data.roomId).emit('hand-raise', {
      id: client.id,
      name: p.name,
      raised: p.handRaised,
    });
  }

  @SubscribeMessage('screen-share')
  handleScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { on: boolean },
  ) {
    const p = this.getParticipant(client);
    if (!p) return;
    p.sharingScreen = !!payload.on;
    client.to(client.data.roomId).emit('screen-share', {
      id: client.id,
      name: p.name,
      on: p.sharingScreen,
    });
  }

  @SubscribeMessage('reaction')
  handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { emoji: string },
  ) {
    const p = this.getParticipant(client);
    if (!p) return;
    const emoji = (payload.emoji || '').toString().slice(0, 8);
    if (!emoji) return;
    this.server.to(client.data.roomId).emit('reaction', {
      id: client.id,
      name: p.name,
      emoji,
    });
  }

  @SubscribeMessage('caption')
  handleCaption(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; final: boolean },
  ) {
    const p = this.getParticipant(client);
    if (!p) return;
    const text = (payload.text || '').toString().slice(0, 300);
    client.to(client.data.roomId).emit('caption', {
      id: client.id,
      name: p.name,
      text,
      final: !!payload.final,
    });
  }

  private admitToRoom(
    client: Socket,
    room: Room,
    roomId: string,
    name: string,
    media: { muted?: boolean; cameraOff?: boolean },
    isOwner: boolean,
  ) {
    const me: Participant = {
      id: client.id,
      userId: client.data.userId || null,
      name,
      muted: !!media.muted,
      cameraOff: !!media.cameraOff,
      handRaised: false,
      sharingScreen: false,
      isOwner,
    };
    client.data.waiting = false;
    client.join(roomId);

    client.emit('existing-users', { users: [...room.participants.values()] });
    client.emit('role', { isOwner, ownerId: room.ownerSocketId });

    room.participants.set(client.id, me);
    client.to(roomId).emit('user-joined', { user: me });
  }

  private nspSocket(id: string): Socket | undefined {
    const sockets: any = (this.server as any).sockets;
    if (sockets instanceof Map) return sockets.get(id);
    return sockets?.sockets?.get(id);
  }

  private ownerRoom(client: Socket): Room | null {
    const roomId = client.data.roomId;
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room || room.ownerSocketId !== client.id) return null;
    return room;
  }

  private broadcastWaiting(room: Room) {
    if (room.ownerSocketId) {
      this.server
        .to(room.ownerSocketId)
        .emit('waiting-list', { users: [...room.waiting.values()] });
    }
  }

  private getParticipant(client: Socket): Participant | undefined {
    const roomId = client.data.roomId;
    if (!roomId) return undefined;
    return this.rooms.get(roomId)?.participants.get(client.id);
  }

  private endMeeting(roomId: string, room: Room, reason: string) {
    if (room.endTimer) {
      clearTimeout(room.endTimer);
      room.endTimer = null;
    }
    this.server.to(roomId).emit('meeting-ended', { reason });
    room.waiting.forEach((_, id) => this.server.to(id).emit('meeting-ended', { reason }));
    this.rooms.delete(roomId);
    this.logger.log(`Meeting "${roomId}" ended: ${reason}`);
  }

  private handleLeave(client: Socket) {
    const roomId = client.data.roomId;
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.waiting.delete(client.id)) {
      this.broadcastWaiting(room);
      client.data.roomId = undefined;
      return;
    }

    const wasOwner = room.ownerSocketId === client.id;
    if (room.participants.delete(client.id)) {
      client.to(roomId).emit('user-left', { id: client.id });
    }
    client.leave(roomId);
    client.data.roomId = undefined;

    if (wasOwner) {
      room.ownerSocketId = null;
      if (room.endTimer) clearTimeout(room.endTimer);
      room.endTimer = setTimeout(() => {
        const fresh = this.rooms.get(roomId); if (room.endTimer) clearTimeout(room.endTimer);

        if (fresh && fresh.ownerSocketId === null) {
          this.endMeeting(roomId, fresh, 'The host left the meeting');
        }
      }, OWNER_GRACE_MS);
      this.logger.log(`Owner left "${roomId}" — ending in ${OWNER_GRACE_MS}ms unless they return`);
    } else if (room.participants.size === 0 && room.ownerSocketId === null) {
      if (room.endTimer) clearTimeout(room.endTimer);
      this.rooms.delete(roomId);
    }
  }
}
