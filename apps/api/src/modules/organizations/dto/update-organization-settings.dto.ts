import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateOrganizationSettingsDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  tensionThresholdAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tensionThresholdDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  monteCarloRuns?: number;

  @IsOptional()
  @IsString()
  sector?: string;
}
