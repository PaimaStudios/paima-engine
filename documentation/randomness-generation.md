# Randomness Generation

Randomness is an important part of many games and having a good source of randomness prevents users from abusing statistical trends to their own benefit.

In our case, we are building Paima Engine to produce games as globally accessible state machines. This means they are inherently deterministic (as everyone has to replay all submitted game input to arrive at the same global state). There is no central server which we rely on who could be the trusted randomness producing source (aka. randomness oracle).

Thus as we move forward having a good source of randomness becomes more and more important.

Of note, whenever a new block is generated there are two pieces of information provided to Paima Engine which have a degree of uncertainty/randomness to them which make them harder to predict:

- The block hash
- The list of submitted data (user game input) which was posted by users to the on-chain smart contract

As such, these are the pieces of data which we can start to build randomness from.

A v0.1 of a randomness generation protocol can simply use the block hash. This may be sufficient for simple games, but will need to be replaced in the near future.

Going one step above, for v0.2 we can take the hash of all of the data submitted to the on-chain smart contract in the latest block and combine it with the block hash. Because this is user-generated/submitted data, this has much more randomness as we have a potentially significantly larger number of actors submitting input.

Furthermore, we can also set up an automated piece of software which submits random data to the smart contract in order to improve the randomness of v0.2 as well. However the one weakness in v0.2 is that the block producer still has the power to decide on which transactions to include in the block, and as such he can collude and censor all transactions to the smart contract, and then work on finding a block hash that benefits him. (Generally unlikely the block producer will collude for a video game, but theoretically possible)

Next up, for v0.3 we can start to look at improving randomness generation such that it becomes significantly harder for the block producer to collude. We can do this by having an iteratively generated source of randomness. Rather than just using the data from the latest block, we instead cache the previously generated randomness from the last 10 blocks and combine them all together.

Moving forward, when working towards v0.4, we can cache the randomness of the latest 25 blocks. Using this cache, we can use the v0.2 protocol to generate a temporal-randomness which is then used to select which of the previous latest 25 blocks randomness we should choose to combine with the temporal-randomness to generate a final randomness seed.

For v1.0, we can cache the submitted data from the last 25 blocks, and by using the v0.2 generated randomness of the latest block, start from block X - 25 and randomly select which submitted data to use as a part of generating a new source of randomness. Once a random set of the submittedData is selected from block X - 25, then the protocol moves to X - 24 using the newly generated randomness to select a subset of the submitted data from that block, and so on.

The idea being that with v1.0, we make the computation of generating the randomness quite complex such that it will be nearly impossible for a block producer to manipulate the process for their own benefit within the time frame that they have to produce a block (by trying to find/create a block with a specific set of submitted data by users and a specific block hash that benefits them).
