# Diagnose and repair four web-app faults

Status: needs-triage

Class B. Brief of 2026-11-22: four faults from the staging pass and CI.

- Home load is slow on desktop (release check). The Home film download (8.6 MB, 23 s) fills a slow link. A navigation behind it waits: the document and DOMContentLoaded are slow, not only the load event. With the film blocked, the second Home load takes 0.15–1.0 s (6 of 6 runs); with the film, 4.8–15 s (6 of 6). The repair is a film choice (smaller file, play once, or later start). It needs the owner. The check stays the same: `domcontentloaded` is as slow as `load`.
- WebKit offline play: three failed modules in one CI run. The worker precached all three in that run. Four local WebKit experiments (12 runs) do not fail. The cause is not proven. The check message now gives the resource type and the failure text of each failed request.
- An online game named the opponent "the computer" in the square descriptions. The descriptions now go through the online wording, as the other game text does.
- Play a friend, Powers off: the seats said "Light King" and "Dark King", but sides are random. The seats now say "Random side". The look stays the same.
