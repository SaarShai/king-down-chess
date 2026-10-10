DRAFT — not legal advice; the owner and a lawyer must check it

# UK record of measures (draft)

Version 0.1, 2026-10-10. Ticket: [05 — Safety documents: drafts](../specs/accounts-multiplayer/issues/05-safety-drafts.md). Report: [part 01, section 5.7](../research/multiplayer-2026-10-10/01-user-journey.md) and [part 03, section 8.10](../research/multiplayer-2026-10-10/03-technical.md).

## What this record is

Step 3 of Ofcom's risk assessment method asks the provider to record three things:

1. each measure from Ofcom's Codes of Practice that the service uses, or plans to use;
2. each applicable measure that the service does not plan to use;
3. each alternative measure, with evidence that it meets the duty.

This file is that record for King Down. It also names the measures that the build adds in phase 1. The other records point to it by the names M01 to M23.

Related files: [illegal content risk assessment](uk-illegal-content-risk-assessment.md), [children's access assessment](uk-childrens-access-assessment.md), [children's risk assessment outline](uk-childrens-risk-assessment.md), [terms](terms-draft.md), [safety and reporting page](safety-and-reporting-draft.md), [contact page](contact-draft.md).

**Accountable person** (Illegal Content Code ICU A2; Protection of Children Code PCU A2): [owner fact: name]. For a very small service, Ofcom says that this can mean reporting to a senior manager. For King Down, it is the owner.

**Legend for the "State" column** (update it when each ticket merges):

- *planned*: a ticket of the [accounts and multiplayer spec](../specs/accounts-multiplayer/spec.md) builds it. It is not merged yet.
- *draft*: this folder holds a draft. The owner publishes it.
- *owner step*: only the owner can do it.

## Measures that the build adds in phase 1

| ID | Measure | What it does | Where | State |
|---|---|---|---|---|
| M01 | Preset messages only | A player can send one fixed phrase from a short list. The proposed list is "Good game", "Well played" and "Thanks". Each phrase has fixed text, with no free field, number or link. Each preset can go once per game. | Ticket 02 (`say`), ticket 09 (`kingdown_say`) | planned |
| M02 | No free text, private messages, uploads, or age, school, location or flag on a profile | The service has no field that takes these. | Tickets 02, 07, 08, 09 | planned |
| M03 | Icon, not photo | A player picks a preset icon. The sign-up step stops copying the provider's full name and photo. | Ticket 02 | planned |
| M04 | Handle rules | 3 to 20 characters from `a-z`, `0-9`, `_` and `-`. A letter first, a letter or digit last. Unique. A blocklist for slurs, staff words and title patterns. Old and deleted handles never return. One rename in 90 days. The owner can rename a handle. | Tickets 02 and 07 | planned |
| M05 | Privacy defaults and limits | By default, only signed-in players can challenge a player. "Online now" shows only to mutual follows. Quiet mode turns off social features. A profile is not public by default. **Rule that must hold:** no list of a player's followers or follows is visible to other players. Alerts: one turn email until the player returns; none while the player looks at the game. | Tickets 02, 06, 07, 08 | planned |
| M06 | Block and mute | A block refuses challenges and invitations both ways and hides presets. | Ticket 07 | planned |
| M07 | One report flow | A player reports a player, a handle or a preset. Seven reasons: computer help, rating manipulation, leaving or stalling, offensive handle, harassment, child safety or illegal content, other. It exists on the website and in ChatGPT (`kingdown_report`, or a link to the report form). | Tickets 07, 08, 09 | planned |
| M08 | Intimate image path | "Child safety or illegal content" has the choice "Intimate image shared without consent". The owner removes the reported content and matching copies no later than 48 hours after the report. | Ticket 07 (queue and target); the owner acts | planned, owner step |
| M09 | Owner review queue | The owner lists open reports. Child safety or illegal content comes first. A command-line tool (`tools/mod.ts`) lists, shows and acts. | Ticket 07 | planned, owner step |
| M10 | Actions with a statement of reasons | The report lists these actions: warning, rename, hide, timeout, rated-play ban, board removal, suspension, closure. Ticket 07 builds warning, rename, hide and suspension. Each action writes a `mod_actions` row with the reasons (the facts, the rule, how to appeal). | Ticket 07 | planned |
| M11 | Appeals | A player can appeal an action. The row keeps `appeal_status` and `appeal_note`. | Ticket 07 | planned, owner step |
| M12 | Report hold and retention | `reports.hold_until` stops the deletion and cleanup jobs for the reported content and the related user data. The NCA rules ask the service to keep the reported content and the related user data for one year. This includes two weeks of related user data. The service keeps the report reference for five years. | Tickets 06 and 07 | planned |
| M13 | NCA registration and escalation | Register with the National Crime Agency reporting portal, and name a senior person as organisation administrator, before the first report. Write the escalation path. Send priority 1 reports at once. The report row stores `nca_reference`. | Owner (registration); tickets 02 and 07 (the report fields) | owner step |
| M14 | Accountable person | Name one person who answers for the safety duties. | Owner | owner step |
| M15 | Terms | Plain terms for the youngest permitted user (13). They ban primary priority content, cover the intimate image duty, and say that the service removes proscribed organisations. They work with a keyboard and a screen reader. | [terms-draft.md](terms-draft.md) | draft |
| M16 | Safety and reporting page | One page that explains moderation, complaints and appeals. | [safety-and-reporting-draft.md](safety-and-reporting-draft.md) | draft |
| M17 | Contact page | An address that a person reads, for players and for authorities. The owner answers an Ofcom information notice by its deadline. | [contact-draft.md](contact-draft.md) | draft |
| M18 | Removal of proscribed organisations | A terms rule and the actions `suspension` and `closure`. | Terms; ticket 07 | draft, planned |
| M19 | Deletion that keeps games | A deleted player shows as "Deleted player". A 7-day grace period; a sign-in cancels. Data under a report hold stays until the hold ends. | Tickets 02, 06 and 07 | planned |
| M20 | Phase gates | Until a new risk assessment exists (section 9(4)): no matching with strangers, no guests, no free text, no uploads, no public profiles or boards. | The spec ("Later, by phase") | planned |
| M21 | Quotas | Each preset once per game. Invitations last 24 hours (live) or 14 days (Daily) and work once. Firewall rate limits at the first deploy. | Ticket 02; owner (firewall) | planned, owner step |
| M22 | Under-13 reports | When a parent or another person reports a player under 13, the owner deletes the account. | Owner | owner step |
| M23 | Review cycle | Review every record at least every 12 months. Write a new assessment before each significant change. In phase 1, read the report counts each month. | Owner | owner step |

## Ofcom code measures for all services

IDs come from the Illegal Content Code (ICU, 9 September 2026) and the Protection of Children Code (PCU, 4 July 2025). They are as the research report read them.

| Code ID | What it asks | King Down | Measures |
|---|---|---|---|
| ICU A2, PCU A2 | Name an individual who is accountable for the duties | The owner | M14 |
| ICU C1, C2, PCU C1, C2 | Review suspected illegal content and content harmful to children; take it down fast | Owner queue; rename, hide, suspend | M09, M10 |
| ICU D1, D2, PCU D1, D2 | Easy to find, reach and use complaints systems | One report flow; the contact page | M07, M17 |
| ICU D7, D9 to D13, PCU D7, D9, D10, D13, D14 | Handle complaints and appeals | Statements of reasons; appeals | M10, M11 |
| ICU G1, G3, PCU G1, G3 | Terms that say how the service protects users and how to complain. They suit the youngest permitted user. They work with a keyboard and a screen reader. | Terms and the safety page | M15, M16 |
| ICU H1 | Remove the accounts of proscribed organisations | Terms rule; `closure` | M18 |

## Measures that King Down does not use, and why

| Measure | Why not | Check again |
|---|---|---|
| Measures for large services (more than 7 million monthly UK users) and for multi-risk services | King Down is neither. A multi-risk service has medium or high risk for two or more kinds of harm. | At each review |
| ICU D3 to D6 (measures that apply when a service is at medium or high risk of one kind of illegal harm; D3 and D5 also when children are likely to use the service) | All first-pass ratings are Low or Negligible. | When a rating rises to Medium |
| ICU F1 and F2 (child safety defaults, for high grooming risk, "to the extent" that the service has an existing means to determine age) | The grooming rating is Low, and King Down holds no age. | If the grooming rating rises; if an age signal is ever added |
| Highly effective age assurance (PCU B2 to B7) | Not required. The terms ban primary priority content for all users, the owner can remove any handle, and no system recommends such content. | If the terms change |

## Measures in place today (private ChatGPT friend play)

If King Down has UK links, the measures for all services can already apply to today's private play. The repository shows this state:

| Need | Today | Gap |
|---|---|---|
| Sign-in; seat checks; one account for each seat | Done. The server checks every request against the signed-in account. | None |
| Invitations | A token, stored as a hash, 24 hours, one joiner. | None |
| Messages, pictures, names | None exist. | None |
| Accountable person (ICU A2) | Not named. | Name the owner (M14). |
| Complaints route (ICU D1, D2) | The address `hello@kingdown.dev` on the live pages. | Say on the live pages that this address takes safety reports (M17). |
| Terms (ICU G1, G3) | A live terms page of 3 October 2026. It does not cover safety, reporting or complaints. The lawyer checks its reading age. | Replace it with M15 before or at the phase 1 launch; add a safety paragraph now if the lawyer asks. |
| Moderation function (ICU C1, C2) | None, apart from the owner. | Write down how the owner removes a user's access today. |

## Gaps found while writing the drafts

1. **Affected persons who are not players.** The law asks for an easy way for users and affected persons to report intimate image content (section 20A). The planned website report route needs a sign-in. A person who is not a player cannot use it. Until a public form exists, the contact page takes these reports by email. A lawyer must say if an email address is "easy" enough. A form that needs no sign-in is the safer choice. This is a change for ticket 08 or for a later ticket.
2. **Handles as a contact channel.** A handle cannot carry a link, but it can carry a hint such as an app name. The owner decides on the blocklist (M04). See the [illegal content risk assessment](uk-illegal-content-risk-assessment.md), "Open points".
3. **What "related user data" means in a report hold.** The NCA rules ask the service to keep two weeks of related user data. The foundation keeps no request log of its own. Vercel and Supabase keep logs under their own rules. The owner and the lawyer must define the data, and say how to keep it.
4. **Reports must stay.** The NCA report reference needs five years. Make sure that no cleanup job deletes `reports` rows. Ticket 10 must check this.
5. **Follow lists.** Table 13.3 of Ofcom's guidance raises the grooming risk when users can see child users in other users' lists of connections. M05 forbids public lists. Ticket 07 and ticket 08 must keep that rule.
6. **Two controls have no ticket.** The report asks for one switch that turns presets off (part 01, section 3.6) and a one-tap mute of the opponent (part 01, section 8.2). The profile has `quiet_mode`, and ticket 07 builds blocks. Decide if quiet mode also stops presets. The report also asks for a cap on draw offers; ticket 02 names no cap. Assign these to a ticket before the phase 1 launch.
7. **The live pages disagree with the new design.** The live privacy page says that children under 13 need a parent's permission to sign in. It shows a display name and a photo. It says that deletion happens at once or within 30 days. The new design has a minimum age of 13, a handle and an icon, and a 7-day grace period. Update the privacy and delete-data pages with the terms.

## Facts only the owner can supply

- [ ] The accountable person.
- [ ] The place and the hours when the owner reads reports.
- [ ] The target time to act on a report other than an intimate image report.
- [ ] Who decides an appeal, and the time to answer.
- [ ] The NCA registration: the date, and the name of the organisation administrator.
- [ ] The final preset list.
- [ ] The decision on the handle blocklist.
- [ ] The address for reports and for notices (see the [contact page](contact-draft.md)).
- [ ] The lawyer's answers to gaps 1 and 3.

## Sources

- [Ofcom: Illegal Content Codes of Practice for user-to-user services, 9 September 2026](https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/detecting-intimate-image-abuse/illegal-content-codes-of-practice-for-user-to-user-services-9sep2026.pdf?v=425251) (ICU A2, C1, C2, D1 to D13, F1, F2, G1, G3, H1)
- [Ofcom: Protection of Children Code of Practice for user-to-user services, 4 July 2025](https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/protection-of-children-code-of-practice-for-user-to-user-services.pdf?v=403579)
- [Ofcom: Protection of children duties under the Online Safety Act](https://www.ofcom.org.uk/online-safety/protecting-children/protection-of-children-duties-under-the-online-safety-act) (accountable person for a small service)
- [Ofcom: Risk Assessment Guidance and Risk Profiles, V2.0, 25 June 2026](https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/updates/risk-assessment-guidance-and-risk-profiles.pdf) (Step 3 records; Table 13.3)
- [Ofcom: Duty to report child sexual exploitation and abuse content](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/duty-to-report-child-sexual-exploitation-and-abuse-csea-content-know-the-rules-and-how-to-comply) (NCA registration)
- [S.I. 2026/268](https://www.legislation.gov.uk/uksi/2026/268/made) (the NCA report format, timing and retention)
- [Online Safety Act 2023, section 66](https://www.legislation.gov.uk/ukpga/2023/50/section/66) (duty to report CSEA content)
- [Section 10](https://www.legislation.gov.uk/ukpga/2023/50/section/10) (safety duties; the 48-hour take-down in subsection (3A); terms in subsection (5))
- [Section 20A](https://www.legislation.gov.uk/ukpga/2023/50/section/20A) (reporting of intimate image content)
- [Section 9](https://www.legislation.gov.uk/ukpga/2023/50/section/9) (a new assessment before a significant change)
- [Digital Services Act, Articles 11 to 18](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065) (the EU duties that the same report flow serves, if the Act applies)
