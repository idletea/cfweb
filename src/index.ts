import {Router, Route} from "./router";

export type AppInit = {
    routes: Route[],
}

function respondFromOrigin(ev: FetchEvent): Promise<Response> {
    return fetch(ev.request);
}

export class App {
    private router: Router

    constructor(init: AppInit) {
        this.router = new Router(init.routes);
    }

    async handle(ev: FetchEvent): Promise<Response> {
        const handler = this.router.getHandler(ev);
        if (handler !== null) {
            return (await handler)();
        } else {
            return respondFromOrigin(ev);
        }
    }
}
