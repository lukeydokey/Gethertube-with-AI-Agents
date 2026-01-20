/**
 * Room API service
 * Handles REST API calls for room management
 */

import api from './api';
import type {
  RoomResponse,
  RoomListResponse,
  CreateRoomRequest,
  UpdateRoomRequest,
  JoinRoomRequest,
} from '@/types/room.types';

const ROOM_BASE_PATH = '/rooms';

/**
 * Get list of public rooms
 */
export const getRooms = async (page = 1, limit = 20): Promise<RoomListResponse> => {
  const response = await api.get<RoomListResponse>(ROOM_BASE_PATH, {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Get room by ID
 */
export const getRoomById = async (roomId: string): Promise<RoomResponse> => {
  const response = await api.get<RoomResponse>(`${ROOM_BASE_PATH}/${roomId}`);
  return response.data;
};

/**
 * Create a new room
 */
export const createRoom = async (data: CreateRoomRequest): Promise<RoomResponse> => {
  const response = await api.post<RoomResponse>(ROOM_BASE_PATH, data);
  return response.data;
};

/**
 * Update room settings (host only)
 */
export const updateRoom = async (
  roomId: string,
  data: UpdateRoomRequest
): Promise<RoomResponse> => {
  const response = await api.patch<RoomResponse>(`${ROOM_BASE_PATH}/${roomId}`, data);
  return response.data;
};

/**
 * Delete room (host only)
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
  await api.delete(`${ROOM_BASE_PATH}/${roomId}`);
};

/**
 * Join room via REST API (password verification)
 */
export const joinRoomViaAPI = async (
  roomId: string,
  data?: JoinRoomRequest
): Promise<RoomResponse> => {
  const response = await api.post<RoomResponse>(`${ROOM_BASE_PATH}/${roomId}/join`, data);
  return response.data;
};

/**
 * Leave room via REST API
 */
export const leaveRoomViaAPI = async (roomId: string): Promise<void> => {
  await api.post(`${ROOM_BASE_PATH}/${roomId}/leave`);
};

/**
 * Get user's joined rooms
 */
export const getMyRooms = async (): Promise<RoomResponse[]> => {
  const response = await api.get<RoomResponse[]>(`${ROOM_BASE_PATH}/my`);
  return response.data;
};

export default {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  joinRoomViaAPI,
  leaveRoomViaAPI,
  getMyRooms,
};
