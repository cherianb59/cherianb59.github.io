## Keeloq Part 1 - The Algorithm


This is a 5 part series on the Keeloq algorithm and how to break it. I have been interested in Keeloq from 2013 when I first moved into a house with an automatic garage doors and I wanted to know how they work. Studying how to break it has taught me a lot about enryption and greatly improved my programming skills and ability to read academic papers.

### Background 
Keeloq was invented in the 1980s and has been used to make secure garage door openers and car door unlockers
This series will focus on the garage door openers becuase I had one and wanted to know how it worked and most of the academic literature on breaking it fousses on garage door openers. 

The first remote control garage door openers transmitted the same code to the recivers. This is very insecure as an adversary can "listen" to the code and replay it to open the garage door. 

Keeloq stops this replay attack by sending a counter in the transmission, and encrypting the transmission. The receiver decrypts the transmission and then checks the counter. If the counter is less than what the reciver has stored, it won't open the door. If the counter is larger than what it has stored then the door will open and it will store the counter value the transmitter sent. 
If an attacker tries to replay a code it won't work. The replayed code has a counter value that will be rejected by the garage door reciever. They also can't create a code with a higher counter value as they don't have the encryption key.

In 2007 Andrey Bogdanov published the first Cryptanalysis of the keeloq cipher. There were weaknesses but they couldn't be used to exploit garage doors. Further mathematical analysis reduced the requirements to break the encryption, but they always required known plaintext and ciphertext pairs. Garage door fobs only transmit the ciphertext, the plaintext is not known hence these attacks were useless. 

In 2008 Timo Kasper and Tomas Eisenbarth published a paper on using power analysis to get the encryption key. By measuring the amount of power the keyfob used while it was encrypting they could deduce the key used in encryption. The first part ot this series covers the Keeloq cipher, the second covers using power analysis to break the encryption.


### What happens when you press the button

This section explains what happens when a fob uses the HCS301 chip, other chips have a very similar operation. This chip has 4 buttons, it is programmed with a 64 bit key, 28 bit serial number and 16 bit syncronisation counter.

Each time a button is pressed the syncronisation counter is incremented. 

It then transmits 66 bits to the garage door reciever. 

![](/img/code word transmission.png)

The first 34 bits are unencrypted and consist of a repeat bit, Vlow bit, the button status (which button was pressed) and the serial number. The transmission then contains the encrypted section which consists of the button status (again), the syncronisation counter, overflow bits for the syncronisation counter and the 10 least significant bits of the serial number. The encrypted section is 32 bits and is encrypted using the 64 bit key.  

The garage door opener receives these and decrypts the encrypted portion. It compares the syncronisation counter to it's own syncronisation counter and if the transmitted counter is higher, it will replace the internally stored counter with the transmitted one and then operates the door. If the transmitted one is lower, then it doesn't do anything. 

The transmitted DISC (the 10 least significant bits of the serial number) is compared to the unencrypted section (which contains the whole serial number) to ensure the transmission and decryption worked.  

### Keeloq Cipher

Keeloq takes a 32 bit plaintext and a 64 bit key and uses a Non Linear Feedback Shift Register to produce a 32 bit ciphertext. 

There are 528 rounds, every round it shifts everything right one bit, and appends a new bit in the Most Significant Bit (MSB).

The key is also right shifted very round. 

The new bit is calculated by XORing the plaintext bit 0 (least significant bit), bit 16, bit 0 from the key and the output of a nonlinear function. 

The Non Linear Function (NLF) takes five bits from the plaintext (bits 21, 26, 20, 9 and 1) and outputs one bit.
It is defined as 

$$
NLF(x_{4},x_{3},x_{2},x_{1},x_{0}) =  x_{4}x_{3}x_{2} \oplus x_{4}x_{3}x_{1} \oplus x_{4}x_{2}x_{0} \oplus x_{4}x_{1}x_{0}
\oplus x_{4}x_{2} \oplus x_{4}x_{0} \oplus x_{3}x_{2} \oplus x_{3}x_{0} \oplus x_{2}x_{1} \oplus x_{1}x_{0}
\oplus x_{1} \oplus x_{0} 
$$

However in academic literature and in code it was described as 0x3A5C742E or 00111010 01011100 01110100 00101110 in binary.

This confused me for a long time but I realised it is a look up table. Since there are five bits there are total of 32 possible inputs, 0,0,0,0,0 - 1,1,1,1,1. Each of the possible inputs is passed through the NLF and each of the one bit output is stored in a single 32 bit number. If the input is 0,0,0,0,0 the one bit output is stored in the least significant bit, the output from 0,0,0,0,1 is stored in the next least significant bit and so on. 
Now instead of calculating the NLF it can be looked up. For example if the five inputs are 1,0,1,0,0 then this is read as 10100 (20 in decimal) and then the 20th bit in 0x3A5C742E is used, that is the output of the NLF.
This saves time as the NLF has to computed only 32 times, it can be stored on the chip in 4 bytes and merely has to be looked up when encrypting or decrypting. This saves ~ 30 operations every round.

In academic literature Keeloq encryption is described like this 

Let  $$ Y^{(i)} = \left ( y_{31}^{(i)}, \ldots, y_{0}^{(i)} \right) \in \{0,1\}^{32} $$ be the input for round i and $$ K = \left ( k_{63}, \ldots, k_{0} \right) \in \{0,1\}^{64} $$  be the key.
THe input to round 0 is the plaintext $$ P = Y^{(0)} $$ and the ciphertext is the output after 528 rounds $$ C = Y^{(528)} $$ 

Each round the new most significant bit is  

$$ \varphi^{(i)} = \text{NLF} \left( y_{31}^{(i)}, y_{26}^{(i)}, y_{20}^{(i)}, y_{9}^{(i)}, y_{1}^{(i)} \right) 
\oplus y_{16}^{(i)} \oplus y_{0}^{(i)} \oplus k_i \mod 64 $$

hence 

$$ Y^{(i+1)} = \left( \varphi^{(i)}, y_{31}^{(i)}, \ldots, y_{1}^{(i)} \right) $$


This is the C implementation of keeloq. 

The bit(x,n) macro gets the n'th bit from the number x. 

```c
#define KeeLoq_NLF		0x3A5C742E
#define bit(x,n)		(((x)>>(n))&1)
#define g5(x,a,b,c,d,e)	(bit(x,a)+bit(x,b)*2+bit(x,c)*4+bit(x,d)*8+bit(x,e)*16)

uint32_t KeeLoq_Encrypt (const uint32_t data, const uint64_t key)
{
  uint32_t	x = data, r;

  for (r = 0; r < 528; r++)
  {
	x = (x>>1)^((bit(x,0)^bit(x,16)^(uint32_t)bit(key,r&63)^bit(KeeLoq_NLF,g5(x,1,9,20,26,31)))<<31);
  }
  return x;
}
```

And here is the decryption:

```c

uint32_t KeeLoq_Decrypt (const uint32_t data, const uint64_t key)
{
  uint32_t	x = data, r;

  for (r = 0; r < 528; r++)
  {
    x = (x<<1)^bit(x,31)^bit(x,15)^(uint32_t)bit(key,(15-r)&63)^bit(KeeLoq_NLF,g5(x,0,8,19,25,30));
  }
  return x;
}

```
