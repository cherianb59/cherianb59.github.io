## Keeloq Part 4 - Optimisations

This part will focus on optimising code for power analysis and speeding up brute force attacks.


### ctypes

Calling C functions from python

Greatly speeds up power analysis

If 4 bits of a key are guessed each round and the best 6 keys are kept
64 /4 = 16 rounds. 16 (first round, 16 guess to try) + 16*6 (16 * 6 key guesses for all further rounds) * 15 (15 further rounds) guesses. The power analysis is performed on 1456 key guesses.

Using pure python this takes x seconds, but using ctypes it speeds up to y seconds.

Using ctypes is also relatively simple. 



### OpenCL, CUDA

Using the graphics card to bruteforce key guesses allows much more throughput.

It is simple to implement as the code is very similar to C.

It's not really fair to compare CPU and GPU as it depends on my particular setup. I think a good comparison is the amount of energy it takes.

### Bit Slicing

Bit slicing speeds up bruteforcing by working with more than one bit at a time. 

So far the Keeloq encryptions have owrked on one bit at a time. 

If many keys are trying to be guessed the processor word size can be exploited.

Imagine we have a 32 bit processor, it can perform AND and XOR operations on 32 bit operands, this allows guessing 32 keys at once.

Suppose we test out keys 0-31
i.e. these keys 
 
0000000000000000000000000000000000000000000000000000000000000000 - key 0
0000000000000000000000000000000000000000000000000000000000000001 - key 1
...
0000000000000000000000000000000000000000000000000000000000011111 - key 31

Brute forcing has worked on one key at a time.

First transpose such that they keys are an array of 32 bit words. The first element of the array represents the 

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

The operations XOR and AND can now operate on each elemenet of the array, this is where the speed up occurs.

There are two downsides.

The NLF can't use the lookup table anymore it has to be converted to Algebraic normal form (i.e. into XOR and AND)
Bit shifting also doesn't work. When a rotate is needed the elements can be shifted to a lower (left shift) or higher (right shift) index.

Another inefficiency comes from tranposing the key and text at the start and end of the encryption.

Speed up
