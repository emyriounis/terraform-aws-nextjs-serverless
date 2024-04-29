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
exports.handler = void 0;
const next_server_1 = __importDefault(require("next/dist/server/next-server"));
const serverless_http_1 = __importDefault(require("serverless-http"));
// @ts-ignore
const required_server_files_json_1 = require("./.next/required-server-files.json");
const showDebugLogs = process.env.SHOW_DEBUG_LOGS === 'true';
const overrideHostHeader = process.env.OVERRIDE_HOST_HEADER === 'true';
const useCustomServerSidePropsHandler = (path) => process.env.DEFAULT_SS_PROPS_HANDLER !== 'true' &&
    path.includes('/_next/data/');
const getProps = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    const path = './.next/server/pages/' +
        event.rawPath
            .replace('/_next/data/', '')
            .split('/')
            .slice(1)
            .join('/')
            .replace('.json', '.js');
    showDebugLogs && console.log({ path });
    const { getServerSideProps } = require(path);
    const customResponse = yield getServerSideProps(context);
    showDebugLogs && console.log({ customResponse });
    const response = {};
    response.statusCode = 200;
    response.body = JSON.stringify({ pageProps: customResponse.props });
    showDebugLogs && console.log({ response });
    return response;
});
const nextServer = new next_server_1.default({
    hostname: 'localhost',
    port: 3000,
    dir: './',
    dev: false,
    conf: Object.assign({}, required_server_files_json_1.config),
    customServer: true,
});
const main = (0, serverless_http_1.default)(nextServer.getRequestHandler(), {
    binary: ['*/*'],
    provider: 'aws',
});
const handler = (event, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    showDebugLogs && console.debug({ event }, (_e = (_d = (_c = (_b = JSON.parse((_a = event === null || event === void 0 ? void 0 : event.queryStringParameters) === null || _a === void 0 ? void 0 : _a.cf_event)) === null || _b === void 0 ? void 0 : _b.request) === null || _c === void 0 ? void 0 : _c.headers) === null || _d === void 0 ? void 0 : _d.host) === null || _e === void 0 ? void 0 : _e.value);
    showDebugLogs && console.debug({ context });
    if (overrideHostHeader) {
        const customDomainHost = (_k = (_j = (_h = (_g = JSON.parse((_f = event === null || event === void 0 ? void 0 : event.queryStringParameters) === null || _f === void 0 ? void 0 : _f.cf_event)) === null || _g === void 0 ? void 0 : _g.request) === null || _h === void 0 ? void 0 : _h.headers) === null || _j === void 0 ? void 0 : _j.host) === null || _k === void 0 ? void 0 : _k.value;
        event.headers.host = customDomainHost;
    }
    return useCustomServerSidePropsHandler(event.rawPath)
        ? getProps(event, context)
        : main(event, context);
};
exports.handler = handler;
