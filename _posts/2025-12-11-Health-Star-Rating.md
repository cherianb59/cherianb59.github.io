---
layout: post
title: Health Star Rating
description: The Hidden Formula
date: 2025-12-11 11:12:30 +1000
tags: Life
---

I've been listening to the Hamish and Andy podcast for over 15 years. In the last few years they have taken potshots at the Austrlaian Health Star ratings. Health star ratings are a government led initiative to rate how healthy foods are. Food manufactures aren't compelled to label their products with the health star ratings however if they choose to play they cannot be selective with which products they label. THey either label all of them or none of them. 

Hamish and Andy have been flummoxed at how these ratings are calculated and tey often pointed out health star ratings that dont make any sense. Recently they found that the HSR calculator is available as a spreadsheet on the official site. https://www.healthstarrating.gov.au/calculator
There is a spreadhseet at the bottom of the page, which means we can get the formulas and figure out how it's calculated. 
Unfortunately the worksheet is password protected, however it's pretty easy to remove the [password](https://cherianb59.github.io/static/HSR Calculator 4.2.xlsm).

By removing the password, it's easy to see exactly how the points are calculated. Short version is that you lose points for more saturated fats and sugar, and you gain points for having more protein, fibre, fruits and vegetables.

I've reverse engineered the spreadsheet and converted it into a [calculator](https://cherianb59.github.io/static/hsr_calculator.html) and an [api](https://cherianb59.github.io/static/hsr.html?hsr_input=1&energy=500&saturated_fat=2&total_sugars=5&sodium=200&fibre=3&protein=4&concentrated_fruit_and_vegetable=10&FVNL=20). Just put in the parameters and feel free to copy the code yourself.

## Spreadsheet breakdown

The `HSR Calculator 4.2.xlsm` spreadsheet implements the Australian/New Zealand Health Star Rating (HSR) system, version 4.2. It is the authoritative source for lookup tables used by all implementations (Python notebooks, web UI). It allows batch calculation of HSR star ratings from nutritional data, producing a rating on a 1–5 star scale (displayed as 1–10 half-star increments internally).

The HSR system is a front-of-pack labelling scheme administered by the Australian and New Zealand Ministerial Forum on Food Regulation. Version 4.2 reflects amendments from the independent Five Year Review (agreed July 2020) plus minor tweaks in v4.1 (November 2020) and v4.2.

---

## Workbook Structure

| Sheet | Purpose |
|---|---|
| `Details and Instructions` | General usage instructions for the workbook |
| `Amendments history` | Version changelog (v3, v4, v4.1, v4.2) |
| `Points Table A` | Baseline points lookup tables for energy, saturated fat, total sugars, sodium |
| `Points Table C` | Modifying points lookup tables for FVNL%, fibre, protein |
| `Lookups` | FOPL calibration end-points, category mappings, star divisors, constants |
| `HSR Calculator` | Main data-entry and calculation sheet (up to ~1000 rows of foods) |
| `Non-Dairy Beverages ONLY Calc.` | Separate simplified calculator for non-dairy beverages (Category 1) |

---

## Inputs

All nutritional values are entered **per 100 g (or 100 mL)** of product. The main `HSR Calculator` sheet accepts:

| Column | Field | Unit | Precision | Notes |
|---|---|---|---|---|
| C | **HSR Category** | — | Drop-down | Must be selected from the list; see categories below |
| B | Row Number | — | Optional | User reference only |
| D | Food | — | Optional | Product name |
| E | Company | — | Optional | Manufacturer |
| F | **Energy** | kJ/100 g | Nearest whole kJ | |
| G | **Saturated Fat** | g/100 g | Nearest 0.1 g | |
| H | **Total Sugars** | g/100 g | Nearest 0.1 g | |
| I | **Sodium** | mg/100 g | Nearest 1 mg | |
| J | **Fibre** | g/100 g | Nearest 0.1 g | |
| K | **Protein** | g/100 g | Nearest 0.1 g | |
| L | **Concentrated Fruit & Vegetable** | % | — | Percentage of product that is *concentrated* FVNL (e.g. dried fruit, tomato paste) |
| M | **FVNL** | % | — | Percentage of product that is *non-concentrated* fruit, vegetable, nut or legume |

### FVNL Input Rules

The split between columns L and M matters:

- **Column L (Concentrated FVNL):** Enter only the concentrated FVNL component (e.g. dried fruit, tomato paste, juice concentrate). Concentrated ingredients are counted at double weight in the effective FVNL% calculation.
- **Column M (FVNL):** Enter the non-concentrated FVNL component (fresh or minimally processed fruit, vegetable, nut, or legume content).
- The spreadsheet also derives an **"All FVNL Concentrated?"** flag (column S): this is automatically set to `Yes` only when L > 0 and M = 0. The cell comment states: *"One should only answer 'Yes' where the concentrated fruit and vegetables are the **only** fruit, vegetable, nut and legume component. If the food contains a mixture of concentrated and unconcentrated FVNL sources, you must still answer 'No'."*
- Validation rule: `L * 2 + M` must not exceed 100%.

---

## Food Categories

Selected via a drop-down in column C. The cell comment on C1 provides the full taxonomy:

### Category 1 — Non-Dairy Beverages
> **Use the separate `Non-Dairy Beverages ONLY Calc.` tab.**

This category is **not handled** by the main HSR Calculator sheet. It uses a completely different algorithm (see below).

### Category 1D — Dairy Beverages
Milks, flavoured milk, and milk alternatives derived from legumes, cereals, nuts or seeds with **≥100 mg/100 mL calcium**.

*Healthy reference examples (≥4 stars):* Whole fruit juices, typically >67% FVNL, <13.6% total sugars.  
*Less healthy reference examples (≤1 star):* Beverages with 0% FVNL and sugars >13.6%.

### Category 2 — Foods
The broadest category, including all of:

- **Core Cereals** — Breads, buns, wraps, breakfast cereals, pasta, flour, rice, grains
- **Fruit** — Processed fruit. Note: minimally or unprocessed fruit, as defined in the Industry Guide, is eligible for an automatic 5-star HSR and does not need this calculator.
- **Protein** — Meats and fish (raw and processed), eggs, nuts (including spreads), plant protein foods (tofu, meat alternatives)
- **Vegetables** — Processed vegetables. Note: minimally or unprocessed vegetables are eligible for an automatic 5-star HSR.
- **Non-core foods** — Specialty bakery foods, cake mixes, biscuits, confectionery, desserts, dips, dressings, ice cream, meals/meal bases, pizza, sauces/condiments, salty and other snacks, soups/stocks, yeast spread

*Healthy reference examples (≥4 stars):* Whole grain foods, high fibre, with protein.  
*Less healthy reference examples (≤1 star):* Highly refined, high sugar, low fibre cereal foods.

### Category 2D — Dairy Foods
Soft or unripened cheese and analogues with calcium **<320 mg/100 g**; dairy foods with **>75% dairy ingredients**, including yoghurt, cream, cream cheese, fermented milk products, custard, dairy desserts, mascarpone, etc.

*Healthy reference examples (≥4 stars):* Low fat milks and alternatives (typically <2.1% sat fat and/or >3.1% protein).  
*Less healthy reference examples (≤1 star):* Full fat, sweetened, flavoured milks with protein <3.2%, sugar >9.1%.

### Category 3 — Fats, Oils
Fats, extracted oils, fat/oil based spreads.

*Healthy reference examples (≥4 stars):* Reduced fat cheese, reduced sodium.  
*Less healthy reference examples (≤1 star):* High sodium, high saturated fat cheese.

### Category 3D — Cheese
Cheese, processed cheese and analogues with calcium **≥320 mg/100 g**.

*Healthy reference examples (≥4 stars):* Lite yoghurt, cottage cheese.  
*Less healthy reference examples (≤1 star):* Regular fat yoghurt with sugar typically >9.1%.

---

## Calculation Flow (Main HSR Calculator)

The calculation proceeds in five stages. Intermediate results appear in the columns to the right of the inputs (columns N onwards).

### Stage 1 — NPSC Category Classification

Each HSR category maps to one of three underlying NPSC (Nutrient Profiling Scoring Criterion) groups:

| HSR Category | NPSC Category | NPSC Group |
|---|---|---|
| 1D — Dairy beverages | Beverages | 1 |
| 2 — Foods | Food | 2 |
| 2D — Dairy foods | Food | 2 |
| 3 — Fats, oils | Fats/Oils/Cheese | 3 |
| 3D — Cheese | Fats/Oils/Cheese | 3 |

The NPSC group number controls which version of Points Table A is used (Group 3 uses a different, linear table).

### Stage 2 — Effective FVNL% (Fruit, Vegetable, Nut & Legume Percent)

Before looking up Table C modifying points, the raw concentrated and non-concentrated FVNL inputs are combined into a single **effective FVNL%**:

```
FVNL% = 100 × (M + 2×L) / (M + 2×L + (100 − L − M))
```

where L = concentrated FVNL% and M = non-concentrated FVNL%. Concentrated ingredients are weighted at **2× their volume** because they represent a greater proportion of nutrients per gram. The result is rounded to the nearest whole percent (column U).

**Exception — All FVNL Concentrated flag:** If L > 0 and M = 0 (everything is concentrated), the FVNL modifying points are looked up directly from the *concentrated FVNL%* column in Table C (column A of that table), bypassing the formula above.

### Stage 3 — Baseline Points (Table A)

Points are assigned for four nutrients considered "bad" (higher content = more points = worse score). The lookup uses the threshold tables in the `Points Table A` sheet.

**Important:** All threshold values in the table are inflated by exactly 0.01 (one reportable increment) to implement strict "greater than" boundaries, as required by FSANZ.

#### Two different Table A versions by NPSC Group:

**Groups 1 & 2 (categories 1D, 2, 2D) — "Extended" table:**

| Nutrient | Scale | Max points |
|---|---|---|
| Energy (kJ) | 0 pts at 0; +1 pt per 335 kJ | 11 pts at ≥3,685 kJ |
| Saturated fat (g) | Non-linear, accelerating scale | 30 pts at ≥90 g |
| Total sugars (g) | Non-linear scale | **25 pts at ≥99 g** (capped at 25 — v4 change) |
| Sodium (mg) | Linear 0–30 pts | 30 pts at ≥2,700 mg (v4 change: aligned with Group 3) |

The saturated fat scale is non-linear (penalties grow faster at high levels). The total sugars scale was deliberately made more aggressive in v4 (Recommendation 4B of the Five Year Review), capping at 25 pts for >99 g/100 g.

**Group 3 (categories 3, 3D) — Linear table (per HC Standard 1.2.7):**

| Nutrient | Scale | Max points |
|---|---|---|
| Energy (kJ) | Same as Groups 1 & 2 | 11 pts at ≥3,685 kJ |
| Saturated fat (g) | Linear: +1 pt per 1 g | 30 pts at ≥30 g |
| Total sugars (g) | Linear: 0 → 10 pts | 10 pts at ≥45 g |
| Sodium (mg) | Linear: same as Groups 1 & 2 | 30 pts at ≥2,700 mg |

The key difference: Group 3 saturated fat is linear (1 pt per g) because cheese and fats are inherently high-fat foods and a different sensitivity curve applies.

```
Total Baseline Points (Table A) = Energy pts + Sat Fat pts + Total Sugars pts + Sodium pts
```

### Stage 4 — Modifying Points (Table C)

Points are assigned for three "good" components. Higher content = more points = better (they subtract from the baseline).

| Component | Lookup column | Max points | Notes |
|---|---|---|---|
| FVNL% | Conc FVNL% or FVNL% (see above) | 10 pts at 100% | All categories |
| Dietary fibre (g) | % Foods Fibre | 15 pts at ≥20 g | **Zero for Category 1D (Beverages)** — fibre points are not awarded to beverages |
| Protein (g) | % Foods Protein | 15 pts at ≥50 g | Subject to tipping point (see below) |

#### The Tipping Point Rule

Protein points are only included in the total modifying points if **either** of the following conditions is true:

1. **Total Baseline Points < 13** (the "A tipping point")
2. **FVNL modifying points ≥ 5** (the "fruit/veg tipping point")

If neither condition is met, protein points are excluded. The rationale: for highly processed, high-baseline foods that also lack significant fruit/veg content, awarding protein points could artificially inflate the rating (e.g. a high-sugar, high-sodium processed meat product).

Formally (from the spreadsheet formula):
```
IF (Total_Baseline_Points < 13) OR (FVNL_Modifying_Points >= 5):
    Total_Modifying_Points = FVNL_pts + Fibre_pts + Protein_pts
ELSE:
    Total_Modifying_Points = FVNL_pts + Fibre_pts
```

### Stage 5 — HSR Profile Score

```
HSR Profile Score = Total Baseline Points − Total Modifying Points
```

A lower score is healthier (fewer penalty points, more bonus points deducted). The score can be negative.

### Stage 6 — FOPL Calibration and Star Conversion

The raw profile score is converted to star points using category-specific calibration end-points derived from industry data. The calibration ensures that:

- Healthy reference foods in each category typically achieve **≥4 stars**
- Less healthy reference foods in each category typically achieve **≤1 star**
- The scale extends from 5 stars downward to cover the full range of foods in the category

#### Calibration End-Points by Category

These are the "flexed end-points" from the `Lookups` sheet (cells A55:D59), based on the 5th and 95th percentile NPSC scores from new industry data:

| HSR Category | "Less healthy" end (↓ = 1 star) | "More healthy" end (↑ = 5 stars) | Range |
|---|---|---|---|
| 1D — Dairy beverages | 6 | −2 | 8 |
| 2 — Foods | 29 | −15 | 44 |
| 2D — Dairy foods | 14 | −3 | 17 |
| 3 — Fats, oils | 45 | 10 | 35 |
| 3D — Cheese | 41 | 23 | 18 |

The `Lookups` sheet notes that the calibration end-points *can* be adjusted (blue cells only). All other values must not be changed.

#### Star Conversion Divisor

Each category also has a star conversion divisor that maps the calibrated score onto the 1–10 half-star integer range:

| HSR Category | Divisor |
|---|---|
| 1D — Dairy beverages | **8.999** |
| 2 — Foods | 9.999 |
| 2D — Dairy foods | 9.999 |
| 3 — Fats, oils | 9.999 |
| 3D — Cheese | 9.999 |

Category 1D uses 8.999 rather than 9.999 because its FOPL range is narrower (8 vs. the typical 9+ for other categories). The spreadsheet notes: *"If % Food range < 9 then Range = Range + 0.999, else Range = 9.999"* — ensuring not all categories have an HSRC range >10.

#### Final Star Points Formula

```
Raw = 10.499 − ((Profile_Score − More_Healthy_End) / Range) × Star_Divisor
HSR_Star_Points = ROUND(Raw, 0), clamped to [1, 10]
```

The 10.499 constant produces a result where:
- A score equal to the "more healthy" end-point → 10 star points (5 stars)
- A score equal to the "less healthy" end-point → 1 star point (½ star)

#### Star Points to Display

Star points (1–10) map to displayed stars (½ to 5 in half-star steps). The `Lookups` sheet symbol column shows this mapping using a font-encoded glyph scheme (e.g. `«` = ½ star increment).

---

## How Categories Differ in Treatment

| Aspect | 1D Dairy beverages | 2 Foods | 2D Dairy foods | 3 Fats, oils | 3D Cheese |
|---|---|---|---|---|---|
| Table A version | Groups 1 & 2 (non-linear) | Groups 1 & 2 (non-linear) | Groups 1 & 2 (non-linear) | Group 3 (linear) | Group 3 (linear) |
| Sugar cap | 25 pts at ≥99 g | 25 pts at ≥99 g | 25 pts at ≥99 g | 10 pts at ≥45 g | 10 pts at ≥45 g |
| Sat fat scale | Non-linear (max 30 pts) | Non-linear (max 30 pts) | Non-linear (max 30 pts) | Linear 1 pt/g (max 30 pts) | Linear 1 pt/g (max 30 pts) |
| Fibre points | **None (beverages)** | Up to 15 pts | Up to 15 pts | Up to 15 pts | Up to 15 pts |
| Star divisor | 8.999 | 9.999 | 9.999 | 9.999 | 9.999 |
| FOPL range | Narrowest (8) | Widest (44) | 17 | 35 | 18 |
| Healthy end-point | −2 | −15 | −3 | 10 | 23 |
| Less healthy end-point | 6 | 29 | 14 | 45 | 41 |

**Key observations:**

- **Beverages (1D):** Fibre is irrelevant for liquids; no fibre points are awarded. The narrower score range (8) and unique divisor (8.999) reflect the tighter clustering of dairy beverages. The healthy end-point of −2 means a dairy beverage needs a *negative* profile score (more modifying than baseline points) to reach 5 stars.
- **Foods (2):** The widest calibration range (44 points) reflects the enormous diversity within this category — from confectionery to whole grains.
- **Dairy Foods (2D):** A relatively tight range (17) centred on fermented dairy. The calibration was rescaled in v4 (Recommendation 4D) so that healthier options now receive higher HSRs. Specifically, the less-healthy end moved from 6 → 14 and the healthy end from −2 → −3, widening the range from 8 to 17.
- **Fats & Oils (3):** Very high calibration end-points reflect that even the "healthiest" oils and spreads have high baseline points. A healthy oil still scores 10 profile points.
- **Cheese (3D):** Similarly high end-points. The healthy end moved from 21 → 23 in v4 (scaling widened from 20 → 18).

---

## Non-Dairy Beverages (Separate Tab)

**Category 1 — Non-Dairy Beverages** uses a completely different algorithm implemented in the `Non-Dairy Beverages ONLY Calc.` tab. This was introduced in v4 (Recommendation 5) based on the French Nutri-Score system.

### Inputs (Non-Dairy Beverages)

| Column | Field | Notes |
|---|---|---|
| D | Energy (kJ/100 mL) | |
| E | Total sugars (g/100 mL) | |
| F | FVNL (%) | |

Saturated fat, protein, sodium, concentrated FVNL, and fibre are **not used**. Only three inputs drive the score.

### Points Table (Non-Dairy Beverages)

Points are added for energy and sugars (bad), then deducted for FVNL (good):

| Energy threshold (kJ/100 mL) | Pts | | Sugar threshold (g/100 mL) | Pts | | FVNL% threshold | Pts |
|---|---|---|---|---|---|---|---|
| 0 | 0 | | 0 | 0 | | 0 | 0 |
| >0 to 31 | 1 | | >0 to 0.11 | 0 | | >0 to 25 | 1 |
| >31 to 61 | 2 | | >0.11 to 1.61 | 1 | | >25 to 33 | 1 |
| >61 to 91 | 3 | | >1.61 to 3.11 | 2 | | >33 to 41 | 2 |
| >91 to 121 | 4 | | >3.11 to 4.61 | 3 | | >41 to 49 | 2 |
| >121 to 151 | 5 | | >4.61 to 6.11 | 4 | | >49 to 57 | 3 |
| >151 to 181 | 6 | | >6.11 to 7.61 | 5 | | >57 to 65 | 3 |
| >181 to 211 | 7 | | >7.61 to 9.11 | 6 | | >65 to 73 | 4 |
| >211 to 241 | 8 | | >9.11 to 10.61 | 7 | | >73 to 81 | 4 |
| >241 to 271 | 9 | | >10.61 to 12.11 | 8 | | >81 to 89 | 5 |
| >271+ | 10 | | >12.11 to 13.61 | 9 | | >89 to 96 | 6 |
| | | | >13.61+ | 10–12 | | >96+ | 7 |

```
Total Points = Energy Points + Sugar Points − FVNL Points
```

### Score-to-Stars Mapping (Non-Dairy Beverages)

The non-dairy beverage calculator uses a direct score-to-star-points lookup rather than the FOPL calibration formula:

| Score range | Star points | Stars |
|---|---|---|
| ≤−10 | 10 | 5 |
| −10 to 1 | 8–9 | 4–4.5 |
| 1 to 2 | 7 | 3.5 |
| 2 to 4 | 6 | 3 |
| 4 to 6 | 5 | 2.5 |
| 6 to 8 | 4 | 2 |
| 8 to 10 | 3 | 1.5 |
| 10 to 12 | 2 | 1 |
| 12+ | 1 | 0.5 |

**Special case (v4.2):** If energy, sugars, and FVNL are all zero *and* a product name is entered, a rating of 3.5 stars is returned (diet/zero drinks). This was added in v4.2 to ensure products like diet drinks with zero nutritional content still display a rating.

**Special case (v4.1):** This rule was introduced in November 2020 (Forum decision) to cap diet drinks at a maximum of 3.5 stars.

---

## Key Constants

| Constant | Value | Meaning |
|---|---|---|
| A Tipping Point | 13 | Threshold: if Total Baseline Points < 13, protein points are always included |
| Fruit/Veg Tipping Point | 5 | Threshold: if FVNL modifying points ≥ 5, protein points are always included |
| Table A inflation | +0.01 | All thresholds inflated by one reportable increment for "greater than" logic |
| Star divisor (1D) | 8.999 | Converts calibrated score to 1–10 half-star range for dairy beverages |
| Star divisor (all others) | 9.999 | Converts calibrated score to 1–10 half-star range |

---

## Version History Summary

| Version | Key Changes |
|---|---|
| **v3** | Drop-down for HSR Category added; dairy beverage scaling fixed for <2 star foods |
| **v4** | Five Year Review implementation: sugars more heavily penalised (max 25 pts); sodium improved for high-sodium products (max at 2700 mg); dairy categories (2D, 3D) rescaled; non-dairy beverage tab added with Nutri-Score–based algorithm |
| **v4.1** | Diet drinks capped at 3.5 stars (non-dairy beverage tab) |
| **v4.2** | Diet drinks (zero energy, zero sugars, zero FVNL) now display 3.5 stars when a product name is entered, rather than showing no result |

---

## Lookup Table Technical Notes

### Table A Threshold Encoding

All threshold values in Points Table A are inflated by exactly **+0.01**. This is not rounding error — it is deliberate. The FSANZ specification uses "greater than" comparisons (e.g. "score 1 point if energy > 335 kJ"). The VLOOKUP function in Excel uses "less than or equal to" matching. By storing the threshold as 335.01, the lookup correctly assigns 1 point for any value greater than 335 kJ.

### FOPL End-Point Flexibility

The `Lookups` sheet notes that only the blue cells (A55:C59 — the calibration end-points for the five active categories) may be modified. All other values on that sheet are protected reference data. Adjusting these end-points shifts where the 1-star and 5-star boundaries sit within the NPSC score distribution, allowing recalibration if industry data changes.

### Scaling Design Principles (from Lookups sheet)

The calibration was designed to satisfy these criteria:
1. Healthy reference foods in each category typically achieve at least **4 stars**
2. Non-healthy reference foods in each category typically achieve **½ to 1 star**
3. Core foods should score at least **3 stars**
4. The star score range extends from **5 stars downwards** to the least healthy scores in each category
5. Foods score within the established range
6. Categories with an NPSC points range <10 start at 5 stars and extend downwards
7. The "most healthy" food is set at or below the **5th percentile** of NPSC scores for the category
8. The "least healthy" food is set at or above the **95th percentile** of NPSC scores for the category

## My implementations


My python implementation 

```python
def get_next_highest_index(x: float, data_list: list) -> int:
    for index, value in enumerate(data_list):
        if value > x:
            return index - 1   
    # If the input value 'x' is greater than all thresholds, return len - 1 
    return(len(data_list) - 1 )
    
#HSR Function

def hsr_input_validation(hsr_input, energy, saturated_fat,total_sugars, sodium, fibre, protein, concentrated_fruit_and_vegetable, FVNL ):
    '''
    hsr_input - hsr category
    
    energy = 1 # kj/100g
    saturated_fat =  0 #g/100g
    total_sugars = 0 #g/100g
    sodium = 0 #mg/100g
    fibre = 0 #g/100g
    protein = 0 #g/100g
    concentrated_fruit_and_vegetable = 0.0 # %
    FVNL = 0.0 #% non concetrated fruit and veg

    '''
    
    if (hsr_input < 0 or hsr_input > 4): raise E(f"")
    if (energy < 0 or energy > 4000): raise E(f"")
    if (saturated_fat < 0 or saturated_fat > 100): raise E(f"")
    if (total_sugars < 0 or total_sugars > 100): raise E(f"")
    if (fibre < 0 or fibre > 100): raise E(f"")
    if (protein < 0 or protein > 100): raise E(f"")
    if (concentrated_fruit_and_vegetable < 0 or concentrated_fruit_and_vegetable*2 > 100): raise E(f"")
    if (FVNL < 0 or FVNL > 100): raise E(f"")

    if (saturated_fat + fibre +  protein + total_sugars > 100): raise E(f"")
    if (concentrated_fruit_and_vegetable*2 + FVNL > 100): raise E(f"")

    return(hsr_input, energy, saturated_fat,total_sugars, sodium, fibre, protein, concentrated_fruit_and_vegetable, FVNL )
    
    
def hsr_calc(
    hsr_input, 
    energy, 
    saturated_fat,
    total_sugars, 
    sodium, 
    fibre, 
    protein, 
    concentrated_fruit_and_vegetable, 
    FVNL ):

    '''
    hsr_input - hsr category
    
    energy = 1 # kj/100g
    saturated_fat =  0 #g/100g
    total_sugars = 0 #g/100g
    sodium = 0 #mg/100g
    fibre = 0 #g/100g
    protein = 0 #g/100g
    concentrated_fruit_and_vegetable = 0.0 # %
    FVNL = 0.0 #% non concetrated fruit and veg

    '''
    #lookups 
    
    #Lookups!$C$106
    a_tipping_point = 13 
    # Lookups!$C$120
    fruit_veg_tipping_point = 5 
    
    # Lookups!$A$136:$C$144 
    hsr_to_npsc = {
        "1D - Dairy beverages": {"category": "Beverages", "group_number": 1},
        "2 - Foods": {"category": "Food", "group_number": 2},
        "2D - Dairy foods": {"category": "Food", "group_number": 2},
        "3 - Fats, oils": {"category": "Fats/Oils/Cheese", "group_number": 3},
        "3D - Cheese": {"category": "Fats/Oils/Cheese", "group_number": 3},
    }
    
    
    #Lookups!$A$55:$D$64
    fopl_calibration_map = {
        "1D - Dairy beverages": {"bad": 6, "good": -2, "range": 8},
        "2 - Foods": {"bad": 29, "good": -15, "range": 44},
        "2D - Dairy foods": {"bad": 14, "good": -3, "range": 17},
        "3 - Fats, oils": {"bad": 45, "good": 10, "range": 35},
        "3D - Cheese": {"bad": 41, "good": 23, "range": 18},
        "Core Cereals": {"bad": 29, "good": -15, "range": 44},
        "Beverages, non-dairy": {"bad": 3, "good": -6, "range": 9},
        "Non-core foods": {"bad": 29, "good": -15, "range": 44},
        "Protein": {"bad": 29, "good": -15, "range": 44},
        "Vegetables": {"bad": 29, "good": -15, "range": 44},
    }
    
    #Lookups!$C$2:$D$11
    
    star_conversion_divisor_map = {
        "1D - Dairy beverages": 8.999,
        "2 - Foods": 9.999,
        "2D - Dairy foods": 9.999,
        "3 - Fats, oils": 9.999,
        "3D - Cheese": 9.999,
    }
    
    #Points Table A - Category 2
    energy_kj_1 = [ 0, 335.01, 670.01, 1005.01, 1340.01, 1675.01, 2010.01, 2345.01, 2680.01, 3015.01, 3350.01, 3685.01,]
    sat_fat_g_1 = [ 0, 1.01, 2.01, 3.01, 4.01, 5.01, 6.01, 7.01, 8.01, 9.01, 10.01, 11.21, 12.51, 13.91, 15.51, 17.31, 19.31, 21.61, 24.11, 26.91, 30.01, 33.51, 37.41, 41.71, 46.61, 52.01, 58.01, 64.71, 72.31, 80.61, 90.01,]
    tot_sug_g_1 = [ 0, 5.01, 8.91, 12.81, 16.81, 20.71, 24.61, 28.51, 32.41, 36.31, 40.31, 44.21, 48.11, 52.01, 55.91, 59.81, 63.81, 67.71, 71.61, 75.51, 79.41, 83.31, 87.31, 91.21, 95.11, 99.01,]
    na_mg_1 = [0, 90.01, 180.01, 270.01, 360.01, 450.01, 540.01, 630.01, 720.01, 810.01, 900.01, 990.01, 1080.01, 1170.01, 1260.01, 1350.01, 1440.01, 1530.01, 1620.01, 1710.01, 1800.01, 1890.01, 1980.01, 2070.01, 2160.01, 2250.01, 2340.01, 2430.01, 2520.01, 2610.01, 2700.01,]
    
    #Points Table A - Category 3 
    energy_kj_2 = [0, 335.01, 670.01, 1005.01, 1340.01, 1675.01, 2010.01, 2345.01, 2680.01, 3015.01, 3350.01, 3685.01]
    sat_fat_g_2 = [0, 1.01, 2.01, 3.01, 4.01, 5.01, 6.01, 7.01, 8.01, 9.01, 10.01, 11.01, 12.01, 13.01, 14.01, 15.01, 16.01, 17.01, 18.01, 19.01, 20.01, 21.01, 22.01, 23.01, 24.01, 25.01, 26.01, 27.01, 28.01, 29.01, 30.01]
    tot_sug_g_2 = [0, 5.01, 9.01, 13.51, 18.01, 22.51, 27.01, 31.01, 36.01, 40.01, 45.01]
    na_mg_2 = [0, 90.01, 180.01, 270.01, 360.01, 450.01, 540.01, 630.01, 720.01, 810.01, 900.01, 990.01, 1080.01, 1170.01, 1260.01, 1350.01, 1440.01, 1530.01, 1620.01, 1710.01, 1800.01, 1890.01, 1980.01, 2070.01, 2160.01, 2250.01, 2340.01, 2430.01, 2520.01, 2610.01, 2700.01]
    
    #Points Table C
    conc_fvnl_percent = [ 0.00, 25.00, 43.00, 52.00, 63.00, 67.00, 80.00, 90.00, 99.50, 100.00]
    fvnl_percent = [ 0.00, 40.01, 60.01, 67.01, 75.01,  80.01, 90.01, 95.01, 99.51, 100.00]
    percent_foods_fibre = [ 0.00, 0.91, 1.91, 2.81, 3.71,  4.71, 5.41, 6.31, 7.31, 8.41, 9.71, 11.21, 13.01, 15.01, 17.31, 20.01]
    percent_foods_protein = [ 0.00, 1.61, 3.20, 4.81, 6.41, 8.01, 9.61, 11.61, 13.91, 16.71, 20.01, 24.01, 28.91, 34.71,  41.61, 50.01]
    
    
    HSR_categories = ['1D - Dairy beverages','2 - Foods','2D - Dairy foods','3 - Fats, oils','3D - Cheese',]

    hsr_category = HSR_categories[hsr_input] 
        
    npsc_category =  hsr_to_npsc[hsr_category]["category"] # VLOOKUP(hsr_category,Lookups!$A$136:$C$144,2)
    
    npsc_category_group_number =  hsr_to_npsc[hsr_category]["group_number"] # VLOOKUP(hsr_category,Lookups!$A$136:$C$144,2)
    
    all_fav_concentrated = "Yes" if (concentrated_fruit_and_vegetable >= 0 and FVNL == 0 ) else "No"  #=IF(AND(L2>0,M2=0),"Yes","No")
    
    whole_food_percent = concentrated_fruit_and_vegetable + FVNL #=L2+M2
    
    fruit_veg_nuts_pulses_percent = round(100*(FVNL + 2*concentrated_fruit_and_vegetable) /(FVNL + 2*concentrated_fruit_and_vegetable +  (100 - concentrated_fruit_and_vegetable - FVNL)) ,2) # =ROUND(100*(M2+2*L2)/(M2+2*L2+(100-L2-M2)),2)
    
    
    # =IF($Q2<>3,VLOOKUP(F2,'Points Table A'!B$3:$F$33,5),VLOOKUP(F2,'Points Table A'!H$3:$L$33,5))
    baseline_energy_points = get_next_highest_index(energy, energy_kj_1) if npsc_category_group_number != 3 else get_next_highest_index(energy, energy_kj_2) 
    
    # =IF($Q2<>3,VLOOKUP(G2,'Points Table A'!C$3:$F$33,4),VLOOKUP(G2,'Points Table A'!I$3:$L$33,4))
    baseline_sat_fat_points = get_next_highest_index(saturated_fat, sat_fat_g_1) if npsc_category_group_number != 3 else get_next_highest_index(saturated_fat, sat_fat_g_2) 
    
    # =IF($Q2<>3,VLOOKUP(H2,'Points Table A'!D$3:$F$28,3),VLOOKUP(H2,'Points Table A'!J$3:$L$33,3))
    baseline_total_sugars_points = get_next_highest_index(total_sugars, tot_sug_g_1) if npsc_category_group_number != 3 else get_next_highest_index(total_sugars, tot_sug_g_2) 
    
    #=IF($Q2<>3,VLOOKUP(I2,'Points Table A'!E$3:$F$33,2),VLOOKUP(I2,'Points Table A'!K$3:$L$33,2))
    baseline_sodium_points = get_next_highest_index(energy, na_mg_1) if npsc_category_group_number != 3 else get_next_highest_index(energy, na_mg_2) 
    
    total_baseline_points_table_a = baseline_energy_points + baseline_sat_fat_points + baseline_total_sugars_points + baseline_sodium_points #=SUM(V2:Y2)
    
    #=IF($S2=Lookups!$B$113,VLOOKUP(L2,'Points Table C'!A$3:$E$11,5),VLOOKUP(U2,'Points Table C'!B$3:$E$11,4))
    modifying_points_percent_FVNL = get_next_highest_index(concentrated_fruit_and_vegetable,conc_fvnl_percent) if all_fav_concentrated == "Yes" else  get_next_highest_index(fruit_veg_nuts_pulses_percent, fvnl_percent)
    
    #=IF($Q2=1,0,VLOOKUP($J2,'Points Table C'!$C$3:$E$18,3))
    modifying_points_percent_fibre = get_next_highest_index(fibre, percent_foods_fibre) if npsc_category_group_number == 1 else 0
    
    #=VLOOKUP($K2,'Points Table C'!$D$3:$E$18,2)
    modifying_points_percent_protein = get_next_highest_index(protein, percent_foods_protein)
    
    #=IF($Z2<Lookups!$C$106,($AA2+AB2+AC2),IF($AA2>=Lookups!$C$120,($AA2+AB2+AC2),$AA2+$AB2))
    combined_modifying_percent = modifying_points_percent_FVNL + modifying_points_percent_fibre + modifying_points_percent_protein
    
    if ( total_baseline_points_table_a < a_tipping_point or total_baseline_points_(table_a)  > fruit_veg_tipping_point ) : 
        total_modifying_points_table_c = combined_modifying_percent
    else: 
        total_modifying_points_table_c = modifying_points_percent_FVNL + modifying_points_percent_fibre
    
    hsr_profile_score =  total_baseline_points_table_a + total_modifying_points_table_c #=$Z2-$AD2 Total Baseline Points (Table  A)		Total Modifying Points (Table C)
    
    #hsr_star_points  # =IF(ROUND(10.499-(((N2-VLOOKUP($C2,Lookups!$A$55:$D$64,3))/(VLOOKUP($C2,Lookups!$A$55:$D$64,4))*VLOOKUP($C2,Lookups!$C$2:$D$11,2))),0)<1,1,IF(ROUND(10.499-(((N2-VLOOKUP($C2,Lookups!$A$55:$D$64,3))/(VLOOKUP($C2,Lookups!$A$55:$D$64,4))*VLOOKUP($C2,Lookups!$C$2:$D$11,2))),0)<11,ROUND(10.499-(((N2-VLOOKUP($C2,Lookups!$A$55:$D$64,3)
    
    
    fopl_calibration_good = fopl_calibration_map[hsr_category]["good"]  
    fopl_calibration_range = fopl_calibration_map[hsr_category]["range"]  
    star_conversion_divisor = star_conversion_divisor_map[hsr_category] 
    
    
    r = round(10.499 - ((hsr_profile_score - fopl_calibration_good) / fopl_calibration_range) * star_conversion_divisor,0)
    
    hsr_star_points = max(min(r, 10), 1)
    
    return(hsr_star_points)

```

