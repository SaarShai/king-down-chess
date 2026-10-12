DRAFT — not legal advice; the owner and a lawyer must check it

# UK children's access assessment (draft record)

Version 0.1, 2026-10-10. Ticket: [05 — Safety documents: drafts](../specs/accounts-multiplayer/issues/05-safety-drafts.md). Report: [part 01, section 5.7](../research/multiplayer-2026-10-10/01-user-journey.md) and [part 03, section 8.10](../research/multiplayer-2026-10-10/03-technical.md).

## What this record is

Each user-to-user service under the UK Online Safety Act must decide if children are likely to use it. Ofcom calls this the children's access assessment. In the Act, a child is a person under 18.

Ofcom asks for two stages. The provider records the result in all cases. A "yes" starts the [children's risk assessment](uk-childrens-risk-assessment.md) and the child safety measures.

This record covers the whole of King Down. The website and the ChatGPT plugin count as one service (see the [illegal content risk assessment](uk-illegal-content-risk-assessment.md), "What this record is"). It covers today's private friend play and phase 1. Phase 1 has Daily friend games, handles, preset messages and reports.

## Dates

| Item | Date |
|---|---|
| First day UK users could use the service | [owner fact] |
| Deadline for this assessment: three months from that first day (for services that came into scope after 16 January 2025) | [owner fact: first day plus three months] |
| Deadline for the children's risk assessment: three months after this assessment concludes that children are likely to use the service | [owner fact: date of conclusion plus three months] |
| This assessment completed on | [owner fact] |

## Stage 1: Can children access the service?

Ofcom's test is strict. A provider can say that children cannot access the service only in one case. The provider must use highly effective age assurance. It must also use access controls that block anyone who is not verified as an adult. Terms that say "adults only", a self-declared age and a payment method do not count.

| Fact | King Down |
|---|---|
| Highly effective age assurance | None. The report recommends none. |
| Access control that blocks users not verified as adults | None. |
| Terms | The terms state a minimum age of 13. They do not count for this test. |
| Self-declared age | King Down asks no age and holds none. |
| Payment | None. The game is free. |

**Result: children can access the service.** Go to Stage 2.

Do not change the minimum age in the terms to 18 to avoid the children's duties. Without highly effective age assurance, it does not work.

## Stage 2: The child user condition

The condition is met in either of two cases. In the first, a significant number of children use the service. In the second, the service is of a kind that is likely to attract a significant number of children. The Act gives no number. Ofcom advises:

- err on the side of caution;
- a relatively small number or percentage of children can be a significant number;
- a service for young people aged 15 to 17 meets the condition;
- Ofcom's list of content that appeals to children includes games.

### Evidence

| Question | Facts | Source |
|---|---|---|
| How many children use King Down? | [owner fact: user numbers; King Down holds no ages, so give the best estimate and say how you made it] | Owner |
| Does the service benefit children? | Chess is a game that many children play. King Down has lessons that teach the rules (the `lessons` data in the account). | Repository; [owner fact: confirm] |
| Does the content or design appeal to children? | A painted board, fantasy pieces and kings with powers. Ofcom lists bright, bold colours and characters as a design that attracts children. | Repository; Ofcom guidance |
| Are children part of the commercial strategy? | None known. The game has no ads and no sale. The report says: no marketing to children. [owner fact: any school, family or youth marketing] | Report, part 01, section 5.7 |
| Which users can the ChatGPT surface reach? | OpenAI requires a plugin to suit general audiences, including ages 13 to 17, and not to target children under 13. So 13-to-17-year-olds can use the plugin. | OpenAI app submission guidelines (read by the research checker on 2026-10-10) |
| Does the privacy page say who the game is for? | Yes: "King Down is for everyone", with a parent's permission for children under 13 (live page, 3 October 2026). | `public/privacy.html` |

### Result (proposed)

**The child user condition is met. Children are likely to use King Down.** The reasons:

- the game is of a kind that Ofcom lists;
- the design uses characters and colour;
- the plugin audience includes ages 13 to 17;
- Ofcom asks providers to err on the side of caution.

## What follows from the result

1. Write the [children's risk assessment](uk-childrens-risk-assessment.md) within three months. Ofcom's guidance for the children's risk assessment says the same (paragraph 2.21).
2. Apply the core measures of Ofcom's Protection of Children Code. They apply to all services that children are likely to use. The [record of measures](uk-record-of-measures.md) lists them.
3. Highly effective age assurance is not needed if the terms ban the worst content for all users and the service can remove it. The [terms draft](terms-draft.md) bans it. See the children's risk assessment, "Age assurance".
4. Keep this assessment under review. Ofcom states the repeat rule for a "not likely" result: repeat within 12 months. This record has a "likely" result, so no repeat is due. Review it with the other records each year, and before any change that adds an age signal or marketing to children.

## Children under 13

The terms state a minimum age of 13. King Down asks no age, so it cannot stop an under-13 from joining. When a parent or another person reports a player under 13, the owner deletes the account (M22 in the [record of measures](uk-record-of-measures.md)).

The UK GDPR, the ICO Children's Code and the US children's privacy law (COPPA) apply to children's data. They are outside Ofcom's duties. A lawyer must check them. The live privacy page says that children under 13 need a parent's permission to sign in. That text must change to match a minimum age of 13.

## Records to keep

Ofcom asks the provider to record:

- the outcome, in all cases;
- the steps taken and the evidence, when the child user condition is not met (not our case);
- the date, and the name of the person who approved the assessment.

| Role | Name | Date |
|---|---|---|
| Accountable person (owner) | [owner fact] | |
| Lawyer | [owner fact] | |

## Facts only the owner can supply

- [ ] The first day that UK users could use the service.
- [ ] The number of users, and the best estimate of the number of children, with the method.
- [ ] Any marketing to schools, families or young people.
- [ ] Confirmation that the lessons are meant for beginners of all ages.
- [ ] The minimum age (13) after the lawyer's check.
- [ ] The name of the accountable person.

## Sources

- [Ofcom: Children's access assessment duties under the Online Safety Act](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/childrens-access-assessment-duties-under-the-online-safety-act) (page last updated 29 June 2026: the two stages, the dates, the repeat rule, the records)
- [Ofcom: Children's access assessments guidance, 24 April 2025](https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/childrens-access-assessments-guidance.pdf?v=396655) (the "err on the side of caution" text, Table 7 and the 15-to-17 rule)
- [Ofcom: Children's Risk Assessment Guidance and Children's Risk Profiles, 24 April 2025](https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-1-10-weeks/statement-protecting-children-from-harms-online/main-document/childrens-risk-assessment-guidance-and-childrens-risk-profiles.pdf?v=396653) (paragraph 2.21: three months after the access assessment)
- [Ofcom: Protection of children duties under the Online Safety Act](https://www.ofcom.org.uk/online-safety/protecting-children/protection-of-children-duties-under-the-online-safety-act) (page last updated 1 April 2026)
- [Ofcom: The Online Safety Act and gaming](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/the-online-safety-act-and-gaming-know-the-risks-know-the-rules-know-how-to-comply)
- [OpenAI: App submission guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines) (ages 13 to 17; not a regulator; it shows the ChatGPT audience)
- [ICO: Age appropriate design, a code of practice for online services](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/) (children's data)
- [FTC: Complying with COPPA, frequently asked questions](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) (children under 13 in the US)
