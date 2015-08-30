#!/usr/bin/nodejs
fs = require('fs');  //Filesystem related functions = read and open files
gm = require('gm');  //Graphics = rendering of the graph
var PriorityQueue = require('priorityqueuejs'); //npm install priorityqueuejs
var SortedList = require('sortedlist');//npm install sortedlist


//DEFAULT PARAMETERS
//each params.coeffs is from interval 0..1
//and this numbers defines its weight in algorithm
var params={};
params.coeffs=[]
params.coeffs['green']=0.5;
params.coeffs['smog']=0.5;

var improvedItems=0;




function Edge(properties){
   this.time=properties.time;
   this.quality=properties.quality;
   this.A=properties.A;
   this.B=properties.B;
   this.euclideanLength=Math.sqrt(Math.pow(this.A.x-this.A.y,2)+Math.pow(this.B.x-this.B.y,2));
   this.id=properties.idn;
        //console.log(properties);

   ///returns road as array of points (just coordinates in array, x,y - e.g.[ [50,30], [51,32] ]
   /**
    *  @param node - node from that to start output.
    */
   this.getPath = function(node){
	if(node.id==this.A.id){
	ret=[[this.A.x, this.A.y], [this.B.x, this.B.y]];
	}
	else if(node.id==this.B.id){
	ret=[[this.B.x, this.B.y], [this.A.x, this.A.y]];
	}else{
	throw("Edge.getPath error");
	}
    return ret;
 }

  this.getNeighbour = function(vertex){
   if(this.A.id!=vertex.id){return this.A;}
   else if(this.B.id!=vertex.id){return this.B;}
   else {throw "getNeighbour failed!"}
  }
}



///In vertices and Nodes
function Vertex(properties){
  this.id=properties.id;
  this.x=properties.x;
  this.y=properties.y;
  this.num=0;
  this.roads=[];
  this.edges=[];
  this.color=0;
  this.timeToSource=-1; //minimal time to reach starting node; -1 if not counted. Relevant to iteratingBFS function   
  this.timeToDestination=-1; //minimal time to reach starting node; -1 if not counted. Relevant to iteratingBFS function

   this.addEdge = function(e){
		if(undefined!==e && e!==null){
		this.edges[this.edges.length]=e;
		}
            };
            
   this.distance = function(vertex){
       var dx=this.x-vertex.x;
       var dy=this.y-vertex.y;
       return Math.sqrt(dx*dx + dy*dy); 
   }
		
}

function Graph () {
    this.edges = [];
    this.vertices = {};
    this.nodes = [];
    this.minX=9999999;
    this.maxX=0;
    this.minY=9999999;
    this.maxY=0;
    this.fw_noPrevNode = -1;
    this.SEGMENT_SIZE = 0.1; //for BSF algorithm
	
    //private
    this.addNode = function(x,y){
	if(this.vertices[x+"_"+y] === undefined ){ //&& x>1600000 && x<1605000 && y>6455000 && y<6460000


		//first seen GeoPoint
		if(this.minX>x){this.minX=x;}
		if(this.maxX<x){this.maxX=x;}
		if(this.minY>y){this.minY=y;}
		if(this.maxY<y){this.maxY=y;}

		this.vertices[x+"_"+y]=new Vertex({"id":this.nodes.length,"x":x,"y":y});
		this.nodes[this.nodes.length]=this.vertices[x+"_"+y];
     	}
	
	//process.stdout.write(this.nodes.length+"\n");
	return this.vertices[x+"_"+y];
   };


  //=====================================
    //======= GET ADJECENT NODE ===========
    //=====================================
   this.getAdjecentNodeID = function(id, edge) {
    if(edge.A.id == id) return edge.B.id;
    return edge.A.id;
   }
   
    //=====================================
    //======= GET NEAREST NODE AND POP ====
    //=====================================
   this.getSmallestNodeAndPop = function(distVector, queue) {
      
      var smallestNode;
      var popIndex;
      var smallestDist = Number.POSITIVE_INFINITY;
      //linear search in array - a big spacce for improvement
      for(var i = 0; i < queue.length; i++) {
        if(smallestDist > distVector[queue[i]]) {
          popIndex = i;
          smallestDist = distVector[queue[i]];
          nearestNode = queue[i];//this.getAdjecentNodeID(queue[i][0], queue[i][1])
        }        
      }
      queue.splice(popIndex, 1)//delete selected node
      return nearestNode;
   }
    //=====================================
    //======= DIJKSTRA ====================
    //=====================================
   this.getDijkstraPath = function(source, destination) {

    var size = this.nodes.length;
    var path = []
    
    //init
    var distVector = []; distVector.length = size;
    var prevVector = []; prevVector.length = size;
    var noPriorityQueueAvaible = []
    
    for(var i = 0; i < size; i++) {
      distVector[i] = Number.POSITIVE_INFINITY;
      prevVector[i] = null;
      noPriorityQueueAvaible.push(i)
    }
    distVector[source] = 0;
    //end of init
    
    //go dijkstra!
    while(noPriorityQueueAvaible.length != 0) {
      var nearestNode = this.getSmallestNodeAndPop(distVector, noPriorityQueueAvaible)//v prvnĂ­ iteraci mĂˇ navracet source
      
      //for each edge, calculate distance
      for(var i = 0; i < this.nodes[nearestNode].edges.length; i++) {
        //console.log("visited: " + closeNodes) 
		//criteria
		
		//TIME
		criteria = this.nodes[nearestNode].edges[i].time ; 
 		 
		/*
		//Euclidean distance
		criteria = this.nodes[nearestNode].edges[i].euclideanLength ; 
 		*/

		/*
		//Q1
		criteria = this.nodes[nearestNode].edges[i].time * 1000 +
			1000/((this.nodes[nearestNode].edges[i].quality+0.01) * this.nodes[nearestNode].edges[i].time ); 
			*/	

//console.log(this.nodes[nearestNode].edges[i].quality);

        var distance = distVector[nearestNode] + criteria;
        var destNode = this.getAdjecentNodeID(nearestNode, this.nodes[nearestNode].edges[i])

        if(distance < distVector[this.getAdjecentNodeID(nearestNode, this.nodes[nearestNode].edges[i])]) {
          distVector[destNode] = distance;
          prevVector[destNode] = nearestNode;
        }
        if(destNode == destination) {
          //console.log("cesta nalezena")
          var node = destination;

          while(prevVector[node] != null) {
            path.push(node)
            node = prevVector[node];  
          }
          path.push(source)
          return path;
        }
      }
      //console.log("length: " + noPriorityQueueAvaible.length);
    }
    return "no path"//path;
   }

    //=====================================



    //private
    this.addEdge = function(A,B,properties){
        
	e=new Edge({"A":A,"B":B,"time":properties.min,"quality":properties.kvalita,"idn":this.edges.length});	
	A.addEdge(e);
	B.addEdge(e);
	this.edges[this.edges.length]=e;
   };

    ///@param path Array of GeoPoints (pairs of lat,lon)
    //private function
    this.addPath = function(path,properties) {
        /* Problem:
         * property .time is the same for each edge
         * Let's divide it between edges by euclidian distance
         */
        //count euclidian distance
        totalDistance=0;
        totalTime=properties.min;
        for(var pathI=1;pathI<path.length;pathI++){
            
            var A=this.addNode(path[pathI][0],path[pathI][1]);
            //add also my neighbour	
            var B=this.addNode(path[pathI-1][0],path[pathI-1][1]);
            totalDistance+=A.distance(B);
        }
        
     for(var pathI=1;pathI<path.length;pathI++){
     
	A=this.addNode(path[pathI][0],path[pathI][1]);

    	//add also my neighbour	
	B=this.addNode(path[pathI-1][0],path[pathI-1][1]);
	
	if(A!=null && B!=null){
         properties.min=A.distance(B) * totalTime / totalDistance;
	 this.addEdge(A,B,properties);
	}

	} //end of for path elements
    };

    this.addFeature = function(feature) {
	this.addPath(feature.geometry.coordinates,feature.properties); //TEST data feature.geometry.coordinates[0] 
		
	};

   this.getNodeCount = function(){
	return this.nodes.length;
	};

   
   this.loadGeoJSON = function(jsonString){

	//process.stdout.write(jsonString+"\n");
	data=JSON.parse(jsonString);
	      	
	for(i=0;i<data.features.length;i++){
	// process.stdout.write(JSON.stringify(data.features[i].geometry.coordinates, null, 2)+"\n"); // spacing level = 2
	 this.addFeature(data.features[i]);
	 //process.stdout.write("d="+data.features[i].geometry.coordinates);
	} 	
  };


    this.getTimeMatrix = function(){
	out=new Array(this.getNodeCount());
	for(x=0;x<this.getNodeCount();x++){
		out[x]=new Array(this.getNodeCount());
		 for(edgeI=0;edgeI<this.nodes[x].edges.length;edgeI++){
		 y=this.nodes[x].edges[edgeI].getNeighbour(this.nodes[x]).id;
	
		 out[x][y]=this.nodes[x].edges[edgeI].time;
		 }
	}
	return out;
    };


 
   //nodeList is array of indexes
   this.getPath = function(nodeIndexArray){
    param=[]
    for(i=0;i<nodeIndexArray.length;i++){
     param[i]=this.nodes[nodeIndexArray[i]];
    }
    return this.getPathFromNodes(param);    
   };




   this.getPathFromNodes = function(nodeList){
    ret=[];
    for(i=0;i<nodeList.length;i++){
	 if(i<nodeList.length-1){
	 //print out the corresponding path
	  for(n=0;n<nodeList[i].edges.length;n++){
 //process.stdout.write("x1="+path[0][0] + ", y1=" + path[0][1] + ",x2 =" +path[1][0] + ", y2=" +path[1][1]+"\n");
		if(nodeList[i].edges[n].getNeighbour(nodeList[i]).id==nodeList[i+1].id){
                 // ret=nodeList[i].edges[n].getPath().concat(ret);
 		ret=ret.concat(nodeList[i].edges[n].getPath(nodeList[i]));
		 break;		
		}
		if(n==nodeList[i].edges.length-1){
		 //not successful
		 throw("Bad path ");		
		}
	   }
	 
	  }
	 }
    // console.log(ret);
   return ret;    
   };

  this.renderBase = function(x,y){
               image=gm('template.png');
//process.stdout.write("a:"+this.nodes.length + ", " + this.nodes[0].edges.length +" ... \n");
	 image.fill("#00aa00");
	for(ii=0;ii<this.nodes.length;ii++){
	  for(edI=0;edI<this.nodes[ii].edges.length;edI++){
	  path=this.nodes[ii].edges[edI].getPath(this.nodes[ii]);
//process.stdout.write("road:"+path.length + "\n");
	    for(p=0;p<path.length;p++){
	    if(p>0){ //single line from path
			x1=(x*(path[p-1][0] - this.minX)/(this.maxX - this.minX));
			y1=y*(path[p-1][1] - this.minY)/(this.maxY - this.minY);
			x2=x*(path[p][0] - this.minX)/(this.maxX - this.minX);
			y2=y*(path[p][1] - this.minY)/(this.maxY - this.minY);
		  image.drawLine(x1, y1, x2, y2);		
		}
	    }
	  }
	}
	 image.fill("#ff0000",5);
	 image.stroke("#ff0000",5);
         return image;
  }

   ///Render as an png file
   this.render = function(x,y,addPath,addNodes,filename){

         image=this.renderBase(x,y);
//process.stdout.write("RENDERING");
//console.log(addPath);
//process.stdout.write("\n");
	for(pin=1;pin<addPath.length;pin++){
	    image.drawLine(
			x * (addPath[pin-1][0] - this.minX)/(this.maxX - this.minX),
			y * (addPath[pin-1][1] - this.minY)/(this.maxY - this.minY),
			x * (addPath[pin][0] - this.minX)/(this.maxX - this.minX),
			y * (addPath[pin][1] - this.minY)/(this.maxY - this.minY));	
	}

	 image.fill("#00ff00",10);
	 image.stroke("#00ff00",10);
	for(pin=0;pin<addNodes.length;pin++){
	    image.drawCircle(
			x * (addNodes[pin].x - this.minX)/(this.maxX - this.minX),
			y * (addNodes[pin].y - this.minY)/(this.maxY - this.minY),
			(x/1000)+ x * (addNodes[pin].x - this.minX)/(this.maxX - this.minX),
			y * (addNodes[pin].y - this.minY)/(this.maxY - this.minY));	
	}


	image.write(filename, function (err) {
	  if (err) console.log(err);	
	});
   }
   
   
   ///Render as an png file
   this.renderColorizedNodes = function(x,y,filename){
    image=this.renderBase(x,y);
   addPath=new Array();
   addNodes=new Array();
    for(var i=0;i<this.nodes.length;i++){
        if(this.nodes[i].color===1){
            addNodes[addNodes.length]=i;
        }
    }
    for(var n=0;n<this.edges.length;n++){
        if(this.edges[n].A.color===1 && this.edges[n].B.color===1){
           addPath[addPath.length]=new Array(this.edges[n].A.x,this.edges[n].A.y);
           addPath[addPath.length]=new Array(this.edges[n].B.x,this.edges[n].B.y);
           /* Render this path */
           
	    image.drawLine(
			x * (this.edges[n].B.x - this.minX)/(this.maxX - this.minX),
			y * (this.edges[n].B.y - this.minY)/(this.maxY - this.minY),
			x * (this.edges[n].A.x - this.minX)/(this.maxX - this.minX),
			y * (this.edges[n].A.y - this.minY)/(this.maxY - this.minY));
        }
    }
    
	image.write(filename, function (err) {
	  if (err) console.log(err);	
	});
   }
   
   this.renderWays = function(x,y,filename,waysArray){
       
    image=this.renderBase(x,y);
   
    for(var n=0;n<waysArray.length;n++){
        //for each way
        var w = waysArray[n];
         image.drawLine(
			x * (this.nodes[w[0]].x - this.minX)/(this.maxX - this.minX),
			y * (this.nodes[w[0]].y - this.minY)/(this.maxY - this.minY),
			x * (this.nodes[w[1]].x - this.minX)/(this.maxX - this.minX),
			y * (this.nodes[w[1]].y - this.minY)/(this.maxY - this.minY));
        }
    
	image.write(filename, function (err) {
	  if (err) console.log(err);	
	});
   }

   //nodeList is array of indexes
   this.randomWalk = function(steps,node,prevNode){
    x=node.x;
    y=node.y;
	myIndex=Math.floor(Math.random()*node.edges.length-0.0000001);
	if(
	  node.edges[myIndex].A.id==prevNode.id && node.edges[myIndex].B.id==node.id ||
	  node.edges[myIndex].B.id==prevNode.id && node.edges[myIndex].A.id==node.id
	){
	//same edge by which we came
	  myIndex=(myIndex+1)%node.edges.length;
	}		
	if(node.edges[myIndex].A.id==node.id){
	 newNode=node.edges[myIndex].B;	
	}
	else if(node.edges[myIndex].B.id==node.id){
	 newNode=node.edges[myIndex].A;	
	}else{
	 throw ("Weird edge!\n");
	}

    if(steps==0){return [];}
    return [[x,y]].concat(this.randomWalk(steps-1,newNode,node));
   };


   //
   this.niceWalk = function(steps,node,prevNode){
    if(steps<=0){return [];} //recursion stop
    x=node.x;
    y=node.y;
	//maximal edge
	newNode=null;

//console.log(node);



	sortedEdges=node.edges.sort( function(a,b){return b.quality-a.quality;} );
	for(myIn=0;myIn<sortedEdges.length;myIn++){
		if(
		  node.edges[myIn].A.id==prevNode.id && node.edges[myIn].B.id==node.id ||
		  node.edges[myIn].B.id==prevNode.id && node.edges[myIn].A.id==node.id
		){ //came from this road
		  continue;
		}

		//go via this edge
			if(node.edges[myIn].A.id!=node.id){
			  newNode=node.edges[myIn].A;
			}else if(node.edges[myIn].B.id!=node.id){
			  newNode=node.edges[myIn].B;
			}else{
			throw("Assertion failed");			
			}
		    ret=this.niceWalk(steps-1,newNode,node);
		 if(ret==-1){ //this is not the proper way
		  continue; 
		 }

		//success!
		return [[node.x,node.y]].concat(ret);
		break;
             }
	//no suitable alternatives!
	return -1; 
   };

 
  //@args: path, prevMatrix, from, to
  this.fw_getPath = function(path, matrix, i, j) {
      if(i === j) {/*path.push(i); console.log("first path: " + path)*/}
      else if(matrix[i][j] === this.fw_noPrevNode) {path = []}
      else {this.fw_getPath(path, matrix, i, matrix[i][j]); path.push(matrix[i][j]); /*console.log("second path: " + path)*/}
  }

  this.fw_run = function(source,destination) {
      this.fw_noPrevNode=-1

      //get source and destination
      var graph = this.getTimeMatrix();
      
      var size = graph.length;

      
      //the init graph function goes here
      var fwMatrix = graph;               //floydwarshall matrix
      var prevMatrix = new Array(size);   //previous nodes matrix
      for(var i = 0; i < size; i++) {
          prevMatrix[i] = new Array(size);
      }

      for(var i = 0; i < size; i++) {
          for(var j = 0; j < size; j++) {
              if(j == i) {fwMatrix[j][i] = 0; prevMatrix[j][i] = this.fw_noPrevNode ;}
              else if(fwMatrix[j][i] === null) {fwMatrix[j][i] = Infinty; prevMatrix[j][i] = this.fw_noPrevNode}
              else {/*fwMatrix[j][i] = graph[j][i]*/; prevMatrix[j][i] = j}
          }
      }

      //floyd-warshall algorithm computes here
      for (var k = 0; k < size; k += 1) {
//process.stdout.write( k +" / "+size+" = "+Math.round((k/size)*100)+"%\n" );
        for (var i = 0; i < size; i += 1) {
          for (var j = 0; j < size; j += 1) {
            if (fwMatrix[i][j] > fwMatrix[i][k] + fwMatrix[k][j]) {
              fwMatrix[i][j] = fwMatrix[i][k] + fwMatrix[k][j];
              prevMatrix[i][j] = prevMatrix[k][j];
            }
          }
        }
      }
fs.writeFile("fw_timeMatrix.dat",  JSON.stringify(fwMatrix), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 
      


      console.log("source: "+ source + " dest: " + destinaton)
     //get the road found by FW
      var path = [];

      this.fw_getPath(path, prevMatrix, source, destinaton);
      if(path.length != 0) path.push(destinaton)
     // console.log("path: " + path);
      return path;
}
  
  
    this.paintNodes = function(nodeIndexes) {
        for(var i=0;i<this.nodes.length;i++){
            this.nodes[i].color=0;
        }
        for(var n=0;n<nodeIndexes.length;n++){
            if(nodeIndexes[n]<=this.nodes.length){
                this.nodes[nodeIndexes[n]].color=1;
            }else{
              throw "paintNodes: Index out of bounds ["+n+"]: '"+nodeIndexes[n]+"' not < "+this.nodes.length;
                
            }
        }
    }

 ///Return string with defined LP problem based on this graph
 /**
  * 
  * @param {type} source - starting point
  * @param {type} destination
  * @returns {undefined}
  */
    this.generateLP = function(source,target,tmin,tmax) {
        
      output="param n := "+this.nodes.length+";\n";
      output+="param s := "+source+";\n";
      output+="param t := "+target+";\n";
      
        //data: EDGES
        eStr="param:\nE :\tTime\tQuality :=";
        path="";
        
      for(var i=0;i<this.edges.length;i++){
          eStr+="\n";
          if(this.edges[i].time<=0){this.edges[i].time=1;}
          eStr+=(this.edges[i].A.id+1)+" "+(this.edges[i].B.id+1) + " " + this.edges[i].time + " "+(this.edges[i].quality);
      
          eStr+="\n";    
          eStr+=(this.edges[i].B.id+1)+" "+(this.edges[i].A.id+1) + " " + this.edges[i].time + " "+(this.edges[i].quality);          
       
           if(this.edges[i].A.color===1 && this.edges[i].B.color === 1 ){
             path+="x["+(this.edges[i].A.id+1)+","+(this.edges[i].B.id+1)+"]=1;\n";
           }else{
          //path+="0";
           }
          }
      eStr+=";\n\n";
      path+=";\n\n";
      
      
      
      return "data;\n" + output + eStr /* +  path */ +  "\nend;\n" /* +path */ ;
      
     /*
     tminString="tmin: ";
     tmaxString="tmax: ";
     for(var i=0;i<this.edges.length;i++){
          value=this.edges[i].quality;
          value=1;
          output+=" +"+(value)+" * e"+this.edges[i].id+" ";
          tminString+=" +"+this.edges[i].time+" * e"+i+" ";
          tmaxString+=" +"+this.edges[i].time+" * e"+i+" ";
      }
        
      
      output+=";\n\nsubject to\n";
      
      //target time function
      
        tminString+=" >= "+tmin+";\n\n";
        tmaxString+=" <= "+tmax+";\n\n";
      //  output+=tminString;
      //  output+=tmaxString;
        */
       
        //Target conditions for nodes
        /*
        cnt=1;
      for(var i=0;i<this.nodes.length;i++){
          var node=this.nodes[i];
            
        if(i===source || i===destination){
               //special case
               
                    if(i===source){
                        output+="source: ";
                    }else{
                        output+="destination: ";
                    }
                    for(var n=0;n<node.edges.length;n++){
                        output+="+e"+node.edges[n].id;
                    }
                    output+=" = 1;\n";
                  
            }else
            {
                    
                    //for each neigbour vertex
                  for(var n=0;n<node.edges.length;n++){
                      
                        //every equality has to have an unique name
                        output+="h"+cnt+": ";
                        cnt=cnt+1;
                        output+="-e"+node.edges[n].id;
                        for(var k=0;k<node.edges.length;k++){
                            if(k===n){continue;}
                            output+="+e"+node.edges[k].id;
                        }
                        output+=" = 0;\n";
                     }
           }
      } */
      
          
  }
  
     ///Counting the shortest destination to source; Jarnik algorithm
     /**
      https://en.wikipedia.org/wiki/Prim's_algorithm 
     
      Subset V' of Nodes :={source}
       Repeat until V' is not all graph nodes:
        {
         Choose edge (u,v) going out of V' with minimal cost
         Add Node v to V'
        }
     */
    this.countTimeToReach = function(target,property) {
      //Initialize
      for(var i=0;i<this.nodes.length;i++){
       this.nodes[i][property]=-1;
      } 
          
      //Priority queue: keeps minimum of Item time. 
      var queue = new PriorityQueue(function(a, b) {
        return b.time - a.time;
      });

      /*
       Item in priority node is composed of:
        time (we want always use an edge with shortest time}
        node (where it points us)
        neighTime (timeToSource of Node already in subset V') 
      */
      queue.enq({ neighTime:0, time: 0, node: this.nodes[target] }); 
       while(queue.size()>0){    
        var nextItem = queue.deq();                        
        var nextNode = nextItem.node;
        nextNode[property] = nextItem.neighTime + nextItem.time;
         for(var n=0;n<nextNode.edges.length;n++){
            var edge=nextNode.edges[n];
            var neighbour=edge.getNeighbour(nextNode);
            if(neighbour[property]<0){ //not yet visited
                queue.enq({ neighTime: (nextNode[property]), time: (edge.time), node: neighbour }); 
               
 // process.stdout.write("enq: "+nextNode[property]+"->"+ edge.time + "\n");
              }
              
         }
       }
   }
  
  
   this.iteratingBFS_start = function(source,destination,tmin,tmax){
       
          this.countTimeToReach(source,"timeToSource");  
          this.countTimeToReach(destination,"timeToDestination");
       
       this.myNodesBitmap=new Array(this.nodes.length);
        //Select only reachable nodes
        for(var i=0;i<this.nodes.length;i++){
                
                //also initialize our data and recursive func
                this.nodes[i].bestPaths=new Array();
                this.nodes[i].maxTable=new Array(parseInt(tmax / this.SEGMENT_SIZE) );
                this.nodes[i].SEGMENT_SIZE=this.SEGMENT_SIZE;
                this.nodes[i].tmax=tmax;
                //item = {time,value,nextNode}
                this.nodes[i].joinMaxTable = function(edge,jTable){
                    
                     // process.stdout.write("k "+this.id+"\n");
                    
                        //join this.maxTable and jTable
                        for(var j=0;j<jTable.length;j++){
                            if(jTable[j]!=null && edge!==undefined){                 
                             //process.stdout.write("j="+j+"\n");
                             if(typeof(edge.getNeighbour) !== 'function'){
                                break; //last node has special null edge.
                               }
                             if(jTable[j]==undefined){
                                /* actually I don't have anything to add. */
                               continue;
                             }
                             
                    // process.stdout.write("joining: "+this.id + " with "+ edge.getNeighbour(this).id+"\n");
      
                             if( this.SEGMENT_SIZE*j + this.timeToSource > this.tmax){break;}
                             
                               //console.log(typeof(edge.getNeighbour));
                            var addRecord={time:jTable[j].time+edge.time,value:jTable[j].value+edge.quality,nextNode:null,visitedSiblings:new SortedList()};
                            //addRecord
                            var index=Math.floor(addRecord.time/this.SEGMENT_SIZE); //target index
                            
                                if((this.maxTable[index]===undefined || this.maxTable[index].value > addRecord.value)){
                                 //addRecord is better
                                 improvedItems++;
                                 addRecord.nextNode=edge.getNeighbour(this);
                                 /*
                                 if(addRecord.nextNode==null || addRecord.nextNode.id==0){
                                     console.log(edge);                                     
                                 }
                                 */
                                  if(this.destinationDepth !==  addRecord.nextNode.destinationDepth || jTable[j].visitedSiblings.bsearch(this.id)==-1){
                                        //This node has not been visited in this family. And a
                                        
                                     if(this.destinationDepth ==  addRecord.nextNode.destinationDepth){
                                      vSiblingsArr=jTable[j].visitedSiblings.toArray();
                                      vSiblings=new SortedList(vSiblingsArr);
                                      addRecord.visitedSiblings=vSiblings;
                                    }else{
                                          //we are going from depth to depth+1 and our family may be empty
                                    }
                                   addRecord.visitedSiblings.insertOne(this.id); //add this node to already visited siblings from family

                                   this.maxTable[index]=addRecord;
                                    }
                                 //process.stdout.write("+");
                                }
                          }  
                        }
                }
                
            this.myNodesBitmap[i]=0;
            if ((this.nodes[i].timeToSource + this.nodes[i].timeToDestination) <= tmax){
                this.myNodesBitmap[i]=1;
             }
        //initialize color
        this.nodes[i].color=0;
        this.nodes[i].color2=0;
        
        }
        
        //Initialize depth info
        //infoDepths=new Array(100);
        //for(var i=0;i<100;i++){infoDepths[i]=0;}
         
       var queue=[{depth:0,node:this.nodes[destination]}];
         while(queue.length>0){
          var tItem = queue.shift();
          tNode=tItem.node;
          tNode.color2=1;
          tNode.destinationDepth=tItem.depth;
          //infoDepths[tItem.depth]++;
           for(var n=0;n<tNode.edges.length;n++){
            var edge=tNode.edges[n];
            var neighbour=edge.getNeighbour(tNode);
            if(this.myNodesBitmap[neighbour.id]==1 && neighbour.color2==0){ //check if it is in our subset
               queue.push({depth:tNode.destinationDepth+1,node:neighbour});
              }
           }
         }
         
         //Show info about depths
         //for(var i=0;i<100;i++){
         //process.stdout.write( "D "+i+":"+infoDepths[i]+"\n" );
         //}
   }
  
  this.shuffle = function(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}
  
 ///
 /**
  * 
  * @param {int} source starting point
  * @param {int} destination            
  * @param {int} tmin low bound for path time
  * @param {int} tmax high bound for path time
  * @returns {undefined}
  */
    this.iteratingBFS_step = function(source,destination,tmin,tmax) {
        
        
        for(var i=0;i<this.nodes.length;i++){
         //initialize color
         this.nodes[i].color=0;
        }
        
        
        //simple queue of Nodes for BFS

         //process.stdout.write("queues: ");
         var queue=[{edge:{time:0,value:0,nextNode:null}, node:this.nodes[destination]}];
         var queueNextDepth=[];
         var currentDepth=0;
         
         while(queue.length>0){
          var tItem = queue.shift();
          var tNode = tItem.node;
          tNode.color=1;
          //process.stdout.write(""+tNode.id+", "); 
           for(var n=0;n<tNode.edges.length;n++){
         
            var edge=tNode.edges[n];
            var neighbour=edge.getNeighbour(tNode);
          
          
             tNode.joinMaxTable(tItem.edge, neighbour.maxTable);
             if(this.myNodesBitmap[neighbour.id]==1 && neighbour.color==0){ //check if it is in our subset
                 if(tNode.destinationDepth!=neighbour.destinationDepth){
                  queueNextDepth.push({edge:edge,node:neighbour});
                }else{
                  queue.push({edge:edge,node:neighbour});   
                }
              }
           }
           if(queue.length==0){
               this.shuffle(queueNextDepth);
               queue=queueNextDepth;
               queueNextDepth=[];
           }
         }  
          //process.stdout.write("\n\n"); 
    }
    
    
    
    this.findEdge = function(Vertex1_id,Vertex2_id){
        if(Vertex1_id == Vertex2_id){
            throw "find Edge Vertex1_id == Vertex2_id";
        }
        var v=this.nodes[Vertex1_id];
        for(var c=0;c<v.edges.length;c++){
            if(v.edges[c].A.id == Vertex2_id || v.edges[c].B.id == Vertex1_id){
                return v.edges[c];
            }
        }
        return null;
    };
}



var g = new Graph();
/*

g.addPath([[50,30],[51,30],[51,31]]);
g.addPath([[51,30],[55,35]]);
g.collapse();
	process.stdout.write("\nnodeCount="+g.getNodeCount()+"\n");
*/

jsonString=fs.readFileSync('./data/cesty_p2_final.geojson', 'utf8');
//jsonString=fs.readFileSync('./data/maly_test.geojson', 'utf8');


 g.loadGeoJSON(jsonString);
 jsonString=null
// process.stdout.write( "Loaded GeoJSON\n" );

//process.stdout.write( g.minX +" "+g.maxX+" "+g.minY+" "+g.maxY );

 
 //console.log(g);
//console.log("---");
//console.log(g.nodes[0].edges[0].roads);
 //process.stdout.write( "Collapsed\n" );
 //console.log(g.maxX);

//random walk
//path=g.randomWalk(50,g.nodes[500],new Vertex({"id":-1,"x":0,"y":0}));

/* RENDERING TEST */
/*
for(nodeId=100;nodeId<2000;nodeId+=10){
for(stepN=1;stepN<50;stepN++){
 newPath=g.niceWalk(stepN,g.nodes[nodeId],new Vertex({"id":-1,"x":0,"y":0}));
 if(newPath==-1){break;}
 path=newPath;
 }
g.render(3000,3000,path,'path_'+nodeId+'.png'); //[[1600000,6455000],[1605000,6460000]] 
}
*/

/* Floyd Warshall */
/*
path=g.fw_run(50,600);
g.render(3000,3000,path,'fw_.png'); //[[1600000,6455000],[1605000,6460000]] 
*/


/*
START=50;
END=999;
*/
//index of start and end nodes
START=900;
END=1500;

//START=2;
//END=3;

//index of start and end nodes
/*
START=parseInt(Math.random()*g.nodes.length);
END=parseInt(Math.random()*g.nodes.length);
*/
/*
//Adjactment vertices
START=100;
END=g.nodes[START].edges[0].getNeighbour(g.nodes[START]).id;
*/


//nodeIndexes=g.getDijkstraPath(START, END);


//

/*
LPpathNodesString=fs.readFileSync('path.dat', 'utf8');
LPpathNodesF=LPpathNodesString.split("\n");


//reindex from 1..N to 0..N-1
LPpathWays=new Array();
for(i=0;i<LPpathNodesF.length;i++){
    thisWay=LPpathNodesF[i].split("-");
    //this way should contain two integers
    
    var x = parseInt(thisWay[0]);
    var y = parseInt(thisWay[1]);
    x--;y--; //reindex
    
    if(x>=0 && x==x && y>=0 && y==y){
        LPpathWays[LPpathWays.length]=new Array(x,y);  
    }
}
g.renderWays(2000,2000,"test.png",LPpathWays);

*/



//process.stdout.write("/* Network with "+g.nodes.length+" nodes, SOURCE="+START+", DESTINATION="+END+" */\n");
//process.stdout.write(g.generateLP(START,END,5,20))

    g.iteratingBFS_start (START,END,60,90);
    g.nodes[END].maxTable[0]={time:0,value:0,nextNode:null,visitedSiblings:new SortedList()};
for(var it=0;it<20;it++){ //200 iterations is temporary!
      process.stdout.write("ITERATION "+it+"\n");   
        
    g.iteratingBFS_step (START,END,60,90);
    
    cnt=0;
    for(var n=0;n<g.nodes.length;n++){
        var j=0;var c=0;
        for(j=0;j<g.nodes[n].maxTable.length;j++){
            if(g.nodes[n].maxTable[j]!==undefined){
            cnt++;
            }
        }
    }
   process.stdout.write(" Table entries: "+cnt+"\n");
   process.stdout.write("Improved: "+improvedItems+"\n");
   improvedItems=0;
}


//forward tracking
console.log(START);
console.log(END);
myNode=g.nodes[START];
path=new Array();
remainingTime=90;
pathTime=0;
while(myNode!==g.nodes[END]){
        var i=0;
        var maxVal=-1;
        
            for(j=0;j<myNode.maxTable.length;j++){
                if(myNode.maxTable[j]!==undefined){
                 process.stdout.write("("+remainingTime+"/"+myNode.maxTable[j].time+")\n");
                }   
              if(myNode.maxTable[j]!==undefined && maxVal < myNode.maxTable[j].value && (remainingTime)>=myNode.maxTable[j].time){
                  i=j;
                  maxVal=myNode.maxTable[j].value;
                }
            }
        //process.stdout.write("[ "+remainingTime+"/"+myNode.maxTable[i].time+"]");
        
        process.stdout.write(myNode.id+"("+i+")-> ");
      
        if(myNode.maxTable[i]!==undefined){      
            pathTime+=g.findEdge(myNode.id,myNode.maxTable[i].nextNode.id).time;
            remainingTime=myNode.maxTable[i].time - g.findEdge(myNode.id,myNode.maxTable[i].nextNode.id).time;
            path[path.length]=new Array(myNode.id,myNode.maxTable[i].nextNode.id);
            myNode=myNode.maxTable[i].nextNode;
        }else{console.log(i);console.log(maxVal);console.log(myNode);break;}
}
    
process.stdout.write("Time: "+pathTime+"\n");
g.renderWays(2000,2000,"new_test.png",path);


/*
for(var i=0;i<g.nodes.length;i++){
    var n=0;
  
   
    while(g.nodes[i].maxTable[n]!==undefined){
         
        process.stdout.write(n+"|"+g.nodes[i].id+"->");
        
//                            console.log(g.nodes[i].maxTable[n].nextNode);
        if(g.nodes[i].maxTable[n].nextNode!==null){
            process.stdout.write(" "+g.nodes[i].maxTable[n].nextNode.id);
        }
        
        process.stdout.write(":t="+g.nodes[i].maxTable[n].time+"");
        process.stdout.write(":v="+g.nodes[i].maxTable[n].value+"\n");   
        n++;
    }
   
 }
// */

//g.paintNodes(nodeIndexes);
//g.renderColorizedNodes(2000,2000,"test.png");
