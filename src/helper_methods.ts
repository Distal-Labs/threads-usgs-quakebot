import { html, raw } from 'hono/html'
import { Env, GeoJSONSummary, GeoJSONFeature, IGCreateContainerResponse } from './types'

const minlongitude = -125
const maxlongitude = -65
const minlatitude = 24.6
const maxlatitude = 50

const isEventInContUS = (feature: GeoJSONFeature): boolean => {
  if (feature.geometry.coordinates.length !== 3) {
    return false
  }

  const longitude: number = feature.geometry.coordinates[0]
  const latitude: number = feature.geometry.coordinates[1]
  return minlongitude <= longitude && longitude <= maxlongitude && minlatitude <= latitude && latitude <= maxlatitude
}

const isEventTimeWithinLastMinute = (feature: GeoJSONFeature): boolean => {
  return feature.properties.time > (Date.now() - 60000)
}

const postToThreads = async (env: Env, postText: string): Promise<number> => {
  const igUserId = env.THREADS_IG_USER_ID
  const threadsAPIAccessToken = env.THREADS_API_ACCESS_TOKEN

  if (!igUserId || !threadsAPIAccessToken) {
    return 200
  }

  const creationRequest = new Request(
    `https://graph.facebook.com/v18.0/${igUserId}/media&surface=threads&text=${postText}&cross_post_options=0`
  )
  creationRequest.headers.set('Content-Type', 'application/json')
  creationRequest.headers.set('Accept', 'application/json')
  creationRequest.headers.set('Authorization', `Bearer ${env.THREADS_API_ACCESS_TOKEN}`)
  creationRequest.headers.delete('X-Requested-With')

  return fetch(creationRequest, { method: 'POST' })
    .then(async (creationResponse) => {
      if (creationResponse.status === 200) {
        return creationResponse.json() as IGCreateContainerResponse
      } else {
        throw Error('Unable to create Threads post container')
      }
    })
    .then((creationJSON) => {
      const publishRequest = new Request(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish&creation_id=${creationJSON.id}`
      )
      publishRequest.headers.set('Content-Type', 'application/json')
      publishRequest.headers.set('Accept', 'application/json')
      publishRequest.headers.set('Authorization', `Bearer ${env.THREADS_API_ACCESS_TOKEN}`)
      publishRequest.headers.delete('X-Requested-With')

      return fetch(publishRequest, { method: 'POST' })
    })
    .then((publishResponse) => {
      if (publishResponse.status !== 200) {
        console.error('Unable to publish Threads post')
      }
      return publishResponse.status
    })
    .catch((e) => {
      console.error(`Posting to Threads failed: ${(e as Error).message}`)
      return 400
    })
}

export const postAllToThreads = async (env: Env, posts: string[]): Promise<boolean> => {
  let didSucceed = true

  for await (const post of posts) {
    if (!didSucceed) {
      break
    }
    const postToThreadsStatus = await postToThreads(env, post)
    didSucceed = postToThreadsStatus === 200
  }
  return didSucceed
}

export const fetchAndProcessLatestQuakes = async (isCron: boolean = true) => {
  const url = isCron
    ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson'
    : 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
  const posts = new Array<string>()
  await fetch(url)
    .then((res) => {
      const { headers } = res
      const contentType = headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return res.json() as GeoJSONSummary
      } else {
        console.error(`Unexpected response returned from USGS API:\n${JSON.stringify(res.text(), null, 2)}`)
        return null
      }
    })
    .then((featureCollection) => {
      if (!featureCollection) {
        return
      }
      const onlyUSEvents = featureCollection.features.filter((x) => isEventInContUS(x))
      if (onlyUSEvents.length === 0) {
        console.debug('No new events')
      }
      for (const feature of onlyUSEvents) {
        if (!isCron && posts.length > 0) {
          console.debug('Skipping further processing')
          break
        }
        if (isEventTimeWithinLastMinute(feature) || !isCron) {
          const localeOptions = { 
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
            timeZoneName: "short",
            timeZone: "America/New_York"
          };
          const eventTimeString = (new Date(feature.properties.time).toLocaleString('en-US', localeOptions)).split(', ')
          posts.push(
            `M ${feature.properties.mag} earthquake located ${feature.properties.place} was reported by the U.S. Geological Survey on ${
              eventTimeString[0] + ' at ' + eventTimeString[1]
            } | ${feature.properties.status === 'automatic' ? 'This report is a preliminary assessment and is subject to change. ' : ''}For the latest details visit the USGS (@usgs_quakes) event page at ${feature.properties.url}
            | NOTICE: this automated account only posts notifications for earthquakes of magnitude 2.5+ that are located within the contiguous U.S.`
          )
        }
      }
      return
    })
    .catch((e) => {
      console.error((e as Error).message)
      return
    })
  return posts
}

export const Preview = (postText: string) => {
  return html`
    <!doctype html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=50%,initial-scale=1,maximum-scale=2,shrink-to-fit=no" />
        <link
          type="text/css"
          rel="stylesheet"
          href="https://static.cdninstagram.com/rsrc.php/v3/yT/l/0,cross/UaTyB_lhJJa.css?_nc_x=Ij3Wp8lg5Kz"
          data-bootloader-hash="vCBbCVg"
          crossorigin="anonymous"
          data-p=":4"
          data-c="1"
        />
        <title>Latest post</title>
      </head>
      <body style="padding: 1em 2em">
        <div class="x1a2a7pz x1n2onr6" style="margin: auto; width: 50%">
          <div
            class="x1bl2z55 x1frmxcx x1l90r2v x1iorvi4 x1sqbtui"
            data-pressable-container="true"
            data-interactive-id=""
          >
            <div class="xpvyfi4 x1xdureb x1agbcgv"></div>
            <div class="xrvj5dj xd0jker x11ql9d">
              <div class="xqti54a x13vxnyz x49hn82 xcrlgei x889kno">
                <div>
                  <div class="x1a6qonq xj0a0fe x126k92a x6prxxf x7r5mf7">
                    <span
                      class="x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye xjohtrz xo1l8bm xp07o12 xat24cr xdj266r"
                      dir="auto"
                      style="line-height: var(--base-line-clamp-line-height); --base-line-clamp-line-height: calc(1.4 * 1em);"
                    >
                      ${raw(postText.replace(' | ', '<br><br>').replace('|', '<br>').replace(RegExp('(https:\/\/earthquake\.usgs\.gov\/earthquakes\/eventpage\/.+)'), '<a href="$1" target="_blank" title="Visit the USGS detail page for this event">$1</a>'))}
                    </span>
                  </div>
                  <div class="x1orzsq4 x1k70j0n">
                    <div class="xrvj5dj xjn6g71">
                      <div class="x6s0dn4 x78zum5 xc9qbxq xl56j7k x14qfxbe">
                        <a
                          class="x1i10hfl xjbqb8w xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 x78zum5 x5yr21d xl56j7k x1n2onr6 xh8yej3"
                          href="#"
                          role="link"
                          tabindex="0"
                          target="_self"
                          ><div class="x6s0dn4 x78zum5 xl56j7k xx6bhzk x11xpdln x12w9bfk">
                            <div class="x5yr21d x10l6tqk xh8yej3 xi1g0f7 x1pdr0v7">
                              <div
                                class="x90nhty x14yjl9h xudhj91 x18nykt9 xww2gxu xc9qbxq x10l6tqk xvqlfdi x1ogtga9 xpwpydw x14qfxbe"
                              ></div>
                            </div>
                            <svg
                              aria-label="Like"
                              class="x1lliihq x1n2onr6 x1yxark7"
                              fill="transparent"
                              height="19"
                              role="img"
                              viewBox="0 0 24 22"
                              width="20"
                            >
                              <title>Like</title>
                              <path
                                d="M1 7.66c0 4.575 3.899 9.086 9.987 12.934.338.203.74.406 1.013.406.283 0 .686-.203 1.013-.406C19.1 16.746 23 12.234 23 7.66 23 3.736 20.245 1 16.672 1 14.603 1 12.98 1.94 12 3.352 11.042 1.952 9.408 1 7.328 1 3.766 1 1 3.736 1 7.66Z"
                                stroke="currentColor"
                                stroke-width="2"
                              ></path>
                            </svg></div
                        ></a>
                      </div>
                      <div class="x6s0dn4 x78zum5 xc9qbxq xl56j7k x14qfxbe">
                        <a
                          class="x1i10hfl xjbqb8w xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 x78zum5 x5yr21d xl56j7k x1n2onr6 xh8yej3"
                          href="#"
                          role="link"
                          tabindex="0"
                          target="_self"
                          ><div class="x6s0dn4 x78zum5 xl56j7k xx6bhzk x11xpdln x12w9bfk">
                            <div class="x5yr21d x10l6tqk xh8yej3 x1bp8bn4 xeb58b7">
                              <div
                                class="x90nhty x14yjl9h xudhj91 x18nykt9 xww2gxu xc9qbxq x10l6tqk xvqlfdi x1ogtga9 xpwpydw x14qfxbe"
                              ></div>
                            </div>
                            <svg
                              aria-label="Comment"
                              class="x1lliihq x1n2onr6 x1yxark7"
                              fill="currentColor"
                              height="20"
                              role="img"
                              viewBox="0 0 24 24"
                              width="20"
                            >
                              <title>Comment</title>
                              <path
                                d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                                fill="none"
                                stroke="currentColor"
                                stroke-linejoin="round"
                                stroke-width="2"
                              ></path>
                            </svg></div
                        ></a>
                      </div>
                      <div class="x6s0dn4 x78zum5 xc9qbxq xl56j7k x14qfxbe">
                        <a
                          class="x1i10hfl xjbqb8w xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 x78zum5 x5yr21d xl56j7k x1n2onr6 xh8yej3"
                          href="#"
                          role="link"
                          tabindex="0"
                          target="_self"
                          ><div class="x6s0dn4 x78zum5 xl56j7k xx6bhzk x11xpdln x12w9bfk">
                            <div class="x5yr21d x10l6tqk xh8yej3 x17qophe x13vifvy">
                              <div
                                class="x90nhty x14yjl9h xudhj91 x18nykt9 xww2gxu xc9qbxq x10l6tqk xvqlfdi x1ogtga9 xpwpydw x14qfxbe"
                              ></div>
                            </div>
                            <svg
                              aria-label="Repost"
                              class="x1lliihq x1n2onr6 x1yxark7"
                              fill="currentColor"
                              height="20"
                              role="img"
                              viewBox="0 0 24 24"
                              width="20"
                            >
                              <title>Repost</title>
                              <path
                                d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.923.923 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.27A5.277 5.277 0 0 0 3 9.271V13.5a1 1 0 0 0 2 0V9.271a3.275 3.275 0 0 1 3.271-3.27Z"
                              ></path>
                            </svg></div
                        ></a>
                      </div>
                      <div class="x6s0dn4 x78zum5 xc9qbxq xl56j7k x14qfxbe">
                        <a
                          class="x1i10hfl xjbqb8w xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 x78zum5 x5yr21d xl56j7k x1n2onr6 xh8yej3"
                          href="#"
                          role="link"
                          tabindex="0"
                          target="_self"
                        >
                          <div
                            class="x1i10hfl xjbqb8w xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 x78zum5 x5yr21d xl56j7k x1n2onr6 xh8yej3"
                            role="button"
                            tabindex="0"
                          >
                            <div class="x6s0dn4 x78zum5 xl56j7k xx6bhzk x11xpdln x12w9bfk">
                              <div class="x5yr21d x10l6tqk xh8yej3 xi1g0f7 x1qiirwl">
                                <div
                                  class="x90nhty x14yjl9h xudhj91 x18nykt9 xww2gxu xc9qbxq x10l6tqk xvqlfdi x1ogtga9 xpwpydw x14qfxbe"
                                ></div>
                              </div>
                              <svg
                                aria-label="Share"
                                class="x1lliihq x1n2onr6 x1yxark7"
                                fill="currentColor"
                                height="20"
                                role="img"
                                viewBox="0 0 24 24"
                                width="20"
                              >
                                <title>Share</title>
                                <line
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  x1="22"
                                  x2="9.218"
                                  y1="3"
                                  y2="10.083"
                                ></line>
                                <polygon
                                  fill="none"
                                  points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
                                  stroke="currentColor"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                ></polygon>
                              </svg>
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}
