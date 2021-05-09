import {strict as assert} from "assert";

import {Method, App} from "../src/index";

import {makeFetchEvent, makeTaggedResponseMiddleware} from "./_helpers";

const ERROR_HANDLER =
    (_ev: FetchEvent, _exc: any) => new Response(null, {
        status: 500,
        headers: new Headers({"x-handler": "error-handled"}),
    });

const ROUTES = [
    {
        paths: [/^\/throw\/?$/],
        methods: ["GET" as Method],
        handler: () => {throw new Error("ahhhh")},
    },
    {
        paths: [/^\/$/],
        methods: ["GET" as Method],
        handler: () => new Response(null),
    }
];

const APP_WITH_HANDLER = new App({
    routes: ROUTES,
    error_handler: ERROR_HANDLER,
});

const APP_WITHOUT_HANDLER = new App({
    routes: ROUTES,
});

const APP_WITH_RESPONSE_MIDDLEWARE = new App({
    routes: ROUTES,
    error_handler: ERROR_HANDLER,
    response_middleware: [
        makeTaggedResponseMiddleware("mid-1"),
        makeTaggedResponseMiddleware("mid-2"),
    ],
});

test("should call the error handler if defined", async () => {
    const ev = makeFetchEvent("GET", "https://example.com/throw/");
    const response = await APP_WITH_HANDLER.handle(ev);
    assert.equal(response.headers.get("x-handler"), "error-handled");
});

test("should call the error handler if defined", async () => {
    const ev = makeFetchEvent("GET", "https://example.com/throw/");
    assert.rejects(async () => await APP_WITHOUT_HANDLER.handle(ev), {
        name: "Error",
        message: "ahhhh",
    });
});

test("should call response middlewares if they're present", async () => {
    const ev = makeFetchEvent("GET", "https://example.com/");
    const response = await APP_WITH_RESPONSE_MIDDLEWARE.handle(ev);
    assert.equal(response.headers.get("x-resp-middle"), "mid-1,mid-2");
});

test("should call response middlewares for implicit handlers", async () => {
    const ev = makeFetchEvent("OPTIONS", "https://example.com/");
    const response = await APP_WITH_RESPONSE_MIDDLEWARE.handle(ev);
    assert.equal(response.headers.get("x-resp-middle"), "mid-1,mid-2");
});

test("should call response middlewares for error handler responses", async () => {
    const ev = makeFetchEvent("GET", "https://example.com/throw/");
    const response = await APP_WITH_RESPONSE_MIDDLEWARE.handle(ev);
    assert.equal(response.headers.get("x-handler"), "error-handled");
    assert.equal(response.headers.get("x-resp-middle"), "mid-1,mid-2");
});
