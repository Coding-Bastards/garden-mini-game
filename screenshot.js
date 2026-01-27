const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/tmp/nextjs-screenshot.png' });
  await browser.close();
  console.log('Screenshot saved to /tmp/nextjs-screenshot.png');
})();
