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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGrpcData = void 0;
exports.parseGrpcData = function (requestObject, dataObject, onChunkReceive, onFinish, onError) { return __awaiter(void 0, void 0, void 0, function () {
    var url, method, headers, _a, _b, limiter, _c, concatData, _d, showDebug_1, objectPrefix_1, allData, limiterData, hasLimiter_1, res, handleLimiterData, count, failedCount, reader, decoder, result, endObjRegex, parsedChunkData, _e, value, done, chunk, list, _i, list_1, item, returnedData, returnedData, error_1;
    var _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _g.trys.push([0, 5, , 6]);
                console.time('parseGrpcData');
                url = requestObject.url, method = requestObject.method, headers = requestObject.headers;
                _a = dataObject !== null && dataObject !== void 0 ? dataObject : {}, _b = _a.limiter, limiter = _b === void 0 ? 1 : _b, _c = _a.concatData, concatData = _c === void 0 ? false : _c, _d = _a.showDebug, showDebug_1 = _d === void 0 ? false : _d;
                objectPrefix_1 = (_f = dataObject === null || dataObject === void 0 ? void 0 : dataObject.objectPrefix) !== null && _f !== void 0 ? _f : 'result';
                allData = [];
                limiterData = [];
                hasLimiter_1 = limiter && limiter > 0;
                return [4 /*yield*/, fetch(url, {
                        method: method.toUpperCase(),
                        headers: headers,
                        body: requestObject.body && JSON.stringify(requestObject.body),
                    }).catch(function (e) {
                        if (showDebug_1) {
                            console.error("Error in fetch: ", e);
                        }
                        return onError === null || onError === void 0 ? void 0 : onError(e);
                    })];
            case 1:
                res = _g.sent();
                if (res.status != 200) {
                    return [2 /*return*/, onError === null || onError === void 0 ? void 0 : onError({
                            status: res.status,
                            message: res.statusText,
                        })];
                }
                handleLimiterData = function (item, parsedChunkData, allData, limiterData, limiter, concatData) {
                    var parsedChunk = JSON.parse(item);
                    var pushedData = objectPrefix_1 ? parsedChunk[objectPrefix_1] : parsedChunk;
                    allData.push(pushedData);
                    parsedChunkData.push(pushedData);
                    if (hasLimiter_1) {
                        limiterData.push(pushedData);
                        if (limiterData.length === limiter) {
                            var newLimiterData = __spreadArrays(limiterData);
                            limiterData.splice(0, limiter);
                            var returnedData = concatData
                                ? allData
                                : newLimiterData;
                            if (showDebug_1) {
                                console.log("newLimiterData length: ", newLimiterData.length);
                                console.log("limiterData length: ", limiterData.length);
                                console.log("allData length: ", allData.length);
                                console.log("returnedData length: ", returnedData.length);
                            }
                            onChunkReceive === null || onChunkReceive === void 0 ? void 0 : onChunkReceive(returnedData);
                        }
                    }
                };
                count = 0;
                failedCount = 0;
                reader = (res === null || res === void 0 ? void 0 : res.body) ? res.body.getReader() : undefined;
                decoder = new TextDecoder('utf8');
                if (showDebug_1) {
                    console.log("=== objectPrefix: ", objectPrefix_1);
                    console.log("=== limiter: ", limiter);
                    console.log("=== concatData: ", concatData);
                }
                result = '';
                endObjRegex = /\r?\n+/;
                _g.label = 2;
            case 2:
                if (!(true && reader)) return [3 /*break*/, 4];
                parsedChunkData = [];
                return [4 /*yield*/, reader.read()];
            case 3:
                _e = _g.sent(), value = _e.value, done = _e.done;
                if (done)
                    return [3 /*break*/, 4];
                chunk = decoder.decode(value);
                result += chunk;
                list = result.split(endObjRegex);
                if (list.length > 1) {
                    // create for loop for list
                    for (_i = 0, list_1 = list; _i < list_1.length; _i++) {
                        item = list_1[_i];
                        try {
                            handleLimiterData(item, parsedChunkData, allData, limiterData, limiter, concatData);
                            result = '';
                            count++;
                        }
                        catch (_err) {
                            // Failed to parse => add list to result
                            result += item;
                        }
                    }
                }
                else {
                    // uncompleted list
                    result = list[0];
                    // try to parse this result incase of there is only 1 result at the end of stream
                    try {
                        handleLimiterData(list[0], parsedChunkData, allData, limiterData, limiter, concatData);
                        result = '';
                        count++;
                    }
                    catch (_err) {
                        // Nothing to do, this maybe the end of stream data
                    }
                }
                if (!hasLimiter_1) {
                    returnedData = concatData ? allData : parsedChunkData;
                    onChunkReceive === null || onChunkReceive === void 0 ? void 0 : onChunkReceive(returnedData);
                }
                return [3 /*break*/, 2];
            case 4:
                // return all limiterData if still have some pending
                if (limiterData.length > 0) {
                    returnedData = concatData ? allData : limiterData;
                    onChunkReceive === null || onChunkReceive === void 0 ? void 0 : onChunkReceive(returnedData);
                    if (showDebug_1) {
                        console.log("=== end limiterData length: ", limiterData.length);
                        console.log("=== end returnedData length: ", returnedData.length);
                    }
                }
                if (allData.length === 0) {
                    onChunkReceive === null || onChunkReceive === void 0 ? void 0 : onChunkReceive([]);
                }
                if (onFinish) {
                    if (showDebug_1) {
                        console.log("count: ", count);
                        console.log("failed count: ", failedCount);
                    }
                    console.timeEnd('parseGrpcData');
                    onFinish(allData);
                }
                return [3 /*break*/, 6];
            case 5:
                error_1 = _g.sent();
                if (onError)
                    onError(error_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=index.js.map