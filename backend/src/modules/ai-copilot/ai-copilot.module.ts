import { Module } from '@nestjs/common';
import { AiCopilotController } from './ai-copilot.controller';
import { AiCopilotService } from './ai-copilot.service';
import { ContextBuilderService } from './context-builder.service';

@Module({
  controllers: [AiCopilotController],
  providers: [AiCopilotService, ContextBuilderService],
  exports: [AiCopilotService],
})
export class AiCopilotModule {}
