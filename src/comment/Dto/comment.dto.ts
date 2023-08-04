import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddCommentBodyDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class UpdateCommentBodyDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  content?: string;
}
