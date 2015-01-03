-----------------------------------------------------------------------------------------
--
--  main.lua
--
--  Base main view
--
-----------------------------------------------------------------------------------------

-- Include the necessary modules
local storyboard = require("storyboard")

-- Hide the status bar
display.setStatusBar(display.HiddenStatusBar)

-- Load the menu screen
storyboard.gotoScene("mainMenu")