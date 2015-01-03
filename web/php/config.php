<?php
    $username = "rusticcitrus";
    $password = "#8&2V*#7uH*56pK7";
    $hostname = "mysql.rusticcitrus.com";
    $dbName = "RusticCitrusWeb";

    $connection = mysql_connect($hostname, $username, $password) or die("Error: could not connect to database.");
    mysql_select_db($dbName, $connection);
?>