import { chromium } from 'playwright';

(async ()=>{
  console.log('Launching browser (chrome channel) to collect console logs...')
  const browser = await chromium.launch({ channel: 'chrome', headless: false })
  const page = await browser.newPage()
  page.on('console', msg => console.log('PAGE_CONSOLE', msg.type(), msg.text()))
  page.on('pageerror', err => console.log('PAGE_ERROR', err && err.stack ? err.stack : err))
  try{
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 60000 })
    console.log('Page loaded — waiting 4s to collect runtime console logs...')
    await new Promise(r => setTimeout(r, 4000))
  }catch(err){
    console.error('Navigation failed:', err && err.message ? err.message : err)
  }
  await browser.close()
  console.log('Done.')
})()
