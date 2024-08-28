## TT Scorer
My housemate bought a table tennis table and we started to play  in between rounds of losing DoTA.
After having played several tens of games I wanted a scoreboard. Something that showed the current score, points and sets, which side you are meant to be on and also who is serving. A phone app could do this, but there was nothing available, and I didn't know how to make one. 
 
This was a good project to start learning the arduino platform. I bought a 4x20 hitachi screen to display all the information and had to figure out a way to communicate with it. 

The first issue was making the scoreboard large enough to read from 2 meters away. The hitachi screen was easy to use, simply give a string and a position and the screen will print it on the 80 available tiles. Each character only fills up one of the 4x20 tiles but they were too small to read. There weren't enough tiles to use ascii art to make a larger looking number.

That is until I found a github project (https://github.com/gcassarino/BigFont) where someone added 8 custom glyphs (characters) which could be used to make larger looking numbers. The glyphs look like this.
![](/img/BigFontGlyphs.jpg)

And how they are put together to make the larger digits like this.
 ![](/img/4x4-font.jpg)

Each number now was 4 x 4 tiles and I needed up to 4 digits to show the score. THis meant 16 of the columns were used just for showing the score. I had 4 columns to play around with and I used one of them separate the scores and the 3 remaining columns could who was serving and which side you were meant to be on. 

With the score display out of the way I could start working on choosing players and displaying who would server and the side they would be on.

How to communicate with the scorer? Buttons aren't great, I don't want to walk to the scorer after every point. I needed something wireless and I found Wifi and bluetooth too complicated, I turned to an older technology, infrared. IR receivers are cheap and IR transmitters (TV remotes) are plentiful. The code to read and send IR signals is easily available and components easy to wire up. The only hardware I needed to add was an IR receiver and a resistor, I already had a spare remote from a set top box that was no longer useful. It wasn't too hard to figure out the code each button was sending and I added these int othe main program. The tricky part was making sure it understood and reacted properly. 

To do this i needed to make a number of states that the program could be in, these states would be player selection, side and serve selection and then the scoring state. 
For the player state I wanted to be able to scroll through a list of players and select my name and my opponents name. I had to make an array and then create a function that would scroll down. what actually happened is once it reached the bottom player and you selected  next state was set selection after player selection this was a piece of cake.
next state was score display and finally display who won 
Implement an undo button. this would lower the most recent score and then recalculate whose serve which side etc. the only problem is if you won the set or won the match you couldn’t go back.
 
