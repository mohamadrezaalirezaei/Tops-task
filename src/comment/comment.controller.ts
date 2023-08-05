import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { AddCommentBodyDto, UpdateCommentBodyDto } from './Dto/comment.dto';
import { User } from 'src/user/decorators/user.decorator';
import { userDecorator } from 'src/user/dto/auth.dto';
import { Roles } from 'src/decorators/roles.decorators';
import { PostService } from 'src/post/post.service';
import { Role } from '@prisma/client';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Roles(Role.ADMIN, Role.USER)
  @Post(':id')
  async addComment(
    @Body() body: AddCommentBodyDto,
    @Param('id', ParseIntPipe) postId: number,
    @User() user: userDecorator,
  ) {
    return this.commentService.addComment(body, postId, user);
  }

  //fix get all comment for own post
  @Roles(Role.ADMIN, Role.USER)
  @Get(':id')
  async getAllCommentsForPost(@Param('id', ParseIntPipe) postId: number) {
    return this.commentService.getAllCommentsForPost(postId);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Put(':id')
  async updateComment(
    @Body() body: UpdateCommentBodyDto,
    @Param('id', ParseIntPipe) commentId: number,
    @User() user: userDecorator,
  ) {
    const commentAuthorId = await this.commentService.getAuthorOfComment(
      user,
      commentId,
    );
    if (commentAuthorId !== user.id) {
      throw new HttpException(
        'Unauthorized, You nou are not the author of this comment!',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.commentService.updateComment(body, commentId);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Delete(':id')
  async deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @User() user: userDecorator,
  ) {
    const commentAuthorId = await this.commentService.getAuthorOfComment(
      user,
      commentId,
    );
    if (commentAuthorId !== user.id && user.role !== Role.ADMIN) {
      throw new HttpException(
        'Unauthorized, You nou are not the author of this comment!',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.commentService.deleteComment(commentId);
  }
}
