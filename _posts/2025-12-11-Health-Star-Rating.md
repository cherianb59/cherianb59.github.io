---
layout: post
title: Health Star Rating
description: The Hidden Formula
date: 2025-12-11 11:12:30 +1000
tags: Life
---

I've been listening to the Hamish and Andy podcast for over 15 years. In the last few years they have taken potshots at the Austrlaian HEalth Star rateings. Health star ratings are a governmetn led initiative to rate how helathy foods are. Food manufactures arent compelled to label their products with the health star ratings however if they choose to play they cannot be selective with which products they label. THey either labbel all of them or none of them. 

Hamish and ANdy have been flummoxed at how , but they recently showed that the calculator is available as a spreadsheet on the official site. https://www.healthstarrating.gov.au/calculator
There is a spreadhseet at the bottom of the page, which means we can get the formulas and figure out how it's calculated. 
Unfortunately the worksheet is password protected, however it's pretty easy to remove the [password](https://cherianb59.github.io/static/HSR Calculator 4.2.xlsm).

By removing the password, it's easy to see exactly how the points are calculated. Short version is that you lose points for more saturated fats and sugar, and you gain points for having more protein, fibre, fruits and vegetables.

I've reverse engineered and converted it into an [api](https://cherianb59.github.io/static/hsr.html?hsr_input=1&energy=500&saturated_fat=2&total_sugars=5&sodium=200&fibre=3&protein=4&concentrated_fruit_and_vegetable=10&FVNL=20)
. Just put the parameters and feel free to copy the code yourself.


