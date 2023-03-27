export interface DynamicObject {
    [key: string]: any;
}

export const parseGrpcData = async (
    requestObject: {
        url: string;
        method: 'POST' | 'GET' | 'post' | 'get';
        headers: DynamicObject;
        body?: DynamicObject;
    },
    dataObject: {
        limiter?: number; //limit/page size before data is being returned
        concatData?: boolean; //returns all data from start until the limit
        objectPrefix?: string; // string for returning the object on a specific object path
        showDebug?: boolean; // show debug logs output
    },
    onChunkReceive?: (data: any) => void,
    onFinish?: (data: any) => void,
    onError?: (e: any) => void
) => {
    try {
        console.time('parseGrpcData');
        const { url, method, headers } = requestObject;
        const { limiter = 1, concatData = false, showDebug = false } = dataObject || {};
        let objectPrefix = dataObject.objectPrefix || 'result';
        const allData: DynamicObject[] = [];
        const limiterData: DynamicObject[] = [];
        const hasLimiter = limiter && limiter > 0;

        const fetchProps: DynamicObject = {
            method,
            headers,
            body: requestObject.body ? JSON.stringify(requestObject.body) : undefined,
        };

        const res: any = await fetch(url, fetchProps).catch((e: any) => {
            onError?.(e);
        });

        let count = 0;
        let failedCount = 0;
        const reader = res?.body ? res.body.getReader() : undefined;
        const decoder = new TextDecoder('utf8');

        if (showDebug) {
            console.log("objectPrefix: ", objectPrefix);
        }

        let result = '';
        const startObject = `{"${objectPrefix}":`;
        // streaming data will like: 
        // 1 - {"result":{...
        // 2 - ...}}\n
        // 3 - {"result":{...}}
        const endObjRegex = /}}\n+/g; 

        while (true && reader) {
            const parsedChunkData: DynamicObject[] = [];
            const { value, done } = await reader.read();
          
            if (done) break;
            const chunk: string = decoder.decode(value);
            result += chunk;

            const startIndex = result.indexOf(startObject);
            const endIndex = result.search(endObjRegex);

            if (startIndex !== -1 && endIndex !== -1) {
                const jsonStr = result.substring(startIndex, endIndex + 2);
                const restOfStr = result.substring(endIndex + 2);
                try {
                    const parsedChunk = JSON.parse(jsonStr);

                    const pushedData = objectPrefix
                        ? parsedChunk ? parsedChunk[objectPrefix] : undefined
                        : parsedChunk;

                    allData.push(pushedData);
                    parsedChunkData.push(pushedData);
                    if (hasLimiter) {
                        limiterData.push(pushedData);
                        if (limiterData.length === limiter) {
                            const newLimiterData = [...limiterData];
                            limiterData.splice(0, limiter);
                            const returnedData = concatData
                                ? allData
                                : newLimiterData;
                            onChunkReceive(returnedData);
                        }
                    }
                } catch (_err) {
                    // onError(_err);
                    console.log('Failed to parse json chunk');
                    failedCount++;
                } finally {
                    result = restOfStr;
                    count++;
                }
            } else {
                // try to parse the result, this case handle one 1 result returned
                try {
                    const parsedChunk = JSON.parse(result);

                    const pushedData = objectPrefix
                        ? parsedChunk ? parsedChunk[objectPrefix] : undefined
                        : parsedChunk;
                    allData.push(pushedData);
                    parsedChunkData.push(pushedData);
                    if (hasLimiter) {
                        limiterData.push(pushedData);
                        if (limiterData.length === limiter) {
                            const newLimiterData = [...limiterData];
                            limiterData.splice(0, limiter);
                            const returnedData = concatData
                                ? allData
                                : newLimiterData;
                            onChunkReceive(returnedData);
                        }
                    }
                    count++;
                } catch (_err) { // keep error in here cause object not completed
                    // onError(_err);
                    // console.log('Failed to parse json chunk');
                    // failedCount++;
                }
            }
        }

        if (hasLimiter && limiterData.length > 0) {
            const returnedData = concatData ? allData : limiterData;
            onChunkReceive(returnedData);
        }

        if (allData.length === 0) {
            onChunkReceive([]);
        }

        if (onFinish) {
            if (showDebug) {
                console.log("count: ", count);
                console.log("failed count: ", failedCount);
            }
            console.timeEnd('parseGrpcData');
            onFinish(allData);
        }
    } catch (error) {
        if (onError) onError(error);
    }
};