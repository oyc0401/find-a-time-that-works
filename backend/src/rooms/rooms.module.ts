import { Module } from "@nestjs/common";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";
import { RoomsGateway } from "./rooms.gateway";
import { RoomsEventService } from "./rooms-event.service";

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, RoomsEventService],
})
export class RoomsModule {}
