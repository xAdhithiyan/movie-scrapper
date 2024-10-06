import puppeteer, { Page } from 'puppeteer';
import readline from 'readline';

const MAX_RETRIES = 5;
const URL = 'https://moviesmod.day/';
const DOWNLOAD_PATH = './movies';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const takeInput = (qn: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    rl.question(qn, (e) => {
      resolve(e);
    });
  });
};

const searchMovie = async (page: Page, userMovie: string) => {
  await page.type('#s', userMovie);
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  const movies = await page.evaluate(() => {
    const movie = document.querySelectorAll('article');
    return Array.from(movie).map((m) => {
      const movieName: string =
        m?.querySelector('header')?.querySelector('a')?.textContent || '';
      const movieLink: string =
        m?.querySelector('header')?.querySelector('a')?.href || '';
      return { movieName, movieLink };
    });
  });

  movies.map((m, index) => {
    console.log(index, m.movieName?.split(' ').slice(1).join(' '));
  });

  if (movies.length === 0) {
    throw new Error('No movies found\n');
  }
  return movies;
};

interface searchDownloadLinkType {
  downloadLinks: string;
  downloadQuality: string;
}

const searchDownloadLink = async (
  page: Page,
  headingTag: string = 'h4'
): Promise<searchDownloadLinkType[]> => {
  let downloadLink = await page.evaluate((tag) => {
    const downloadHeading = document.querySelectorAll(tag);
    return Array.from(downloadHeading).map((d) => {
      const downloadQuality: string = d?.textContent || '';
      let downloadLinks;
      if (d?.nextElementSibling?.tagName == 'P') {
        downloadLinks = d?.nextElementSibling?.querySelectorAll('a');
        downloadLinks = downloadLinks[downloadLinks.length - 1]?.href;
        return { downloadQuality, downloadLinks };
      } else {
        return { downloadLinks: '', downloadQuality: '' };
      }
    });
  }, headingTag);

  downloadLink = downloadLink.filter(
    (item) => item.downloadLinks !== '' && item.downloadQuality !== ''
  );

  if (downloadLink.length === 0) {
    if (headingTag === 'h4') {
      return await searchDownloadLink(page, 'h3');
    } else {
      return [];
    }
  }

  downloadLink.map((d, index) => {
    console.log(index, d?.downloadQuality);
  });

  return downloadLink;
};

const blockResources = async (page: Page, enableJS = false) => {
  await page.setRequestInterception(true);

  page.removeAllListeners('request');

  page.on('request', (req) => {
    if (
      req.resourceType() == 'document' ||
      (enableJS && req.resourceType() == 'script') ||
      (enableJS && req.resourceType() == 'xhr') ||
      (enableJS && req.resourceType() == 'fetch') ||
      (enableJS && req.resourceType() == 'stylesheet')
    ) {
      req.continue();
    } else {
      req.abort();
    }
  });
};

const checkButton = async (page: Page, buttonName: string) => {
  let instantDownload = await page.evaluate((buttonName) => {
    const download = document.querySelectorAll('a');
    return Array.from(download).map((d) => {
      if (d.textContent?.includes(buttonName)) {
        return d.href;
      } else {
        return '';
      }
    });
  }, buttonName);

  instantDownload = instantDownload.filter((item) => item != '');
  return instantDownload;
};

const downloadMovie = async (page: Page) => {
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_PATH,
  });

  const fastServer = await page.evaluate(() => {
    const link = document.querySelector('.maxbutton-1') as HTMLAnchorElement;
    return link.href;
  });

  await page.goto(fastServer, { waitUntil: 'networkidle0' });
  console.log(' - fast server(google drive) page passed');

  const verificationPage = await page.evaluate(() => {
    const form = document.querySelector('#landing') as HTMLFormElement;
    return form.submit();
  });

  await page.waitForNavigation();

  let extractDomain = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    return Array.from(scripts).map((script) => {
      const regex = /s_343\('([^']*)'/;
      const match = script?.innerHTML.match(regex) || null;
      return match ? match[1] : null;
    });
  });

  extractDomain = extractDomain.filter((item) => item != null);

  await page.goto(`${fastServer.split('?')[0]}?go=${extractDomain[0]}`, {
    waitUntil: 'networkidle0',
  });

  console.log(' - verification page passed');

  let downloadButton = await checkButton(page, 'Instant');
  // this is for resume cloud
  if (downloadButton.length === 0) {
    downloadButton = await checkButton(page, 'Cloud');
    await page.goto(downloadButton[0], { waitUntil: 'networkidle0' });

    console.log(' - button found');

    await page.click('.btn-success');
    await downloadPage(page);
  } else {
    // this is for the instant download
    await blockResources(page, true);
    await page.goto(downloadButton[0], { waitUntil: 'networkidle2' });

    const downloadBtnExists = await page.$('#ins');
    if (downloadBtnExists) {
      const newTabPromise = async (target: any) => {
        const newPage = await target.page();
        if (newPage && target.url() !== page.url()) {
          await newPage.close();
        }
      };
      page.browser().on('targetcreated', newTabPromise);

      for (let i = 0; i < 5; i++) {
        await page.click('#ins');
      }

      page.browser().off('targetCreated', newTabPromise);
      console.log(' - button found');
    } else {
      console.log('Button not found');
    }

    await new Promise<void>((resolve) => {
      page.on('response', async (response) => {
        const header = response.headers();
        if (header.server === 'UploadServer') {
          resolve();
        }
      });
    });

    await downloadPage(page);
  }
};

const downloadPage = async (page: Page) => {
  const downloadPage = 'chrome://downloads';
  await page.goto(downloadPage, { waitUntil: 'networkidle2' });

  const waitForCondition = new Promise<void>((resolve) => {
    const fetchData = async () => {
      const details = await page.evaluate(() => {
        const shadowHost = document.querySelector('downloads-manager');
        if (!shadowHost) return 'shadowHost not found';

        const shadowRoot = shadowHost.shadowRoot;
        if (!shadowRoot) return 'shadowRoot not found';

        const downloadsItem = shadowRoot.querySelector('downloads-item');
        if (!downloadsItem) return 'downloadsItem not found';

        const itemShadowRoot = downloadsItem.shadowRoot;
        if (!itemShadowRoot) return 'itemShadowRoot not found';

        const description = itemShadowRoot.querySelector(
          '.description'
        ) as HTMLElement;

        if (description.hasAttribute('hidden')) {
          return 'hidden';
        }
        return description.textContent;
      });

      if (details === 'hidden') {
        clearInterval(intervalId);
        resolve();
      } else {
        process.stdout.write(`${details?.trim()}   \r`);
      }
    };

    const intervalId = setInterval(fetchData, 1000);
  });

  await waitForCondition;
};

const main = async (retires = 0) => {
  try {
    const userMovie: string = await takeInput('What movie ma: ');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await blockResources(page);
    await page.goto(URL, {
      waitUntil: 'networkidle0',
    });
    const movies = await searchMovie(page, userMovie);

    const userMovieChoice: number = Number(await takeInput('Movie index: '));
    await page.goto(movies[userMovieChoice].movieLink);

    const downloadLinks = await searchDownloadLink(page);
    const userDownloadChoice: number = Number(
      await takeInput('Download index: ')
    );
    await page.goto(downloadLinks[userDownloadChoice].downloadLinks, {
      waitUntil: 'networkidle0',
    });

    await downloadMovie(page);
    console.log(`Done ma. Movie in ${DOWNLOAD_PATH}`);
    await browser.close();
  } catch (err) {
    console.log('Error:', err instanceof Error ? err.message : err);
    console.log('\nRetrying...');

    if (retires < MAX_RETRIES) {
      await main(retires + 1);
    }
  } finally {
    rl.close();
  }
};

main();
