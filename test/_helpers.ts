import {strict as assert} from "assert";

// ceate mock fetch event
export const makeFetchEvent =
    (method: string, url: string) => new FetchEvent("fetch", {
        request: new Request(url, {
            method: method,
        }),
    });
// create handler with a tag to identify if it was used to generate a response
export const makeTaggedHandler =
    (tag: string) =>
        (_ev: FetchEvent, _match: RegExpExecArray) => new Response(null, {
            headers: new Headers({"x-handler": tag}),
        });

// create handler which asserts the expected regex matches are present
export const makeGroupAssertHandler =
    (tag: string, expecteds: ({name: string, value: string})[]) =>
        (ev: FetchEvent, match: RegExpExecArray) => {
            for (const expected of expecteds) {
                assert.equal(match.groups[expected.name], expected.value);
            }
            return makeTaggedHandler(tag)(ev, match);
        };

// create response middleware which adds a tag header to responses
export const makeTaggedResponseMiddleware =
    (tag: string) =>
        (_ev: FetchEvent, response: Response) => {
            response.headers.append("x-resp-middle", tag);
            return response;
        };

