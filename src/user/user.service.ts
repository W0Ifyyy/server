import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { hashPassword } from 'utils/creatingPassword';
import { ICreateUser, IUpdateUser } from 'utils/Interfaces';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}
  async getAllUsers() {
    let users = await this.usersRepository.find();
    return users;
  }
  async getUserById(id: number) {
    let user = await this.usersRepository.findOne({ where: { id } });
    if (!user)
      throw new HttpException(
        `User with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    return user;
  }
  async createUser(params: ICreateUser) {
    let existingUser = await this.usersRepository.findOne({
      where: { email: params.email },
    });
    if (existingUser)
      throw new HttpException(
        'User with that email already exists!',
        HttpStatus.CONFLICT,
      );
    try {
      const hashedPassword = await hashPassword(params.password);
      const newUser = await this.usersRepository.save({
        ...params,
        password: hashedPassword,
      });
      return { msg: 'User created succesfully!', user: newUser };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        'An error occurred while creating the user.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async updateUser(id: number, params: IUpdateUser) {
    //todo: check if params are undefined
    const result = await this.usersRepository.update(id, params);
    if (result.affected === 0) {
      throw new HttpException(
        'User with this id does not exist!',
        HttpStatus.NOT_FOUND,
      );
    }
    return { msg: 'User updated successfully!' };
  }
  async deleteUserById(id: number) {
    try {
      let deletingUserOperation = await this.usersRepository.delete({ id });
      if (deletingUserOperation.affected === 0)
        throw new HttpException(
          "The user you're trying to delete does not exist!",
          HttpStatus.NOT_FOUND,
        );
      return { msg: 'User deleted succesfully' };
    } catch (error) {
      console.log(`An error occured while deleting the user: ${error.message}`);
      throw new HttpException(
        'An error occured while deleting the user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
