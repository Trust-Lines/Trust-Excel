/**
 * Headless Chrome for rendering PDFs (price lists, re-order PFs).
 * On Vercel there is no bundled Chrome: puppeteer-core with the serverless Chromium build.
 * Locally the full puppeteer package (with its own Chrome) is used.
 */
export async function launchBrowser(): Promise<any> {
  /* eslint-disable @typescript-eslint/no-var-requires */
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = require('@sparticuz/chromium');
    const puppeteerCore = require('puppeteer-core');
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const puppeteer = require('puppeteer');
  return puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  /* eslint-enable @typescript-eslint/no-var-requires */
}
