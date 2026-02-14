import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const WsCurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | User[keyof User] => {
    const client = ctx.switchToWs().getClient();
    const user = client.data?.user as User;
    return data ? user[data] : user;
  },
);
