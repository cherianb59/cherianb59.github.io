## The Fundamental Theorem of Ultimate Frisbee

The Fundamental Theorem of Ultimate Frisbee is that if you lost by X points, you had X or X-1 more turnovers.

More specifically 

If team A starts on offence, then at the start of every point  A points + A turnovers - I(A receiving pull)  = B points + B turnovers - I(B won half)

Where 
I(⋅) is an indicator function that equals 1 if the condition is true, and 0 otherwise.

This can be rearranged as 

(A points - B points) = (B turnovers - A turnovers) + I(A receiving pull) - I(B won half)

The last two terms can only sum to 0 or 1 

### Proof

Assumptions: Game is first to N

Every time there is a turnover or a score possession changes. 
One exception is at half time. 

The number of possessions of A team is equal to B team or A team has an extra posession because they start with the disc.  I(A receiving pull) accounts for A starting with posession at the start of the game.

This means the number of turnovers + scores of A team is equal to (or one more than) turnovers + scores of B team. 

Accounting for half time is simple. If B won half, then B had possession at the end of the point, and at the start of the next point i.e. posession didnt change. I(B won half) in the formula accounts for the loss of one possession if B talks half.


