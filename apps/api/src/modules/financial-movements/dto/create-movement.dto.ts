import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { MovementStatus, MovementType } from "@prisma/client";

export class CreateMovementDto {
  @IsEnum(MovementType)
  movementType!: MovementType;

  @IsEnum(MovementStatus)
  status!: MovementStatus;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  counterparty?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  rawReference?: string;
}
