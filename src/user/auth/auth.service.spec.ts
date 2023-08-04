import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('Should register a user and return a token', async () => {
      //mock input data
      const registerBody = {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: 'johndoe@gmail.com',
        phone: '09304550096',
        role: Role.USER,
      };

      //mock prismaService findUnique
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      // jest
      //   .spyOn(bcrypt, 'hash')
      //   .mockImplementation((pass, salt, cb) => cb(null, ''));

      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: 55656,
        ...registerBody,
        password: await bcrypt.hash(registerBody.password, 10),
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
      });

      // Mock the bcrypt.hash method

      const result = await authService.register(registerBody);
      expect(typeof result).toBe('string');
    });

    it('should throw an error if the email is already in use', async () => {
      // Mock input data
      const registerBody = {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: 'johndoe@gmail.com',
        phone: '09304550096',
        role: Role.USER,
      };

      // Mock the PrismaService findUnique method to return a user object (email already exists)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 1,
        ...registerBody,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Call the register method and expect it to throw an HttpException with BAD_REQUEST status
      await expect(authService.register(registerBody)).rejects.toThrowError(
        'Email already in use! ',
      );
    });
  });
  describe('login', () => {
    it('should login a user and return a token', async () => {
      // Mock input data
      const email = 'johndoe@gmail.com';
      const password = 'johndoe@gmail.com';
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: await bcrypt.hash(password, 10), // Hash the password to simulate the hashed value stored in the database
        phone: '09304550096',
        role: Role.USER,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
      };

      // Mock the PrismaService findUnique method to return the mockUser object (user exists)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Mock the bcrypt.compare method to return true for the password comparison
      jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(Promise.resolve(true) as never);

      // Mock the AuthService's generateToken method to return a token string
      jest.spyOn(authService, 'generateToken').mockResolvedValue('mockToken');

      // Call the login method
      const token = await authService.login({ email, password });

      // Expect the result to be a token string
      expect(typeof token).toBe('string');
      // Expect the generateToken method to have been called with the correct arguments
      expect(authService.generateToken).toHaveBeenCalledWith(
        mockUser.name,
        mockUser.id,
        mockUser.role,
      );
    });

    it('should throw an error if the email is not found', async () => {
      // Mock input data
      const email = 'nonexistent@gmail.com';
      const password = 'password';

      // Mock the PrismaService findUnique method to return null (user does not exist)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Call the login method and expect it to throw an HttpException with NOT_FOUND status
      await expect(authService.login({ email, password })).rejects.toThrowError(
        new HttpException('Email not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw an error if the password is incorrect', async () => {
      // Mock input data
      const email = 'johndoe@gmail.com';
      const password = 'wrongpassword';
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: await bcrypt.hash('correctpassword', 10), // Use a different hashed password to simulate the stored value
        phone: '09304550096',
        role: Role.USER,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
      };

      // Mock the PrismaService findUnique method to return the mockUser object (user exists)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Mock the bcrypt.compare method to return false for the password comparison (wrong password)
      jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(Promise.resolve(false) as never);

      // Call the login method and expect it to throw an HttpException with BAD_REQUEST status
      await expect(authService.login({ email, password })).rejects.toThrowError(
        new HttpException('Invalid credential', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
