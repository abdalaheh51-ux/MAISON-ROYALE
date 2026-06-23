import * as dotenv from 'dotenv';
import { defineConfig, env } from '@prisma/config';

dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
    directUrl: env('DIRECT_URL'),
  },
});
