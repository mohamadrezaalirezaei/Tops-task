import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

describe('PostService', () => {
  let postService: PostService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          isGlobal: true,
        }),
      ],
      providers: [
        PostService,
        { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
        PrismaService,
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createPost', () => {
    it('should create a post', async () => {
      // Mock input data
      const bodyPost = {
        title: 'Test Post',
        tags: ['tag1', 'tag2'],
        content: 'This is a test post content.',
      };

      const userDecorator = {
        id: 123, // Mock user ID
        name: 'Ali',
        iat: Date.now(),
        exp: Date.now(),
        role: Role.USER,
      };

      // Mock the PrismaService create method to return a post object
      jest.spyOn(prismaService.post, 'create').mockResolvedValue({
        id: 1,
        ...bodyPost,
        authorId: userDecorator.id,
        publicationDate: new Date(),
        updatedAt: new Date(),
      });

      // Call the createPost method
      const result = await postService.createPost(bodyPost, userDecorator);

      // Expectations
      expect(result).toBeDefined(); // Check if the result is defined (not null or undefined)
      expect(result.title).toBe(bodyPost.title); // Check if the post title is correct
      expect(result.tags).toEqual(bodyPost.tags); // Check if the post tags are correct
      expect(result.content).toBe(bodyPost.content); // Check if the post content is correct
      expect(result.authorId).toBe(userDecorator.id); // Check if the authorId is set correctly
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      // Mock the postId
      const postId = 1;

      // Mock the PrismaService findUnique method to return a post object
      jest.spyOn(prismaService.post, 'findUnique').mockResolvedValue({
        id: postId,
        title: 'Test Post',
        tags: ['tag1', 'tag2'],
        content: 'This is a test post content.',
        publicationDate: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
        authorId: 2,
      });

      // Mock the PrismaService delete method to return an empty object (indicating successful deletion)
      jest.spyOn(prismaService.post, 'delete').mockResolvedValue(null);

      // Call the deletePost method
      const result = await postService.deletePost(postId);

      // Expectations
      expect(result).toBe('Post successfuly deleted'); // Check if the result is the success message
      expect(prismaService.post.findUnique).toBeCalledWith({
        where: { id: postId },
      }); // Check if findUnique was called with the correct postId
      expect(prismaService.post.delete).toBeCalledWith({
        where: { id: postId },
      }); // Check if delete was called with the correct postId
    });

    it('should throw a NotFoundException if the post does not exist', async () => {
      // Mock the postId
      const postId = 1;

      // Mock the PrismaService findUnique method to return null (indicating that the post does not exist)
      jest.spyOn(prismaService.post, 'findUnique').mockResolvedValue(null);

      // Call the deletePost method and expect it to throw a NotFoundException
      await expect(postService.deletePost(postId)).rejects.toThrowError(
        NotFoundException,
      );
      expect(prismaService.post.findUnique).toBeCalledWith({
        where: { id: postId },
      }); // Check if findUnique was called with the correct postId
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      // Mock the post ID and update data
      const postId = 1;
      const updateBody = {
        title: 'Updated Post Title',
        tags: ['updated-tag1', 'updated-tag2'],
        content: 'This is the updated content.',
      };

      // Mock the PrismaService findUnique method to return a post object
      jest.spyOn(prismaService.post, 'findUnique').mockResolvedValue({
        id: postId,
        title: 'Test Post',
        tags: ['tag1', 'tag2'],
        content: 'This is a test post content.',
        publicationDate: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
        authorId: 2,
      });

      // Mock the PrismaService update method to return the updated post object
      jest.spyOn(prismaService.post, 'update').mockResolvedValue({
        id: postId,
        ...updateBody,
        updatedAt: new Date(),
        publicationDate: new Date(Date.now()),
        authorId: 2,
      });

      // Call the updatePost method
      const result = await postService.updatePost(postId, updateBody);

      // Expectations
      expect(result).toBeDefined(); // Check if the result is defined (not null or undefined)
      expect(result.id).toBe(postId); // Check if the post ID is the same as the input postId
      expect(result.title).toBe(updateBody.title); // Check if the post title is updated
      expect(result.tags).toEqual(updateBody.tags); // Check if the post tags are updated
      expect(result.content).toBe(updateBody.content); // Check if the post content is updated
      expect(prismaService.post.findUnique).toBeCalledWith({
        where: { id: postId },
      }); // Check if findUnique was called with the correct postId
      expect(prismaService.post.update).toBeCalledWith({
        where: { id: postId },
        data: updateBody,
      }); // Check if update was called with the correct postId and updateBody
    });

    it('should throw a NotFoundException if the post does not exist', async () => {
      // Mock the post ID and update data
      const postId = 1;
      const updateBody = {
        title: 'Updated Post Title',
        tags: ['updated-tag1', 'updated-tag2'],
        content: 'This is the updated content.',
      };

      // Mock the PrismaService findUnique method to return null (indicating that the post does not exist)
      jest.spyOn(prismaService.post, 'findUnique').mockResolvedValue(null);

      // Call the updatePost method and expect it to throw a NotFoundException
      await expect(
        postService.updatePost(postId, updateBody),
      ).rejects.toThrowError(NotFoundException);
      expect(prismaService.post.findUnique).toBeCalledWith({
        where: { id: postId },
      }); // Check if findUnique was called with the correct postId
    });
  });

  describe('getAllPostForAdmin', () => {
    it('should get all posts for admin', async () => {
      // Mock the request query parameters
      const title = 'Test Post';
      const authorId = 1;
      const tags = 'tag1,tag2';
      const page = 1;
      const limit = 10;
      const sortBy = 'publicationDate';
      const sortOrder = 'desc';

      // Mock the filter object
      const filter = {
        title,
        authorId,
        tags: tags.split(','),
        page,
        limit,
        sortBy,
        sortOrder,
      };

      // Mock the PrismaService findMany method to return an array of posts
      jest.spyOn(prismaService.post, 'findMany').mockResolvedValue([
        // Add mock posts here (as per your requirement)
        {
          id: 1,
          title: 'Test Post 1',
          publicationDate: new Date(),
          updatedAt: new Date(),
          content: 'This is test post content 1.',
          tags: ['tag1', 'tag2'],
          authorId: 1,
        },
        {
          id: 2,
          title: 'Test Post 2',
          publicationDate: new Date(),
          updatedAt: new Date(),
          content: 'This is test post content 2.',
          tags: ['tag3', 'tag4'],
          authorId: 2,
        },
      ]);

      // Call the getAllPostForAdmin method
      const result = await postService.getAllPostForAdmin(
        filter,
        0,
        limit,
        page,
        sortBy,
        sortOrder,
      );

      // Expectations
      expect(result).toBeDefined(); // Check if the result is defined (not null or undefined)
      expect(result.numberOfRecords).toBe(2); // Check if the number of records is correct (number of mocked posts)
      expect(result.post).toHaveLength(2); // Check if the number of posts returned is correct
      expect(result.page).toBe(page); // Check if the page number is correct
      expect(result.limit).toBe(limit); // Check if the limit per page is correct
    });
  });
});
