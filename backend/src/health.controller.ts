import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get()
  check(): string {
    return "ok";
  }
}
