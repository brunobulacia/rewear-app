import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const globalPrefix = 'api';
  const PORT = process.env.PORT || 4000;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);
  await app.listen(PORT, () => {
    console.log('Listening at http://localhost:' + PORT + '/' + globalPrefix);
  });
}
bootstrap();
