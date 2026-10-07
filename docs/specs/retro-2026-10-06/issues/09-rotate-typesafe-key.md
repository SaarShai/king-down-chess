# Rotate the Typesafe API key

Type: task
Status: wontfix

## Question

On 2026-10-03 20:26 a local `pgrep -fl` printed `TYPESAFE_API_KEY` and `CLAUDE_CODE_MESSAGING_TOKEN` in full into the session transcript. The owner rotates the Typesafe key in its dashboard and tells the agent; the agent records nothing but the date here. The Claude messaging token is managed by the Claude app; if the app offers a sign-out and sign-in, that renews it.

## Answer

The owner (2026-10-07) does not want to rotate the key. The exposure is local only: the key went into a session transcript on this Mac, never into git (the gate's history scan of origin on 2026-10-07 gives "not found" for the Typesafe key, so the 77 transcripts that were public on main did not hold it). The local transcripts are redacted. No rotation; the ticket closes.
