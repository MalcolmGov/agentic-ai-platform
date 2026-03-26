const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/contract.html', { waitUntil: 'networkidle0', timeout: 15000 });
  
  // Wait for fonts and images to fully load
  await new Promise(r => setTimeout(r, 2000));
  
  await page.pdf({
    path: 'C:\\Users\\616078\\Downloads\\Swifter_Pay_Commission_Agreement_Gustav_Vermaas.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });
  
  console.log('PDF generated successfully!');
  await browser.close();
})();
