<?php
    // Connect to the emails database
    $username = "rusticcitrus";
    $password = "#8&2V*#7uH*56pK7";
    $hostname = "mysql.rusticcitrus.com";
    $dbName = "RusticCitrusWeb";

    $connection = mysql_connect($hostname, $username, $password) or die("Error: could not connect to database.");
    mysql_select_db($dbName, $connection);
    
    // If we are passed the correct POST data, do the database table insertion
    if (isset($_POST["email"]) && strlen($_POST["email"]) > 0)
    {
        // Sanitize the email POST value
        $email = filter_var($_POST["email"], FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_HIGH);
        
        // If the record was successfully inserted, return a success result
        if (validateEmail($email) == "true") {
            // Insert the sanitized email into the table=
            $result = mysql_query("INSERT INTO rusticcitrusweb.emails (id,email) VALUES(NULL,'".$email."');");
            
            if ($result) {
                echo "success";
                mysql_close($connection);
            }
            
            // Otherwise, return a failure result
            else {
                echo "Failure inserting email into table. ";
                echo mysql_errno();
                echo mysql_error();
                exit();
            }
        }
        else {
            echo "POST data is not a valid email address.";
            exit();
        }
    }

    // If we are not passed the correct POST data, simply return
    else {
        echo("Bad POST data.");
        exit();
    }
    
    
    /* Returns "true" if the inputted email is valid; otherwise, returns "false" */
    function validateEmail($email)
    {
        $isValid = "true";
        $atIndex = strrpos($email, "@");
        if (is_bool($atIndex) && !$atIndex)
        {
            $isValid = "false";
        }
        else
        {
            $domain = substr($email, $atIndex+1);
            $local = substr($email, 0, $atIndex);
            $localLen = strlen($local);
            $domainLen = strlen($domain);
            if ($localLen < 1 || $localLen > 64)
            {
                // local part length exceeded
                $isValid = "false";
            }
            else if ($domainLen < 1 || $domainLen > 255)
            {
                // domain part length exceeded
                $isValid = "false";
            }
            else if ($local[0] == '.' || $local[$localLen-1] == '.')
            {
                // local part starts or ends with '.'
                $isValid = "false";
            }
            else if (preg_match('/\\.\\./', $local))
            {
                // local part has two consecutive dots
                $isValid = "false";
            }
            else if (!preg_match('/^[A-Za-z0-9\\-\\.]+$/', $domain))
            {
                // character not valid in domain part
                $isValid = "false";
            }
            else if (preg_match('/\\.\\./', $domain))
            {
                // domain part has two consecutive dots
                $isValid = "false";
            }
            else if (!preg_match('/^(\\\\.|[A-Za-z0-9!#%&`_=\\/$\'*+?^{}|~.-])+$/', str_replace("\\\\","",$local)))
            {
                // character not valid in local part unless 
                // local part is quoted
                if (!preg_match('/^"(\\\\"|[^"])+"$/', str_replace("\\\\","",$local)))
                {
                    $isValid = "false";
                }
            }
            if ($isValid && $domainLen != 0 && !(checkdnsrr($domain,"MX") || checkdnsrr($domain,"A")))
            {
                // domain not found in DNS
                $isValid = "false";
            }
        }
        return $isValid;
    }
?>