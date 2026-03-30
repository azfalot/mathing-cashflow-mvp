import { Injectable } from "@nestjs/common";
import { parse } from "csv-parse/sync";

@Injectable()
export class CsvImportConnector {
  parseBuffer(buffer: Buffer) {
    return parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    }) as Record<string, string>[];
  }
}
