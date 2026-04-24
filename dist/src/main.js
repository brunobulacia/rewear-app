"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const fs = require("fs");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const uploadsDir = (0, path_1.join)(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir))
        fs.mkdirSync(uploadsDir, { recursive: true });
    app.useStaticAssets(uploadsDir, { prefix: '/api/uploads' });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`ReWear API running on http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map