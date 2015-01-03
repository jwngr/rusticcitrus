// TODO: make this update the live tile with proper data
// TODO: have Amanda make proper sized badge logos
(function () {
    "use strict";

    // Get a reference to the Windows Notifications class
    var notifications = Windows.UI.Notifications;

    // Display the live tile notification
    var date = new Date();
    displayTileNotification(date);

    // Mark the current background task instance as succeeded
    Windows.UI.WebUI.WebUIBackgroundTaskInstance.current.succeeded = true;

    // Close the background task
    close();

    /* Displays a live tile notification */
    function displayTileNotification(content) {
        // Get a filled in version of the template
        var tileXml = notifications.TileUpdateManager.getTemplateContent(notifications.TileTemplateType.tileWide310x150SmallImageAndText04);

        // Populate the template
        var tileTextAttributes = tileXml.getElementsByTagName("text");
        var title = "Tile Updated At";
        tileTextAttributes[0].appendChild(tileXml.createTextNode("Mary Anderson"));
        tileTextAttributes[1].appendChild(tileXml.createTextNode("Mary has invited you to a new game!"));

        var tileImageAttributes = tileXml.getElementsByTagName("image");
        tileImageAttributes[0].setAttribute("src", "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-ash1/203244_778380366_1988734921_q.jpg");
        tileImageAttributes[0].setAttribute("alt", "Mary Anderson");

        // Create the notification from the XML
        var tileNotification = new notifications.TileNotification(tileXml);

        // Send the notification to the app's default tile
        notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);
    };
})();