## Keeloq Part 2 - Power Analysis

Power analysis uses the power consumed by the computational device to make guesses about the key.

A very simple power analysis could be of the form, if a 1 bit of the key was used then more power is consumed, if a 0 bit was used then less power is consumed. By measuring the power used over the 528 rounds and seeing if more or less power was used each round the key could be inferred.

For Keeloq it is not quite this simple.

Most keyfobs use Microchips HCSX01 series (HCS201, HCS301, HCS401). This is a single chip used in the transmitter. The researchers found that the power consumption is related to the changes in the registers in the chip. Also known as the hamming distance of a register before and after a round of encryption. Put simple it is the number of bits that flip (change from 0 to 1 or from 1 to 0 ) each round.  

There are two registers in the chip, the key register and the state register. The key register rotates every round, hence the number of bits that flip or Hamming distance is constant and it can't be used in the power analysis.

The state register is used to encrypt the 32 bits of the plaintext. This register also rotates every round, however the most significant bit changes (see part one for details). Hence it can be used for power analysis. 

We can collect two peices of data from the  the fob, the amount of power used, and the transmission (the cipher text or the 32 bits of the final round of keeloq).

Knowing the 32 bits from the last round of encryption means we also know 31 bits of the second last round, round 527. Only bit 0 from round 527 is not known.

From part one 

After each round the new most significant bit is  

$$ \varphi^{(i)} = \text{NLF} \left( y_{31}^{(i)}, y_{26}^{(i)}, y_{20}^{(i)}, y_{9}^{(i)}, y_{1}^{(i)} \right) 
\oplus y_{16}^{(i)} \oplus y_{0}^{(i)} \oplus k_{i \mod 64} $$

hence 

$$ Y^{(i+1)} = \left( \varphi^{(i)}, y_{31}^{(i)}, \ldots, y_{1}^{(i)} \right) $$

For the last round

$$ Y^{(528)} = \left( y_{31}^{(528)}, y_{30}^{(528)}, \ldots , y_{0}^{(528)} \right)  = \left( \varphi^{(527)}, y_{31}^{(527)}, \ldots, y_{1}^{(527)} \right) $$

$$ Y^{(527)} = \left( y_{31}^{(527)}, \ldots, y_{1}^{(527)} , y_{0}^{(527)} \right )  $$ 

$$ Y^{(527)} = \left( y_{30}^{(528)}, \ldots, y_{0}^{(528)} , y_{0}^{(527)} \right ) $$


Only $$y_{0}^{(527)}$$  is unknown, the rest is from the transmission, by rearranging the equation to get the MSB of the final round of encryption

$$ y_{31}^{(528)} = \text{NLF} \left( y_{30}^{(528)}, y_{25}^{(528)}, y_{19}^{(528)}, y_{8}^{(528)}, y_{0}^{(528)} \right) 
\oplus y_{15}^{(528)} \oplus y_{0}^{(527)} \oplus k_{528 \mod 64} $$

We get

$$ y_{0}^{(527)}  =  k_{527 \mod 64}  \oplus  \text{NLF} \left( y_{30}^{(528)}, y_{25}^{(528)}, y_{19}^{(528)}, y_{8}^{(528)}, y_{0}^{(528)} \right) 
\oplus y_{15}^{(528)} \oplus y_{31}^{(528)}$$

The gives the relationship between $$y_{0}^{(527)}$$  and  $$ k_{527 \mod 64}  $$, therefore correctly guessing one bit of the state register using power analysis will reveal one bit of the key.

This can be used to recover all bits of the key.



![](/img/4x4-font.jpg)

