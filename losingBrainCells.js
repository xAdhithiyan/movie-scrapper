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
const checkfile = (filePath) => { };
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch({ headless: false });
    const page = yield browser.newPage();
    const filePath = '/home/quent/movies';
    yield page.goto('https://video-seed.xyz/?url=R1h3bTQrSVRERFV4eVVjQWNIRFJIMDlqUThHVFoxSi9vSW54Qmppajc2SzQ5T2cveDNyZE1tSjNKODdIYTB0RUpiUk44TlFYbXNtS1lHQWRjWXR4b0NxNDZmRlNhUVB5eW45Y2Vld0RJY3pPVDE3bFdDL2ptcFhYTkF6TVZHckc3YU56djB0aVRCbmJZNGJ0MzFGTFRKd21meU50WHhFTkVlcjlEd1pZNXRVWmZWalg0ZU04dlhpQ3BnelgzS0dl');
    const session = yield browser.target().createCDPSession();
    yield session.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: filePath,
        eventsEnabled: true,
    });
    yield page.click('#ins');
    yield page.click('#ins');
    yield page.click('#ins');
});
main();
