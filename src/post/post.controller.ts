import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  HttpException,
  HttpStatus,
  Query,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { postDto, updateBodyDto } from './dto/post.dto';
import { User } from 'src/user/decorators/user.decorator';
import { userDecorator } from 'src/user/dto/auth.dto';
import { Roles } from 'src/decorators/roles.decorators';
import { Role } from '@prisma/client';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
  private readonly logger = new Logger(PostService.name);

  @Roles(Role.ADMIN, Role.USER)
  @Post()
  createPost(@Body() body: postDto, @User() user: userDecorator) {
    return this.postService.createPost(body, user);
  }

  @Roles(Role.USER)
  @Get('/user')
  getAllPostForUser(
    @User() user: userDecorator,
    @Query('title') title?: string,
    @Query('authorId') authorId?: number,
    @Query('tags') tags?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('fields') fields?: string,
  ) {
    const filter = {
      ...(title && { title: title }),
      ...(authorId && { authorId: authorId }),
      ...(tags && { tags: tags.split(',') }),
      ...(sortBy && { sortBy: sortBy }),
      ...(sortOrder && { sortOrder: sortOrder }),
      ...(fields && { fields: fields.split(',') }),
    };
    const requestedPage = page && !isNaN(Number(page)) ? Number(page) : 1;

    // If the user didn't provide a value for pageSize or provided an invalid value, use the default (pageSize = 10)
    const requestedLimit = limit && !isNaN(Number(limit)) ? Number(limit) : 10;
    const offset = (requestedPage - 1) * requestedLimit;

    this.logger.log(filter);
    return this.postService.getAllPostForUser(
      user,
      filter,
      offset,
      requestedLimit,
      requestedPage,
      sortBy,
      sortOrder,
    );
  }

  @Roles(Role.ADMIN)
  @Get('/admin')
  getAllPostForAdmin(
    @Query('title') title?: string,
    @Query('authorId') authorId?: number,
    @Query('tags') tags?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('fields') fields?: string,
  ) {
    const filter = {
      ...(title && { title: title }),
      ...(authorId && { authorId: authorId }),
      ...(tags && { tags: tags.split(',') }),
      ...(sortBy && { sortBy: sortBy }),
      ...(sortOrder && { sortOrder: sortOrder }),
      ...(fields && { fields: fields.split(',') }),
    };

    const requestedPage = page && !isNaN(Number(page)) ? Number(page) : 1;

    // If the user didn't provide a value for pageSize or provided an invalid value, use the default (pageSize = 10)
    const requestedLimit = limit && !isNaN(Number(limit)) ? Number(limit) : 10;
    const offset = (requestedPage - 1) * requestedLimit;

    this.logger.log(filter);
    return this.postService.getAllPostForAdmin(
      filter,
      offset,
      requestedLimit,
      requestedPage,
      sortBy,
      sortOrder,
    );
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('/:id')
  async getPostById(
    @Param('id', ParseIntPipe) postId: number,
    @User() user: userDecorator,
  ) {
    const authorId = await this.postService.getAuthorOfPost(user, postId);
    if (user.id !== authorId && user.role !== Role.ADMIN) {
      throw new HttpException(
        'Unauthorized, You nou are not the author of this post!',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.postService.getPostById(postId);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Delete(':id')
  async deletePost(
    @Param('id', ParseIntPipe) postId: number,
    @User() user: userDecorator,
  ) {
    const authorId = await this.postService.getAuthorOfPost(user, postId);
    if (user.id !== authorId && user.role !== Role.ADMIN)
      throw new HttpException(
        'Unauthorized, You nou are not the author of this post!',
        HttpStatus.UNAUTHORIZED,
      );
    return this.postService.deletePost(postId);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Put('/:id')
  async updatePost(
    @Param('id', ParseIntPipe) postId: number,
    @Body() body: updateBodyDto,
    @User() user: userDecorator,
  ) {
    const authorId = await this.postService.getAuthorOfPost(user, postId);
    if (user.id !== authorId && user.role !== Role.ADMIN)
      throw new HttpException(
        'Unauthorized, You nou are not the author of this post!',
        HttpStatus.UNAUTHORIZED,
      );
    return this.postService.updatePost(postId, body);
  }
}
