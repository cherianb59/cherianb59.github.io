## Recording and displaying power usage

Energy prices have increased significantly and this made me want to reduce electricity usage. I didn't want to start turning everything off when I wasn't using it in order to save a few cents. It's annoying to wait for it when I turn it back on and it's worth the small cost to just leave it on. I wanted to find the major culprits, the electricity suckers, and turn them off when not in use. 

I needed a way to track energy usage over time to see what was using the most electricity, tp link provide smart plugs that monitor electricity usage and offer remote switching. 

![](https://static.tp-link.com/HS100(AU)-1.0-package_1480336960019b.jpg)

I already had one, which I used in the past to check the power usage of heaters and washing machines (note: washing machines use very little electricity, it's not worth the half a cent saving running it in an off peak time ) and I liked it so I bought another one and connected the older one to my 3d printer, work laptop, desktop and monitors, the newer one connected to the TV and media PC. TP-Link provide an app to show the power usage, but I can't store it anywhere and see how it changes over time. I don't want to look at the app all of the time and I don't want mess about with extracting data from the app, especially when the data is in the plug itself. 

There is a [python library](https://github.com/python-kasa/python-kasa) to connect to the devices and read the data from them. I used it to connect to both plugs and store the usage every minute in a sqlite database. 

From there I made a dash app to read from the sqlite db and show the realtime (every minute), daily and monthly power usage for both of the plugs.  


### Realtime 

![](/img/realtime.png)

The red line is the desktop, work laptop and monitors. The desktop and monitors use a lot of power during the day, about an extra 150 watts compared to sleep mode. This corresponds to 6 cents an hour. When it is in sleep mode it takes about 10 watts, this is 0.4 cents an hour, or 4 millidollars per hour. I could save 4 cents a day by turning it off rather than putting it to sleep, but it's not worth it to me. Making it sleep every night is worth it, this saves about 50 cents a night and is not disruptive.

The blueline is the TV, media PC and digital piano. The TV and media PC don't use that much electricity and the digital piano uses very little. I don't turn off the piano when not in use, much to my wife's annoyance as the electricity use is minimal.

### Daily 

![](/img/daily.png)

### Monthly 

![](/img/monthly.png)