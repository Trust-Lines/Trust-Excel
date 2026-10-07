import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomProjectType } from '@prisma/client';

export interface CreateCustomTypeDto {
  name: string;
  code: string;
  description?: string;
  isGlobal?: boolean;
}

export interface UpdateCustomTypeDto {
  name?: string;
  code?: string;
  description?: string;
  isGlobal?: boolean;
  isActive?: boolean;
}

@Injectable()
export class CustomTypesService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Get all active custom types
   */
  async findAll(): Promise<CustomProjectType[]> {
    return this.prismaService.customProjectType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all active global custom types
   */
  async findGlobal(): Promise<CustomProjectType[]> {
    return this.prismaService.customProjectType.findMany({
      where: {
        isActive: true,
        isGlobal: true
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find custom type by name
   */
  async findByName(name: string): Promise<CustomProjectType | null> {
    return this.prismaService.customProjectType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        isActive: true
      },
    });
  }

  /**
   * Find custom type by code
   */
  async findByCode(code: string): Promise<CustomProjectType | null> {
    return this.prismaService.customProjectType.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        isActive: true
      },
    });
  }

  /**
   * Create a new custom type
   */
  async create(createDto: CreateCustomTypeDto): Promise<CustomProjectType> {
    // Validate name and code format
    if (!createDto.name?.trim()) {
      throw new BadRequestException('Type name is required');
    }

    if (!createDto.code?.trim()) {
      throw new BadRequestException('Type code is required');
    }

    // Normalize inputs
    const normalizedName = createDto.name.trim();
    const normalizedCode = createDto.code.trim().toUpperCase();

    // Check for duplicates
    const existingByName = await this.findByName(normalizedName);
    if (existingByName) {
      throw new ConflictException(`Custom type with name "${normalizedName}" already exists`);
    }

    const existingByCode = await this.findByCode(normalizedCode);
    if (existingByCode) {
      throw new ConflictException(`Custom type with code "${normalizedCode}" already exists`);
    }

    // A soft-deleted type still holds its unique name/code — bring it back instead of failing.
    const softDeleted = await this.prismaService.customProjectType.findFirst({
      where: {
        isActive: false,
        OR: [
          { name: { equals: normalizedName, mode: 'insensitive' } },
          { code: { equals: normalizedCode, mode: 'insensitive' } },
        ],
      },
    });
    if (softDeleted) {
      return this.prismaService.customProjectType.update({
        where: { id: softDeleted.id },
        data: {
          isActive: true,
          name: normalizedName,
          code: normalizedCode,
          description: createDto.description?.trim() || null,
          isGlobal: createDto.isGlobal ?? true,
        },
      });
    }

    // Create the custom type
    return this.prismaService.customProjectType.create({
      data: {
        name: normalizedName,
        code: normalizedCode,
        description: createDto.description?.trim() || null,
        isGlobal: createDto.isGlobal ?? true,
      },
    });
  }

  /**
   * Create custom type if it doesn't exist (used during project creation)
   */
  async createIfNotExists(typeName: string): Promise<CustomProjectType> {
    const existing = await this.findByName(typeName);
    if (existing) {
      return existing;
    }

    // Generate a code from the type name
    const code = this.generateCodeFromName(typeName);

    const newCustomType = await this.create({
      name: typeName,
      code,
      isGlobal: true,
    });

    return newCustomType;
  }

  /**
   * Update custom type
   */
  async update(id: string, updateDto: UpdateCustomTypeDto): Promise<CustomProjectType> {
    const existing = await this.prismaService.customProjectType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException('Custom type not found');
    }

    // Check for conflicts if name or code is being changed
    if (updateDto.name && updateDto.name !== existing.name) {
      const duplicateByName = await this.findByName(updateDto.name);
      if (duplicateByName && duplicateByName.id !== id) {
        throw new ConflictException(`Custom type with name "${updateDto.name}" already exists`);
      }
    }

    if (updateDto.code && updateDto.code !== existing.code) {
      const duplicateByCode = await this.findByCode(updateDto.code);
      if (duplicateByCode && duplicateByCode.id !== id) {
        throw new ConflictException(`Custom type with code "${updateDto.code}" already exists`);
      }
    }

    return this.prismaService.customProjectType.update({
      where: { id },
      data: {
        ...updateDto,
        name: updateDto.name?.trim(),
        code: updateDto.code?.trim().toUpperCase(),
        description: updateDto.description?.trim() || null,
      },
    });
  }

  /**
   * Soft delete custom type
   */
  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prismaService.customProjectType.findUnique({
      where: { id },
      include: {
        projectItems: true,
        missingExtraItems: true,
      },
    });

    if (!existing) {
      throw new BadRequestException('Custom type not found');
    }

    // Check if type is in use
    const itemCount = existing.projectItems.length + existing.missingExtraItems.length;
    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete custom type "${existing.name}" as it is used by ${itemCount} item(s). ` +
        'Please reassign these items to other types first.'
      );
    }

    // Soft delete
    await this.prismaService.customProjectType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Custom type "${existing.name}" deleted successfully` };
  }

  /**
   * Generate a short code from a type name
   */
  private generateCodeFromName(name: string): string {
    const cleaned = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleaned.length <= 3) {
      return cleaned;
    }

    // Take first letter of each word or first 3 characters
    const words = name.trim().toUpperCase().split(/\s+/);
    if (words.length > 1) {
      return words.map(w => w.charAt(0)).join('').substring(0, 3);
    }

    return cleaned.substring(0, 3);
  }

  /**
   * Check if a type name is a predefined enum type
   */
  isEnumType(typeName: string): boolean {
    const enumTypes = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];
    return enumTypes.includes(typeName.toUpperCase());
  }

  /**
   * Get all available types (both enum and custom)
   */
  async getAllAvailableTypes(): Promise<{ enumTypes: string[], customTypes: CustomProjectType[] }> {
    const enumTypes = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];
    const customTypes = await this.findGlobal();

    return { enumTypes, customTypes };
  }
}