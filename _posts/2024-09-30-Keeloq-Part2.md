---
layout: post
title: Keeloq Part 2 - Power Analysis
description: Measuring power to crack keys
date: 2025-09-30 11:12:30 +1000
tags: Programming
---

## Keeloq Part 2 - Power Analysis

Power analysis is a key recovery technique which uses the power consumed by the computational device to make derive a cryptographic key.

Here is a very simple made up power analysis example. Keeloq uses one bit from teh 64 bit key every round. Suppose that if the key bit is 1 then more power is consumed, if it was a 0 bit then less power is consumed. By measuring the power used over the 528 rounds and seeing if more or less power was used each round the key could be inferred.

Unfortunately it is not quite this simple.

Most keyfobs use Microchips HCSX01 series chips (HCS201, HCS301, HCS401). This single chip handles the encryption and radio tranmission. Researchers found that the power consumption during the encryption phase is related to the changes in the vale of registers in the chip. This is also known as the hamming distance of a register before and after a round of encryption. Or put simply it is the number of bits that flip (change from 0 to 1 or from 1 to 0 ) each round.  

There are two registers in the chip, the key register and the state register. The key register rotates every round, hence the number of bits that flip or Hamming distance is constant and it can't be used in the power analysis.

The state register is used to encrypt the 32 bits of the plaintext. This register also rotates every round, however the most significant bit changes (see part one for details). Hence it can be used for power analysis. 

We can collect two pieces of data from the fob, the amount of power used, and the transmission (the cipher text or the 32 bits of the final round of keeloq).

Knowing the 32 bits from the last round of encryption means we also know 31 bits of the second last round, round 527. Only bit 0 from round 527 is not known.


Let $$ Y^{(i + 1)} $$ be the state register after $$ i $$ rounds of encryption.

Let $$ \left( y_{k}^{(i)}) $$  be the the k'th bit after $$ i $$ rounds of encryption.

Let $$ \varphi^{(i)} $$ be the bit calculated after  $$ i $$ rounds of encryption.

After each round the new most significant bit is  

$$ \varphi^{(i)} = \text{NLF} \left( y_{31}^{(i)}, y_{26}^{(i)}, y_{20}^{(i)}, y_{9}^{(i)}, y_{1}^{(i)} \right) 
\oplus y_{16}^{(i)} \oplus y_{0}^{(i)} \oplus k_{i \mod 64} $$

hence 

$$ Y^{(i+1)} = \left( \varphi^{(i)}, y_{31}^{(i)}, \ldots, y_{1}^{(i)} \right) $$

The last round, which is transmitted by the key fob is:

$$ Y^{(528)} = \left( y_{31}^{(528)}, y_{30}^{(528)}, \ldots , y_{0}^{(528)} \right)  = \left( \varphi^{(527)}, y_{31}^{(527)}, \ldots, y_{1}^{(527)} \right) $$

$$ Y^{(527)} = \left( y_{31}^{(527)}, \ldots, y_{1}^{(527)} , y_{0}^{(527)} \right )  $$ 

$$ Y^{(527)} = \left( y_{30}^{(528)}, \ldots, y_{0}^{(528)} , y_{0}^{(527)} \right ) $$


Only $$y_{0}^{(527)}$$ and $$ k_{527 \mod 64}  $$ are unknown, the rest of the bits are known as they come from the transmission. By rearranging the equation to get the MSB of the final round of encryption

$$ y_{31}^{(528)} = \text{NLF} \left( y_{30}^{(528)}, y_{25}^{(528)}, y_{19}^{(528)}, y_{8}^{(528)}, y_{0}^{(528)} \right) 
\oplus y_{15}^{(528)} \oplus y_{0}^{(527)} \oplus k_{528 \mod 64} $$

We get

$$ y_{0}^{(527)}  =  k_{527 \mod 64}  \oplus  \text{NLF} \left( y_{30}^{(528)}, y_{25}^{(528)}, y_{19}^{(528)}, y_{8}^{(528)}, y_{0}^{(528)} \right) 
\oplus y_{15}^{(528)} \oplus y_{31}^{(528)}$$

The gives the relationship between $$y_{0}^{(527)}$$  and  $$ k_{527 \mod 64}  $$, therefore correctly guessing one bit of the state register $$ y_{0}^{(527)}  $$ using power analysis will reveal one bit of the key.

This covers all the theory, the next section will cover how this is done practically. 
