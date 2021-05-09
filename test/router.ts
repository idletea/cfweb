import {strict as assert} from "assert";

import {Router} from "../src/router";

import {makeTaggedHandler, makeGroupAssertHandler, makeFetchEvent} from "./_helpers";

const ROUTER = new Router([
    {
        paths: [/^\/doubled\/$/],
        methods: ["PUT"],
        handler: makeTaggedHandler("/doubled1"),
    },
    {
        paths: [/^\/doubled\/$/],
        methods: ["PUT"],
        handler: makeTaggedHandler("/doubled2"),
    },
    {
        paths: [/^\/options\/$/],
        methods: ["OPTIONS"],
        handler: makeTaggedHandler("/options/"),
    },
    {
        paths: [/^\/user\/(?<user>\w+)\/overview$/],
        methods: ["GET"],
        handler: makeGroupAssertHandler("/user/<user>/overview", [{
            name: "user", value: "bob",
        }]),
    },
    {
        paths: [/^\/user\/(?<user>\w+)\/security$/],
        methods: ["GET"],
        handler: makeGroupAssertHandler("/user/<user>/security", [{
            name: "user", value: "alice",
        }]),
    },
    {
        paths: [/^\/(?<first>\w+)\/(?<second>\w+)\/?$/],
        methods: ["GET"],
        handler: makeGroupAssertHandler("/<first>/<second>", [
            {name: "first", value: "one"},
            {name: "second", value: "two"},
        ]),
    },
    {
        paths: [/^\/head\/$/],
        methods: ["HEAD", "PATCH"],
        handler: makeTaggedHandler("/head/"),
    },
    {
        paths: [/^\/three\/?$/],
        methods: ["POST", "PUT", "OPTIONS"],
        handler: makeTaggedHandler("/three"),
    },
    {
        paths: [/^\/two$/, /^\/two\/$/],
        methods: ["GET"],
        handler: makeTaggedHandler("/two"),
    },
    {
        paths: [/^\/one\/?$/],
        methods: ["GET"],
        handler: makeTaggedHandler("/one"),
    },
    {
        paths: [/^\/$/],
        methods: ["GET"],
        handler: makeTaggedHandler("/"),
    },
]);


for (const spec of [
    {method: "GET", path: "/", tag: "/"},
    {method: "GET", path: "/?x=10", tag: "/"},
    {method: "GET", path: "/#anchor", tag: "/"},
    {method: "GET", path: "/one", tag: "/one"},
    {method: "GET", path: "/one/", tag: "/one"},
    {method: "GET", path: "/two", tag: "/two"},
    {method: "GET", path: "/two/", tag: "/two"},
    {method: "PUT", path: "/three/", tag: "/three"},
    {method: "POST", path: "/three/", tag: "/three"},
    {method: "OPTIONS", path: "/three/", tag: "/three"},
]) {
    test(`should find match to ${spec.method} ${spec.path}`, async () => {
        const ev = makeFetchEvent(spec.method, `https://example.com${spec.path}`);
        const handler = await ROUTER.getHandler(ev);
        const response = await handler();
        assert.equal(response.headers.get("x-tag"), spec.tag);
    })
};

for (const spec of [
    {path: "/user/bob/overview", tag: "/user/<user>/overview"},
    {path: "/user/alice/security", tag: "/user/<user>/security"},
    {path: "/one/two", tag: "/<first>/<second>"},
]) {
    test(`should get regex match for path ${spec.path}`, async () => {
        const ev = makeFetchEvent("GET", spec.path);
        const handler = await ROUTER.getHandler(ev);
        const response = await handler();
        assert.equal(response.headers.get("x-tag"), spec.tag);
    });
};

for (const spec of [
    {method: "GET", path: "/a/b/c/d"},
]) {
    test(`should not find match to ${spec.method} ${spec.path}`, async () => {
        const ev = makeFetchEvent(spec.method, `https://example.com${spec.path}`);
        const handler = await ROUTER.getHandler(ev);
        assert.equal(handler, null);
    })
};

test("should get 405 error handler for uncovered method", async () => {
    const ev = makeFetchEvent("DELETE", "https://example.com/");
    const response = await (await ROUTER.getHandler(ev))();
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
});


test("should get implicit options handler for routes", async () => {
    const ev = makeFetchEvent("OPTIONS", "http://example.com/");
    const response = await (await ROUTER.getHandler(ev))();
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("should get explicit options handler for routes", async () => {
    const ev = makeFetchEvent("OPTIONS", "http://example.com/options/");
    const response = await (await ROUTER.getHandler(ev))();
    assert.equal(response.headers.get("x-tag"), "/options/");
});

test("should not see HEAD twice in allow for explict HEAD handler", async () => {
    const ev = makeFetchEvent("OPTIONS", "http://example.com/head/");
    const response = await (await ROUTER.getHandler(ev))();
    assert.equal(response.headers.get("allow"), "HEAD, PATCH");
});

test("should route the first match in the routing table", async () => {
    const ev = makeFetchEvent("PUT", "http://example.com/doubled/");
    const response = await (await ROUTER.getHandler(ev))();
    assert.equal(response.headers.get("x-tag"), "/doubled1");
});
