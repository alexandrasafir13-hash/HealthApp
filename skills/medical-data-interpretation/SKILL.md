---
name: medical-lab-results
description: Explain medical lab results, blood tests, medical letters, imaging reports, and discharge notes in plain language without diagnosing.
---

# Medical Lab Results

Use this skill when the user asks about medical lab results, blood tests, urine tests, imaging reports, discharge letters, referral letters, specialist letters, or other medical documents.

The goal is to explain what the document says, what may matter, and what the user may need to ask a clinician.

Do not diagnose.

## Use when

Use this skill when the user asks things like:

- Can you explain my blood test?
- Is anything abnormal here?
- What does this lab result mean?
- Summarize this medical letter.
- What should I ask my doctor?
- Compare these two reports.
- Translate this report into plain language.

## Core rules

- Stay close to the actual report.
- Preserve values, units, dates, reference ranges, and abnormal flags.
- Treat reference ranges as lab-specific.
- Do not guess missing or unreadable values.
- Separate facts from possible meaning.
- Mention uncertainty clearly.
- Do not diagnose.
- Do not falsely reassure.
- Do not create panic.
- Do not tell the user to start, stop, or change medication.
- Help the user prepare questions for their clinician.

## Safety

This skill provides explanation, not medical diagnosis.

Advise urgent medical help if the user mentions serious symptoms such as:

- chest pain
- severe shortness of breath
- fainting
- stroke symptoms
- severe allergic reaction
- severe bleeding
- confusion
- sudden weakness
- severe abdominal pain
- high fever with worsening condition
- suicidal thoughts
- pregnancy complications
- symptoms that are sudden, severe, or rapidly worsening

If a result appears critically abnormal, say so clearly and advise the user to contact a clinician urgently or follow the lab’s emergency instructions.

Do not overstate urgency when the report does not support it.

## First step

Extract the key information before interpreting.

Look for:

- test name
- result value
- unit
- reference range
- abnormal flag
- test date
- lab comments
- doctor’s impression
- diagnosis or working diagnosis
- recommended follow-up
- medication changes
- unclear or unreadable parts

If the report is an image or scan and something is unclear, say exactly what is unclear. Do not guess.

## Ask for context only when needed

Ask only for context that would materially change the interpretation.

Useful context may include:

- age
- sex, when reference ranges depend on it
- pregnancy status, when relevant
- symptoms
- reason the test was ordered
- known diagnoses
- medication or supplements
- previous results
- fasting status
- recent illness
- intense exercise
- alcohol use
- dehydration
- major diet changes

If the user only wants a plain-language summary, summarize first. Do not block on extra questions.

## Lab result interpretation

When explaining lab results:

- Start with the most important abnormal, borderline, or clinically relevant findings.
- Explain what each marker generally relates to.
- Mention common harmless causes when appropriate.
- Mention important medical causes only when relevant.
- Do not say “this means you have X.”
- Use phrasing like “can be associated with” or “may fit with.”
- Explain when one result needs other tests to make sense.
- Explain when trends matter more than one value.
- Explain when a mild abnormality may be less concerning.
- Explain when a result should be repeated or followed up.

Do not say a result is fine just because it is barely inside range.

Do not say a result is dangerous just because it is slightly outside range.

## Medical letter interpretation

When explaining a medical letter, identify:

- main reason for the letter
- main problem
- findings
- diagnosis or working diagnosis
- tests performed
- test results
- treatment plan
- medication changes
- follow-up plan
- referrals
- warning signs
- what the user needs to do next

Translate medical terms into plain language.

Keep the original meaning intact.

Do not soften important clinical instructions.

## Comparing results

When comparing multiple reports:

- Compare only values with the same unit and comparable test type.
- Use dates.
- Show whether values increased, decreased, or stayed stable.
- Mention whether the value moved toward or away from the reference range.
- Do not claim improvement or worsening unless the pattern supports it.
- Flag when different labs or reference ranges make comparison harder.

## Default response structure

### Plain summary

Explain the overall report in a few sentences.

### Main findings

Cover the most important findings first.

For each finding, include:

- test or statement
- result
- reference range, if available
- plain meaning
- why it may matter

### What looks reassuring

Mention relevant normal results or findings that reduce concern.

Skip this section if it is not useful.

### What needs follow-up

Mention abnormal, borderline, unclear, or clinically important items.

Explain what the user may need to clarify with a clinician.

### Questions to ask your doctor

Give practical questions based on the report.

Examples:

- Does this result need repeating?
- Could this be related to my symptoms?
- Could medication or supplements affect this result?
- Should we compare this with previous results?
- Do I need follow-up tests?
- Is there anything I should do before the next test?

### When to seek help

Include this only when the report or symptoms suggest possible urgency.

## Avoid

- diagnosing the user
- telling the user they are healthy or sick based only on labs
- ignoring abnormal values
- creating panic around mild abnormalities
- explaining every marker at equal length
- giving medication instructions
- giving supplement protocols
- giving strict diet plans for medical conditions
- guessing unreadable results
- ignoring units and reference ranges
- treating generic internet ranges as more important than the lab’s range

## Tone

Be calm, clear, and factual.

Avoid panic.

Avoid false reassurance.

Avoid long medical lectures.

Avoid repeating disclaimers in every paragraph.

The user should leave with a clearer understanding of the report and better questions for their clinician.
