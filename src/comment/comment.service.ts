import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { userDecorator } from 'src/user/dto/auth.dto';

interface AddcommentBody {
  content: string;
}

interface UpdatecommentBody {
  content?: string;
}

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  async addComment(
    { content }: AddcommentBody,
    postId: number,
    user: userDecorator,
  ) {
    const post = await this.prismaService.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        author: true,
      },
    });
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    const comment = await this.prismaService.comment.create({
      data: { content, authorId: user.id, postId },
    });
    return {
      ...comment,
      commentAuthor: user.name,
      postAuthor: post.author.name,
    };
  }

  async getAllCommentsForPost(postId: number) {
    return this.prismaService.post.findMany({
      where: {
        id: postId,
      },
      select: {
        comments: true,
      },
    });
  }

  async updateComment(body: UpdatecommentBody, commentId: number) {
    const comment = await this.prismaService.comment.findUnique({
      where: {
        id: commentId,
      },
    });
    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    const updatedComment = await this.prismaService.comment.update({
      where: {
        id: commentId,
      },
      data: body,
    });
    return { ...updatedComment };
  }

  async deleteComment(commentId: number) {
    const comment = await this.prismaService.comment.findUnique({
      where: {
        id: commentId,
      },
    });
    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.comment.delete({
      where: {
        id: commentId,
      },
    });
    return 'Comment successfully deleted.';
  }

  async getAuthorOfComment(user: userDecorator, commentId: number) {
    const author = await this.prismaService.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        authorId: true,
      },
    });
    return author.authorId;
  }
}
