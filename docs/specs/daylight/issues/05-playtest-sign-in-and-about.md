# Repair sign-in and About links

Status: resolved

The playtest finds three faults. The first sign-in can show a service fault
while the provider list still loads. Facebook shows on the normal web address.
Browser Back from Privacy, Terms or Support can put You at the top.

## Repair

- Read public sign-in settings before loading the account client. Show
  “One moment…” while the request runs. Try once more after a failed read.
  The request has a five-second limit.
- Show Facebook on the website only when the provider is on and the address
  has `?facebook=1`. This follows the rule on the old page.
- Save the scroll position in the You history entry when the document leaves.
  Restore it when the shell draws You again.

## Proof

The Daylight browser check covers a slow first reply, one failed reply,
the Facebook switch and Back from all three About links. The people screen
test checks that two failed replies show the fault and offer Try again.
The lane report and before and after pictures are in `runs/launch/qa-signin2/`
beside the game repository. Merge PR #391 first.
