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
        const { limiter = 1, concatData = false, showDebug = false } = dataObject ?? {};
        let objectPrefix = dataObject?.objectPrefix ?? 'result';

        const allData: DynamicObject[] = [];
        const limiterData: DynamicObject[] = [];
        const hasLimiter = limiter && limiter > 0;

        const res: any = await fetch(url, {
            method: method.toUpperCase(),
            headers,
            body: requestObject.body && JSON.stringify(requestObject.body),
        }).catch((e: any) => {
            onError?.(e);
        });

        const handleLimiterData = (item: any, parsedChunkData: DynamicObject[], allData: DynamicObject[], limiterData: DynamicObject[], limiter: number, concatData: boolean): void => {
            const parsedChunk = JSON.parse(item);
            const pushedData = objectPrefix ? parsedChunk[objectPrefix] : parsedChunk;
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
                    if (showDebug) {
                        console.log("newLimiterData length: ", newLimiterData.length);
                        console.log("limiterData length: ", limiterData.length);
                        console.log("allData length: ", allData.length);
                        console.log("returnedData length: ", returnedData.length);
                    }
                    onChunkReceive?.(returnedData);
                }
            }
        };

        let count = 0;
        let failedCount = 0;
        const reader = res?.body ? res.body.getReader() : undefined;
        const decoder = new TextDecoder('utf8');

        if (showDebug) {
            console.log("=== objectPrefix: ", objectPrefix);
            console.log("=== limiter: ", limiter);
            console.log("=== concatData: ", concatData);
        }

        let result = '';
        const endObjRegex = /\r?\n+/;

        while (true && reader) {
            const parsedChunkData: DynamicObject[] = [];
            const { value, done } = await reader.read();

            if (done) break;
            const chunk: string = decoder.decode(value);
            result += chunk;

            const list = result.split(endObjRegex);

            if (list.length > 1) {
                // create for loop for list
                for (const item of list) {
                    try {
                        handleLimiterData(item, parsedChunkData, allData, limiterData, limiter, concatData);
                        result = '';
                        count++;
                    } catch (_err) {
                        // Failed to parse => add list to result
                        result += item
                    }
                }
            } else {
                // uncompleted list
                result = list[0]
                // try to parse this result incase of there is only 1 result at the end of stream
                try {
                    handleLimiterData(list[0], parsedChunkData, allData, limiterData, limiter, concatData);
                    result = '';
                    count++;
                } catch (_err) {
                    // Nothing to do, this maybe the end of stream data
                }
            }

            if (!hasLimiter) {
                const returnedData = concatData ? allData : parsedChunkData;
                onChunkReceive?.(returnedData);
            }
        }

        // return all limiterData if still have some pending
        if (limiterData.length > 0) {
            const returnedData = concatData ? allData : limiterData;
            onChunkReceive?.(returnedData);
            if (showDebug) {
                console.log("=== end limiterData length: ", limiterData.length);
                console.log("=== end returnedData length: ", returnedData.length);
            }
        }

        if (allData.length === 0) {
            onChunkReceive?.([]);
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