# 35 Give the CORS fixture time to answer

Status: repair ready for review
Branch: `live-check-flake`

## Fault

The CORS case in `tools/deploy.test.ts` gives all requests in the live check a total of 250 ms.
If the art response arrives after that deadline, `fetch` throws `TimeoutError`. The live check
has no header assertion to report and prints `plugin-live-check: FAIL: request failed`.
Both CI logs show that message. [Run 45136724993](https://github.com/SaarShai/king-down-chess/actions/runs/45136724993/attempts/1), [run 45139473033](https://github.com/SaarShai/king-down-chess/actions/runs/45139473033/attempts/1).

## Check

The local server waits 500 ms before it sends the art response without `Access-Control-Allow-Origin`.
With the old deadline, a trace shows that the server receives the art request and that `fetch`
times out. The test then fails with the CI message. Give this case 2 s. It requires the live check
to name the missing header, exit with status 1, and finish in less than 5 s.
