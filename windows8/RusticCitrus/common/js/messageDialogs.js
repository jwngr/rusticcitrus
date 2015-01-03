(function () {
    "use strict";

    /*********************/
    /*  MESSAGE DIALOGS  */
    /*********************/
    /* Displays a dialog prompting the user to purchase the app */
    function displayAppPurchaseDialog(title, message, includeCancelButton) {
        // Prompt the user to buy the app by displaying a message dialog
        var messageDialog = new Windows.UI.Popups.MessageDialog(message, title);

        // Add a purchase button to the message dialog
        messageDialog.commands.append(new Windows.UI.Popups.UICommand("Purchase", function () { purchaseFullVersion(includeCancelButton) }));

        // Include a cancel button and set the appropriate defaults if requested
        if (includeCancelButton) {
            // Add a cancel button to the message dialog
            messageDialog.commands.append(new Windows.UI.Popups.UICommand("Cancel"));

            // Set the commands that will be invoked by default and when escape is pressed
            messageDialog.defaultCommandIndex = 0;
            messageDialog.cancelCommandIndex = 1;
        }

        // Show the message dialog
        messageDialog.showAsync();
    };

    /* Contacts the Windows Store and attempts to purchase the full version of Rustic Citrus */
    function purchaseFullVersion(includeCancelButton) {
        RC.currentApp.requestAppPurchaseAsync(/* includeReceipt = */ false).then(
            /* The purchase was successful */
            function () {
                // Check the license state to determine if the purchase was successful
                if (RC.licenseInformation.isActive && !RC.licenseInformation.isTrial) {
                    displayPurchaseSuccessDialog();
                }
                else {
                    displayPurchaseErrorDialog(includeCancelButton);
                }
            },

            /* The purchase was not completed because there was an error */
            function () {
                displayPurchaseErrorDialog(includeCancelButton);
            }
        );
    };

    /* Displays a dialog when there is an error purchasing the app and allows the user to retry the purchase */
    function displayPurchaseErrorDialog(includeCancelButton) {
        // Prompt the user to buy the app by displaying a message dialog
        var messageDialog = new Windows.UI.Popups.MessageDialog("Something went wrong with the purchase. Please try again so you can continue playing the addictive, jumbled madness!", "Let's try that again");

        // Add a purchase button to the message dialog
        messageDialog.commands.append(new Windows.UI.Popups.UICommand("Purchase", function () { purchaseFullVersion(includeCancelButton) }));

        // Include a cancel button and set the appropriate defaults if requested
        if (includeCancelButton) {
            // Add a cancel button to the message dialog
            messageDialog.commands.append(new Windows.UI.Popups.UICommand("Cancel"));

            // Set the commands that will be invoked by default and when escape is pressed
            messageDialog.defaultCommandIndex = 0;
            messageDialog.cancelCommandIndex = 1;
        }

        // Show the message dialog
        messageDialog.showAsync();
    };

    /* Displays a dialog when the app purchase is successful */
    function displayPurchaseSuccessDialog() {
        // Prompt the user to buy the app by displaying a message dialog
        var messageDialog = new Windows.UI.Popups.MessageDialog("You now own the full version of Rustic Citrus! Enjoy!", "Purchase successful");

        // Show the reset game button
        $("#resetGame").show();

        // Show the message dialog
        messageDialog.showAsync();
    };

    /* Display a toast notification when a user gets an achievment */
    function displayAchievementToastNotification(achievement) {
        // Store the WinJS notifications object
        var notifications = Windows.UI.Notifications;

        // Create the toast notification template
        var template = notifications.ToastTemplateType.toastText02;
        var toastXml = notifications.ToastNotificationManager.getTemplateContent(template);

        // Set the title and description of the toast notification
        var toastTextElements = toastXml.getElementsByTagName("text");
        toastTextElements[0].appendChild(toastXml.createTextNode("Achievement Unlocked!"));
        toastTextElements[1].appendChild(toastXml.createTextNode(achievement.name + " - " + achievement.description));

        // Create and show the toast notification
        var toast = new notifications.ToastNotification(toastXml);
        var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();
        toastNotifier.show(toast);
    };

    // Add the MessageDialogs class to the RC namespace
    WinJS.Namespace.defineWithParent(RC, "MessageDialogs", {
        displayAppPurchaseDialog: displayAppPurchaseDialog,
        purchaseFullVersion: purchaseFullVersion,
        displayPurchaseErrorDialog: displayPurchaseErrorDialog,
        displayPurchaseSuccessDialog: displayPurchaseSuccessDialog,
        displayAchievementToastNotification: displayAchievementToastNotification
    });
})();