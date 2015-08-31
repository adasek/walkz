/* 
   Universal header of most valuable path search LP problem
   written in GNU MathProg language
   Author: Adam Benda 2015
   Based on mvcp.mod and spp.mod examples
*/

param n, integer, > 0;
/* number of nodes */

set E, within {i in 1..n, j in 1..n};
/* set of edges */

param s, in {1..n};
/* source node */

param t, in {1..n};
/* target node */

var x{(i,j) in E}, binary;
/* x[i,j] = 1 means that edge (i,j) belong to the best path;
   x[i,j] = 0 means that edge (i,j) does not belong to the best path;
 */


s.t. r{i in 1..n}: sum{(j,i) in E} x[j,i] + (if i = s then 1) =
                   sum{(i,j) in E} x[i,j] + (if i = t then 1);
/* conservation conditions for unity flow from s to t; every feasible
   solution is a path from s to t */

/* Don't go through one vertex twice */
/* unnecessary? */
s.t. p{i in 1..n}: sum{(j,i) in E} x[i,j] <= 1;
s.t. p2{i in 1..n}: sum{(i,j) in E} x[i,j] <= 1;

#Does not work
#s.t. e{(i,j) in E}: Visited[j]=if (j=s) then (1) else (if (x[i,j]=1 & Visited[i]=1) then (1) else (0));
 

param Quality{(i,j) in E}, >= 0;
/* Aggregated quality of edge e */

param Time{(i,j) in E}, >= 0;
/* Time needed to go through edge e */


/* Don't allow disconnected circles */
var Visited{i in {1..n}}, integer, >= 0 <= n; #order in which vertices are visited


#Don't allow A->B->A (returns and circles with length 2)
#s.t. circles2{(i,j) in E}: x[j,i] + x[i,j] <= 1;

/* minimize Z: sum{(i,j) in E} Time[i,j] * x[i,j];  */
/* objective function is the path length to be minimized */
maximize Z: sum{(i,j) in E} Quality[i,j] * x[i,j];


subject to
time: sum{(i,j) in E} Time[i,j] * x[i,j] <= 60;

first_visited: Visited[s]=1;
indivisibility{(i,j) in E}: Visited[i] + 1 - (1-x[i,j])*(n) <= Visited[j];



solve;

#Print which vertices are Visited
printf {i in {1..n}} ("vis %d:%d\n"),i,Visited[i] ; 
printf "#OUTPUT START\n";
#printf{(i,j) in E} "[%d,%d]=%d\n", i, j; 
printf {(i,j) in E} (if x[i,j] > 1 then ":%d-%d\n" else ""),i,j ; 
printf "#OUTPUT END\n";

end;
