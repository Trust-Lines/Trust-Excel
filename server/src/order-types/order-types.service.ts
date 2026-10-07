import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderTypeDto } from './dto/create-order-type.dto';
import { UpdateOrderTypeDto } from './dto/update-order-type.dto';
import { OrderType } from '@prisma/client';

@Injectable()
export class OrderTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<OrderType[]> {
    return this.prisma.orderType.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { name: 'asc' }
      ]
    });
  }

  async findOne(id: string): Promise<OrderType> {
    const orderType = await this.prisma.orderType.findUnique({
      where: {
        id
      }
    });

    if (!orderType) {
      throw new NotFoundException(`Order type with ID ${id} not found`);
    }

    return orderType;
  }

  async create(createOrderTypeDto: CreateOrderTypeDto): Promise<OrderType> {
    // Check if order type with this name already exists
    const existingOrderType = await this.prisma.orderType.findFirst({
      where: {
        name: createOrderTypeDto.name
      }
    });

    if (existingOrderType) {
      throw new ConflictException(
        `Order type with name "${createOrderTypeDto.name}" already exists`
      );
    }

    return this.prisma.orderType.create({
      data: createOrderTypeDto
    });
  }

  async update(id: string, updateOrderTypeDto: UpdateOrderTypeDto): Promise<OrderType> {
    // Verify order type exists
    await this.findOne(id);

    // If updating name, check for conflicts globally
    if (updateOrderTypeDto.name) {
      const existingOrderType = await this.prisma.orderType.findFirst({
        where: {
          name: updateOrderTypeDto.name,
          id: { not: id }
        }
      });

      if (existingOrderType) {
        throw new ConflictException(
          `Order type with name "${updateOrderTypeDto.name}" already exists`
        );
      }
    }

    return this.prisma.orderType.update({
      where: { id },
      data: updateOrderTypeDto
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    // Verify order type exists
    await this.findOne(id);

    // Soft delete by setting isActive to false
    await this.prisma.orderType.update({
      where: { id },
      data: { isActive: false }
    });

    return {
      message: 'Order type deactivated successfully'
    };
  }

  // ================== PERMISSION-BASED METHODS ==================

  /**
   * Create order type with permission check for canManageMasterData
   */
  async createWithPermissionCheck(createOrderTypeDto: CreateOrderTypeDto, userId: string): Promise<OrderType> {
    // Load user's role policy to check canManageMasterData permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canManageMasterData = pagePermissions?.canManageMasterData ?? true; // Default true for backward compatibility

    if (!canManageMasterData) {
      throw new ForbiddenException('You do not have permission to create order types');
    }

    // Permission granted, proceed with creation
    return this.create(createOrderTypeDto);
  }

  /**
   * Update order type with permission check for canManageMasterData
   */
  async updateWithPermissionCheck(id: string, updateOrderTypeDto: UpdateOrderTypeDto, userId: string): Promise<OrderType> {
    // Load user's role policy to check canManageMasterData permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canManageMasterData = pagePermissions?.canManageMasterData ?? true; // Default true for backward compatibility

    if (!canManageMasterData) {
      throw new ForbiddenException('You do not have permission to update order types');
    }

    // Permission granted, proceed with update
    return this.update(id, updateOrderTypeDto);
  }

  /**
   * Delete order type with permission check for canManageMasterData
   */
  async removeWithPermissionCheck(id: string, userId: string): Promise<{ message: string }> {
    // Load user's role policy to check canManageMasterData permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canManageMasterData = pagePermissions?.canManageMasterData ?? true; // Default true for backward compatibility

    if (!canManageMasterData) {
      throw new ForbiddenException('You do not have permission to delete order types');
    }

    // Permission granted, proceed with deletion
    return this.remove(id);
  }
}