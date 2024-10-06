import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const checkfile = (filePath: string) => {};

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const filePath = '/home/quent/movies';

  await page.goto(
    'https://video-seed.xyz/?url=R1h3bTQrSVRERFV4eVVjQWNIRFJIMDlqUThHVFoxSi9vSW54Qmppajc2SzQ5T2cveDNyZE1tSjNKODdIYTB0RUpiUk44TlFYbXNtS1lHQWRjWXR4b0NxNDZmRlNhUVB5eW45Y2Vld0RJY3pPVDE3bFdDL2ptcFhYTkF6TVZHckc3YU56djB0aVRCbmJZNGJ0MzFGTFRKd21meU50WHhFTkVlcjlEd1pZNXRVWmZWalg0ZU04dlhpQ3BnelgzS0dl'
  );

  const session = await browser.target().createCDPSession();
  await session.send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: filePath,
    eventsEnabled: true,
  });

  await page.click('#ins');
  await page.click('#ins');
  await page.click('#ins');
};

main();
