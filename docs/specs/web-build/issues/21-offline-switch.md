# Set the browser offline before the server refuses requests

Type: task

Status: resolved

The old check can make the test server refuse requests while the browser still reports that it is online. An idle animation can request an optional frame in this interval. Run 44285270728 records the same Knight frame as run 44262287966, before the first offline probe. The same assertion also fails in runs 41060716600 and 41106592727, before PR 375.

The check now waits for the page to report that it is offline before the server refuses requests. The check records asset requests that the server refuses and asset failures that the page reports during offline play.

The new test fails with the old order. The four focused test files pass 343 cases. The Chromium check and all five WebKit checks pass.
