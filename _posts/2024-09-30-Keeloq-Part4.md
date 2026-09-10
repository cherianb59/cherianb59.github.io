---
layout: post
title: Keeloq Part 4 - Optimisations
description: Optimisations
date: 2025-09-30 11:12:30 +1000
tags: Programming
---

## Keeloq Part 4 - Optimisations

This part will focus on optimising code for power analysis and speeding up brute force attacks.


### ctypes

Calling C functions from python greatly speeds up power analysis

If 4 bits of a key are guessed each round and the best 6 keys are kept
64/4 = 16 rounds. 16 (first round, 16 guess to try) + 16*6 (16 * 6 key guesses for all further rounds) * 15 (15 further rounds) guesses. The power analysis is performed on 1456 key guesses.

Using pure python it takes 115 seconds, using ctypes takes 8 seconds. A speed up of 14x.  

Using ctypes is relatively simple, I replaced the partial decryption function, which performs n decryption rounds and returns the hamming distance of the last round with the equivalent in C. 

First write the C code 

```c
#define KeeLoq_NLF		0x3A5C742E
#define bit(x,n)		(((x)>>(n))&1)
#define g5(x,a,b,c,d,e)	(bit(x,a)+bit(x,b)*2+bit(x,c)*4+bit(x,d)*8+bit(x,e)*16)

uint32_t popcount_2(uint32_t x)
{
    uint32_t m1 = 0x55555555;
    uint32_t m2 = 0x33333333;
    uint32_t m4 = 0x0f0f0f0f;
    x -= (x >> 1) & m1;
    x = (x & m2) + ((x >> 2) & m2);
    x = (x + (x >> 4)) & m4;
    x += x >>  8;
    return (x + (x >> 16)) & 0x3f;
}

uint32_t	KeeLoq_Partial_Decrypt_Power (const uint32_t data, const uint64_t key, const uint32_t stop)
{
	uint32_t	x = data, r, power, y1,y0;
    
	for (r = 0; r < stop; r++)
	{
	  if (r == stop - 1)  { y1 = x ; }
      x = (x<<1)^bit(x,31)^bit(x,15)^(uint32_t)bit(key,(15-r)&63)^bit(KeeLoq_NLF,g5(x,0,8,19,25,30));
      if (r == stop - 1)  { y0 = x ; }
	}
    power = popcount_2(y1^y0) ; 
	return power;
}

```

Then in python the ctypes library needs to be imported, and the types of the input and output of the function needs to be specified

```python

import ctypes 

lib = ctypes.CDLL('./keeloq.so')

lib.KeeLoq_Partial_Decrypt_Power.argtypes = [ ctypes.c_uint32, ctypes.c_uint64, ctypes.c_uint32]
lib.KeeLoq_Partial_Decrypt_Power.restype = ctypes.c_uint32


```

In algorithm 1 the function needs to be replaced with the ctype equivalent

```python

...
        #v['dummy_power'] = partial_decrypt_power(ciphertext, device_keyhyp ,key_depth)
        v['dummy_power'] = lib.KeeLoq_Partial_Decrypt_Power(ciphertext, device_keyhyp , key_depth) 
...
```


## Brute Forcing Methods

The following two techniques looks at bruteforcing guessing keys. Why would we want to bruteforce?

Sidetrack: How do the keyfob and garage door opener know the which key is used? The key has to be kept secure, it shouldn't be transmitted out in the open. The key sharing also needs to be idiot proof. A lot of simpletons own garage doors and any mildly complicated setup will mean the garage door opener won't sell.  

There are 4 methods used, all of them use a 64 bit manufacturer key which is the same across all garage door opener units from the same manufacturer. 

Method 1 - The 64 bit manufacturer key is used to decrypt the serial number of the keyfob, and the decrypted serial number is used as the keyfob key (device key). The keyfob is programmed with the device key at the factory. The user has to press a learning button on the garage door opener, and then press any button on the keyfob. This will register the serial number with the garage door opener. When the keyfob transmits, the opener will read the serial number (which is sent unencrypted), check that it is registered, then derive the device key by decrypting the serial number using the manufacturer key, then use the device key to decrypt the encrypted section. 

Method 2 - Similar to method 1 but instead of using the serial number a random seed is used. The user setup is more complicated, they press the learning button on the garage door opener, and then press a specific button on the keyfob. This button sends the seed to the garage door opener. The garage door opener will decrypt the seed using the manufacturer key, this produces the device key. 

Method 3 - Same as method 1, but instead of using Keeloq decryption, XOR is used, i.e. the manufacturer key is XOR'ed with the serial number.

Method 4 - Same as method 2, but instead of using Keeloq decryption, XOR is used, i.e. the manufacturer key is XOR'ed with the seed.

If the device key is recovered, bruteforcing can reveal the manufacturer key. Power analysis can also be used, but it is more difficult as a microcontroller is used in the garage door reciever. 



### GPGPU - OpenCL, CUDA

Using the graphics card to bruteforce key guesses allows much more throughput. 

It is simple to implement as the code is very similar to C.

It's not really fair to compare CPU and GPU as it depends on a particular setup. I think a good comparison is the amount of energy it takes.

### Bit Slicing

Brute forcing has previously worked on one key at a time.

Bit slicing speeds up bruteforcing by working with more than one bit at a time. 

So far the Keeloq encryptions have calculated one bit in each round. 

If many keys are trying to be guessed the processor word size can be exploited.

Imagine we have a 32 bit processor, it can perform AND and XOR operations on 32 bit operands, this allows guessing 32 keys at once.

Suppose we test out keys 0-31 i.e. these keys 
 
0000000000000000000000000000000000000000000000000000000000000000 - key 0

0000000000000000000000000000000000000000000000000000000000000001 - key 1

...

0000000000000000000000000000000000000000000000000000000000011111 - key 31



First transpose such that they keys are an array of 32 bit words. The first element of the array represents the bit 0 of each of the 32 keys, second element is bit 1, etc.

10101010101010101010101010101010 - bit 0 

11001100110011001100110011001100 - bit 1

11110000111100001111000011110000 - bit 2

11111111000000001111111100000000 - bit 3

11111111111111110000000000000000 - bit 4

00000000000000000000000000000000 - bit 5

00000000000000000000000000000000 - bit 6

...

00000000000000000000000000000000 - bit 63



The plaintexts also have to be transposed simlarly.

The operations XOR and AND can now operate on the entire array at once, this is where the speed up occurs.

There are two downsides.

The NLF can't use the lookup table anymore it has to be converted to Algebraic normal form (i.e. into XOR and AND)
Bit shifting also doesn't work. When a rotate is needed the elements of the array can be moved to a lower (left shift) or higher (right shift) index.

A smarter way would be to use an offset index, instead of tying .

Another inefficiency comes from tranposing the key and text at the start and end of the encryption.

### Por Que No Los Dos?

Bit Slicing and GPGPU can be combined to use the GPU's word size.

These guys did it in 2012 [](https://barenghi.faculty.polimi.it/lib/exe/fetch.php?media=parma2012.pdf)

Using an i7 920 single threaded gave 0.451 M keys / second, while using a GTX 270 gives 19.6 M keys / second, a speed up of 42x. 

My own results using a Ryzen 5 7600 and a GTX 1060 are 

| Implementation | Engine / Hardware | Decryption (Ops/sec) | Encryption (Ops/sec) | Parity Ratio |
| :--- | :--- | ---: | ---: | ---: |
| Pure Python (Inlined) | 1 Core (Python Bytecode) | 4,308 | 4,183 | 97.1% |
| Pure Python (64-Way Bitslice) | 1 Core (Python Integers) | 140,248 | 143,892 | 102.6% |
| Standard C Reference (1 Core) | 1 Core (Native Scalar C) | 1,068,754 | 912,231 | 85.4% |
| Python + ctypes (Standard C) | 1 Core (Native C DLL) | 1,047,302 | 912,154 | 87.1% |
| Python + ctypes (64-Way Bitslice) | 1 Core (uint64 C DLL) | 36,571,436 | 37,255,396 | 101.8% |
| Python + ctypes (256-Way AVX2) | 1 Core (AVX2 C DLL) | 83,900,403 | 83,912,119 | 100.0% |
| 64-Way Bitslice C (1 Core) | 1 Core (Native uint64) | 54,746,425 | 55,966,060 | 102.2% |
| 64-Way Bitslice C (12 Cores) | 12 Cores (Native uint64) | 310,760,101 | 305,200,000 | 98.2% |
| 256-Way AVX2 Bitslice C (1 Core) | 1 Core (Native AVX2) | 279,208,358 | 291,059,175 | 104.2% |
| 256-Way AVX2 Bitslice C (12 Cores) | 12 Cores (Native AVX2) | 1,507,414,602 | 1,653,198,353 | 109.6% |
| GPU Bitsliced Parallel CUDA | NVIDIA GTX 1060 (1280 Cores) | 1,191,005,940 | 1,117,881,685 | 93.8% |