# jsongoose
A JSON-based noSQL db based on Mongo/Mongoose

This was a silly idea I had in which I wanted to create a database structure from the ground up in Javascript that would be as light on memory as possible. Essentially all operations should be direct modifications to the disk and very little data would be stored in RAM. It is NOT meant to be used in any serious environment, this is just a weird experiment.