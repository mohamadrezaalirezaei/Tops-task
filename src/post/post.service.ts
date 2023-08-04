import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';
import { userDecorator } from 'src/user/dto/auth.dto';

interface bodyPost {
  title: string;
  content: string;
  tags: string[];
}

interface updateBody {
  title?: string;
  content?: string;
  tags?: string[];
}

interface GetPostsParam {
  title?: string;
  authorId?: number;
  publicationDate?: Date;
  tags?: string[];
  fields?: string[];
  sortBy?: string;
}

@Injectable()
export class PostService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prismaService: PrismaService,
  ) {}

  async getAllPostForUser(
    user: userDecorator,
    filter: GetPostsParam,
    offset: number,
    limit: number,
    page: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc', //fix this as enum
  ) {
    const where = {
      authorId: user.id,
      title: filter.title,
    };

    if (filter.tags) {
      where['tags'] = {
        hasSome: filter.tags,
      };
    }
    const selectFields = filter.fields;
    const posts = await this.prismaService.post.findMany({
      select: selectFields
        ? this.createSelectObject(selectFields)
        : {
            id: true,
            title: true,
            publicationDate: true,
            updatedAt: true,
            content: true,
            tags: true,
            authorId: true,
            comments: true,
            author: true,
          },
      where: where,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    if (!posts) {
      throw new NotFoundException();
    }
    await this.cacheManager.set('cached_item', { key: 32 });
    const cachedItem = await this.cacheManager.get('cached_item');
    console.log(cachedItem);
    return { numberOfRecords: posts.length, posts, page, limit };
  }
  async createPost({ title, tags, content }: bodyPost, user: userDecorator) {
    const post = await this.prismaService.post.create({
      data: {
        title,
        tags,
        content,
        authorId: user.id,
      },
    });
    return post;
  }
  createSelectObject(fields: string[]) {
    const selectObj: any = {};
    fields.forEach((field) => {
      selectObj[field] = true;
    });
    return selectObj;
  }
  async getAllPostForAdmin(
    filter: GetPostsParam,
    offset: number,
    limit: number,
    page: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc', //fix this as enum
  ) {
    const where = {
      title: filter.title,
      authorId: filter.authorId,
    };

    if (filter.tags) {
      where['tags'] = {
        hasSome: filter.tags,
      };
    }
    const post = await this.prismaService.post.findMany({
      select: {
        id: true,
        title: true,
        publicationDate: true,
        updatedAt: true,
        content: true,
        tags: true,
        authorId: true,
        comments: true,
        author: true,
      },
      where: where,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    return { numberOfRecords: post.length, post, page, limit };
  }

  async getPostById(postId: number) {
    const post = await this.prismaService.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }

  async deletePost(postId: number) {
    // dont forget to delete foreign keys as well
    await this.prismaService.comment.deleteMany({
      where: {
        postId,
      },
    });
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException();
    }

    await this.prismaService.post.delete({
      where: {
        id: postId,
      },
    });
    return 'Post successfuly deleted';
  }

  async updatePost(id: number, body: updateBody) {
    const post = await this.prismaService.post.findUnique({
      where: { id },
    });
    if (!post) {
      throw new NotFoundException();
    }

    const updatedPost = await this.prismaService.post.update({
      where: { id },
      data: body,
    });
    return updatedPost;
  }

  async getAuthorOfPost(user: userDecorator, postId: number) {
    const author = await this.prismaService.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        author: true,
      },
    });
    return author.author.id;
  }
}
