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
const util_1 = require("../../util");
const ConcurrencyImplementation_1 = require("../ConcurrencyImplementation");
const debug = util_1.debugGenerator('BrowserConcurrency');
const BROWSER_TIMEOUT = 5000;
class Browser extends ConcurrencyImplementation_1.default {
    init() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    workerInstance() {
        return __awaiter(this, void 0, void 0, function* () {
            let browser = yield chromeLauncher.launch(this.options);
            let resp = yield util.promisify(request)(`http://localhost:${browser.port}/json/version`);
            let { webSocketDebuggerUrl } = JSON.parse(resp.body);
            let chrome = yield this.puppeteer.connect({
                browserWSEndpoint: webSocketDebuggerUrl,
            });
            let page;
            let context; // puppeteer typings are old...
            return {
                jobInstance: () => __awaiter(this, void 0, void 0, function* () {
                    yield util_1.timeoutExecute(BROWSER_TIMEOUT, (() => __awaiter(this, void 0, void 0, function* () {
                        context = yield chrome.createIncognitoBrowserContext();
                        page = yield context.newPage();
                    }))());
                    return {
                        resources: {
                            page,
                        },
                        close: () => __awaiter(this, void 0, void 0, function* () {
                            yield util_1.timeoutExecute(BROWSER_TIMEOUT, context.close());
                        }),
                    };
                }),
                close: () => __awaiter(this, void 0, void 0, function* () {
                    yield chrome.close();
                }),
                repair: () => __awaiter(this, void 0, void 0, function* () {
                    debug('Starting repair');
                    try {
                        // will probably fail, but just in case the repair was not necessary
                        yield chrome.close();
                    }
                    catch (e) { }
                    // just relaunch as there is only one page per browser
                    browser = yield chromeLauncher.launch(this.options);
                    // tslint:disable-next-line: max-line-length
                    resp = yield util.promisify(request)(`http://localhost:${browser.port}/json/version`);
                    webSocketDebuggerUrl = JSON.parse(resp.body).webSocketDebuggerUrl;
                    chrome = (yield this.puppeteer.connect({
                        browserWSEndpoint: webSocketDebuggerUrl,
                    }));
                }),
            };
        });
    }
}
exports.default = Browser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb25jdXJyZW5jeS9idWlsdC1pbi9Ccm93c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRUEsa0RBQWtEO0FBQ2xELDZCQUE2QjtBQUM3QixhQUFhO0FBQ2IsbUNBQW1DO0FBRW5DLHFDQUE0RDtBQUM1RCw0RUFBeUY7QUFDekYsTUFBTSxLQUFLLEdBQUcscUJBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBRW5ELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQztBQUU3QixNQUFxQixPQUFRLFNBQVEsbUNBQXlCO0lBQzdDLElBQUk7OERBQUksQ0FBQztLQUFBO0lBQ1QsS0FBSzs4REFBSSxDQUFDO0tBQUE7SUFFVixjQUFjOztZQUN2QixJQUFJLE9BQU8sR0FBUSxNQUFNLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdELElBQUksSUFBSSxHQUFRLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxvQkFBb0IsT0FBTyxDQUFDLElBQUksZUFBZSxDQUFDLENBQUM7WUFDL0YsSUFBSSxFQUFFLG9CQUFvQixFQUFFLEdBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUQsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztnQkFDdEMsaUJBQWlCLEVBQUUsb0JBQW9CO2FBQzFDLENBQXNCLENBQUM7WUFFeEIsSUFBSSxJQUFvQixDQUFDO1lBQ3pCLElBQUksT0FBWSxDQUFDLENBQUMsK0JBQStCO1lBRWpELE9BQU87Z0JBQ0gsV0FBVyxFQUFFLEdBQVMsRUFBRTtvQkFDcEIsTUFBTSxxQkFBYyxDQUFDLGVBQWUsRUFBRSxDQUFDLEdBQVMsRUFBRTt3QkFDOUMsT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLDZCQUE2QixFQUFFLENBQUM7d0JBQ3ZELElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbkMsQ0FBQyxDQUFBLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBRU4sT0FBTzt3QkFDSCxTQUFTLEVBQUU7NEJBQ1AsSUFBSTt5QkFDUDt3QkFFRCxLQUFLLEVBQUUsR0FBUyxFQUFFOzRCQUNkLE1BQU0scUJBQWMsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7d0JBQzNELENBQUMsQ0FBQTtxQkFDSixDQUFDO2dCQUNOLENBQUMsQ0FBQTtnQkFFRCxLQUFLLEVBQUUsR0FBUyxFQUFFO29CQUNkLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN6QixDQUFDLENBQUE7Z0JBRUQsTUFBTSxFQUFFLEdBQVMsRUFBRTtvQkFDZixLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFDekIsSUFBSTt3QkFDQSxvRUFBb0U7d0JBQ3BFLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO3FCQUN4QjtvQkFBQyxPQUFPLENBQUMsRUFBRSxHQUFFO29CQUVkLHNEQUFzRDtvQkFDdEQsT0FBTyxHQUFHLE1BQU0sY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3BELDRDQUE0QztvQkFDNUMsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxvQkFBb0IsT0FBTyxDQUFDLElBQUksZUFBZSxDQUFDLENBQUM7b0JBQ3RGLG9CQUFvQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDO29CQUNsRSxNQUFNLElBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQzt3QkFDbEMsaUJBQWlCLEVBQUUsb0JBQW9CO3FCQUMxQyxDQUFzQixDQUFBLENBQUM7Z0JBQzVCLENBQUMsQ0FBQTthQUNKLENBQUM7UUFDTixDQUFDO0tBQUE7Q0FFSjtBQXhERCwwQkF3REMifQ==