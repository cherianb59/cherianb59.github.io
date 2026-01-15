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

I've reverse engineered and converted it into an [api](https://cherianb59.github.io/static/hsr.html?hsr_input=1&energy=500&saturated_fat=2&total_sugars=5&sodium=200&fibre=3&protein=4&concentrated_fruit_and_vegetable=10&FVNL=20)
. Just put in the parameters and feel free to copy the code yourself.


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

