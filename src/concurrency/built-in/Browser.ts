
import * as puppeteer from 'puppeteer';
import * as chromeLauncher from 'chrome-launcher';
import * as util from 'util';
import * as request from 'request';

import { debugGenerator, timeoutExecute } from '../../util';
import ConcurrencyImplementation, { WorkerInstance } from '../ConcurrencyImplementation';
const debug = debugGenerator('BrowserConcurrency');

const BROWSER_TIMEOUT = 5000;

export default class Browser extends ConcurrencyImplementation {
    public async init() {}
    public async close() {}

    public async workerInstance(): Promise<WorkerInstance> {
        let browser = await chromeLauncher.launch(this.options);
        const resp = await util.promisify(request)(`http://localhost:${browser.port}/json/version`);
        const {webSocketDebuggerUrl} = JSON.parse(resp.body);
        let chrome = await this.puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl}) as puppeteer.Browser;

        let page: puppeteer.Page;
        let context: any; // puppeteer typings are old...

        return {
            jobInstance: async () => {
                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    context = await chrome.createIncognitoBrowserContext();
                    page = await context.newPage();
                })());

                return {
                    resources: {
                        page,
                    },

                    close: async () => {
                        await timeoutExecute(BROWSER_TIMEOUT, context.close());
                    },
                };
            },

            close: async () => {
                await chrome.close();
            },

            repair: async () => {
                debug('Starting repair');
                try {
                    // will probably fail, but just in case the repair was not necessary
                    await chrome.close();
                } catch (e) {}

                // just relaunch as there is only one page per browser
                chrome = await this.puppeteer.launch(this.options);
            },
        };
    }

}
