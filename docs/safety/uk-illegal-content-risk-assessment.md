DRAFT — not legal advice; the owner and a lawyer must check it

# UK illegal content risk assessment (draft record)

Version 0.1, 2026-10-10. Ticket: [05 — Safety documents: drafts](../specs/accounts-multiplayer/issues/05-safety-drafts.md). Report: [part 01, section 5.7](../research/multiplayer-2026-10-10/01-user-journey.md) and [part 03, section 8.10](../research/multiplayer-2026-10-10/03-technical.md).

## What this record is

The UK Online Safety Act (the Act) makes each user-to-user service write an illegal content risk assessment (section 9). Ofcom can ask for the written record with an information notice. Ofcom fined 4chan for not answering such a notice.

This file follows Ofcom's four steps. It rates the 18 kinds of priority illegal content for two scopes:

- **Today:** the private ChatGPT friend play.
- **Phase 1:** Daily friend games on the website and in ChatGPT, with handles, preset messages and reports (the build on branch `claude/multiplayer-foundation`).

The ratings are proposals. The owner and a lawyer decide them. Ofcom asks a provider to choose the higher level when the evidence is not clear.

The website and the ChatGPT plugin share one account and one set of records. Ofcom lets similar versions of a service count as one service (Risk Assessment Guidance, footnote 48). This record treats them as one.

Other files in this folder: [children's access assessment](uk-childrens-access-assessment.md), [children's risk assessment outline](uk-childrens-risk-assessment.md), [record of measures](uk-record-of-measures.md), [terms](terms-draft.md), [safety and reporting page](safety-and-reporting-draft.md), [contact page](contact-draft.md). Measure names such as M07 point to the record of measures.

## Step 0: Is King Down in scope?

| Test | Answer | Source |
|---|---|---|
| A user-to-user service is one where content from one user can reach another user. "Content" includes data of any description, so moves count. | Probably yes. One player's moves reach the other player. This holds today and in phase 1. A lawyer must confirm it. | Act, sections 3 and 236 |
| No exemption in Schedule 1 fits a game with handles and preset messages. | None fits. Preset messages do not take the service out of scope. | Act, Schedule 1 and section 55 |
| The service has "links with the UK": a significant number of UK users, or the UK is a target market. | [owner fact: UK users, in numbers; UK target market, yes or no] | Act, section 4 |
| Company size gives no exemption. The Act covers a provider outside the UK. | Not a factor. | Ofcom, guide for services |

Ofcom gives no number for "significant". It asks the provider to explain the judgement, also when the provider thinks the number is not significant. Write the judgement here: [owner fact: the judgement and its reason].

## Dates

| Item | Date |
|---|---|
| First day UK users could use the service (the private plugin; a lawyer decides about the website link game) | [owner fact] |
| First illegal content risk assessment due: three months after the service came into scope (Risk Assessment Guidance, paragraph 2.19) | [owner fact: first day plus three months] |
| Next review: at least every 12 months (paragraph 2.45) | [owner fact: date] |
| Further assessment before each significant change (section 9(4)) | See "Step 4" |

The repository holds one hint. The private beta packet (`docs/plugin-beta-support.md`) holds this line: "No invitations have been sent." The owner must confirm the true number of testers. The owner must also confirm the number of UK users.

## Step 1: Understand the kinds of illegal content

### The service

| Part | Today (private ChatGPT friend play) | Phase 1 (Daily friend games) |
|---|---|---|
| Sign-in | Google or GitHub, through the consent page. No guest. | Same, plus email code. No guest (guests come in phase 2). |
| What a player can show to others | Nothing. No name, handle, picture or age. | A handle and a preset icon. No provider name, no photo, no age, school, location or flag. |
| What a player can send to others | Moves that the engine checks as legal. An invitation token that the player shares outside King Down. | Moves, the same invitations (link or short code), and one fixed preset phrase at a time. |
| Free text, private messages, pictures, video | None. | None. |
| Links between players | None. | Follow (one way) and block. No public list of followers or follows (see M05). |
| Finding other players | None. The player gives the token to a friend. | By invitation. Open play with strangers comes in phase 3 and needs a new assessment. |
| Reports and moderation | None. | A report flow, an owner queue, actions with a statement of reasons, appeals (M07 to M12). |
| Alerts | None. | A "your turn" email that names the opponent's handle. Presets and opponent text never go into alerts. |

### Ofcom risk factors that apply

Ofcom's U2U Risk Profile (Table 9) lists the risk factors. The IDs below are Ofcom's.

| ID | Risk factor | Today | Phase 1 |
|---|---|---|---|
| 1c | Gaming service | Yes | Yes |
| 2 | Child users | Possible. OpenAI's rules allow ages 13 to 17. King Down holds no age data. | Yes. Assume that children use it. |
| 3a | User profiles | No | Yes. A handle and an icon only. |
| 3b | Anonymous or pseudonymous users, or users without an account | No | Partly. Ofcom counts aliases as pseudonymity, so handles count. No guests. |
| 4a | User connections | No | Yes. Follow and block. |
| 5b | Direct messaging | No | Possible. The Ofcom Code defines a direct message as a message that only one recipient account can view at once. A preset that goes to one opponent can meet that definition. |
| 7a | Searching for user-generated content | No | Only if a handle lookup exists. [check with ticket 08] |
| 4b, 5a, 5c to 5g, 6, 7b, 8 | Groups, livestreaming, encrypted messaging, comments, images, location, forwarding, goods for sale, hyperlinks, recommender systems | No | No. Users cannot post links. The service makes the invitation links. No system suggests players. |
| General | User base demographics, business model, commercial profile | Children possible. Free, no ads, no sale of data. [owner fact: revenue plans] | Same. |

### The 18 kinds

Ofcom's numbering (Risk Assessment Guidance V2.0, Appendix A, Table 15). The controls column uses the measure names of the [record of measures](uk-record-of-measures.md).

**Rule used for phase 1.** A kind gets "Low" when two things hold. First, Ofcom links one of King Down's risk factors to it. Second, a user can reach another user with it through a handle. A kind gets "Negligible" when no channel on King Down can carry it. A fixed preset phrase cannot carry any of these kinds. A handle has 3 to 20 characters from `a-z`, `0-9`, `_` and `-`. It cannot hold a link or a picture. It can hold a short phrase that joins words with `_` or `-`.

Today, no channel carries any of these kinds, so every kind is Negligible.

| # | Kind | How it could arise on King Down | Controls | Today | Phase 1 |
|---|---|---|---|---|---|
| 1 | Terrorism | A handle names or praises a banned group | M04, M07, M09, M18 | Negligible | Low |
| 2 | Child sexual exploitation and abuse (overall) | The highest of 2A and 2B | — | Negligible | Low |
| 2A | Grooming | An adult uses a game contact to reach a child, or a handle gives a contact hint. See "Grooming" below. | M01 to M07, M20 | Negligible | Low |
| 2B(i) | Image-based CSAM | Not possible. No picture or video can pass between players. | M02 | Negligible | Negligible |
| 2B(ii) | CSAM URLs | Not possible. Users post no links. A handle cannot form a link, because it has no `.` or `/`. | M01, M02, M04 | Negligible | Negligible |
| 3 | Hate | A handle holds a slur | M04, M07, M09 | Negligible | Low |
| 4 | Harassment, stalking, threats and abuse | A handle holds abuse or a threat. Repeated invitations or challenges. A player follows another to track the person. | M04 to M07, M21 | Negligible | Low |
| 5 | Controlling or coercive behaviour | A partner uses Follow or "online now" to watch a person | M05, M06 | Negligible | Low |
| 6 | Intimate image abuse | A handle threatens to share an image. No image can pass. | M02, M04, M07, M08 | Negligible | Low |
| 7 | Extreme pornography | Not possible. No picture or video can pass. | M02 | Negligible | Negligible |
| 8 | Sexual exploitation of adults | A handle advertises | M04, M07 | Negligible | Low |
| 9 | Human trafficking | A handle advertises or recruits | M04, M07 | Negligible | Low |
| 10 | Unlawful immigration | A handle advertises | M04, M07 | Negligible | Low |
| 11 | Fraud and financial services | A handle advertises a scam. King Down has no payments, no goods and no marketplace. | M04, M07 | Negligible | Low |
| 12 | Proceeds of crime | A handle advertises | M04, M07 | Negligible | Low |
| 13 | Drugs and psychoactive substances | A handle advertises | M04, M07 | Negligible | Low |
| 14 | Firearms and other weapons | A handle advertises | M04, M07 | Negligible | Low |
| 15 | Encouraging or assisting suicide and serious self-harm | A handle tells a person to hurt themselves | M04, M07, M09 | Negligible | Low |
| 16 | Foreign interference | A handle spreads a message | M04, M07 | Negligible | Low |
| 17 | Animal welfare offence | Not possible. No picture or video can pass, and a handle is too short to show cruelty. Ofcom links none of King Down's risk factors to it. | — | Negligible | Negligible |
| 18 | Cyberflashing | Not possible. The offence needs a photograph or film. | M02 | Negligible | Negligible |

**Other illegal content** (not priority). Today: Negligible. Phase 1: Low. Handles can hold a threatening or abusive message, which can be a communications offence. The same controls apply.

**Use of the service to commit or help a priority offence** (Ofcom asks U2U services to assess this too). The main way is contact exchange. A person meets a player through a game and moves to another app. A handle such as "add_me_on_[app]" can carry a contact hint. A preset cannot. Controls: M04 (handle rules; the owner decides whether to block app names, see "Open points"), M07 (report a handle), M20 (no strangers in phase 1). Rating: Today Negligible; phase 1 Low. This rating must change when open play starts.

### Grooming

Ofcom's Table 13.3 (Risk Assessment Guidance, page 67) gives the test for grooming. It is the kind that Ofcom and the research report flag for games that children use.

| Condition in Table 13.3 | King Down, phase 1 |
|---|---|
| Children can access the service | Yes. |
| Functions let users talk one-to-one with children | Possibly. A preset to one opponent can count as a direct message. Assume yes. |
| Network expansion prompts, including recommender systems | None. |
| Users can see child users in other users' lists of connections | No, if M05 holds: no public list of followers or follows. [check with tickets 07 and 08] |
| Profiles that show whether a user is likely a child | None by design: no age, school, location, flag or photo. A handle can still hint at age. The terms ban this, and a report can remove it (M04, M07). |
| "A lot" of the listed risk factors: social media, messaging, gaming, livestreaming, encrypted messaging, commenting | One: gaming. King Down is not a social media or messaging service and has no livestream, encrypted messages or comments. |

Result. High risk needs one of the extra conditions, and King Down meets none if M05 holds. Medium risk needs several of the listed risk factors, and King Down has one. So the proposed rating is **Low**. The reasons:

1. Every preset is a fixed phrase. It has no free field, number or link. It cannot carry contact details.
2. There is no free text, no private message, no picture, no video and no voice.
3. Profiles show no age, school, location or photo. Provider names and photos are not copied.
4. By default, only signed-in players can challenge a player (`challenge_from`). "Online now" shows only to mutual follows.
5. Phase 1 has no matching with strangers and no guest play. Players come by invitation.
6. A player can block, and can report in each game.

The lawyer must confirm the rating. If any of the six reasons stops being true, the rating becomes Medium or High. Ofcom's Code measures F1 and F2 (child safety defaults) then apply "to the extent" that the service has an existing means to determine age. King Down asks no age and holds none, so it uses no such means.

## Step 2: Assess the risk of harm

### Evidence

Ofcom's core inputs (Table 10) and what King Down holds:

| Core input | What King Down holds |
|---|---|
| Risk Profile and Register of Risks | Used in Step 1. |
| User complaints and reports | None yet. The report flow comes in phase 1. Add the counts to this record at the first review. |
| User data, including age | Account IDs and game data. No age. [owner fact: number of accounts and of UK accounts] |
| Retrospective analysis of incidents | [owner fact: any incident of harm so far, or "none"] |
| Existing controls | See the [record of measures](uk-record-of-measures.md). |
| Other relevant information | The [multiplayer research report](../research/multiplayer-2026-10-10/README.md) (2026-10-10), with the gap 6 findings on the Act. |

The service is small, but phase 1 has several risk factors (1c, 2, 3a, 3b, 4a and 5b). Ofcom expects enhanced evidence in two cases. The first case is a service with several risk factors for a kind of harm. The second is a provider that is not sure that core inputs are enough (paragraphs 2.7 and 2.16). Plan this before the phase 1 launch:

- a test of the report flow with real testers;
- the lawyer's review;
- for grooming, advice from a child safety expert or charity.

### Ways to use the service that the design does not intend

| Misuse | Effect | Control |
|---|---|---|
| A handle carries a contact hint, an advert or abuse | Contact outside the service; abuse of the other player | M04, M07 |
| Repeated invitations or challenges to one person | Harassment | M05, M06, M21 |
| Repeated draw offers, or stalling in a game | Harassment; not illegal content | The fair-play rules in the terms; a cap on draw offers (gap 6 in the record of measures) |
| A false report against a player | Unfair action | The owner reads each report; appeals (M09 to M11) |
| One person holds several accounts | Evasion of a block or ban | The terms ban a new account that avoids a block or a ban; the owner can suspend (M10) |
| An invitation link goes to the wrong person | A stranger joins a game | A link works once; it expires; `challenge_from` and blocks refuse a join |

### Ratings

Section "Step 1" gives the rating of each kind. Ofcom's rule is: judge likelihood and impact separately, then pick the level. Ofcom asks for the higher level when the evidence is not clear (Risk Assessment Guidance, paragraph 3.3). The owner and the lawyer decide the final level.

## Step 3: Decide measures, implement and record

The [record of measures](uk-record-of-measures.md) lists each measure from Ofcom's Illegal Content Codes of Practice (9 September 2026) that King Down uses. It also lists the measures that King Down does not use, and the reason. It names the owner as the accountable person (ICU A2) when the owner fills that field.

## Step 4: Report, review and update

- **Report.** The accountable person reads this record and signs it. [owner fact: name, date]
- **Monitor.** Read the report counts each month in phase 1. Compare them with the ratings above.
- **Review.** Every 12 months at the latest. [owner fact: date of the first review]
- **Significant change.** Write a new assessment before each of these changes (section 9(4)):
  - open play or any matching with strangers (phase 3);
  - guest play (phase 2);
  - free-text chat of any kind, also between friends;
  - uploads of pictures, video or voice, or a profile picture;
  - a public profile, a leaderboard, a league or a tournament;
  - a handle search or a list of followers;
  - a change in the preset list that adds a free field, a number or a link.

## Open points

- The owner decides whether the handle blocklist includes names of other apps (for example, messaging apps) to lower the contact-hint risk. A longer blocklist blocks some honest handles.
- The preset list is not final. When ticket 02 fixes it, copy it into the record of measures (M01) and check that no preset holds a free field, number or link.
- The lawyer decides whether a preset to one opponent counts as a direct message. This draft assumes yes.
- The lawyer decides whether the website link game is a user-to-user service. In that game, the whole game travels in a link, and no server checks it. The research report is not sure.

## Sign-off

| Role | Name | Date | Note |
|---|---|---|---|
| Accountable person (owner) | [owner fact] | | |
| Lawyer | [owner fact] | | |

## Facts only the owner can supply

- [ ] The legal name of the provider and its place of establishment.
- [ ] The number of users, and the number in the UK, today and at each review.
- [ ] Whether the UK is a target market (language, marketing, UK sign-ups).
- [ ] The first day that UK users could use the service, and the three-month dates.
- [ ] Any incident of harm so far, or a statement that there is none.
- [ ] Revenue plans (the Ofcom business model factor).
- [ ] The accountable person.
- [ ] The decision on the handle blocklist and on the final preset list.

## Sources

- [Online Safety Act 2023, section 3](https://www.legislation.gov.uk/ukpga/2023/50/section/3) (user-to-user service)
- [Section 4](https://www.legislation.gov.uk/ukpga/2023/50/section/4) (links with the UK)
- [Section 9](https://www.legislation.gov.uk/ukpga/2023/50/section/9) (illegal content risk assessment)
- [Section 23](https://www.legislation.gov.uk/ukpga/2023/50/section/23) (record keeping)
- [Section 55](https://www.legislation.gov.uk/ukpga/2023/50/section/55) (regulated user-generated content)
- [Section 236](https://www.legislation.gov.uk/ukpga/2023/50/section/236) (definitions of content and identifying content)
- [Schedule 1](https://www.legislation.gov.uk/ukpga/2023/50/schedule/1) (exempt services)
- [Ofcom: Risk Assessment Guidance and Risk Profiles, V2.0, 25 June 2026](https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/updates/risk-assessment-guidance-and-risk-profiles.pdf) (the four steps, Table 9, Table 10, Table 13.3, Table 15)
- [Ofcom: Illegal content duties under the Online Safety Act](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/illegal-content-duties-under-the-online-safety-act) (record template)
- [Ofcom: Illegal Content Codes of Practice for user-to-user services, 9 September 2026](https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/detecting-intimate-image-abuse/illegal-content-codes-of-practice-for-user-to-user-services-9sep2026.pdf?v=425251)
- [Ofcom: The Online Safety Act and gaming](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/the-online-safety-act-and-gaming-know-the-risks-know-the-rules-know-how-to-comply)
- [Ofcom: Overview of regulated services](https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/overview-of-regulated-services.pdf)
- [Ofcom: Guide for services](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/guide-for-services)
- [Ofcom: 4chan investigation](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/investigation-into-4chan-and-its-compliance-with-duties-to-protect-its-users-from-illegal-content)
