import { IsOptional, IsString } from "class-validator";

export class UploadImportDto {
  @IsString()
  importType!: string;

  @IsOptional()
  @IsString()
  columnMapping?: string;
}
