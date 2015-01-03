-----------------------------------------------------------------------------------------
--
-- roundScoreboard.lua
--
-----------------------------------------------------------------------------------------

-- Include the necessary modules
local storyboard = require("storyboard")
local widget = require("widget")
local facebook = require("facebook")
local json = require("json")
local scrollView = widget.newScrollView{
    width = display.contentWidth,
    height = 150,
    hideBackground = false,
    maskFile = "resources/images/mask320x150.png"
}
local generateRound = require("generateRound")

-- Create a new storyboard scene
local scene = storyboard.newScene()

local facebookAppId = "372025176196549"

local scoreboardGroup = display.newGroup()

-----------------------------------------------------------------------------------------

_G["gameId"] = nil
_G["roundId"] = nil

-- Goes to the game board when the "Classic" button is released
local function onPlayButtonRelease()
	
	local options =
	{
    	effect = "fade",
    	time = 500,
    	params =
    	{
    		numLetters = 6,
    		gameMode = "multiplayer",
    		gameId = _G["gameId"]
    	}
	}
	
	-- Go to game.lua scene
	storyboard.gotoScene("round", options)
	
	-- Return "true" to indicate a successful touch
	return true
end

-- Goes back to the game list view when the "Game List" button is pressed
local function onGameListButtonRelease(event)
	local options =
	{
		effect = "slideRight",
		time = 500
	}
		
	-- Go to game list scene
	storyboard.gotoScene("gameList", options)
	
	-- Return "true" to indicate a successful touch
	return true
end


-- Draws and positions the user 1 picture
local function user1PictureListener( event )
	if (event.isError) then
		print ("Network error - download failed")
	else
		-- Update the width, height, and position of the opponent picture
		event.target.width = 50
		event.target.height = 50
		event.target.x = event.target.x - 40
		event.target.y = event.target.y - 70
		
		-- Add the opponent picture to the scroll view
		scoreboardGroup:insert(event.target)
	end
	
	--print ( "RESPONSE: " .. event.response )
end

-- Draws and positions the user 2 picture
local function user2PictureListener( event )
	if (event.isError) then
		print ("Network error - download failed")
	else
		-- Update the width, height, and position of the opponent picture
		event.target.width = 50
		event.target.height = 50
		event.target.x = event.target.x - 40
		event.target.y = event.target.y - 70
		
		-- Add the opponent picture to the scroll view
		scoreboardGroup:insert(event.target)
	end
	
	--print ( "RESPONSE: " .. event.response )
end


-- Draws a header for a list of games
local function drawGameListHeader(text, yCoord)
	local yourTurnHeaderRectangle = display.newRoundedRect(10, yCoord, 150, 30, 5)
	yourTurnHeaderRectangle:setFillColor(255, 140, 0)
	yourTurnHeaderRectangle.strokeWidth = 1
	yourTurnHeaderRectangle:setStrokeColor(0, 0, 0)
	yourTurnHeaderRectangle:setReferencePoint(display.CenterReferencePoint)
	scrollView:insert(yourTurnHeaderRectangle)
	
	local yourTurnHeaderText = display.newText(text, 10, yCoord, "Helvetica", 20)
	yourTurnHeaderText:setTextColor(0, 0, 0)
	yourTurnHeaderText:setReferencePoint(display.CenterReferencePoint)
	yourTurnHeaderText.x = yourTurnHeaderRectangle.x
	yourTurnHeaderText.y = yourTurnHeaderRectangle.y
	scrollView:insert(yourTurnHeaderText)	
end


-- Draws the list view for a game
local function drawGameListView(game, yCoord)
	local gameRectangle = display.newRect(10, yCoord, display.contentWidth - 20, 60)
	gameRectangle:setFillColor(200, 200, 200)
	gameRectangle.strokeWidth = 1
	gameRectangle:setStrokeColor(0, 0, 0)
	gameRectangle:setReferencePoint(display.TopLeftReferencePoint)
	scrollView:insert(gameRectangle)
	
	local gameText = display.newText(game.user2, 0, 0, "Helvetica", 18)
	gameText:setTextColor(0, 0, 0)
	gameText:setReferencePoint(display.TopLeftReferencePoint)
	gameText.x = gameRectangle.x + 65
	gameText.y = gameRectangle.y + 5
	scrollView:insert(gameText)	
	
	local user1_score = 0
	for j = 1, #game.user1_scores do
		user1_score = user1_score + tonumber(game.user1_scores[j])
	end
	
	local user2_score = 0
	for j = 1, #game.user2_scores do
		user2_score = user2_score + tonumber(game.user2_scores[j])
	end
	
	local scoreText
	if (user1_score > user2_score) then
		scoreText = "Winning "..user1_score.." to "..user2_score
	elseif (user1_score < user2_score) then
		scoreText = "Losing "..user1_score.." to "..user2_score
	else
		scoreText = "Tied "..user1_score.." to "..user2_score
	end
	
	local scoreText = display.newText(scoreText, 0, 0, "Helvetica", 14)
	scoreText:setTextColor(0, 0, 0)
	scoreText:setReferencePoint(display.TopLeftReferencePoint)
	scoreText.x = gameRectangle.x + 65
	scoreText.y = gameRectangle.y + 25
	scrollView:insert(scoreText)
	
	display.loadRemoteImage("http://developer.anscamobile.com/demo/hello.png", "GET", opponentPictureListener, "helloCopy.png", system.TemporaryDirectory, 15, yCoord)
end


-- Draws the scoreboard for the current game
local function drawScoreboard(event)
	-- Make sure no error occurs
	if (event.isError) then
		  print("Network error!")
	
	-- If there is no error, draw the scoreboard
	else
	    -- Get the response JSON data
		local response = json.decode(event.response)
		  
		-- Set the initial y-coordinate
		local yCoord = 50
	  
	  	-- Get the scoreboard header text
	  	if (response.current_round ~= -1) then
	  		scoreboardHeaderText = "Round " .. response.current_round
	  	else
	  		scoreboardHeaderText = "Game Over"
	  	end
	  
	  	-- Draw the scoreboard header
		local scoreboardHeader = display.newText(scoreboardHeaderText, 0, yCoord, "Helvetica", 26)
		scoreboardHeader:setTextColor(0, 0, 0)
		scoreboardHeader:setReferencePoint(display.CenterReferencePoint)
		scoreboardHeader.x = display.contentWidth / 2
		scoreboardGroup:insert(scoreboardHeader)
		
		yCoord = yCoord + 40
		
		-- Draw the user information
		display.loadRemoteImage("http://developer.anscamobile.com/demo/hello.png", "GET", user1PictureListener, "helloCopy.png", system.TemporaryDirectory, 15, yCoord)
		display.loadRemoteImage("http://developer.anscamobile.com/demo/hello.png", "GET", user2PictureListener, "helloCopy.png", system.TemporaryDirectory, (display.contentWidth/2) + 15, yCoord)
		
		yCoord = yCoord + 60
		
		local user1NameText = display.newText(response.user1, 0, yCoord, "Helvetica", 18)
		user1NameText:setTextColor(0, 0, 0)
		user1NameText:setReferencePoint(display.CenterReferencePoint)
		user1NameText.x = display.contentWidth / 4
		scoreboardGroup:insert(user1NameText)
		
		local user2NameText = display.newText(response.user2, 0, yCoord, "Helvetica", 18)
		user2NameText:setTextColor(0, 0, 0)
		user2NameText:setReferencePoint(display.CenterReferencePoint)
		user2NameText.x = (3 * display.contentWidth) / 4
		scoreboardGroup:insert(user2NameText)
		
		yCoord = 0
		
		local wordSubset = generateRound.getWordSubset("SIDLES")
		
		-- Draw each round's score
		for i = 1, #wordSubset do
			-- Round header
			local word = wordSubset[i]
			local wordText = display.newText(word, 0, yCoord, "Helvetica", 12)
			wordText:setTextColor(0, 0, 0)
			wordText:setReferencePoint(display.CenterReferencePoint)
			wordText.x = display.contentWidth / 2
			scrollView:insert(wordText)
			
			yCoord = yCoord + 20
		end
		
		-- User 1 total
		local user1Total = response.user1_score
		local user1TotalScoreText = display.newText(user1Total, 0, yCoord, "Helvetica", 18)
		user1TotalScoreText:setTextColor(0, 0, 0)
		user1TotalScoreText:setReferencePoint(display.CenterReferencePoint)
		user1TotalScoreText.x = display.contentWidth / 4
		scoreboardGroup:insert(user1TotalScoreText)
		
		-- User 2 score
		local user2Total = response.user2_score
		local user2TotalScoreText = display.newText(user2Total, 0, yCoord, "Helvetica", 18)
		user2TotalScoreText:setTextColor(0, 0, 0)
		user2TotalScoreText:setReferencePoint(display.CenterReferencePoint)
		user2TotalScoreText.x = (3 * display.contentWidth) / 4
		scoreboardGroup:insert(user2TotalScoreText)
		
		-- Classic button
		local doneButton = widget.newButton {
			label = "Done",
			labelColor = {
				default = {255},
				over={128}
			},
			default = "resources/images/button.png",
			over = "resources/images/button-over.png",
			width = 154,
			height = 40,
			onRelease = onDoneButtonRelease
		}
		doneButton:setReferencePoint(display.CenterReferencePoint)
		doneButton.x = display.contentWidth / 2
		doneButton.y = display.contentHeight - 50
		
		scoreboardGroup:insert(doneButton)
		
	    --print ( "RESPONSE: " .. event.response )
	end
end

-----------------------------------------------------------------------------------------
-- BEGINNING OF YOUR IMPLEMENTATION
-- 
-- NOTE: Code outside of listener functions (below) will only be executed once,
--		 unless storyboard.removeScene() is called.
-- 
-----------------------------------------------------------------------------------------

-- Called when the scene's view does not exist:
function scene:createScene( event )
	local group = self.view

	_G["gameId"] = event.params.gameId
	_G["roundId"] = event.params.roundId

	-- Background image
	local background = display.newImageRect("resources/images/landscapeBackground.jpg", display.contentWidth, display.contentHeight)
	background:setReferencePoint(display.TopLeftReferencePoint)
	background.x, background.y = 0, 0
	group:insert(background)

	-- Get the current round's scoreboard information
	network.request("http://127.0.0.1:8000/roundScoreboard/".._G["gameId"].."/".._G["roundId"].."/", "GET", drawScoreboard)

	-- "Game list" back button
	local doneButton = widget.newButton {
		label = "Done",
		labelColor = {
			default = {255},
			over={128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 154,
		height = 40,
		onRelease = onDoneButtonRelease
	}
	doneButton:setReferencePoint(display.TopLeftReferencePoint)
	doneButton.x = 10
	doneButton.y = 10
	group:insert(doneButton)
	
	group:insert(scoreboardGroup)
	scrollView.y = 200
	group:insert(scrollView)
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
	
	-- Remove the current scoreboard scene
	storyboard.removeScene("roundScoreboard")
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