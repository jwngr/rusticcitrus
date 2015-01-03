-----------------------------------------------------------------------------------------
--
--  menu.lua
--
--  Main menu
--
-----------------------------------------------------------------------------------------

-- Include the necessary modules
local storyboard = require("storyboard")
local widget = require("widget")

-- Create a new storyboard scene
local scene = storyboard.newScene()

-----------------------------------------------------------------------------------------

-------------------------
--  SCENE TRANSITIONS  --
-------------------------

--[[ Activates a new single-player round when the "Classic" button is tapped ]]--
local function activateClassicRoundScene()
	-- Define the scene transition options
	local transitionOptions =
	{
    	effect = "fade",
    	time = 500,
    	params =
    	{
    		numLetters = 6,
    		gameMode = "classic"
    	}
	}
	
	-- Activate the single-player round scene
	storyboard.gotoScene("round", transitionOptions)
	
	-- Return true to indicate a successful touch
	return true
end


--[[ Activates the game list when the "Multiplayer" button is tapped ]]--
local function activateGameListScene()
	-- Define the scene transition options
	local transitionOptions =
	{
    	effect = "slideLeft",
    	time = 500
    }
	
	-- Activate the game list scene
	storyboard.gotoScene("gameList", transitionOptions)
	
	-- Return true to indicate a successful touch
	return true
end

-----------------------------------------------------------------------------------------

-----------------------
--  SCENE LISTENERS  --
-----------------------

--[[ Called when the scene's view does not exist ]]--
function scene:createScene(event)
	-- Get the view's main group
	local group = self.view

	-- Background image
	local background = display.newImageRect(group, "resources/images/landscapeBackground.jpg", display.contentWidth, display.contentHeight)
	background:setReferencePoint(display.TopLeftReferencePoint)
	background.x, background.y = 0, 0
	
	-- Title logo
	local titleLogo = display.newImageRect(group, "resources/images/logo.png", 264, 42)
	titleLogo:setReferencePoint(display.CenterReferencePoint)
	titleLogo.x = display.contentWidth / 2
	titleLogo.y = 50
	
	-- Classic button
	local classicButton = widget.newButton {
		label = "Classic",
		labelColor = {
			default = {255},
			over = {128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 154,
		height = 40,
		onRelease = activateClassicRoundScene
	}
	classicButton:setReferencePoint(display.CenterReferencePoint)
	classicButton.x = display.contentWidth / 2
	classicButton.y = 105
		
	-- Multiplayer button
	local multiplayerButton = widget.newButton {
		label = "Multiplayer",
		labelColor = {
			default = {255},
			over = {128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 154,
		height = 40,
		onRelease = activateGameListScene
	}
	multiplayerButton:setReferencePoint(display.CenterReferencePoint)
	multiplayerButton.x = display.contentWidth / 2
	multiplayerButton.y = 160
	
	-- Achievements button
	local achievementsButton = widget.newButton {
		label = "Achievements",
		labelColor = {
			default = {255},
			over = {128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 154,
		height = 40,
		onRelease = activateAchievementsScene
	}
	achievementsButton:setReferencePoint(display.CenterReferencePoint)
	achievementsButton.x = display.contentWidth / 2
	achievementsButton.y = 215
	
	-- Settings button
	local settingsButton = widget.newButton {
		label = "Settings",
		labelColor = {
			default = {255},
			over = {128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 154,
		height = 40,
		onRelease = activateSettingsScene
	}
	settingsButton:setReferencePoint(display.CenterReferencePoint)
	settingsButton.x = display.contentWidth / 2
	settingsButton.y = 270
	
	-- Insert the buttons into the view's main group
	group:insert(classicButton)
	group:insert(multiplayerButton)
	group:insert(achievementsButton)
	group:insert(settingsButton)
end

--[[ Called immediately after scene has moved onscreen ]]--
function scene:enterScene(event)
end

--[[ Called when scene is about to move offscreen ]]--
function scene:exitScene(event)
end

--[[ Called just prior to when scene's view is removed ]]--
function scene:destroyScene(event)
end

-----------------------------------------------------------------------------------------
-- END OF YOUR IMPLEMENTATION
-----------------------------------------------------------------------------------------

-- "createScene" event is dispatched if scene's view does not exist
scene:addEventListener("createScene", scene)

-- "enterScene" event is dispatched whenever scene transition has finished
scene:addEventListener("enterScene", scene)

-- "exitScene" event is dispatched whenever before next scene's transition begins
scene:addEventListener("exitScene", scene)

-- "destroyScene" event is dispatched before view is unloaded, which can be
-- automatically unloaded in low memory situations, or explicitly via a call to
-- storyboard.purgeScene() or storyboard.removeScene().
scene:addEventListener("destroyScene", scene)

-----------------------------------------------------------------------------------------

return scene