import {strict as assert} from "assert";

import {Router} from "../src/router";

const makeFetchEvent =
    (method: string, url: string) => new FetchEvent("fetch", {
        request: new Request(url, {
            method: method,
        }),
    });
const makeTaggedHandler =
    (tag: string) =>
        (_ev: FetchEvent, _match: RegExpExecArray) => new Response(null, {
            headers: new Headers({"x-tag": tag}),
        });

const ROUTER = new Router([
    {
        paths: [/\/three\/?/],
        methods: ["POST", "PUT", "OPTIONS"],
        handler: makeTaggedHandler("/three"),
    },
    {
        paths: [/\/two/, /\/two\//],
        methods: ["GET"],
        handler: makeTaggedHandler("/two"),
    },
    {
        paths: [/\/one\/?/],
        methods: ["GET"],
        handler: makeTaggedHandler("/one"),
    },
    {
        paths: [/\//],
        methods: ["GET"],
        handler: makeTaggedHandler("/"),
    },
]);


for (const spec of [
    {method: "GET", url: "https://example.com/", tag: "/"},
    {method: "GET", url: "https://example.com/?x=10", tag: "/"},
    {method: "GET", url: "https://example.com/#anchor", tag: "/"},
    {method: "GET", url: "https://example.com/one", tag: "/one"},
    {method: "GET", url: "https://example.com/one/", tag: "/one"},
    {method: "GET", url: "https://example.com/two", tag: "/two"},
    {method: "GET", url: "https://example.com/two/", tag: "/two"},
    {method: "PUT", url: "https://example.com/three/", tag: "/three"},
    {method: "POST", url: "https://example.com/three/", tag: "/three"},
    {method: "OPTIONS", url: "https://example.com/three/", tag: "/three"},
]) {
    test(`should find match to ${spec.method} ${spec.url}`, async () => {
        const ev = makeFetchEvent(spec.method, spec.url);
        const handler = await ROUTER.getHandler(ev);
        const response = await handler();
        assert.equal(response.headers.get("x-tag"), spec.tag);
    })
};

test("should get implicit options handler for routes", async () => {
    const ev = makeFetchEvent("OPTIONS", "http://example.com/");
    const handler = await ROUTER.getHandler(ev);
    assert.notEqual(handler, null);
});
