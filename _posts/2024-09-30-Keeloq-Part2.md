## Keeloq Part 2 - Power Analysis


Every round one bit of the key is used, only the MSB changes every round during encryption.

Power analysis uses the power consumed by the computational device to make guesses about the key.

A very simple power analysis could be of the form, if a 1 bit of the key was used then more power is consumed, if a 0 bit was used then less power is consumed. By measuring the power used over the 528 rounds and seeing if more or less power was used the key could be inferred.

It is not quite this simple unfortunately.

Most keyfobs use Microchips HCSX01 series (HCS201, HCS301, HCS401). This is a single chip used in the transmitter. The researchers found that the power consumption is related to the hamming distnace between two states. 

e.g.


FOr keeloq the key register is being rotated by one bit every round, the hamming distnace is equal every round. 
The state register has one bit changing every round (The MSB), the other 31 bits are left shifted.

If we start with theoutput we know 32 bits of the final round of keeloq. This means we also know 31 bits of teh second last round, round 527. Only bit 0 is not known.


Looking at the equation the 
We have the components of the

![](/img/4x4-font.jpg)

