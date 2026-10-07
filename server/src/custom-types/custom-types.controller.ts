import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { CustomTypesService, CreateCustomTypeDto, UpdateCustomTypeDto } from './custom-types.service';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class CreateCustomTypeRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}

export class UpdateCustomTypeRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('custom-types')
@UseGuards(JwtAuthGuard)
export class CustomTypesController {
  constructor(private readonly customTypesService: CustomTypesService) {}

  @Get()
  async findAll() {
    return this.customTypesService.findAll();
  }

  @Get('global')
  async findGlobal() {
    return this.customTypesService.findGlobal();
  }

  @Get('available')
  async getAllAvailableTypes() {
    return this.customTypesService.getAllAvailableTypes();
  }

  @Post()
  async create(@Body(ValidationPipe) createDto: CreateCustomTypeRequestDto) {
    return this.customTypesService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateCustomTypeRequestDto
  ) {
    return this.customTypesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customTypesService.remove(id);
  }
}