import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { RoomsModule } from "./rooms/rooms.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [PrismaModule, RoomsModule],
  controllers: [HealthController],
})
export class AppModule {}
