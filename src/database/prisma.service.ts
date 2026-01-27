import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy
{
  // ❌ NO onModuleInit
  // Prisma will connect lazily on first query

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
