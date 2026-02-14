import { IsArray, ValidateNested, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @IsString()
  id: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderPlaylistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
