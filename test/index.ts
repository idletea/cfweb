import {strict as assert} from "assert";

import {RouteHandler, Method, App} from "../src/index";

import {makeFetchEvent} from "./_helpers";

const ERROR_HANDLER =
    (_ev: FetchEvent, _exc: any) => new Response(null, {
        status: 500,
        headers: new Headers({"x-tag": "error-handled"}),
    });

const ROUTES = [
    {
        paths: [/^\/throw\/?$/],
        methods: ["GET" as Method],
        handler: () => {throw new Error("ahhhh")},
    }
];

const APP_WITH_HANDLER = new App({
    routes: ROUTES,
    error_handler: ERROR_HANDLER,
});

const APP_WITHOUT_HANDLER = new App({
    routes: ROUTES,
});

test("should call the error handler if defined", async () => {
    const ev = makeFetchEvent("GET", "https://example.com/throw/");
    const response = await APP_WITH_HANDLER.handle(ev);
    assert.equal(response.headers.get("x-tag"), "error-handled");
});

test("should call the error handler if defined", async () => {
    const ev = makeFetchEvent("GET", "https://example.com/throw/");
    assert.rejects(async () => await APP_WITHOUT_HANDLER.handle(ev), {
        name: "Error",
        message: "ahhhh",
    });
});
