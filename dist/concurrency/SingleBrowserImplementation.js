"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chromeLauncher = require("chrome-launcher");
const util = require("util");
// @ts-ignore
const request = require("request");
const ConcurrencyImplementation_1 = require("./ConcurrencyImplementation");
const util_1 = require("../util");
const debug = util_1.debugGenerator('SingleBrowserImpl');
const BROWSER_TIMEOUT = 5000;
class SingleBrowserImplementation extends ConcurrencyImplementation_1.default {
    constructor(options, puppeteer) {
        super(options, puppeteer);
        this.browser = null;
        this.repairing = false;
        this.repairRequested = false;
        this.openInstances = 0;
        this.waitingForRepairResolvers = [];
    }
    repair() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.openInstances !== 0 || this.repairing) {
                // already repairing or there are still pages open? wait for start/finish
                yield new Promise(resolve => this.waitingForRepairResolvers.push(resolve));
                return;
            }
            this.repairing = true;
            debug('Starting repair');
            try {
                // will probably fail, but just in case the repair was not necessary
                yield this.browser.close();
            }
            catch (e) {
                debug('Unable to close browser.');
            }
            try {
                const browser = yield chromeLauncher.launch(this.options);
                const resp = yield util.promisify(request)(`http://localhost:${browser.port}/json/version`);
                const { webSocketDebuggerUrl } = JSON.parse(resp.body);
                const chrome = yield this.puppeteer.connect({
                    browserWSEndpoint: webSocketDebuggerUrl,
                });
                this.browser = chrome;
            }
            catch (err) {
                throw new Error('Unable to restart chrome.');
            }
            this.repairRequested = false;
            this.repairing = false;
            this.waitingForRepairResolvers.forEach(resolve => resolve());
            this.waitingForRepairResolvers = [];
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield chromeLauncher.launch(this.options);
            const resp = yield util.promisify(request)(`http://localhost:${browser.port}/json/version`);
            const { webSocketDebuggerUrl } = JSON.parse(resp.body);
            const chrome = yield this.puppeteer.connect({
                browserWSEndpoint: webSocketDebuggerUrl,
            });
            this.browser = chrome;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.browser.close();
        });
    }
    workerInstance() {
        return __awaiter(this, void 0, void 0, function* () {
            let resources;
            return {
                jobInstance: () => __awaiter(this, void 0, void 0, function* () {
                    if (this.repairRequested) {
                        yield this.repair();
                    }
                    yield util_1.timeoutExecute(BROWSER_TIMEOUT, (() => __awaiter(this, void 0, void 0, function* () {
                        resources = yield this.createResources();
                    }))());
                    this.openInstances += 1;
                    return {
                        resources,
                        close: () => __awaiter(this, void 0, void 0, function* () {
                            this.openInstances -= 1; // decrement first in case of error
                            yield util_1.timeoutExecute(BROWSER_TIMEOUT, this.freeResources(resources));
                            if (this.repairRequested) {
                                yield this.repair();
                            }
                        }),
                    };
                }),
                close: () => __awaiter(this, void 0, void 0, function* () { }),
                repair: () => __awaiter(this, void 0, void 0, function* () {
                    debug('Repair requested');
                    this.repairRequested = true;
                    yield this.repair();
                }),
            };
        });
    }
}
exports.default = SingleBrowserImplementation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2luZ2xlQnJvd3NlckltcGxlbWVudGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbmN1cnJlbmN5L1NpbmdsZUJyb3dzZXJJbXBsZW1lbnRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUVBLGtEQUFrRDtBQUNsRCw2QkFBNkI7QUFDN0IsYUFBYTtBQUNiLG1DQUFtQztBQUNuQywyRUFBc0Y7QUFFdEYsa0NBQXlEO0FBQ3pELE1BQU0sS0FBSyxHQUFHLHFCQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUVsRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFFN0IsTUFBOEIsMkJBQTRCLFNBQVEsbUNBQXlCO0lBU3ZGLFlBQW1CLE9BQWdDLEVBQUUsU0FBYztRQUMvRCxLQUFLLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBUnBCLFlBQU8sR0FBNkIsSUFBSSxDQUFDO1FBRTNDLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFDM0Isb0JBQWUsR0FBWSxLQUFLLENBQUM7UUFDakMsa0JBQWEsR0FBVyxDQUFDLENBQUM7UUFDMUIsOEJBQXlCLEdBQW1CLEVBQUUsQ0FBQztJQUl2RCxDQUFDO0lBRWEsTUFBTTs7WUFDaEIsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUM1Qyx5RUFBeUU7Z0JBQ3pFLE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLE9BQU87YUFDVjtZQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRXpCLElBQUk7Z0JBQ0Esb0VBQW9FO2dCQUNwRSxNQUEwQixJQUFJLENBQUMsT0FBUSxDQUFDLEtB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