"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const garments_service_1 = require("./garments.service");
const verification_service_1 = require("../verification/verification.service");
const list_garments_dto_1 = require("./dto/list-garments.dto");
const create_garment_dto_1 = require("./dto/create-garment.dto");
const jwt_auth_guard_1 = require("../common/jwt-auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const imageStorage = (0, multer_1.diskStorage)({
    destination: './uploads',
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${(0, path_1.extname)(file.originalname)}`);
    },
});
let GarmentsController = class GarmentsController {
    constructor(garmentsService, verificationService) {
        this.garmentsService = garmentsService;
        this.verificationService = verificationService;
    }
    async create(files, dto, user) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Se requiere al menos una imagen');
        }
        const apiBase = process.env.API_BASE_URL || 'http://localhost:4000/api';
        const imagenes = files.map((f) => `${apiBase}/uploads/${f.filename}`);
        const garment = await this.garmentsService.create(dto, user.userId, imagenes);
        this.verificationService.runPipeline(garment.id).catch(() => { });
        return garment;
    }
    findMine(user) {
        return this.garmentsService.findByUser(user.userId);
    }
    findAll(dto) {
        return this.garmentsService.findAll(dto);
    }
    getMetadata(id) {
        return this.garmentsService.getMetadata(id);
    }
    findOne(id) {
        return this.garmentsService.findOne(id);
    }
};
exports.GarmentsController = GarmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, {
        storage: imageStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (file.mimetype.startsWith('image/'))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('Solo se aceptan imágenes'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, create_garment_dto_1.CreateGarmentDto, Object]),
    __metadata("design:returntype", Promise)
], GarmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_garments_dto_1.ListGarmentsDto]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/metadata'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "getMetadata", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GarmentsController.prototype, "findOne", null);
exports.GarmentsController = GarmentsController = __decorate([
    (0, common_1.Controller)('garments'),
    __metadata("design:paramtypes", [garments_service_1.GarmentsService,
        verification_service_1.VerificationService])
], GarmentsController);
//# sourceMappingURL=garments.controller.js.map