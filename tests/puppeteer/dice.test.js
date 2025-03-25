import puppeteer from "puppeteer";
import log from "loglevel";
import prefix from "loglevel-plugin-prefix";

const FOUNDRY_URL = "http://localhost:30000"; // Adjust for your local FoundryVTT

describe("FoundryVTT Dice Rolling", () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: true });
        page = await browser.newPage();
        await page.goto(FOUNDRY_URL, { waitUntil: "networkidle2" });
    });

    afterAll(async () => {
        await browser.close();
    });

    test("Roll class exists in FoundryVTT", async () => {
        const rollExists = await page.evaluate(() => {
            return typeof Roll !== "undefined";
        });

        expect(rollExists).toBe(true);
    });

    test("Rolling a 1d20+5 gives a number between 6 and 25", async () => {
        const result = await page.evaluate(() => {
            if (typeof Roll === "undefined") {
                throw new Error(
                    "Roll class is not available in the browser context",
                );
            }
            const roll = new Roll("1d20+5");
            roll.evaluate();
            return roll.total;
        });

        expect(result).toBeGreaterThanOrEqual(6);
        expect(result).toBeLessThanOrEqual(25);
    });

    test("Check FoundryVTT globals", async () => {
        const foundryGlobals = await page.evaluate(() => {
            return {
                game: typeof game !== "undefined",
                CONFIG: typeof CONFIG !== "undefined",
                Roll: typeof Roll !== "undefined",
            };
        });

        log.info("🔍 FoundryVTT Globals in Browser:", foundryGlobals);
        expect(foundryGlobals.Roll).toBe(true);
    });
});
