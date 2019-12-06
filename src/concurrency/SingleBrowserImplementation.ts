
import * as puppeteer from 'puppeteer';
import * as chromeLauncher from 'chrome-launcher';
import * as util from 'util';
// @ts-ignore
import * as request from 'request';
import ConcurrencyImplementation, { ResourceData } from './ConcurrencyImplementation';

import { debugGenerator, timeoutExecute } from '../util';
const debug = debugGenerator('SingleBrowserImpl');

const BROWSER_TIMEOUT = 5000;

export default abstract class SingleBrowserImplementation extends ConcurrencyImplementation {

    protected browser: puppeteer.Browser | null = null;

    private repairing: boolean = false;
    private repairRequested: boolean = false;
    private openInstances: number = 0;
    private waitingForRepairResolvers: (() => void)[] = [];

    public constructor(options: puppeteer.LaunchOptions, puppeteer: any) {
        super(options, puppeteer);
    }

    private async repair() {
        if (this.openInstances !== 0 || this.repairing) {
            // already repairing or there are still pages open? wait for start/finish
            await new Promise(resolve => this.waitingForRepairResolvers.push(resolve));
            return;
        }

        this.repairing = true;
        debug('Starting repair');

        try {
            // will probably fail, but just in case the repair was not necessary
            await (<puppeteer.Browser>this.browser).close();
        } catch (e) {
            debug('Unable to close browser.');
        }

        try {
            const browser: any = await chromeLauncher.launch(this.options);
            const resp: any = await util.promisify(request)(`http://localhost:${browser.port}/json/version`);
            const { webSocketDebuggerUrl }: any = JSON.parse(resp.body);
            const chrome = await this.puppeteer.connect({
                browserWSEndpoint: webSocketDebuggerUrl,
            }) as puppeteer.Browser;
            this.browser = chrome;
        } catch (err) {
            throw new Error('Unable to restart chrome.');
        }
        this.repairRequested = false;
        this.repairing = false;
        this.waitingForRepairResolvers.forEach(resolve => resolve());
        this.waitingForRepairResolvers = [];
    }

    public async init() {
        const browser: any = await chromeLauncher.launch(this.options);
        const resp: any = await util.promisify(request)(`http://localhost:${browser.port}/json/version`);
        const { webSocketDebuggerUrl }: any = JSON.parse(resp.body);
        const chrome = await this.puppeteer.connect({
            browserWSEndpoint: webSocketDebuggerUrl,
        }) as puppeteer.Browser;
        this.browser = chrome;
    }

    public async close() {
        await (this.browser as puppeteer.Browser).close();
    }

    protected abstract async createResources(): Promise<ResourceData>;

    protected abstract async freeResources(resources: ResourceData): Promise<void>;

    public async workerInstance() {
        let resources: ResourceData;

        return {
            jobInstance: async () => {
                if (this.repairRequested) {
                    await this.repair();
                }

                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    resources = await this.createResources();
                })());
                this.openInstances += 1;

                return {
                    resources,

                    close: async () => {
                        this.openInstances -= 1; // decrement first in case of error
                        await timeoutExecute(BROWSER_TIMEOUT, this.freeResources(resources));

                        if (this.repairRequested) {
                            await this.repair();
                        }
                    },
                };
            },

            close: async () => {},

            repair: async () => {
                debug('Repair requested');
                this.repairRequested = true;
                await this.repair();
            },
        };
    }
}
