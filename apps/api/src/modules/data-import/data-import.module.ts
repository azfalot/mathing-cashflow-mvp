import { Module } from "@nestjs/common";
import { DataImportController } from "./data-import.controller";
import { DataImportService } from "./data-import.service";
import { CsvImportConnector } from "./csv-import.connector";
import { NormalizationService } from "./normalization.service";

@Module({
  controllers: [DataImportController],
  providers: [DataImportService, CsvImportConnector, NormalizationService],
  exports: [DataImportService, NormalizationService],
})
export class DataImportModule {}
