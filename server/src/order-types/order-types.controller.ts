import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request
} from '@nestjs/common';
import { OrderTypesService } from './order-types.service';
import { CreateOrderTypeDto } from './dto/create-order-type.dto';
import { UpdateOrderTypeDto } from './dto/update-order-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('order-types')
@UseGuards(JwtAuthGuard)
export class OrderTypesController {
  constructor(private readonly orderTypesService: OrderTypesService) {}

  /**
   * POST /order-types - Create a new order type
   * PERMISSION REQUIRED: canManageMasterData
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createOrderTypeDto: CreateOrderTypeDto, @Request() req) {
    return this.orderTypesService.createWithPermissionCheck(createOrderTypeDto, req.user.userId);
  }

  /**
   * GET /order-types - Get all order types
   * GLOBAL ACCESS: All authenticated users can view order types
   */
  @Get()
  async findAll() {
    return this.orderTypesService.findAll();
  }

  /**
   * GET /order-types/:id - Get a specific order type
   * GLOBAL ACCESS: All authenticated users can view order types
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderTypesService.findOne(id);
  }

  /**
   * PATCH /order-types/:id - Update an order type
   * PERMISSION REQUIRED: canManageMasterData
   */
  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updateOrderTypeDto: UpdateOrderTypeDto,
    @Request() req
  ) {
    return this.orderTypesService.updateWithPermissionCheck(id, updateOrderTypeDto, req.user.userId);
  }

  /**
   * DELETE /order-types/:id - Delete an order type
   * PERMISSION REQUIRED: canManageMasterData
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.orderTypesService.removeWithPermissionCheck(id, req.user.userId);
  }
}