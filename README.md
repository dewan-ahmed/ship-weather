# Ship Weather

**The only CI dashboard that tells you to pack a raincoat.**

Point it at a Harness project. It reads recent pipeline runs and hangs a forecast over the harbor: clear skies when ships are leaving on time, thunder when the deploys are taking on water.

```
        ☀️ ⛅ ☁️ 💨 🌧️ ⛈️ 🌫️
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~
            ⛵  ship weather
```

## The forecast

| Sky | Meaning |
| --- | --- |
| ☀️ Clear shipping skies | Green runs. A fine day to ship. |
| ⛅ Mostly fair | A few clouds. Watch the occasional flake. |
| ☁️ Overcast | Mixed results. Jacket weather. |
| 💨 Gusty | Pipelines still in flight. Expect chop. |
| 🌧️ Failed-deploy showers | Bring a raincoat. |
| ⛈️ Severe shipping weather | Seek logs and shelter. |
| 🌫️ Harbor fog | No recent ships have sailed. |

You also get a **ship temperature** (warmer = healthier), a **chance of fail**, and a per-pipeline forecast. Tap a pipeline name to jump to the last Harness execution.

## Launch the station

You need Node.js 18+ and a Harness [personal access token](https://developer.harness.io/docs/platform/automation/api/add-and-manage-api-keys/).

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your local browser and fill in:

- Account ID
- Organization
- Project
- PAT
- Harness URL (`https://app.harness.io` unless you live on another cluster)

Then hit **Check the weather**.

Use that loopback URL, not a Cursor preview or the LAN/`Network:` address. Those often go through a proxy and return “Accessible only on corporate network.” Fonts are system UI only, so a corporate filter cannot intercept Google Fonts.

## Will my PAT wash out to sea?

No. The token stays in this browser (`sessionStorage`). Account / org / project stick around in `localStorage` so you do not retype the station every time. Calls go through a local Next.js route that only proxies to `https://*.harness.io`. Nothing is committed, and nothing is sent to a third-party weather bureau.

## Stack

Next.js App Router, React, and the Harness Pipeline APIs. The sky is CSS. The sea is also CSS. There is no actual meteorology involved — if it rains on your laptop, that is a you problem.

Fair winds.
