import {Router, Route} from "./router";
export * from "./router";

export type AppInit = {
    routes: Route[],
    error_handler?: ErrorHandler,
}

export type ErrorHandler =
    (ev: FetchEvent, exc: any) => Promise<Response> | Response;

function respondFromOrigin(ev: FetchEvent): Promise<Response> {
    return fetch(ev.request);
}

export class App {
    private router: Router;
    private error_handler: ErrorHandler | null;

    constructor(init: AppInit) {
        this.router = new Router(init.routes);
        this.error_handler = init.error_handler ?? null;
    }

    async handle(ev: FetchEvent): Promise<Response> {
        const handler = await this.router.getHandler(ev);
        try {
            if (handler !== null) {
                return await handler();
            } else {
                return await respondFromOrigin(ev);
            }
        } catch (error) {
            if (this.error_handler !== null) {
                return await this.error_handler(ev, error);
            } else {
                throw error;
            }
        }

    }
}
