DRAFT — not legal advice; the owner and a lawyer must check it

# UK children's risk assessment (outline for phase 1)

Version 0.1, 2026-10-10. Ticket: [05 — Safety documents: drafts](../specs/accounts-multiplayer/issues/05-safety-drafts.md). Report: [part 01, section 5.7](../research/multiplayer-2026-10-10/01-user-journey.md) and [part 03, section 8.10](../research/multiplayer-2026-10-10/03-technical.md).

## What this record is

A service that children are likely to use must assess the risk of harm to children (Online Safety Act, section 11). The [children's access assessment](uk-childrens-access-assessment.md) proposes that King Down is such a service. The first children's risk assessment is due three months after that conclusion (Ofcom guidance, paragraph 2.21).

This file is an outline. It gives the structure of Ofcom's four steps and a first-pass answer for each kind of content. It also lists the evidence that the owner must collect before the first player beyond the testers. Finish it before the phase 1 launch. Repeat it before each significant change.

Scope: phase 1 (Daily friend games on the website and in ChatGPT, handles, preset icons, preset messages, Follow, block, reports). The private ChatGPT play of today has no handle, no message and no profile. It carries none of the risks below, except that children can use it.

Related files: [illegal content risk assessment](uk-illegal-content-risk-assessment.md), [record of measures](uk-record-of-measures.md), [terms](terms-draft.md). Measure names such as M01 point to the record of measures.

## What is in scope

The children's duties cover content that users make or send. King Down has three kinds of user content: handles, the choice of a preset phrase, and moves. King Down's own art, rules and text are provider content. Ofcom's gaming guide leaves out content that the studio makes. A lawyer must confirm this reading.

## Step 1: Understand the content harmful to children

Ofcom's Table 1 lists four kinds of primary priority content and eight kinds of priority content. Each needs its own risk level. Ofcom also asks the provider to look for non-designated content.

**Rule for the first pass.** A kind gets "Low" when a handle can carry an encouragement of it. A kind gets "Negligible" when it needs a picture, a video or long text. A preset cannot carry any kind. All first-pass levels are proposals.

| # | Kind of content | How it could reach a child on King Down | Controls | First pass | Evidence to collect |
|---|---|---|---|---|---|
| P1 | Pornographic content (primary priority) | Not possible. It needs a picture, video or long text. | M02 | Negligible | A check that no field takes a picture, a video or long text |
| P2 | Content that encourages, promotes or gives instructions for suicide (primary priority) | A handle tells a person to end their life | M04, M07, M09 | Low | Report counts by reason; the handle blocklist test |
| P3 | Content that encourages, promotes or gives instructions for deliberate self-injury (primary priority) | A handle encourages self-harm | M04, M07, M09 | Low | Same |
| P4 | Content that encourages, promotes or gives instructions for an eating disorder (primary priority) | A handle encourages disordered eating | M04, M07, M09 | Low | Same |
| C1 | Abusive content that targets race, religion, sex, sexual orientation, disability or gender reassignment | A handle holds abuse | M04, M07, M09 | Low | Same |
| C2 | Content that incites hatred against people of those groups | A handle incites hatred | M04, M07, M09 | Low | Same |
| C3 | Content that encourages, promotes or gives instructions for serious violence against a person | A handle threatens or urges violence | M04, M07, M09 | Low | Same |
| C4 | Bullying content | A handle targets one person; repeated invitations or challenges; Follow used to track a person | M04 to M07, M21 | Low | Same, with the counts of blocks |
| C5 | Content that depicts real or realistic serious violence or injury to a person | Not possible. It needs a picture or video. | M02 | Negligible | As P1 |
| C6 | Content that depicts serious violence or injury to an animal or a fictional creature | Not possible for user content. King Down's own fantasy art is provider content. | M02 | Negligible | A lawyer's view on the game art |
| C7 | Content that encourages the ingestion, inhalation or exposure of harmful substances | A handle encourages it | M04, M07 | Low | Report counts |
| C8 | Content that encourages dangerous stunts and challenges | A handle encourages it | M04, M07 | Low | Report counts |
| N1 | Non-designated content: Ofcom names depression content and body stigma content | A handle carries it. A handle is too short for most of this content. | M04, M07 | Negligible | Report counts. Tell Ofcom if the service finds any. |

Grooming is not a "content harmful to children" kind, but it is the main child-safety risk in games. The [illegal content risk assessment](uk-illegal-content-risk-assessment.md), section "Grooming", rates it and gives the reasons. Use the same reasons here.

### Risk factors (Ofcom's Children's User-to-User Risk Profile)

Ofcom's questions are in Figure 1 of its guidance. Answers for phase 1:

| Question | Answer |
|---|---|
| 1c Gaming service | Yes |
| 2a Profiles that show identifying information | Yes: a handle and an icon only |
| 2b Anonymous users or users without an account | Partly: handles are aliases. No guests in phase 1. |
| 3a Users can connect with other users | Yes: Follow and block. No public list of followers or follows (M05). |
| 3b Groups or group messages | No |
| 4a, 4c, 4d, 4e Livestreaming, comments, images or video, reposting | No |
| 4b Direct messaging | Possible: a preset to one opponent can count as a direct message |
| 5a, 5b Search for user content, content tagging | Only if a handle lookup exists. [check with ticket 08] |
| 6 Content recommender systems | No |
| 7 Features that raise engagement (for example, notifications and alerts) | Yes: the Daily "your turn" email and the 80% reminder. The design limits them. There is one turn email until the player returns. There is no alert while the player looks at the game. Each event has a setting, and quiet mode exists (M05). |
| General: user base age | Children likely. King Down holds no ages. |
| General: other user base demographics | [owner fact] |
| General: business model | Free, no ads, no sale of data. [owner fact: revenue plans] |
| General: commercial profile | [owner fact: size, UK user numbers] |

## Step 2: Assess the risk of harm to children

To complete before launch:

- [ ] Judge likelihood and impact for each row above. Use Ofcom's Risk Level Table for content harmful to children. Write the evidence and the reason for each level.
- [ ] Record how the service treats different age groups of children. The design is the same for all ages: no free text, no images, no profile data that shows age. The minimum age in the terms is 13. Younger children can still join, because King Down asks no age.
- [ ] Record the controls that already work, and what each one does (M01 to M12, M20, M21).
- [ ] List the design features that raise the risk. Ofcom names recommender systems, features that let adults find or contact children, and features that raise use. King Down has none of the first two in phase 1. It has the alerts above.
- [ ] Read the first reports from testers and add them as evidence. Ofcom treats user complaints as a core input.

## Step 3: Decide measures, implement and record

The [record of measures](uk-record-of-measures.md) lists the measures of Ofcom's Protection of Children Code (4 July 2025). They apply to every service that children are likely to use. It says what King Down does for each one. The measure IDs in the Code are PCU A2, C1, C2, D1, D2, D7, D9, D10, D13, D14, G1 and G3. They cover the accountable person, moderation, complaints and appeals, and the terms.

### Age assurance

A service needs highly effective age assurance in four cases. It allows the worst kinds of content. It exists to host them. It cannot remove them. Or it recommends them. The Act removes the duty when the terms clearly ban primary priority content and the ban applies to all users (section 12). To keep this position:

- the [terms](terms-draft.md) ban pornography and content that encourages suicide, self-harm or eating disorders, for every user;
- the owner can rename, hide or remove any handle, and can end an account (M10);
- King Down asks no age and holds no self-declared age. A self-declared age can bring Ofcom's child safety defaults (ICU F1 and F2) into force when the grooming risk is high.

## Step 4: Report, review and update

- The accountable person reads and signs the record. [owner fact: name, date]
- Review at least every 12 months, and when Ofcom changes the Children's Risk Profiles.
- Write a new assessment before each significant change. The triggers are the list in the [illegal content risk assessment](uk-illegal-content-risk-assessment.md), "Step 4", plus any new alert, streak or reward that raises use.
- A provider of a user-to-user service must tell Ofcom about any non-designated content that it finds. Keep a note of each find.

## Facts only the owner can supply

- [ ] The date when the children's access assessment concludes (it starts the three-month clock).
- [ ] The accountable person.
- [ ] The number and ages of players, as far as King Down knows them.
- [ ] Revenue plans, size and UK user numbers (Ofcom's general risk factors).
- [ ] The lawyer's view on the game art as provider content.
- [ ] The decision on a handle lookup (a risk factor if it exists).
- [ ] The first reports from testers, as evidence.

## Sources

- [Online Safety Act 2023, section 11](https://www.legislation.gov.uk/ukpga/2023/50/section/11) (children's risk assessment duties)
- [Section 12](https://www.legislation.gov.uk/ukpga/2023/50/section/12) (safety duties to protect children; the age assurance rule)
- [Section 55](https://www.legislation.gov.uk/ukpga/2023/50/section/55) (regulated user-generated content)
- [Ofcom: Children's Risk Assessment Guidance and Children's Risk Profiles, 24 April 2025](https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/childrens-risk-assessment-guidance-and-childrens-risk-profiles.pdf?v=396653) (Table 1, the four steps, Figure 1, paragraph 2.21)
- [Ofcom: Protection of children duties under the Online Safety Act](https://www.ofcom.org.uk/online-safety/protecting-children/protection-of-children-duties-under-the-online-safety-act) (page last updated 1 April 2026: non-designated content, deadlines, review rule)
- [Ofcom: Protection of Children Code of Practice for user-to-user services, 4 July 2025](https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/protection-of-children-code-of-practice-for-user-to-user-services.pdf?v=403579)
- [Ofcom: Illegal Content Codes of Practice for user-to-user services, 9 September 2026](https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/detecting-intimate-image-abuse/illegal-content-codes-of-practice-for-user-to-user-services-9sep2026.pdf?v=425251) (ICU F1 and F2)
- [Ofcom: The Online Safety Act and gaming](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/the-online-safety-act-and-gaming-know-the-risks-know-the-rules-know-how-to-comply) (studio content is out of scope)
- [Ofcom: Children's access assessment duties under the Online Safety Act](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/childrens-access-assessment-duties-under-the-online-safety-act)
- [ICO: Age appropriate design, a code of practice for online services](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/) (default settings and nudge techniques also bear on the alerts)
