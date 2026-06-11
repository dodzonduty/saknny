import puppeteer from 'puppeteer';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // 1. Landing page
  console.log('Capturing landing page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: 'docs/images/screenshot_landing.png', fullPage: false });
  console.log('Landing page captured.');

  // Scroll down to features section
  console.log('Capturing landing page scrolled...');
  await page.evaluate(() => window.scrollTo(0, 800));
  await delay(1500);
  await page.screenshot({ path: 'docs/images/screenshot_landing_features.png', fullPage: false });
  console.log('Landing features captured.');

  // 2. Auth page
  console.log('Capturing auth page...');
  await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  await page.screenshot({ path: 'docs/images/screenshot_auth.png', fullPage: false });
  console.log('Auth page captured.');

  // 3. Dashboard page (will redirect to auth if not logged in, so let's still capture)
  console.log('Capturing dashboard page...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);
  await page.screenshot({ path: 'docs/images/screenshot_dashboard.png', fullPage: false });
  console.log('Dashboard page captured.');

  // 4. Messages page
  console.log('Capturing messages page...');
  await page.goto('http://localhost:3000/dashboard/messages', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);
  await page.screenshot({ path: 'docs/images/screenshot_messages.png', fullPage: false });
  console.log('Messages page captured.');

  await browser.close();
  console.log('All screenshots saved to docs/images/');
}

main().catch(console.error);
