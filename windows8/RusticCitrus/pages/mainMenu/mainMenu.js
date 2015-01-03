(function () {
    "use strict";

    /********************************/
    /*  PAGE-WIDE GLOBAL VARIABLES  */
    /********************************/
    // Orange button scale and rotation animation timeouts and intervals
    var g_ORANGE_BUTTON_SCALE_TIMEOUT;
    var g_GAMES_HUB_BUTTON_ROTATION_TIMEOUT;
    var g_STATS_HUB_BUTTON_ROTATION_TIMEOUT;
    var g_GAMES_HUB_BUTTON_ROTATION_INTERVAL;
    var g_STATS_HUB_BUTTON_ROTATION_INTERVAL;


    /****************************/
    /*  MAIN MENU PAGE CONTROL  */
    /****************************/
    WinJS.UI.Pages.define("/pages/mainMenu/mainMenu.html", {
        /* Responds to navigations to this page */
        ready: function (element, options) {
            // Initialize the main menu event listeners
            initializeMainMenuEventListeners();

            // Show the main menu
            showMainMenu();

            // TODO: add dateCreated and dateModified to multiplayer games; maybe add a date field for every round played?
        },

        /* Responds to navigations away from this page */
        unload: function () {
            disposeMainMenuEventListeners();
        },

        /* Responds to changes in the view state */
        updateLayout: function (element) {
        }
    });


    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Initializes the main menu event listeners */
    function initializeMainMenuEventListeners() {
        // Prevent the main menu images from being dragged
        $("#mainMenu img").on("dragstart", function (event) {
            event.preventDefault();
        });

        // Games hub button
        $("#gamesHubButton").on("click", function () {
            WinJS.Navigation.navigate("/pages/gamesHub/gamesHub.html");
        });

        // Stats hub button
        $("#statsHubButton").on("click", function () {
            WinJS.Navigation.navigate("/pages/statsHub/statsHub.html");
        });

        // Help button
        $("#mainMenuHelpButton").on("click", function () {
            WinJS.UI.SettingsFlyout.showSettings("helpSettingsFlyout", "/html/default.html");
        });

        // Settings button
        $("#mainMenuSettingsButton").on("click", function () {
            WinJS.UI.SettingsFlyout.showSettings("optionsSettingsFlyout", "/html/default.html");
        });
    };
    
    /* Disposes of the main menu event listeners */
    function disposeMainMenuEventListeners() {
        // Remove all DOM event listeners
        $("#mainMenu img").off("dragstart");
        $("#gamesHubButton").off("click");
        $("#statsHubButton").off("click");
        $("#mainMenuSettingsButton").off("click");
        $("#mainMenuHelpButton").off("click");

        // Clear the orange button scale and rotation animation timeouts and intervals
        window.clearTimeout(g_ORANGE_BUTTON_SCALE_TIMEOUT);
        window.clearTimeout(g_GAMES_HUB_BUTTON_ROTATION_TIMEOUT);
        window.clearTimeout(g_STATS_HUB_BUTTON_ROTATION_TIMEOUT);
        window.clearInterval(g_GAMES_HUB_BUTTON_ROTATION_INTERVAL);
        window.clearInterval(g_STATS_HUB_BUTTON_ROTATION_INTERVAL);
    };

    /* Shows the main menu */
    function showMainMenu() {
        // Unhide the main menu
        $("#mainMenu").show();

        // Start the main menu music
        if (RC.Music.musicOn) {
            RC.Music.mainMenuMusic.play();
        }

        // Animate the Rustic Citrus logo
        $("#rusticCitrusLogo").transition({
            y: -50,
            duration: 1
        }).transition({
            y: 0,
            opacity: "1",
            delay: 200,
            duration: 1000
        });

        // Animate the games hub button
        $("#gamesHubButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 500,
            duration: 1300
        });

        // Animate the stats hub button
        $("#statsHubButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 700,
            duration: 1300
        });

        // Animate the multiplayer button
        $("#mainMenuMultiplayerButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 1100,
            duration: 1300
        });

        // Animate the Floating House Studios logo
        $("#floatingHouseStudiosLogo").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 900,
            duration: 1300
        });

        // Animate the help button
        $("#mainMenuHelpButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 900,
            duration: 1300
        });

        // Animate the settings button
        $("#mainMenuSettingsButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 1100,
            duration: 1300
        });

        // Change the scale of the orange buttons on mouse events (once the two large main menu buttons are in their correct spot)
        var g_ORANGE_BUTTON_SCALE_TIMEOUT = window.setTimeout(function () {
            $(".mainMenuOrangeButton").on("mouseover", function () {
                $(this).transition({
                    scale: 1.2,
                    duration: 150,
                    easing: "ease",
                    queue: false
                });
            });

            $(".mainMenuOrangeButton").on("mouseout", function () {
                $(this).transition({
                    scale: 1.0,
                    duration: 150,
                    easing: "ease",
                    queue: false
                });
            });

            $(".mainMenuOrangeButton").on("mousedown", function () {
                var mouseDownScale = 0.8;
                if ($(this)[0] == $("#mainMenuHelpButton")[0] || $(this)[0] == $("#mainMenuSettingsButton")[0]) {
                    mouseDownScale = 0.9;
                }
                $(this).transition({
                    scale: mouseDownScale,
                    duration: 100,
                    easing: "ease",
                    queue: false
                });
            });
        }, 800);

        // Rotate the play and high scores buttons (once the two large main menu buttons are in their correct spot)
        var gamesHubButtonRotation = "-10deg";
        g_GAMES_HUB_BUTTON_ROTATION_TIMEOUT = window.setTimeout(function () {
            g_GAMES_HUB_BUTTON_ROTATION_INTERVAL = window.setInterval(function () {
                gamesHubButtonRotation = (gamesHubButtonRotation == "-10deg") ? "5deg" : "-10deg";
                $("#gamesHubButton").transition({
                    rotate: gamesHubButtonRotation,
                    easing: "ease",
                    duration: 400,
                    queue: false
                });
            }, 500);
        }, 1300);

        var statsHubButtonRotation = "-10deg";
        g_STATS_HUB_BUTTON_ROTATION_TIMEOUT = window.setTimeout(function () {
            g_STATS_HUB_BUTTON_ROTATION_INTERVAL = window.setInterval(function () {
                statsHubButtonRotation = (statsHubButtonRotation == "-10deg") ? "5deg" : "-10deg";
                $("#statsHubButton").transition({
                    rotate: statsHubButtonRotation,
                    easing: "ease",
                    duration: 400,
                    queue: false
                });
            }, 500);
        }, 1550);
    };
})();