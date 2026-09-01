---
layout: post
title: AI Reflections and Predictions
description: 
date: 2026-09-01 11:12:30 +1000
tags: Programming
---

# BoM

The BoM has a weather app with a great feature, it has the rain radar for the previous 90 minutes AND it has a predicted rain radar for the next 90 minutes.

The BoM website is full of radars, however I cant find a predicted radar. And I have wanted to store and analyse this data, however because it is in the mobile app it limits data acquisition. 

AI to the rescue, I could download the apk and then have AI analyse it to see most of the API calls. It couldnt find the right one for the rain radar. THen I suggedted capturing network traffic from an emulator. The network traffic is encrypted so the AI gave steps and tools needed to decrypt the network data and get the raw data. 

With the apk and the network data it could figure out the structure of the app and all the calls needed to replicate the app. One tricky part was that there are API cals to mapbox that need to be authenticated. The caputred network traffic helped decipher how to replicate the authentication and generate session keys. 

[Client Side BoM Site](https://cherianb59.github.io/static/standalone-maplibre/)

### Future Work

A potentially interesting use is seeing how the 5 minut predictions vary by time.

i.e how the prediction at 3pm looks like at 1:30 vs 2:55.



