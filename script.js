"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const readline_1 = __importDefault(require("readline"));
const MAX_RETRIES = 5;
const URL = 'https://moviesmod.day/';
const DOWNLOAD_PATH = '/home/quent/movies';
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const takeInput = (qn) => {
    return new Promise((resolve, reject) => {
        rl.question(qn, (e) => {
            resolve(e);
        });
    });
};
const searchMovie = (page, userMovie) => __awaiter(void 0, void 0, void 0, function* () {
    yield page.type('#s', userMovie);
    yield page.keyboard.press('Enter');
    yield page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    const movies = yield page.evaluate(() => {
        const movie = document.querySelectorAll('article');
        return Array.from(movie).map((m) => {
            var _a, _b, _c, _d;
            const movieName = ((_b = (_a = m === null || m === void 0 ? void 0 : m.querySelector('header')) === null || _a === void 0 ? void 0 : _a.querySelector('a')) === null || _b === void 0 ? void 0 : _b.textContent) || '';
            const movieLink = ((_d = (_c = m === null || m === void 0 ? void 0 : m.querySelector('header')) === null || _c === void 0 ? void 0 : _c.querySelector('a')) === null || _d === void 0 ? void 0 : _d.href) || '';
            return { movieName, movieLink };
        });
    });
    movies.map((m, index) => {
        var _a;
        console.log(index, (_a = m.movieName) === null || _a === void 0 ? void 0 : _a.split(' ').slice(1).join(' '));
    });
    if (movies.length === 0) {
        throw new Error('No movies found\nedf');
    }
    return movies;
});
const searchDownloadLink = (page_1, ...args_1) => __awaiter(void 0, [page_1, ...args_1], void 0, function* (page, headingTag = 'h4') {
    let downloadLink = yield page.evaluate((tag) => {
        const downloadHeading = document.querySelectorAll(tag);
        return Array.from(downloadHeading).map((d) => {
            var _a, _b, _c;
            const downloadQuality = (d === null || d === void 0 ? void 0 : d.textContent) || '';
            let downloadLinks;
            if (((_a = d === null || d === void 0 ? void 0 : d.nextElementSibling) === null || _a === void 0 ? void 0 : _a.tagName) == 'P') {
                downloadLinks = (_b = d === null || d === void 0 ? void 0 : d.nextElementSibling) === null || _b === void 0 ? void 0 : _b.querySelectorAll('a');
                downloadLinks = (_c = downloadLinks[downloadLinks.length - 1]) === null || _c === void 0 ? void 0 : _c.href;
                return { downloadQuality, downloadLinks };
            }
            else {
                return { downloadLinks: '', downloadQuality: '' };
            }
        });
    }, headingTag);
    downloadLink = downloadLink.filter((item) => item.downloadLinks !== '' && item.downloadQuality !== '');
    if (downloadLink.length === 0) {
        if (headingTag === 'h4') {
            return yield searchDownloadLink(page, 'h3');
        }
        else {
            return [];
        }
    }
    downloadLink.map((d, index) => {
        console.log(index, d === null || d === void 0 ? void 0 : d.downloadQuality);
    });
    return downloadLink;
});
const blockResources = (page_1, ...args_1) => __awaiter(void 0, [page_1, ...args_1], void 0, function* (page, enableJS = false) {
    yield page.setRequestInterception(true);
    page.removeAllListeners('request');
    page.on('request', (req) => {
        if (req.resourceType() == 'document' ||
            (enableJS && req.resourceType() == 'script') ||
            (enableJS && req.resourceType() == 'xhr') ||
            (enableJS && req.resourceType() == 'fetch') ||
            (enableJS && req.resourceType() == 'stylesheet')) {
            req.continue();
        }
        else {
            req.abort();
        }
    });
});
const checkButton = (page, buttonName) => __awaiter(void 0, void 0, void 0, function* () {
    let instantDownload = yield page.evaluate((buttonName) => {
        const download = document.querySelectorAll('a');
        return Array.from(download).map((d) => {
            var _a;
            if ((_a = d.textContent) === null || _a === void 0 ? void 0 : _a.includes(buttonName)) {
                return d.href;
            }
            else {
                return '';
            }
        });
    }, buttonName);
    instantDownload = instantDownload.filter((item) => item != '');
    return instantDownload;
});
const downloadMovie = (page) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield page.target().createCDPSession();
    yield client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_PATH,
    });
    const fastServer = yield page.evaluate(() => {
        const link = document.querySelector('.maxbutton-1');
        return link.href;
    });
    yield page.goto(fastServer, { waitUntil: 'networkidle0' });
    const verificationPage = yield page.evaluate(() => {
        const form = document.querySelector('#landing');
        return form.submit();
    });
    yield page.waitForNavigation();
    let extractDomain = yield page.evaluate(() => {
        const scripts = document.querySelectorAll('script');
        return Array.from(scripts).map((script) => {
            const regex = /s_343\('([^']*)'/;
            const match = (script === null || script === void 0 ? void 0 : script.innerHTML.match(regex)) || null;
            return match ? match[1] : null;
        });
    });
    extractDomain = extractDomain.filter((item) => item != null);
    yield page.goto(`${fastServer.split('?')[0]}?go=${extractDomain[0]}`, {
        waitUntil: 'networkidle0',
    });
    let downloadButton = yield checkButton(page, 'Instant');
    // this is for resume cloud
    if (downloadButton.length === 0) {
        downloadButton = yield checkButton(page, 'Cloud');
        yield page.goto(downloadButton[0], { waitUntil: 'networkidle0' });
        console.log('button found');
        yield page.click('.btn-success');
        yield downloadPage(page);
    }
    else {
        // this is for the instant download
        yield blockResources(page, true);
        yield page.goto(downloadButton[0], { waitUntil: 'networkidle2' });
        const downloadBtnExists = yield page.$('#ins');
        if (downloadBtnExists) {
            const newTabPromise = (target) => __awaiter(void 0, void 0, void 0, function* () {
                const newPage = yield target.page();
                if (newPage && target.url() !== page.url()) {
                    yield newPage.close();
                }
            });
            page.browser().on('targetcreated', newTabPromise);
            for (let i = 0; i < 5; i++) {
                yield page.click('#ins');
            }
            page.browser().off('targetCreated', newTabPromise);
            console.log('button found');
        }
        else {
            console.log('Button not found');
        }
        yield new Promise((resolve) => {
            page.on('response', (response) => __awaiter(void 0, void 0, void 0, function* () {
                const header = response.headers();
                if (header.server === 'UploadServer') {
                    resolve();
                }
            }));
        });
        yield downloadPage(page);
    }
});
const downloadPage = (page) => __awaiter(void 0, void 0, void 0, function* () {
    const downloadPage = 'chrome://downloads';
    yield page.goto(downloadPage, { waitUntil: 'networkidle2' });
    const waitForCondition = new Promise((resolve) => {
        const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
            const details = yield page.evaluate(() => {
                const shadowHost = document.querySelector('downloads-manager');
                if (!shadowHost)
                    return 'shadowHost not found';
                const shadowRoot = shadowHost.shadowRoot;
                if (!shadowRoot)
                    return 'shadowRoot not found';
                const downloadsItem = shadowRoot.querySelector('downloads-item');
                if (!downloadsItem)
                    return 'downloadsItem not found';
                const itemShadowRoot = downloadsItem.shadowRoot;
                if (!itemShadowRoot)
                    return 'itemShadowRoot not found';
                const description = itemShadowRoot.querySelector('.description');
                if (description.hasAttribute('hidden')) {
                    return 'hidden';
                }
                return description.textContent;
            });
            if (details === 'hidden') {
                clearInterval(intervalId);
                resolve();
            }
            else {
                console.log(details);
            }
        });
        const intervalId = setInterval(fetchData, 1000);
    });
    yield waitForCondition;
});
const main = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (retires = 0) {
    try {
        const userMovie = yield takeInput('What movie ma: ');
        const browser = yield puppeteer_1.default.launch();
        const page = yield browser.newPage();
        yield blockResources(page);
        yield page.goto(URL, {
            waitUntil: 'networkidle0',
        });
        const movies = yield searchMovie(page, userMovie);
        const userMovieChoice = Number(yield takeInput('Movie index: '));
        yield page.goto(movies[userMovieChoice].movieLink);
        const downloadLinks = yield searchDownloadLink(page);
        const userDownloadChoice = Number(yield takeInput('Download index: '));
        yield page.goto(downloadLinks[userDownloadChoice].downloadLinks, {
            waitUntil: 'networkidle0',
        });
        yield downloadMovie(page);
        console.log('Done ma');
        yield browser.close();
    }
    catch (err) {
        console.log('Error:', err instanceof Error ? err.message : err);
        if (retires < MAX_RETRIES) {
            yield main(retires + 1);
        }
        console.log('\nRetrying...');
    }
    finally {
        rl.close();
    }
});
main();
