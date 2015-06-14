#!/usr/bin/nodejs
fs = require('fs');
gm = require('gm');


//Input
/*
var loaded=JSON.parse('{ "efg" : 123 }')
var A={};
A.test=1;
process.stdout.write( "t:"+loaded.efg );
*/

//DEFAULT PARAMETERS
//each params.coeffs is from interval 0..1
//and this numbers defines its weight in algorithm
var params={};
params.coeffs=[]
params.coeffs['green']=0.5;
params.coeffs['smog']=0.5;


function Edge(properties){
   this.time=properties.time;
   this.quality=properties.quality;
   this.A=properties.A;
   this.B=properties.B;
   this.euclideanLength=Math.sqrt(Math.pow(A.x-A.y,2)+Math.pow(B.x-B.y,2));

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

   this.addEdge = function(e){
		if(undefined!=e && e!=null){
		this.edges[this.edges.length]=e;
		}	
	}
}

function Graph () {
    this.edges = [];
    this.vertices = {};
    this.nodes = [];
    this.minX=Infinity;
    this.maxX=0;
    this.minY=Infinity;
    this.maxY=0;
    this.fw_noPrevNode = -1
    
	
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
	
	e=new Edge({"A":A,"B":B,"time":properties.min,"quality":properties.kvalita});	
	A.addEdge(e);
	B.addEdge(e);
	this.edges[this.edges.length]=e;
   };

    ///@param path Array of GeoPoints (pairs of lat,lon)
    //private function
    this.addPath = function(path,properties) {
     for(pathI=1;pathI<path.length;pathI++){
     
	A=this.addNode(path[pathI][0],path[pathI][1]);

    	//add also my neighbour	
	B=this.addNode(path[pathI-1][0],path[pathI-1][1]);
	
	if(A!=null && B!=null){
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



   ///Render as an png file
   this.render = function(x,y,addPath,addNodes,filename){
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
process.stdout.write("RENDERING");
//console.log(addPath);
process.stdout.write("\n");
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
  


}



var g = new Graph();
/*

g.addPath([[50,30],[51,30],[51,31]]);
g.addPath([[51,30],[55,35]]);
g.collapse();
	process.stdout.write("\nnodeCount="+g.getNodeCount()+"\n");
*/

jsonString=fs.readFileSync('./data/cesty_p2_final.geojson', 'utf8');


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
START=900;
END=1500;

nodeIndexes=g.getDijkstraPath(START, END);
 //console.log(nodeIndexes);
//nodeIndexes=[535, 529, 289, 290, 186, 187, 860 ]; //kolecko
//nodeIndexes=[535, 529, 289]; //kolecko?
addPath=g.getPath(nodeIndexes);

g.render(3000,3000,addPath,[g.nodes[START],g.nodes[END]],'output/cesta.png'); //[[1600000,6455000],[1605000,6460000]] 
console.log(g.getNodeCount());


 //console.log(addPath);


//console.log(g.nodes);
//process.stdout.write( JSON.stringify(g.getTimeMatrix()) );



//process.stdout.write( JSON.stringify(path));

