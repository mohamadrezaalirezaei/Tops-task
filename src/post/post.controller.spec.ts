import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { userDecorator } from 'src/user/dto/auth.dto';
import { Role } from '@prisma/client';
import { PostService } from './post.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { updateBodyDto } from './dto/post.dto';

describe('PostController', () => {
  let controller: PostController;
  let postService: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      imports: [
        CacheModule.register({
          isGlobal: true,
        }),
      ],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
        PrismaService,
        PostService,
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
    postService = module.get<PostService>(PostService);
  });

  describe('deletePost', () => {
    it('should delete a post when the user is the author', async () => {
      // Mock the user and post data
      const user: userDecorator = {
        id: 1, // User ID
        name: 'John Doe',
        iat: Date.now(),
        exp: Date.now(),
        role: Role.USER,
      };
      const postId = 1;

      // Mock the getAuthorOfPost method to return the authorId (same as user ID)
      jest.spyOn(postService, 'getAuthorOfPost').mockResolvedValue(user.id);

      // Mock the deletePost method to return a success message
      jest
        .spyOn(postService, 'deletePost')
        .mockResolvedValue('Post deleted successfully');

      // Call the deletePost method
      const result = await controller.deletePost(postId, user);

      // Expectations
      expect(result).toBe('Post deleted successfully');
      expect(postService.getAuthorOfPost).toBeCalledWith(user, postId);
      expect(postService.deletePost).toBeCalledWith(postId);
    });

    it('should throw an HttpException when the user is not the author or admin', async () => {
      // Mock the user and post data
      const user: userDecorator = {
        id: 2, // User ID different from postId's authorId
        name: 'Jane Smith',
        iat: Date.now(),
        exp: Date.now(),
        role: Role.USER,
      };
      const postId = 1;
      const authorId = 1; // The actual authorId of the post

      // Mock the getAuthorOfPost method to return the authorId (different from user ID)
      jest.spyOn(postService, 'getAuthorOfPost').mockResolvedValue(authorId);

      // Call the deletePost method and expect it to throw an HttpException
      await expect(controller.deletePost(postId, user)).rejects.toThrowError(
        new HttpException(
          'Unauthorized, You are not the author of this post!',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(postService.getAuthorOfPost).toBeCalledWith(user, postId);
    });
  });

  describe('updatePost', () => {
    const updateBody: updateBodyDto = {
      title: 'Updated Title',
      content: 'Updated Content',
      tags: ['tag1', 'tag2'],
    };

    it('should update a post when the user is the author', async () => {
      // Mock the user and post data
      const user: userDecorator = {
        id: 1, // User ID
        name: 'John Doe',
        iat: Date.now(),
        exp: Date.now(),
        role: Role.USER,
      };
      const postId = 1;

      // Mock the getAuthorOfPost method to return the authorId (same as user ID)
      jest.spyOn(postService, 'getAuthorOfPost').mockResolvedValue(user.id);

      // Mock the updatePost method to return the updated post
      const updatedPost = {
        id: postId,
        title: 'Updated Title', // Add title
        content: 'Updated Content', // Add content
        publicationDate: new Date(), // Add publicationDate
        updatedAt: new Date(), // Add updatedAt
        tags: ['tag1', 'tag2'], // Add tags
        authorId: user.id, // Add authorId
      };
      jest.spyOn(postService, 'updatePost').mockResolvedValue(updatedPost);

      // Call the updatePost method
      const result = await controller.updatePost(postId, updateBody, user);

      // Expectations
      expect(result).toEqual(updatedPost);
      expect(postService.getAuthorOfPost).toBeCalledWith(user, postId);
      expect(postService.updatePost).toBeCalledWith(postId, updateBody);
    });

    it('should throw an HttpException when the user is not the author or admin', async () => {
      // Mock the user and post data
      const user: userDecorator = {
        id: 2, // User ID different from postId's authorId
        name: 'Jane Smith',
        iat: Date.now(),
        exp: Date.now(),
        role: Role.USER,
      };
      const postId = 1;
      const authorId = 1; // The actual authorId of the post

      // Mock the getAuthorOfPost method to return the authorId (different from user ID)
      jest.spyOn(postService, 'getAuthorOfPost').mockResolvedValue(authorId);

      // Call the updatePost method and expect it to throw an HttpException
      await expect(
        controller.updatePost(postId, updateBody, user),
      ).rejects.toThrowError(
        new HttpException(
          'Unauthorized, You are not the author of this post!',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(postService.getAuthorOfPost).toBeCalledWith(user, postId);
    });
  });
});
