# cfweb

A pretty simplistic web framework intended for [Cloudflare Workers](https://workers.cloudflare.com/).

## Goals

* Request path based routing
* Automated handling of `OPTIONS` and `HEAD` requests
* Automated responses where `405 Method Not Allowed` is appropriate

## Usage

```typescript
// TODO
```

## Non-Goals

* Middleware - it's entirely doable to write wrapper functions over handlers
