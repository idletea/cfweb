import {Router, Route} from "./router";
export * from "./router";

export type AppInit = {
    routes: Route[],
    error_handler?: ErrorHandler,
    response_middleware?: ResponseMiddleware[],
}

/// Handler for uncaught exceptions.
export type ErrorHandler =
    (ev: FetchEvent, exc: any) => Promise<Response> | Response;

/// Middleware which can itercept and modify outgoing responses.
export type ResponseMiddleware =
    (ev: FetchEvent, response: Response) => Promise<Response> | Response;

function respondFromOrigin(ev: FetchEvent): Promise<Response> {
    return fetch(ev.request);
}

export class App {
    private router: Router;
    private error_handler: ErrorHandler | null;
    private response_middleware: ResponseMiddleware[];

    constructor(init: AppInit) {
        this.router = new Router(init.routes);
        this.error_handler = init.error_handler ?? null;
        this.response_middleware = init.response_middleware ?? [];
    }

    async handle(ev: FetchEvent): Promise<Response> {
        try {
            const response = await this.initial_response(ev);
            return await this.process_response_middleware(ev, response);
        } catch (error) {
            if (this.error_handler !== null) {
                const response = await this.error_handler(ev, error);
                return await this.process_response_middleware(ev, response);
            } else {
                throw error;
            }
        }

    }

    /// Get the response from user-defined handlers or implicit handlers.
    private async initial_response(ev: FetchEvent): Promise<Response> {
        const handler = await this.router.getHandler(ev);
        if (handler !== null) {
            return await handler();
        } else {
            return await respondFromOrigin(ev);
        }
    }

    /// Pass a response through all response middleware.
    private async process_response_middleware(ev: FetchEvent, response: Response): Promise<Response> {
        for (const middleware of this.response_middleware) {
            response = await middleware(ev, response);
        }
        return response;
    }
}
