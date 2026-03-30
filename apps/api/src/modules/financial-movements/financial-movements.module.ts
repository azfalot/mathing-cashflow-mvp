import { Module } from "@nestjs/common";
import { FinancialMovementsController } from "./financial-movements.controller";
import { FinancialMovementsService } from "./financial-movements.service";

@Module({
  controllers: [FinancialMovementsController],
  providers: [FinancialMovementsService],
  exports: [FinancialMovementsService],
})
export class FinancialMovementsModule {}
