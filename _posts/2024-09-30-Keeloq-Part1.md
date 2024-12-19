## Keeloq Part 1 


This is a 5 part series on the Keeloq algorithm and how to break it. I have been interested in Keeloq from 2013 when I first moved into a house with an automatic garage doors and I wanted to know how they work. Studying how to break it has taught me a lot about enryption and greatly mproved my programming skills, and ability to read academic papers.

### Background 
Keeloq was invented in the 1980s and has been used to make secure garage door openers and car door unlockers
This series will focus on the garage door openers becuase I had one and wanted to know how it worked and most of the academic literature on breaking it fousses on garage door openers. 

The first remote control garage door openers transmitted the same code to the recivers. This is very insecure as an adversary can "listen" to the code and replay it to open the garage door. 

Keeloq stops this replay attack by sending a counter in the transmission, and encrypting the transmission. The receiver decrypts the transmission and then checks the counter. If the counter is less than what the reciver has stored, it won't open the door. If the counter is larger than what it has stored then the door will open and it will store the counter value the transmitter sent. 
If an attacker tries to replay a code it won't work. The replayed code has a counter value that will be rejected by the garage door reciever. They also can't create a code with a higher counter value as they don't have the encryption key.

In 2007 Andrey Bogdanov published the first Cryptanalysis of the keeloq cipher. There were weaknesses but they couldn't be used to exploit garage doors. Further mathematical analysis reduced the requirements to break the encryption, but they always required known plaintext and ciphertext pairs, but garage door fobs only transmit the ciphertext(plaintext is not known) hence these attacks were useless. 

In 2008 Timo Kasper and Tomas Eisenbarth published a paper on using power analysis to get teh encryption key. By measuring the amount of power used by the keyfob when it was encrypting they could deduce the key used in encryption. 

### Keeloq Cipher

Keeloq takes a 32 bit plaintext and a 64 bit key and uses a Non Linear Feedback Shift Register to produce a 32 bit ciphertext. 

There are 528 rounds , every round it shifts everything in the plaintext left one bit, and appends a bit in the Most Significant Bit (MSB).

The MSB is calculated as follows
It XORs 

This is the C implementation. 

```python
#define KeeLoq_NLF		0x3A5C742E
#define bit(x,n)		(((x)>>(n))&1)
#define g5(x,a,b,c,d,e)	(bit(x,a)+bit(x,b)*2+bit(x,c)*4+bit(x,d)*8+bit(x,e)*16)

uint32_t	KeeLoq_Encrypt (const uint32_t data, const uint64_t key)
{
	uint32_t	x = data, r;

	for (r = 0; r < 528; r++)
	{
		x = (x>>1)^((bit(x,0)^bit(x,16)^(uint32_t)bit(key,r&63)^bit(KeeLoq_NLF,g5(x,1,9,20,26,31)))<<31);
	}
	return x;
}

uint32_t	KeeLoq_Decrypt (const uint32_t data, const uint64_t key)
{
	uint32_t	x = data, r;

	for (r = 0; r < 528; r++)
	{
		x = (x<<1)^bit(x,31)^bit(x,15)^(uint32_t)bit(key,(15-r)&63)^bit(KeeLoq_NLF,g5(x,0,8,19,25,30));
	}
	return x;
}

```


And here is the decryption .

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



![](/img/BigFontGlyphs.jpg)

![](/img/4x4-font.jpg)

