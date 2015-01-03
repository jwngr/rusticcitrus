(function () {
    "use strict";

    /*******************************/
    /*  COMMON BINDING CONVERTERS  */
    /*******************************/
    /* Shows normal list items for non-empty lists */
    var showNormalListItem = WinJS.Binding.converter(function (isPlaceholder) {
        return isPlaceholder ? "none" : "normal";
    });

    /* Shows placeholder items for empty lists */
    var showPlaceholderListItem = WinJS.Binding.converter(function (isPlaceholder) {
        return isPlaceholder ? "normal" : "none";
    });

    /* Pretties-up (i.e. adds commas to) large scores */
    var displayPrettyScore = WinJS.Binding.converter(function (score) {
        if (score !== undefined) {
            return score.toString().replace(/(\d)(?=(?:\d{3})+$)/g, "$1,");
        }
    });

    /* Returns the correct pluralization for the number of round(s) completed */
    var displayNumRoundsCompleted = WinJS.Binding.converter(function (numRoundsCompleted) {
        if (numRoundsCompleted == 1) {
            return "1 Round Completed";
        }
        else {
            return numRoundsCompleted + " Rounds Completed";
        }
    });

    /* Returns the correct pluralization for the number of word(s) found */
    var displayNumWordsFound = WinJS.Binding.converter(function (numWordsFound) {
        if (numWordsFound == 1) {
            return "1 Word Found";
        }
        else {
            return numWordsFound + " Words Found";
        }
    });


    /**********************************/
    /*  GAMES HUB BINDING CONVERTERS  */
    /**********************************/
    /* Returns the properly formatted time remaining in the current round */
    var displayTimeRemaining = WinJS.Binding.converter(function (secondsRemaining) {
        var timeRemaining;
        if (secondsRemaining == 0) {
            timeRemaining = "2:00";
        }
        else {
            var minutesRemaining = Math.floor(secondsRemaining / 60);
            var secondsRemaining = secondsRemaining % 60;
            if (secondsRemaining >= 10) {
                var timeRemaining = minutesRemaining.toString() + ":" + secondsRemaining.toString();
            }
            else {
                var timeRemaining = minutesRemaining.toString() + ":0" + secondsRemaining.toString();
            }
        }

        return timeRemaining + " Left";
    });
    

    /*************************************/
    /*  ACHIEVEMENTS BINDING CONVERTERS  */
    /*************************************/
    /* Sets the display style of the lock icon */
    var displayLockIcon = WinJS.Binding.converter(function (isComplete) {
        return isComplete ? "none" : "default";
    });


    /*********************************/
    /*  DEFINE RC.BindingConverters  */
    /*********************************/
    WinJS.Namespace.defineWithParent(RC, "BindingConverters", {
        // Common
        showNormalListItem: showNormalListItem,
        showPlaceholderListItem: showPlaceholderListItem,
        displayPrettyScore: displayPrettyScore,
        displayNumRoundsCompleted: displayNumRoundsCompleted,
        displayNumWordsFound: displayNumWordsFound,

        // Games hub
        displayTimeRemaining: displayTimeRemaining,

        // Achievements
        displayLockIcon: displayLockIcon
    });
})();