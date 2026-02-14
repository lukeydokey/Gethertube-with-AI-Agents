import api from './api';
import type {
  RoomResponse,
  CreateRoomRequest,
  JoinRoomRequest,
  MemberResponse,
} from '@/types/room.types';

/**
 * Room API service
 */
export const roomService = {
  /**
   * List public rooms
   */
  async listRooms(): Promise<RoomResponse[]> {
    const response = await api.get<RoomResponse[]>('/rooms');
    return response.data;
  },

  /**
   * List current user's rooms
   */
  async listMyRooms(): Promise<RoomResponse[]> {
    const response = await api.get<RoomResponse[]>('/rooms/my');
    return response.data;
  },

  /**
   * Get room details by ID
   */
  async getRoom(roomId: string): Promise<RoomResponse> {
    const response = await api.get<RoomResponse>(`/rooms/${roomId}`);
    return response.data;
  },

  /**
   * Create a new room
   */
  async createRoom(data: CreateRoomRequest): Promise<RoomResponse> {
    const response = await api.post<RoomResponse>('/rooms', data);
    return response.data;
  },

  /**
   * Join a room
   */
  async joinRoom(roomId: string, data?: JoinRoomRequest): Promise<void> {
    await api.post(`/rooms/${roomId}/join`, data || {});
  },

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<void> {
    await api.post(`/rooms/${roomId}/leave`);
  },

  /**
   * Delete a room (host only)
   */
  async deleteRoom(roomId: string): Promise<void> {
    await api.delete(`/rooms/${roomId}`);
  },

  /**
   * Get room members
   */
  async getMembers(roomId: string): Promise<MemberResponse[]> {
    const response = await api.get<MemberResponse[]>(`/rooms/${roomId}/members`);
    return response.data;
  },
};

export default roomService;
