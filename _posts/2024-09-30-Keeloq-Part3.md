---
layout: post
title: Keeloq Part 3 - Cracking the key
description: Cracking the key
date: 2025-09-30 11:12:30 +1000
tags: Programming
---

## Keeloq Part 3 - Cracking the key

From the last section the power consumption during each round of the the encryption phase is proportional to the number of bits flipped in the state register before and after each round.

However only the least significant bit of the state changes in each round of the encryption.

Guessing one bit a time isn't efficient as the difference in power consumption for one round is very small. Due to noise the wrong bit could be used, which makes the entire key useless. 

Multiple bits are tested and the best keys are kept using the following algorithm. 

#### Algorithm 1 ####

Input: m (length of key guess), n (number of surviving key guesses), k (known previous key bits)

Output: SurvivingKeys

    1: KeyHyp = {0, 1}^m 
    
    2: for all KeyHypi; 0 ≤ i < 2^m do
    
        3: Perform Correlated Power Analysis on round (528 − m) using PHyp and k
        
    4: end for
    
    5: SurvivingKeys = n most probable partial keys of KeyHyp
    

The data required is a number of ciphertexts and powertraces at each round of the encryption. This is recorded by pressing the keyfob button a number of times and capturing the radio transmission and using an oscilliscope to capture the power used. The first m bits of the key are guessed, e.g. if m = 4, 16 keys would be tested. For each of the ciphertexts recorded, each of the keys will have their power consumption modelled for 4 rounds, this is the hypothetical power consumption. For each of the keys the hypothetical power consumption at round 4 is correlated with the actual power consumption at round 4 and the n most correlated keys are kept for the next round. For the next round the next 4 bits are guessed. This means there are 16n guesses for each of the subsequent rounds. The proceses is finished after 64/4 = 16 rounds.  

This is the python code used to perform power analysis 

```python
def key_register(key):
    '''take a base 10 digit convert it into the actual key in the right format (flipped and left rotated 16 bits)'''
    key = bin(key)[2:] #get rid of 0b
    key = key.zfill(64)#64 chars
    key = key[-17::-1] + key[:-17:-1]
    key = int(key,2)   #convert to binary
    return key

def decrypt_round(cipher,device_key,decrypt_round):
    '''one round of a keeloq decryption'''
    #The key starts at bit 15 and then gets left shifted (next bit used is 14)
    return ((cipher<<1) ^bit(cipher,31) ^bit(cipher,15) ^bit(device_key,(15-decrypt_round)&63) ^bit(KeeLoq_NLF,g5(cipher,0,8,19,25,30))) & 0xFFFFFFFF
  
def partial_decrypt_power(cipher,device_key,stop):
    ''' Get the power usage after a partial decrypt'''
    for r in range(stop):
        if r == stop - 1 : y1 = cipher
        cipher = decrypt_round(cipher,device_key,r)
        if r == stop - 1 : y0 = cipher

    #the power output is the hamming distance between the last two rounds    
    power = bin(y1^y0).count('1')

    return power

  
def algorithm1(key_length_guess, n, ciphertexts , power_traces , prev_keys = [0] , current_bits_guessed = 0 ):
    '''
    guess m bits of the keys (try 2**m) keys, take the best n
    best n is based on the higest correlation between the actual power and the power hypothesis based on the guessed keys 
    '''
    
    #put into normal form
    temp_1 = [ key_register(x) for x in  prev_keys]  
    #add more MSB for guessing 
    temp_2 = [  ( (y <<current_bits_guessed) ^ x) for x in temp_1 for y in range(2**key_length_guess)]
    #put back into key register form for decrypting
    keyhyp = [ key_register(x) for x in  temp_2 ]
    #all combinations of test keys and ciphertexts
    keyhyp_d = { (key, ciphertext) : {} for key in keyhyp for ciphertext in ciphertexts}
    
    key_depth = current_bits_guessed + key_length_guess

    for key,v in keyhyp_d.items():
        device_keyhyp = key[0]
        ciphertext = key[1]
        power_trace =  power_traces[ciphertext]['powertrace_sim']
        
        v['test_key'] = device_keyhyp  
        v['bin_repr'] = bin(device_keyhyp)[2:].zfill(64)  
        v['dummy_power'] = partial_decrypt_power(ciphertext, device_keyhyp ,key_depth)
        
        v['power_trace'] = power_trace[-key_depth]

    df = pd.DataFrame([{'test_key':k[0], 'ciphertext':k[1], 'bin_repr': v['bin_repr'], 'dummy_power': v['dummy_power'], 'power_trace': v['power_trace']} for k,v in keyhyp_d.items()])

    correlation_by_group = df.groupby(['test_key', 'bin_repr']).apply(lambda g: g['dummy_power'].corr(g['power_trace'])).reset_index()
    sorted_corr = correlation_by_group.sort_values(by=0,ascending=False)
            
    return({"likely_keys" : list(sorted_corr['test_key'][0:n]), "current_bits_guessed" : key_depth }) #Get the four most likely( highest max correlation) key guesses


bits = 4 
best_keys = 5
results = {"likely_keys" : [0], "current_bits_guessed" : 0 }
    
for i in range(64//bits):
    results = algorithm1_ct(bits, best_keys, dummy_ciphertexts[0:500] , ciphertexts_d, results["likely_keys"] , results["current_bits_guessed"]   )
    

```

dummy_ciphertexts is a list of cipher texts and ciphertexts_d is a dictionary containing the power trace for each of the ciphertexts

Where do we get this data from? I didn't have an oscilliscope to get the power traces. However there are two sources, the first comes form the researachers who ran a workshop at 25C3, they provided the ciphertexts and traces. Unfortunately the ciphertexts are random and they don't provide the plaintext which means there is no way to verify the keys. 

The second source is from [](https://github.com/marc-invalid/chipwhisperer-marc/blob/master/doc/marc/keeloq/examples_hcs301). This guy used the chipwhisperer framework to perform power analysis. He also helpfully provided the raw power traces and the method to refine them. Because his traces and ciphertexts are from sequential presses from an actual keyfob the plaintext have a section with the serial number, which stays constant accross transmissions. This allowed me to verify that my method was correct. 

Using pure python is slow, it takes minutes to conduct the full power analysis, the next section covers methods to speed up power analysis and also bruteforce Keeloq keys.
