import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Vendor } from '@prisma/client';

@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  /**
   * GET /vendors?q=search - Get all active vendors with optional search
   * GLOBAL ACCESS: All authenticated users can view vendors
   */
  @Get()
  findAll(@Query('q') q?: string): Promise<Vendor[]> {
    return this.vendorsService.findAll(q);
  }

  /**
   * GET /vendors/:id - Get a specific vendor
   * GLOBAL ACCESS: All authenticated users can view vendors
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Vendor> {
    return this.vendorsService.findOne(id);
  }

  /**
   * POST /vendors - Create a new vendor
   * PERMISSION REQUIRED: canManageMasterData
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() createVendorDto: CreateVendorDto, @Request() req: any): Promise<Vendor> {
    return this.vendorsService.createWithPermissionCheck(createVendorDto, req.user.userId);
  }

  /**
   * PATCH /vendors/:id - Update a vendor
   * PERMISSION REQUIRED: canManageMasterData
   */
  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @Request() req: any
  ): Promise<Vendor> {
    return this.vendorsService.updateWithPermissionCheck(id, updateVendorDto, req.user.userId);
  }

  /**
   * DELETE /vendors/:id - Soft delete a vendor
   * PERMISSION REQUIRED: canManageMasterData
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    return this.vendorsService.removeWithPermissionCheck(id, req.user.userId);
  }
}