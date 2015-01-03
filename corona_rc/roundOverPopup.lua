-----------------------------------------------------------------------------------------
--
-- roundOverPopup.lua
--
-----------------------------------------------------------------------------------------

-- Include the necessary modules
local storyboard = require("storyboard")
local widget = require("widget")

-- Create a new storyboard scene
local scene = storyboard.newScene()

-----------------------------------------------------------------------------------------
-- BEGINNING OF YOUR IMPLEMENTATION
-- 
-- NOTE: Code outside of listener functions (below) will only be executed once,
--		 unless storyboard.removeScene() is called.
-- 
-----------------------------------------------------------------------------------------

-- Called when the scene's view does not exist:
function scene:createScene(event)
	local group = self.view
	
	local overlayRect = display.newRect(group, 0, 0, 200, 50)
	overlayRect:setFillColor(255, 255, 255)
	overlayRect.strokeWidth = 1
	overlayRect:setStrokeColor(0, 0, 0)
	overlayRect:setReferencePoint(display.CenterReferencePoint)
	overlayRect.x = display.contentWidth / 2
	overlayRect.y = display.contentHeight / 2
	
	-- Title logo
	local letterText = display.newText(group, "Time's Up!", 0, 0, "Helvetica", 16)
	letterText:setTextColor(0, 0, 0)
	letterText:setReferencePoint(display.CenterReferencePoint)
	letterText.x = overlayRect.x
	letterText.y = overlayRect.y
	
	--group:insert(letterText)
end

-- Called immediately after scene has moved onscreen:
function scene:enterScene(event)
	local group = self.view
	
	-- INSERT code here (e.g. start timers, load audio, start listeners, etc.)
	
end

-- Called when scene is about to move offscreen:
function scene:exitScene(event)
	local group = self.view
	
	-- INSERT code here (e.g. stop timers, remove listenets, unload sounds, etc.)
	
end

-- If scene's view is removed, scene:destroyScene() will be called just prior to:
function scene:destroyScene(event)
	local group = self.view
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