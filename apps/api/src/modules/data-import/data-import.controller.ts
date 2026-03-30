import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/jwt.strategy";
import { DataImportService } from "./data-import.service";
import { UploadImportDto } from "./dto/upload-import.dto";

@Controller("imports")
@UseGuards(JwtAuthGuard)
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadImportDto,
  ) {
    return this.dataImportService.upload(user.organizationId, file, dto);
  }

  @Get(":id/report")
  getReport(@CurrentUser() user: JwtPayload, @Param("id") importId: string) {
    return this.dataImportService.getReport(user.organizationId, importId);
  }
}
