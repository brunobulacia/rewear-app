"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarmentsModule = void 0;
const common_1 = require("@nestjs/common");
const garments_controller_1 = require("./garments.controller");
const garments_service_1 = require("./garments.service");
const verification_module_1 = require("../verification/verification.module");
let GarmentsModule = class GarmentsModule {
};
exports.GarmentsModule = GarmentsModule;
exports.GarmentsModule = GarmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [verification_module_1.VerificationModule],
        controllers: [garments_controller_1.GarmentsController],
        providers: [garments_service_1.GarmentsService],
    })
], GarmentsModule);
//# sourceMappingURL=garments.module.js.map