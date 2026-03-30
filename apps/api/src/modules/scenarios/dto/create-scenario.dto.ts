import {
  IsIn,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { ScenarioActionType } from "@repo/shared/scenario";

const SCENARIO_ACTIONS: ScenarioActionType[] = [
  "DELAY_PAYMENT",
  "ACCELERATE_COLLECTION",
  "INCREASE_FORECAST_SALES",
  "REDUCE_EXPENSE_CATEGORY",
  "ADD_EXTRA_EXPENSE",
  "POSTPONE_INVESTMENT",
];

class ScenarioActionDto {
  @IsIn(SCENARIO_ACTIONS)
  type!: ScenarioActionType;

  @IsOptional()
  @IsString()
  movementId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  days?: number;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateScenarioDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioActionDto)
  actions!: ScenarioActionDto[];
}
