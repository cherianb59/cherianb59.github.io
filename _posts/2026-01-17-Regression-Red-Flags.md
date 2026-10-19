---
layout: post
title: Regression Red Flags
description: The problem with regressions
date: 2026-01-17 11:12:30 +1000
tags: Maths
---

## Regression Red Flags

Regressions are a tool that can be used to find the casual factors of a particular variable, it is very useful to find the strength of the factors when the data has a lot of "noise".

But there are problems.

In this post I'm going to highlight how regressions can give issues by using an example where the answer is arleady known, but using regressions can give wrong answers.

Furthermore it will show that it is difficult to know if you have gotten all the right answers or if there are issues.

### Nutrition 

My example is using a dataset of food to determine the energy density (kJ/g) of certain components of macro nutrients. The energy density of food components is arleady known, but this example shows how using regressions can lead to the wrong answers. 


### The dataset 

THe provides a dataset on the energy value of foods and their components 

(AFCD Release 3 - Food Details.xlsx)[https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Food%20Details.xlsx]


### Coding 


Get the data and import into pandas 


```python
import requests
import pandas as pd 


url = "https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Nutrient%20profiles.xlsx"
outfile = "AFCD Release 3 - Nutrient Profiles.xlsx"

r = requests.get(url, stream=True)
r.raise_for_status()

with open(outfile, "wb") as f:
    for chunk in r.iter_content(chunk_size=8192):
        f.write(chunk)

print(f"Downloaded: {outfile}")

df = pd.read_excel(
    "AFCD Release 3 - Nutrient Profiles.xlsx",
    sheet_name=1,
    skiprows=2,
    header=0    
)
df.columns = df.columns.str.replace("\n", " ", regex=False)
display(df)

```
First 5 rows and 20 columns 


| Public Food Key   |   Classification | Derivation   | Food Name                     |   Energy with dietary fibre, equated  (kJ) |   Energy, without dietary fibre, equated  (kJ) |   Moisture (water)  (g) |   Protein  (g) |   Nitrogen  (g) |   Fat, total  (g) |   Ash  (g) |   Total dietary fibre  (g) |   Alcohol  (g) |   Fructose  (g) |   Glucose  (g) |   Sucrose (g) |   Maltose  (g) |   Lactose  (g) |   Galactose  (g) |   Total sugars (g) |
|:------------------|-----------------:|:-------------|:------------------------------|-------------------------------------------:|-----------------------------------------------:|------------------------:|---------------:|----------------:|------------------:|-----------:|---------------------------:|---------------:|----------------:|---------------:|--------------:|---------------:|---------------:|-----------------:|-------------------:|
| F002258           |            31302 | Borrowed     | Cardamom seed, dried, ground  |                                       1236 |                                           1012 |                     8.3 |           10.8 |            1.72 |               6.7 |        5.8 |                       28   |              0 |               0 |              0 |             0 |              0 |              0 |                0 |                4.4 |
| F002963           |            31302 | Borrowed     | Cinnamon, dried, ground       |                                       1004 |                                            579 |                    10.6 |            4   |            0.64 |               1.2 |        3.6 |                       53.1 |              0 |               0 |              0 |             0 |              0 |              0 |                0 |                2.2 |
| F002893           |            31302 | Borrowed     | Chilli (chili), dried, ground |                                       1224 |                                            950 |                    10.8 |           12.3 |            2    |              14.3 |        8.5 |                       34.2 |              0 |               0 |              0 |             0 |              0 |              0 |                0 |                7.2 |
| F002970           |            31302 | Borrowed     | Cloves, dried, ground         |                                       1389 |                                           1118 |                     9.9 |            6   |            0.96 |              13   |        5.6 |                       33.9 |              0 |               0 |              0 |             0 |              0 |              0 |                0 |                2.4 |
| F003190           |            31302 | Borrowed     | Coriander seed, dried, ground |                                       1344 |                                           1009 |                     8.9 |           12.4 |            1.98 |              17.8 |        6   |                       41.9 |              0 |               0 |              0 |             0 |              0 |              0 |                0 |                2.4 |

If we chuck in a bunch of columns into a linear regression, the results don't look right.

```python
import statsmodels.api as sm

X = df[
    [
        "Protein  (g)",
        "Nitrogen  (g)",
        "Fat, total  (g)",
        "Total dietary fibre  (g)",
        "Ash  (g)",
        "Alcohol  (g)",
        "Total sugars (g)",
        "Added sugars (g)",
        "Free sugars  (g)",
        "Starch  (g)",
        "Resistant starch  (g)",
        "Available carbohydrate, without sugar alcohols  (g)",
        "Available carbohydrate, with sugar alcohols  (g)"
    ]
]

y = df['Energy with dietary fibre, equated  (kJ)']

X = sm.add_constant(X)

model = sm.OLS(y, X).fit()

print(model.summary())
```

#### Results 

                                       OLS Regression Results                                       
====================================================================================================
Dep. Variable:     Energy with dietary fibre, equated  (kJ)   R-squared:                       1.000
Model:                                                  OLS   Adj. R-squared:                  1.000

=======================================================================================================================
                                                          coef    std err          t      P>|t|      [0.025      0.975]
-----------------------------------------------------------------------------------------------------------------------
const                                                   4.3701      0.371     11.795      0.000       3.643       5.097
Protein  (g)                                           16.9958      0.156    109.176      0.000      16.690      17.301
Nitrogen  (g)                                          -0.6316      0.960     -0.658      0.511      -2.515       1.252
Fat, total  (g)                                        36.9632      0.010   3548.321      0.000      36.943      36.984
Total dietary fibre  (g)                                8.0412      0.032    250.193      0.000       7.978       8.104
Ash  (g)                                                0.0716      0.037      1.955      0.051      -0.000       0.143
Alcohol  (g)                                           28.8095      0.114    251.880      0.000      28.585      29.034
Total sugars (g)                                        1.3445      0.107     12.608      0.000       1.135       1.554
Added sugars (g)                                       -0.1985      0.088     -2.243      0.025      -0.372      -0.025
Free sugars  (g)                                       -0.0231      0.091     -0.252      0.801      -0.202       0.156
Starch  (g)                                             2.0975      0.103     20.427      0.000       1.896       2.299
Resistant starch  (g)                                   9.3248      0.617     15.123      0.000       8.115      10.534
Available carbohydrate, without sugar alcohols  (g)    -1.0129      0.242     -4.183      0.000      -1.488      -0.538
Available carbohydrate, with sugar alcohols  (g)       15.8516      0.220     71.932      0.000      15.419      16.284

The R squared is 1, all the variance is explained, however some of the coefficients are negative which is physically impossible. THe constant is 4.7 which means a food without any nutrients would have 4 Kj which is also impossible.

The reason is that some of the independant variables are not really independant, they are subsets or very correlated with each other.

This correlation causes the regression to fail.

If we had subject matter expertise we would know which elements are dependant on each other. Without it we can use a correlation matrix to see the correlation between elements and infer which ones should be dropped. 

```python

import seaborn as sns
import matplotlib.pyplot as plt

cols = [
    "Energy with dietary fibre, equated  (kJ)",
    "Protein  (g)",
    "Nitrogen  (g)",
    "Fat, total  (g)",
    "Total dietary fibre  (g)",
    "Alcohol  (g)",
    "Total sugars (g)",
    "Added sugars (g)",
    "Free sugars  (g)",
    "Starch  (g)",
    "Resistant starch  (g)",
    "Available carbohydrate, without sugar alcohols  (g)",
    "Available carbohydrate, with sugar alcohols  (g)"
]

corr = df[cols].corr()

plt.figure(figsize=(28, 16))
sns.heatmap(
    corr,
    annot=True,
    cmap="RdBu_r",
    center=0,
    vmin=-1,
    vmax=1,
    fmt=".3f"
)

plt.title("Correlation Matrix")
plt.tight_layout()
plt.show()
```

Protein and nitrogen are dependant on each other. Total Sugars added sugars free sugars starch resistant starch and avialbe carbohydrahes all have correlations with each other.

Choosing protein over nitrogen is sensible given that protein is listed on food nutrition labels. 

But for all the carbohydrates it's not immiedatly clear which ones we should keep and which should be removed. Let try each of the 32 combinations of the carbohydrate columns and check the statistical results which will hopefully give some insight into which columns we should keep. 


```python 

from itertools import combinations

base_cols = [
    "Protein  (g)",
    "Fat, total  (g)",
    "Total dietary fibre  (g)",
    "Ash  (g)",
    "Alcohol  (g)",
]

optional_cols = [
    "Total sugars (g)",
    "Starch  (g)",
    "Resistant starch  (g)",
    "Available carbohydrate, without sugar alcohols  (g)",
    "Available carbohydrate, with sugar alcohols  (g)",
]

y = df['Energy with dietary fibre, equated  (kJ)']

results = []

# Generate every subset of optional columns
for r in range(len(optional_cols) + 1):
    for subset in combinations(optional_cols, r):
        cols = base_cols + list(subset)

        X = sm.add_constant(df[cols])
        model = sm.OLS(y, X).fit()

        results.append({
            "n_vars": len(cols),
            "variables": cols,
            "r2": model.rsquared,
            "adj_r2": model.rsquared_adj,
            "aic": model.aic,
            "bic": model.bic,
            "coeffs": model.params,
            
        })

# put all the results into one dataframe
results_df = (
    pd.DataFrame(results)
    .sort_values("n_vars", ascending=False)
)

# add the missing columns and make the coeffs 0 
all_coef_cols = results_df.iloc[0]["coeffs"].index


results_df["coeffs"] = [
    s.reindex(all_coef_cols, fill_value=0)
    for s in results_df["coeffs"]
]

#pivot the coefficients into seperate columns
coeff_cols = results_df["coeffs"].apply(pd.Series)

results_pivot_df = pd.concat(
    [results_df.drop(columns=["coeffs"]), coeff_cols],
    axis=1
)
```


|   n_vars | variables                                                                                                                                                                                                                                                          |       r2 |   adj_r2 |     aic |     bic |     const |   Protein  (g) |   Fat, total  (g) |   Total dietary fibre  (g) |   Ash  (g) |   Alcohol  (g) |   Total sugars (g) |   Starch  (g) |   Resistant starch  (g) |   Available carbohydrate, without sugar alcohols  (g) |   Available carbohydrate, with sugar alcohols  (g) |
|---------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------:|---------:|--------:|--------:|----------:|---------------:|------------------:|---------------------------:|-----------:|---------------:|-------------------:|--------------:|------------------------:|------------------------------------------------------:|---------------------------------------------------:|
|       10 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)'] | 0.999899 | 0.999899 | 10938.2 | 10997.3 |   4.82709 |       16.8832  |           36.9572 |                    8.06992 | 0.0767672  |       28.8128  |           1.20777  |      2.12563  |                 9.38438 |                                            -1.18475   |                                            15.9885 |
|        9 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                     | 0.999891 | 0.99989  | 11062.4 | 11116.1 |   4.97349 |       16.8769  |           36.9593 |                    8.07877 | 0.0507252  |       28.8066  |           0        |      0.958645 |                 9.14055 |                                            -0.0587346 |                                            16.0306 |
|        9 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                | 0.999872 | 0.999872 | 11311.2 | 11364.9 |   4.91899 |       16.8802  |           36.9609 |                    8.09758 | 0.0328782  |       28.8021  |          -0.927939 |      0        |                 9.38009 |                                             0.88167   |                                            16.0246 |
|        9 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                          | 0.999884 | 0.999884 | 11152.1 | 11205.8 |   4.67534 |       16.9055  |           36.9498 |                    8.14756 | 0.0570179  |       28.8237  |           1.15252  |      2.1251   |                 0       |                                            -1.12945   |                                            15.9844 |
|        9 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                        | 0.999898 | 0.999897 | 10959.8 | 11013.5 |   4.92223 |       16.8787  |           36.9577 |                    8.07781 | 0.0767644  |       28.8055  |           0.999968 |      1.91726  |                 9.33934 |                                             0         |                                            15.0098 |
|        9 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                     | 0.999568 | 0.999566 | 13245   | 13298.7 |   6.65685 |       16.806   |           36.9558 |                    8.174   | 0.151641   |       28.6825  |           1.33411  |      2.18478  |                 9.33054 |                                            14.7025    |                                             0      |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                              | 0.999554 | 0.999552 | 13295.5 | 13343.8 |   6.50551 |       16.8282  |           36.9485 |                    8.25117 | 0.131986   |       28.6934  |           1.27914  |      2.18424  |                 0       |                                            14.7535    |                                             0      |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                    | 0.999704 | 0.999702 | 12646.2 | 12694.5 |   2.39313 |       17.0026  |           36.9601 |                    8.26433 | 0.084122   |       28.8096  |           0        |      0        |                15.7369  |                                             1.10448   |                                            15.4366 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                              | 0.999877 | 0.999876 | 11251.3 | 11299.6 |   4.81898 |       16.899   |           36.952  |                    8.15409 | 0.0326279  |       28.8175  |           0        |      1.01019  |                 0       |                                            -0.0550377 |                                            16.0248 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                            | 0.999891 | 0.99989  | 11060.4 | 11108.8 |   4.97764 |       16.8767  |           36.9593 |                    8.07915 | 0.0509906  |       28.8063  |           0        |      0.958195 |                 9.14036 |                                             0         |                                            15.9722 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                         | 0.999558 | 0.999556 | 13280   | 13328.3 |   6.82395 |       16.7988  |           36.9581 |                    8.18408 | 0.123085   |       28.6753  |           0        |      0.895538 |                 9.06096 |                                            15.993     |                                             0      |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                         | 0.999858 | 0.999857 | 11481.9 | 11530.2 |   4.76729 |       16.9025  |           36.9536 |                    8.17517 | 0.0131488  |       28.8129  |          -0.982632 |      0        |                 0       |                                             0.936432  |                                            16.0205 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Resistant starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                       | 0.999871 | 0.999871 | 11321.7 | 11370   |   4.84167 |       16.884   |           36.9609 |                    8.09294 | 0.0290186  |       28.8077  |          -0.929341 |      0        |                 9.42015 |                                             0         |                                            16.9063 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                    | 0.99954  | 0.999538 | 13344.1 | 13392.4 |   6.75556 |       16.8028  |           36.9596 |                    8.20267 | 0.106701   |       28.6712  |          -0.860875 |      0        |                 9.326   |                                            16.8635    |                                             0      |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                                 | 0.999883 | 0.999882 | 11168.8 | 11217.1 |   4.76676 |       16.9011  |           36.9503 |                    8.15472 | 0.0571055  |       28.8166  |           0.954625 |      1.92641  |                 0       |                                             0         |                                            15.0512 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Resistant starch  (g)']                                                                                                            | 0.998271 | 0.998262 | 15447.1 | 15495.4 |   7.82449 |       16.7897  |           36.9198 |                    8.06943 | 0.469273   |       28.6381  |          16.2624   |     16.868    |                12.2218  |                                             0         |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                             | 0.999661 | 0.999659 | 12859.3 | 12902.3 |   1.86788 |       17.0542  |           36.9472 |                    8.41711 | 0.054923   |       28.8293  |           0        |      0        |                 0       |                                             1.22312   |                                            15.369  |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Resistant starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                                           | 0.999702 | 0.999701 | 12652.6 | 12695.6 |   2.29145 |       17.0076  |           36.9601 |                    8.25883 | 0.0793822  |       28.8166  |           0        |      0        |                15.7992  |                                             0         |                                            16.5405 |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                                        | 0.999394 | 0.999392 | 13778.7 | 13821.7 |   4.34335 |       16.9193  |           36.9589 |                    8.3542  | 0.151849   |       28.6826  |           0        |      0        |                15.2409  |                                            16.5253    |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                                                     | 0.999877 | 0.999876 | 11249.3 | 11292.3 |   4.82287 |       16.8988  |           36.952  |                    8.15444 | 0.0328769  |       28.8172  |           0        |      1.00976  |                 0       |                                             0         |                                            15.97   |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                                                  | 0.999544 | 0.999542 | 13326.5 | 13369.5 |   6.67011 |       16.8207  |           36.9509 |                    8.2587  | 0.105119   |       28.6861  |           0        |      0.946655 |                 0       |                                            15.9908    |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Resistant starch  (g)']                                                                                                                                | 0.913629 | 0.913246 | 21655.6 | 21698.5 | 191.714   |       10.93    |           36.3233 |                    8.68302 | 0.00743031 |       21.0619  |           0        |     16.5355   |                 1.4425  |                                             0         |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                                                | 0.999856 | 0.999856 | 11492.5 | 11535.5 |   4.68445 |       16.9066  |           36.9535 |                    8.17059 | 0.0089589  |       28.819   |          -0.98437  |      0        |                 0       |                                             0         |                                            16.9572 |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                                             | 0.999525 | 0.999523 | 13391.4 | 13434.3 |   6.60427 |       16.825   |           36.9523 |                    8.27979 | 0.0870671  |       28.682   |          -0.915269 |      0        |                 0       |                                            16.9139    |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Resistant starch  (g)']                                                                                                                           | 0.859587 | 0.858965 | 22427.2 | 22470.2 | 178.916   |       13.2335  |           35.9878 |                   16.484   | 1.57444    |       17.3286  |          15.7372   |      0        |               278.311   |                                             0         |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)']                                                                                                                                     | 0.998246 | 0.998238 | 15467.8 | 15510.7 |   7.63135 |       16.8187  |           36.91   |                    8.17014 | 0.444944   |       28.6521  |          16.2582   |     16.934    |                 0       |                                             0         |                                             0      |
|        6 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)']                                                                                                                                                    | 0.845453 | 0.844866 | 22577.5 | 22615.1 | 190.779   |       13.6103  |           35.6538 |                   19.8109  | 1.07649    |       16.5753  |          15.5809   |      0        |                 0       |                                             0         |                                             0      |
|        6 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                                                                    | 0.999659 | 0.999657 | 12866.4 | 12904   |   1.75293 |       17.06    |           36.947  |                    8.41168 | 0.0495439  |       28.8372  |           0        |      0        |                 0       |                                             0         |                                            16.5916 |
|        6 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                                                                 | 0.999354 | 0.999352 | 13879.1 | 13916.7 |   3.82629 |       16.9696  |           36.9464 |                    8.5018  | 0.123278   |       28.7023  |           0        |      0        |                 0       |                                            16.5747    |                                             0      |
|        6 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Resistant starch  (g)']                                                                                                                                               | 0.780273 | 0.779439 | 23136.3 | 23173.9 | 353.716   |        7.62731 |           35.428  |                   16.9175  | 1.10614    |       10.2083  |           0        |      0        |               262.794   |                                             0         |                                             0      |
|        6 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)']                                                                                                                                                         | 0.913628 | 0.9133   | 21653.6 | 21691.2 | 191.686   |       10.9336  |           36.3222 |                    8.69489 | 0.00457226 |       21.0638  |           0        |     16.5433   |                 0       |                                             0         |                                             0      |
|        5 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)']                                                                                                                                                                        | 0.767664 | 0.76693  | 23222.9 | 23255.2 | 363.283   |        8.03586 |           35.1177 |                   20.0566  | 0.640083   |        9.56344 |           0        |      0        |                 0       |                                             0         |                                             0      |

These are the results, a lot of data. Key things to look for is low constant value, R Squared close to .99, no negative coeffs, let's keep those rows.

```python
filtered = (
    results_pivot_df[
        (results_pivot_df["r2"] > 0.98)
        & (results_pivot_df[optional_cols] >= 0).all(axis=1)
    ]
    .sort_values("const")
)

```

|   n_vars | variables                                                                                                                                                                                                                       |       r2 |   adj_r2 |     aic |     bic |   const |   Protein  (g) |   Fat, total  (g) |   Total dietary fibre  (g) |   Ash  (g) |   Alcohol  (g) |   Total sugars (g) |   Starch  (g) |   Resistant starch  (g) |   Available carbohydrate, without sugar alcohols  (g) |   Available carbohydrate, with sugar alcohols  (g) |
|---------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------:|---------:|--------:|--------:|--------:|---------------:|------------------:|---------------------------:|-----------:|---------------:|-------------------:|--------------:|------------------------:|------------------------------------------------------:|---------------------------------------------------:|
|        6 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                                 | 0.999659 | 0.999657 | 12866.4 | 12904   | 1.75293 |        17.06   |           36.947  |                    8.41168 |  0.0495439 |        28.8372 |           0        |      0        |                 0       |                                               0       |                                            16.5916 |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                          | 0.999661 | 0.999659 | 12859.3 | 12902.3 | 1.86788 |        17.0542 |           36.9472 |                    8.41711 |  0.054923  |        28.8293 |           0        |      0        |                 0       |                                               1.22312 |                                            15.369  |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Resistant starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                        | 0.999702 | 0.999701 | 12652.6 | 12695.6 | 2.29145 |        17.0076 |           36.9601 |                    8.25883 |  0.0793822 |        28.8166 |           0        |      0        |                15.7992  |                                               0       |                                            16.5405 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)', 'Available carbohydrate, with sugar alcohols  (g)'] | 0.999704 | 0.999702 | 12646.2 | 12694.5 | 2.39313 |        17.0026 |           36.9601 |                    8.26433 |  0.084122  |        28.8096 |           0        |      0        |                15.7369  |                                               1.10448 |                                            15.4366 |
|        6 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                                              | 0.999354 | 0.999352 | 13879.1 | 13916.7 | 3.82629 |        16.9696 |           36.9464 |                    8.5018  |  0.123278  |        28.7023 |           0        |      0        |                 0       |                                              16.5747  |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                     | 0.999394 | 0.999392 | 13778.7 | 13821.7 | 4.34335 |        16.9193 |           36.9589 |                    8.3542  |  0.151849  |        28.6826 |           0        |      0        |                15.2409  |                                              16.5253  |                                             0      |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                              | 0.999883 | 0.999882 | 11168.8 | 11217.1 | 4.76676 |        16.9011 |           36.9503 |                    8.15472 |  0.0571055 |        28.8166 |           0.954625 |      1.92641  |                 0       |                                               0       |                                            15.0512 |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                                                  | 0.999877 | 0.999876 | 11249.3 | 11292.3 | 4.82287 |        16.8988 |           36.952  |                    8.15444 |  0.0328769 |        28.8172 |           0        |      1.00976  |                 0       |                                               0       |                                            15.97   |
|        9 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                     | 0.999898 | 0.999897 | 10959.8 | 11013.5 | 4.92223 |        16.8787 |           36.9577 |                    8.07781 |  0.0767644 |        28.8055 |           0.999968 |      1.91726  |                 9.33934 |                                               0       |                                            15.0098 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, with sugar alcohols  (g)']                                         | 0.999891 | 0.99989  | 11060.4 | 11108.8 | 4.97764 |        16.8767 |           36.9593 |                    8.07915 |  0.0509906 |        28.8063 |           0        |      0.958195 |                 9.14036 |                                               0       |                                            15.9722 |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                           | 0.999554 | 0.999552 | 13295.5 | 13343.8 | 6.50551 |        16.8282 |           36.9485 |                    8.25117 |  0.131986  |        28.6934 |           1.27914  |      2.18424  |                 0       |                                              14.7535  |                                             0      |
|        9 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                  | 0.999568 | 0.999566 | 13245   | 13298.7 | 6.65685 |        16.806  |           36.9558 |                    8.174   |  0.151641  |        28.6825 |           1.33411  |      2.18478  |                 9.33054 |                                              14.7025  |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                                               | 0.999544 | 0.999542 | 13326.5 | 13369.5 | 6.67011 |        16.8207 |           36.9509 |                    8.2587  |  0.105119  |        28.6861 |           0        |      0.946655 |                 0       |                                              15.9908  |                                             0      |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Starch  (g)', 'Resistant starch  (g)', 'Available carbohydrate, without sugar alcohols  (g)']                                      | 0.999558 | 0.999556 | 13280   | 13328.3 | 6.82395 |        16.7988 |           36.9581 |                    8.18408 |  0.123085  |        28.6753 |           0        |      0.895538 |                 9.06096 |                                              15.993   |                                             0      |
|        7 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)']                                                                                                  | 0.998246 | 0.998238 | 15467.8 | 15510.7 | 7.63135 |        16.8187 |           36.91   |                    8.17014 |  0.444944  |        28.6521 |          16.2582   |     16.934    |                 0       |                                               0       |                                             0      |
|        8 | ['Protein  (g)', 'Fat, total  (g)', 'Total dietary fibre  (g)', 'Ash  (g)', 'Alcohol  (g)', 'Total sugars (g)', 'Starch  (g)', 'Resistant starch  (g)']                                                                         | 0.998271 | 0.998262 | 15447.1 | 15495.4 | 7.82449 |        16.7897 |           36.9198 |                    8.06943 |  0.469273  |        28.6381 |          16.2624   |     16.868    |                12.2218  |                                               0       |                                             0      |

This shows that keeping just the Available carbohydrate, with sugar alcohols (g) is the best column, high R squared and low constant value, all the energy can be explained by the nutrients. 

Sugars, starch and carbs are split weirdly, they have changing values. THis is due to multi collinearity, available carbohydrate ≈ sugars + starch + other carbs hence the following combinations will all give the same resuts 

Avail carb = 17, Sugars = 0, Starch = 0

Avail carb = 15, Sugars = 1, Starch = 2.

It's best to either have just available carbs or sugars and starch but not include available carbs. 

