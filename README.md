# ut4-webgpu-packages

Content packs (`*.data`) for the UT4 WebGPU build at https://ut4-hub.pick.haus, published as
GitHub Release assets. The site loads them through a Cloudflare Worker that proxies these release
downloads and adds the CORS / CORP headers browsers need.

Each release tag matches a content build; the page's package base URL names the tag.

## Worker

`worker/` is the Cloudflare Worker (`ut4-packs`, custom domain `ut4-packs.pick.haus`). It proxies
`/<tag>/<name>.data` to this repo's release assets, following GitHub's redirect by hand, and adds
`Access-Control-Allow-Origin: *` and `Cross-Origin-Resource-Policy: cross-origin`. Deploy with
`cd worker && npx wrangler deploy`.

New content build: create a release `packs-<date>` with the `.data` files and bump the tag in the
page's `window.__wndrPkgBase`.
