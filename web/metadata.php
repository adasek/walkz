<?php
/* 
metadata.php 
Script that scans track records in gpx/ directory,
and creates metadata JSON.
Metadata of each track is stored in .cache file named by md5 sum =
 = when file is changed, cache file is rebuilt.
All metadata of existing files are then aggreged into "metadata.json".
That is the file used by displayRoute application.

Currently filenames in this script have absolute path, BEWARE!

*/

header("Content-Type: application/json");

ob_start(null);

echo "{\"tracks\":[\n";  


function haversineGreatCircleDistance(
  $latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo, $earthRadius = 6371000)
{

  // convert from degrees to radians
  $latFrom = deg2rad($latitudeFrom);
  $lonFrom = deg2rad($longitudeFrom);
  $latTo = deg2rad($latitudeTo);
  $lonTo = deg2rad($longitudeTo);

  $latDelta = $latTo - $latFrom;
  $lonDelta = $lonTo - $lonFrom;

  $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
    cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
  return $angle * $earthRadius;
}




$first=1;

$dir="gpx";
if (is_dir($dir)) {
    if ($dh = opendir($dir)) {
        while (($file = readdir($dh)) !== false) {
              if(strtolower(substr($file,-3,3))!="gpx"){continue;}    
            if($first==1){
             $first=0;
            }else{    
             echo ",\n";
            }
            
            if(file_exists("cache/".md5_file($dir."/".$file).".cache")){
             //read from cache instead
                if(gettype(STDERR)=="resource"){
                    fwrite(STDERR,  "C:".$dir."/".$file."\n");
                }
             echo file_get_contents("cache/".md5_file($dir."/".$file).".cache");
             continue;
            }
                if(gettype(STDERR)=="resource"){
            fwrite(STDERR, "N:".$dir."/".$file."\n");
                }
            
            /* GPX parser */
            $xml=simplexml_load_string(file_get_contents($dir."/".$file)) or die("Error: Cannot create object");
           // print_r($xml);
            $name=$xml->trk->name;  
            $desc=$xml->trk->desc;  
            $authorFull=$xml->trk->author;
             $authorArray=explode("|",$authorFull); 
             $author=$authorArray[0];           
             $device=$authorArray[1];  
             $activity=$authorArray[2]; 
            $journeyStart=strtotime($xml->trk->trkseg->trkpt[0]->time);   
            $journeyEnd=strtotime($xml->trk->trkseg->trkpt[ count($xml->trk->trkseg->trkpt)-1 ]->time); 
           // print_r($xml->trk->trkseg->trkpt);
           
             $trackDistance=0;
             $upEle=0;
             $downEle=0;
           
           
             $Atime=strtotime($xml->trk->trkseg->trkpt[0]->time); 
             $Aele=(double)$xml->trk->trkseg->trkpt[0]->ele;      
              $attr=$xml->trk->trkseg->trkpt[0]->attributes();   
             $Alat=(double)$attr["lat"];  
             $Alon=(double)$attr["lon"];  
             
             //center computing
               $totalLat=0;
               $totalLon=0;
               $pointsCnt=0;
               
             for($i=1;$i<count($xml->trk->trkseg->trkpt)-1;$i++){
                 
                 if($i%100==0){
                  if(gettype(STDERR)=="resource"){
                   fwrite(STDERR, $i."/".(count($xml->trk->trkseg->trkpt)-1)."\n");
                   fflush(STDERR);          
                  }
                 }
                 
              // print_r($xml->trk->trkseg->trkpt[$i]);
              $Btime=strtotime($xml->trk->trkseg->trkpt[$i]->time);
              $Bele=(double)$xml->trk->trkseg->trkpt[$i]->ele;      
               $attr=$xml->trk->trkseg->trkpt[$i]->attributes();   
              $Blat=(double)$attr["lat"];  
              $Blon=(double)$attr["lon"];  
               $totalLat+=$Blat;
               $totalLon+=$Blon;
               $pointsCnt++;
               /* Distance between points and height differential */
               $trackDistance+=haversineGreatCircleDistance($Alat,$Alon,$Blat,$Blon);
               if($Bele>$Aele){
                //going up
                $upEle+=($Bele-$Aele);
               }else{
                $downEle+=($Aele-$Bele);               
               }
              
                   
              $Atime=$Btime;                
              $Aele=$Bele; 
              $Alat=$Blat;
              $Alon=$Blon;
             }
             
             
            
            $hash=md5($journeyStart);
           $num1=hexdec(substr($hash,0,2));  
           $num2=hexdec(substr($hash,2,2));   
           $num3=hexdec(substr($hash,4,2));
           if($num1>200){$num1=$num1%200;} 
           if($num2>200){$num2=$num2%200;}
           if($num3>200){$num3=$num3%200;}
           
           
           $color="#".str_pad(dechex($num1),2,"0",STR_PAD_LEFT).str_pad(dechex($num2),2,"0",STR_PAD_LEFT).str_pad(dechex($num3),2,"0",STR_PAD_LEFT);
            
           $output="  {\n";      
           
           $output.="\"file\": \"".$dir."/".$file."\",\n";
           $output.="\"title\": \"".$name."\",\n";                                                    
           $output.="\"description\": \"".$desc."\",\n";                                                
           $output.="\"author\": \"".$author."\",\n";                                               
           $output.="\"device\": \"".$device."\",\n";                                               
           $output.="\"activity\": \"".$activity."\",\n";  
           $output.="\"timeStart\": \"".gmdate("Y-m-d\TH:i:s\Z",$journeyStart)."\",\n";     
           $output.="\"timeEnd\": \"".gmdate("Y-m-d\TH:i:s\Z",$journeyEnd)."\",\n";  
           $output.="\"timeElapsed\": \"".($journeyEnd-$journeyStart)."\",\n";                                                   
           $output.="\"distance\": \"".$trackDistance."\", \n";                                                            
           $output.="\"upElevation\": \"".$upEle."\", \n";                                                         
           $output.="\"center\": [".($totalLon/$pointsCnt).",".($totalLat/$pointsCnt)."], \n";    
           $output.="\"downElevation\": \"".$downEle."\", \n";                                  
           $output.="\"color\": \"".$color."\"\n";  
           /* */
          
           $output.="  }";
                   
           file_put_contents("cache/".md5_file($dir."/".$file).".cache",$output);
           echo $output;
           
        }
        closedir($dh);
    }
}

echo "]}";

$data=ob_get_contents();
file_put_contents("cache/metadata.json",$data); 
//file_put_contents("../cache/metadata.json",$data);    
ob_end_flush ();

?>