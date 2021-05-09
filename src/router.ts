export type RouteHandler =
    (ev: FetchEvent, match: RegExpMatchArray) => Promise<Response> | Response;

type BoundRouteHandler = () => Promise<Response> | Response;

export type Route = {
    paths: RegExp[],
    methods: Method[],
    handler: RouteHandler,
}

export type Method =
    "GET" | "POST" | "HEAD" | "OPTIONS" | "PUT" |
    "DELETE" | "CONNECT" | "TRACE" | "PATCH";

// Create a bound handler to indicate which methods are allowed for
// either 204 responses to an OPTIONS request, or a 405 response.
function allowedMethodsHandler(status: 204 | 405, methods: Method[]): BoundRouteHandler {
    const allowed = Array.from(new Set(methods.concat("HEAD"))).join(", ");
    return () => new Response(null, {
        status: status,
        headers: new Headers({"allow": allowed}),
    });
}

// Create a bound handler to wrap a handler which covers GET requests to
// convert the response to one suitable for a HEAD request.
async function getToHead(handler: BoundRouteHandler): Promise<BoundRouteHandler> {
    const response = await handler();
    return () => new Response(null, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
    });
}

export class Router {
    private routes: Route[]

    constructor(routes: Route[]) {
        this.routes = routes;
    }

    // Get the matching handler bound with the request context.
    getHandler(ev: FetchEvent): BoundRouteHandler | Promise<BoundRouteHandler> | null {
        for (const route of this.routes) {
            const handler = this.getBoundedHandler(ev, route);
            if (handler !== null) {
                return handler;
            }
        }
        return null;
    }

    // Get the appropriate handler for the request bound with the request context.
    private getBoundedHandler(ev: FetchEvent, route: Route): BoundRouteHandler | Promise<BoundRouteHandler> | null {
        const path = new URL(ev.request.url).pathname;
        for (const regex of route.paths) {
            const match = path.match(regex);
            if (match !== null && this.isCoveredMethod(ev, route)) {
                // full match, route handler can handle this
                return () => route.handler(ev, match);
            } else if (match !== null && ev.request.method == "OPTIONS") {
                // partial match, implicit OPTIONS handling will indicate allowed methods
                return allowedMethodsHandler(204, route.methods);
            } else if (match !== null && ev.request.method == "HEAD" && route.methods.includes("GET")) {
                // partial match, implicit handling of HEAD by stripping down the GET response
                return getToHead(() => route.handler(ev, match));
            } else if (match !== null) {
                // route path matches but route does not support request method
                return allowedMethodsHandler(405, route.methods);
            }
        }
        return null;
    }

    // Determine if the specified method is covered by the route.
    private isCoveredMethod(ev: FetchEvent, route: Route): boolean {
        return route.methods.includes(ev.request.method as Method);
    }
}
