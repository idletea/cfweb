// inject the servicer worker API in to the global scope.
import makeServiceWorkerEnv from "service-worker-mock";
declare var global: any
Object.assign(global, makeServiceWorkerEnv())
