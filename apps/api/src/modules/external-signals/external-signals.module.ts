import { Module } from "@nestjs/common";
import { OrganizationsModule } from "../organizations/organizations.module";
import { ExternalSignalsController } from "./external-signals.controller";
import { ExternalSignalsService } from "./external-signals.service";

@Module({
  imports: [OrganizationsModule],
  controllers: [ExternalSignalsController],
  providers: [ExternalSignalsService],
  exports: [ExternalSignalsService],
})
export class ExternalSignalsModule {}
