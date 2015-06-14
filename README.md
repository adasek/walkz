# walkz
Originally a Prague Hackaton 2015 project focused on walk routes generating based on user preferences



# Idea
 * User inputs FROM, TO (optional, can be the same place),  priorities [amount of green, historical_buildings, crowded_index, pollution …], time limitations (e.g. 45-60min)
 * Output of program is a path (without/with circles = option) to take a walk to most suit preferences of the user.
## Technicals (backend)
 * NodeJS written Graph class that loads a network of pedestrian routes with some additional data = quality index(es) (from .json data based on IPR).
 * For a given Start and End node from this network it is able to perform a Dijkstra search with edge quality as edge length.
 * Currently development is focused on implementation of other algorithms that would be able to satisfy multiple constraints (time interval) and preferences as well as optionally generating paths with circles (when enough time is given) and giving the crunching some randomness.
 * Main advantage of this task is that there is no need to search for 100% optimal path – but as main criteria is (along with hard numbers) some kind of aestetic preferences it allows for lot of playful tunning of algorithm.
 * There would be possible to use some kind of precalculation.
