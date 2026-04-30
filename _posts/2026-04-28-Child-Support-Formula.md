---
layout: post
title: Australian Child Support Formula 
description: 
date: 2026-04-28 11:12:30 +1000
tags: 
---


## Why a Formula instead of the Courts?

Before the late 1980s (in Australia and many similar jurisdictions), child support was largely handled by the court system. While this sounds fair in theory, in practice, it created several "pain points" that the modern formula was designed to fix:

*   **Consistency:** Previously, two families in nearly identical financial situations could end up with vastly different support amounts depending on which judge they saw. A formula ensures everyone is measured by the same yardstick.
*   **The "Cluttered Court" Problem:** Using judges for every single support case is incredibly slow and expensive. It forced parents into an adversarial "battle" rather than a simple administrative process.
*   **Predictability:** A formula allows parents to plan their lives. You can run the numbers yourself and know exactly what your obligations or entitlements will be, rather than waiting months for a court date.

In short, the formula moved child support from a **legal dispute** to an **administrative calculation**.

---

## How the Formula Actually Works

Modern formulas (specifically the one used by Services Australia) are built on the **"Income Shares"** model. It assumes that as parental income rises, the total spending on children increases, but the *percentage* of income spent on children actually decreases.

### The Basic Equation
The formula determines the "Cost of the Children" based on the parents' combined income, then splits that cost based on each parent's share of that income and their level of care.

The basic "Support Amount" ($S$) can be expressed as:

$$S = ((\text{Income}\% - \text{Care}\%) \times \text{COC})$$

Where:
*   **$\text{Income}\%$** is the **Income Percentage** (your share of the combined parental income).
*   **$\text{Income}\%$** is the **Care Percentage** (your share of caring for the chilren over the year).
*   **$COC$** is the **Cost of Children** (a dollar amount determined by government tables based on the children's ages and total combined income).

If you have 60% of the income and 60% of the care then there is no exchange, you and your partner are equally meeting the costs of the child by looking after them. 

If you have 80% of the income and 60% of the care then you need to transfer 20% of the cost of the children to your partner. This is because they have 20% of the income and 40%, their care percentage is in excess of their income percentage. 

If you want to explore in more detail how it works I've made a claculator which goes into all the gory details [calculator](https://cherianb59.github.io/static/cs.html). It has all the inputs required for the assessment along with charts which show how the assessment changes as your income increases, and there is also a section if you want to adjust the costs of the children rates.

---

## Pros and Cons of the Formula System

While the formula is efficient, it is often a point of contention for both paying and receiving parents.

### The Pros
*   **Objectivity:** It removes the "he-said, she-said" from the financial aspect of a breakup. The numbers are based on tax returns and proven care arrangements.
*   **Efficiency:** Assessments are usually issued within weeks, not the months or years a court case might take.
*   **Adaptability:** If you lose your job or your income drops, the formula can be recalculated quickly to reflect your new reality.

### The Cons
*   **The "One Size Fits All" Trap:** The formula assumes "standard" costs. It doesn't account for high medical needs, expensive private school fees, or a parent's significant personal debts.
*   **The "Cliff" Effect:** Sometimes, changing your care by just one or two nights can result in a massive jump or drop in the money exchanged. This can lead to parents "fighting for nights" for financial reasons.
*   **Incentive Issues:** Some argue that the formula can discourage a parent from taking a promotion or working overtime, as a large chunk of that extra income might be offset by an increase in support payments.


# Child Support Calculator API


`cs_api.html` [`cs_api.html`](https://cherianb59.github.io/static/cs_api.html) is a client-side JSON API. All inputs are passed as URL query parameters; the page returns a single JSON object with no HTML. There is no server — it runs entirely in the browser.

## Base URL

```
cs_api.html?<parameters>
```

Open the file directly in a browser, or serve it from any static file host.

---

## Parameters

### Required

| Parameter | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `year` | integer | 2008–2026 | Financial year (start year). E.g. `2026` means the 2025–26 financial year. |
| `numkids` | integer | 1–5 | Number of children shared with the other parent. |
| `a_ati` | number | ≥ 0 | Parent A adjusted taxable income (pre-tax, last financial year). |
| `b_ati` | number | ≥ 0 | Parent B adjusted taxable income (pre-tax, last financial year). |
| `kid{n}_age` | integer | 0–17 | Age of child *n* (n = 1 … numkids). E.g. `kid1_age`, `kid2_age`. |
| `kid{n}_cn` | integer | 0–365 | Parent A's nights of care per year for child *n*. E.g. `kid1_cn`. |

### Optional (default: 0)

| Parameter | Constraints | Description |
|-----------|-------------|-------------|
| `a_othercase_n` | 0–20 | Parent A's number of other child support cases. |
| `a_othercase_12l` | 0–20 | Children aged ≤12 in Parent A's other CS cases. |
| `a_othercase_13p` | 0–20 | Children aged 13+ in Parent A's other CS cases. |
| `a_reldep_12l` | 0–20 | Non-CS children aged ≤12 in Parent A's current relationship. |
| `a_reldep_13p` | 0–20 | Non-CS children aged 13+ in Parent A's current relationship. |
| `a_oth_lsc` | 0–20 | Other CS children where Parent A has fewer than 128 nights/year care. |
| `a_isp` | 0 or 1 | Parent A received income support last financial year (1 = yes). |
| `b_othercase_n` | 0–20 | Parent B's number of other child support cases. |
| `b_othercase_12l` | 0–20 | Children aged ≤12 in Parent B's other CS cases. |
| `b_othercase_13p` | 0–20 | Children aged 13+ in Parent B's other CS cases. |
| `b_reldep_12l` | 0–20 | Non-CS children aged ≤12 in Parent B's current relationship. |
| `b_reldep_13p` | 0–20 | Non-CS children aged 13+ in Parent B's current relationship. |
| `b_oth_lsc` | 0–20 | Other CS children where Parent B has fewer than 128 nights/year care. |
| `b_isp` | 0 or 1 | Parent B received income support last financial year (1 = yes). |

> **Note on Parent B care nights:** Parent B's care nights for each child are derived as `365 − kid{n}_cn`; there is no separate `b_kid{n}_cn` parameter.

---

## Response format

All responses are JSON with the following top-level fields:

### Success

```json
{
  "version": "1.0.0",
  "result": "success",
  "inputs": { ... },
  "base_values": { ... },
  "intermediates": { ... },
  "entitlement": { ... }
}
```

| Field | Description |
|-------|-------------|
| `version` | API version string. |
| `result` | `"success"` |
| `inputs` | Echo of all parsed input parameters. |
| `base_values` | Legislative values for the requested year: `mtawe`, `ssa`, `far`, `pps`, `mar`. |
| `intermediates` | Full step-by-step formula workings (see below). |
| `entitlement` | Final result: `liability_a_to_b` (integer, dollars/year) and a human-readable `description`. |

`liability_a_to_b` is positive when Parent A owes Parent B, negative when Parent B owes Parent A, and zero when no child support is payable.

### Error

```json
{
  "version": "1.0.0",
  "result": "error",
  "error": {
    "code": "MISSING_PARAMETER",
    "parameter": "a_ati",
    "reason": "Required parameter \"a_ati\" is missing"
  }
}
```

| Error code | Meaning |
|------------|---------|
| `NO_PARAMETERS` | No query string provided (also returns a parameter reference). |
| `MISSING_PARAMETER` | A required parameter was not supplied. |
| `INVALID_PARAMETER` | A parameter was supplied but failed type or range validation. |
| `CALCULATION_ERROR` | An unexpected error occurred in the formula engine. |

### Intermediates structure

```
intermediates
├── parent_a
│   ├── ati_less_ssa            — ATI after self-support amount deduction
│   ├── relationship_dep_coc    — cost-of-children deduction for relationship dependants
│   ├── ati_less_reldep         — ATI after both deductions
│   ├── allcases_nchild         — total children across all CS cases
│   ├── mc_cost_per_child_12l   — multi-case per-child cost (children ≤12)
│   ├── mc_cost_per_child_13p   — multi-case per-child cost (children 13+)
│   ├── multicase_cost          — total multi-case deduction
│   ├── child_support_income    — final child support income (CSI)
│   ├── income_pct              — share of combined CSI
│   ├── allchild_lsc            — total children in low-shared-care
│   ├── unit_far                — fixed annual rate (FAR) per child
│   ├── mar                     — minimum annual rate (MAR)
│   └── mar_eligible            — true if eligible for MAR floor
├── parent_b                    — same fields as parent_a
├── combined_csi                — Parent A CSI + Parent B CSI (rounded)
├── eligible_kids_12l           — shared children aged ≤12
├── eligible_kids_13p           — shared children aged 13+
├── basic_cost_of_children      — total cost of children from combined CSI
├── basic_coc_per_child         — basic cost of children divided by numkids
├── multi_case_flag             — true if either parent has other CS cases
├── a_total_before_mar          — Parent A gross liability before MAR floor
└── per_child[]                 — one entry per child:
    ├── child_number, age
    ├── a_care_nights, b_care_nights
    ├── a_care_pct, b_care_pct     — fraction of year
    ├── a_cost_pct, b_cost_pct     — care-to-cost lookup result
    ├── a_cs_pct, b_cs_pct         — child support percentage
    ├── a_mc_cap, b_mc_cap         — multi-case liability cap
    ├── a_formula_liability, b_formula_liability
    ├── a_far_applied, b_far_applied
    └── a_final_liability, b_final_liability
```

---

## Examples

### 1. Simple — one child, equal incomes, majority care to Parent A

Parent A earns $80,000, Parent B earns $60,000, one child aged 8. Parent A has 250 nights of care (68%).

```
cs_api.html?year=2026&numkids=1&kid1_age=8&kid1_cn=250&a_ati=80000&b_ati=60000
```

```json
{
  "version": "1.0.0",
  "result": "success",
  "inputs": {
    "year": 2026,
    "numkids": 1,
    "children": [{ "child_number": 1, "age": 8, "a_care_nights": 250 }],
    "parent_a": { "ati": 80000, ... },
    "parent_b": { "ati": 60000, ... }
  },
  "entitlement": {
    "liability_a_to_b": -3241,
    "description": "Parent B owes Parent A $3,241 per year"
  }
}
```

---

### 2. Two children, different ages, shared care

Two children aged 5 and 14. Parent A earns $120,000, Parent B earns $45,000. Parent A has 182 nights (50%) for each child.

```
cs_api.html?year=2026&numkids=2&kid1_age=5&kid1_cn=182&kid2_age=14&kid2_cn=182&a_ati=120000&b_ati=45000
```

---

### 3. Parent A on income support

Parent A earns $18,000 and received Parenting Payment last year. Parent B earns $95,000. One child aged 3, Parent A has 183 nights.

```
cs_api.html?year=2026&numkids=1&kid1_age=3&kid1_cn=183&a_ati=18000&b_ati=95000&a_isp=1
```

---

### 4. Multi-case — Parent A has children from another relationship

Parent A earns $100,000 and has 1 other CS case with 2 children aged ≤12. Parent B earns $70,000. One shared child aged 10, Parent A has 130 nights.

```
cs_api.html?year=2026&numkids=1&kid1_age=10&kid1_cn=130&a_ati=100000&b_ati=70000&a_othercase_n=1&a_othercase_12l=2
```

---

### 5. Historical year

Same scenario as example 1 but for the 2022–23 financial year (`year=2023`).

```
cs_api.html?year=2023&numkids=1&kid1_age=8&kid1_cn=250&a_ati=80000&b_ati=60000
```

---

### 6. Error — missing required parameter

```
cs_api.html?year=2026&numkids=1&kid1_age=8&kid1_cn=200&a_ati=80000
```

```json
{
  "version": "1.0.0",
  "result": "error",
  "error": {
    "code": "MISSING_PARAMETER",
    "parameter": "b_ati",
    "reason": "Required parameter \"b_ati\" is missing"
  }
}
```

---

### 7. Error — invalid year

```
cs_api.html?year=2003&numkids=1&kid1_age=8&kid1_cn=200&a_ati=80000&b_ati=50000
```

```json
{
  "version": "1.0.0",
  "result": "error",
  "error": {
    "code": "INVALID_PARAMETER",
    "parameter": "year",
    "reason": "Parameter \"year\" must be one of 2008, 2009, ..., 2026, got 2003"
  }
}
```

---

## Notes

- The formula is the Australian Child Support formula as legislated under the *Child Support (Assessment) Act 1989*. Results are indicative only and may differ from an official assessment.
- Parent B's care nights are assumed to be `365 − kid{n}_cn`. The formula does not accept a separate Parent B care parameter.
- Income band breakpoints and taper rates are fixed at the 2022 baseline defaults. The formula uses the legislative base values (`mtawe`, `ssa`, `far`, `pps`, `mar`) for the selected financial year.
- All monetary intermediates are rounded to 2 decimal places. The final `liability_a_to_b` is rounded to the nearest dollar.
---