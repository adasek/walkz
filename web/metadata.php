<?php
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
            
            if(file_exists("/var/www/adasek.cz/osm/cache/".md5_file($dir."/".$file).".cache")){
             //read from cache instead
             echo file_get_contents("/var/www/adasek.cz/osm/cache/".md5_file($dir."/".$file).".cache");
             continue;
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
             
             for($i=1;$i<count($xml->trk->trkseg->trkpt)-1;$i++){
              // print_r($xml->trk->trkseg->trkpt[$i]);
              $Btime=strtotime($xml->trk->trkseg->trkpt[$i]->time);
              $Bele=(double)$xml->trk->trkseg->trkpt[$i]->ele;      
               $attr=$xml->trk->trkseg->trkpt[$i]->attributes();   
              $Blat=(double)$attr["lat"];  
              $Blon=(double)$attr["lon"];  
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
           $output.="\"downElevation\": \"".$downEle."\", \n";                                  
           $output.="\"color\": \"".$color."\"\n";  
           /* */
          
           $output.="  }";
                   
           file_put_contents("/var/www/adasek.cz/osm/cache/".md5_file($dir."/".$file).".cache",$output);
           echo $output;
           
        }
        closedir($dh);
    }
}

echo "]}";

$data=ob_get_contents();
file_put_contents("/var/www/adasek.cz/osm/cache/metadata.json",$data); 
//file_put_contents("../cache/metadata.json",$data);    
ob_end_flush ();

?>