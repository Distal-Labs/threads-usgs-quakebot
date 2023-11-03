# USGS Quakebot

[![License](https://img.shields.io/badge/License-AGPL--3.0-yellow.svg)](https://github.com/Distal-Labs/threads-usgs-quakebot/blob/main/LICENSE)
[![Release](https://img.shields.io/github/release/Distal-Labs/threads-usgs-quakebot.svg?label=Release)](https://gitHub.com/Distal-Labs/threads-usgs-quakebot/releases/)

**USGS Quakebot** is serverless web service that polls the [U.S. Geological Survey](https://www.usgs.gov)'s real-time earthquake feed every minute, then parses and filters the [GeoJSON object](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) in order to identify earthquakes of at least magnitude 3.0 located within the Conterminous U.S.[^1]. When the service detects a new earthquake, it will attempt to publish a summary of the event to Instagram's microblogging service, [Threads](https://www.threads.net).[^2] Making an HTTP request to the service's web root (e.g. `/`) will return the content of the most recent Threads post attempted by the service; if no earthquakes have been detected within the last 24 hours, then a message conveying this fact will be returned instead.

- [Requirements](#requirements)
- [Usage](#usage)
- [To Do](#to-do)
- [License](#license)

## Requirements
This service was developed with deployment to Cloudflare Workers in mind. That said, it is written using Web APIs; adapting the code for deployment on other serverless platforms should require minimal effort, but not (yet?) on the roadmap for this project. If you would like to contribute code that would make this service platform-agnostic, please submit a pull request with the suggested changes.

The following are required for local development and deployment:
- Supported operating system (Windows, Linux or macOS)
- NodeJS 20.9.0+ (other LTS versions may work but have not been tested for compatibility)
- pnpm 8.10.2+ (other versions and package managers likely work but have not been tested for compatibility)

## Usage
### Install dependencies
```sh
pnpm i
```

### Local preview with live updating
```sh
pnpm dev
```

### Deploy
```sh
pnpm deploy:prod
```


## To Do
- [ ] Update post-to-Threads code once the content publishing endpoints are known
- [ ] Write test suite
- [ ] Explore ways to make this project easy to customize so that any local, state, or government agency can deploy their own public-information bot using
- [ ] Explore 1-click deployment

## License

**USGS Quakebot** is released under the [AGPL-3.0](https://github.com/Distal-Labs/threads-usgs-quakebot/blob/main/LICENSE) License.

--- 
[^1]: Conterminous U.S. refers to a rectangular region including the lower 48 states and surrounding areas which are outside the Conterminous US. See the [USGS Earthquake Catalog Search page](https://earthquake.usgs.gov/earthquakes/search/) for details.
[^2]: Posting to Threads is aborted if the runtime environment is missing a valid Instagram User ID and/or Instagram Graph API Access Token. Please consult [official documentation for information about Instagram Graph API's Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing#endpoints).