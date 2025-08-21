## The Fundamental Theorem of Ultimate Frisbee

The Fundamental Theorem of Ultimate Frisbee is that if you lost by X points, you had X or X-1 more turnovers.

More specifically 

If team A starts on offence, then at the start of every point 

A points + A turnovers - I(A receiving pull)  = B points + B turnovers - I(B won half)

Where I(⋅) is an indicator function that equals 1 if the condition is true, and 0 otherwise.

This can be rearranged as 

(A points - B points) = (B turnovers - A turnovers) + I(A receiving pull) - I(B won half)

NB: The last two terms can only be 1 or 0 and hence the last two terms can only sum to 1 or 0.

### Proof

Assumptions: Game is first to N

Every time there is a turnover or a score, possession changes (One exception is at half time) 

The number of possessions of team A is equal to team B, or A team has an extra posession because they start with the disc. + I(A receiving pull) accounts for A starting with posession at the start of the game.

This means the number of turnovers + scores of A team is equal to (or one more than) turnovers + scores of B team. 

Accounting for half time is simple. Suppose team B won half, then B had possession at the end of the point, and at the start of the next point (i.e. the point after half time) therefore posession didn't change. -I(B won half) in the formula accounts for the loss of one possession if B takes half.

### Why do I care?

High level players already understand this, more turnovers = you lose. But when you start playing ultimate and finish a 90 minute game the reasons you won or lost may escape you. 

The bottom line is that if you want to win a game, you need to 1. not turn the disc over and 2. make the other team turn the disc over. 

This doesn't mean that hucks and other high risk throws are bad, a 60% huck to the endzone is better than making scoring via 10 throws that have a 5% chance of turning over.

Want to know how the likelihood of turning the disc over affects your chances of winning? Take a look at this [ultimate simulator](https://cherianb59.github.io/static/ultisim.html).
