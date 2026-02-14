export class MessageResponseDto {
  id: string;
  roomId: string;
  userId: string;
  userName: string | null;
  userProfileImage: string | null;
  content: string;
  type: string;
  createdAt: Date;
}
