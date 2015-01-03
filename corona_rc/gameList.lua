-----------------------------------------------------------------------------------------
--
--  gameList.lua
--
--  A list of all the logged in user's multiplayer games
--
-----------------------------------------------------------------------------------------

-- Include the necessary modules
local storyboard = require("storyboard")
local widget = require("widget")
local json = require("json")
--local facebook = require("facebook")

-- Create a new storyboard scene
local scene = storyboard.newScene()

--local facebookAppId = "372025176196549"

-----------------------------------------------------------------------------------------

-------------------------
--  SCENE TRANSITIONS  --
-------------------------

--[[ Activates the game scoreboard scene when a game list item is tapped ]]--
local function activateGameScoreboard(event)
	-- If the event has ended, activate the game scoreboard scene
	if (event.phase == "ended") then
		local transitionOptions =
		{
			effect = "slideLeft",
			time = 500,
			params =
			{
				gameId = event.target.gameId
			}
		}
		
		-- Activate the game scoreboard scene
		storyboard.gotoScene("scoreboard", transitionOptions)
	
	-- Otherwise, if the finger has moved, pass focus to the scroll view
	elseif (event.phase == "moved") then
		local dx = math.abs(event.x - event.xStart)
		local dy = math.abs(event.y - event.yStart)
		if ((dx > 5) or (dy > 5)) then
			scrollView:takeFocus(event)
		end
	end
			
	-- Return true to indicate a successful touch
	return true
end

--[[ Activates the main menu scene when the "Main Menu" button is pressed ]]--
local function activateMainMenuScene(event)
	local transitionOptions =
	{
		effect = "slideRight",
		time = 500
	}
		
	-- Activate the main menu scene
	storyboard.gotoScene("mainMenu", transitionOptions)
			
	-- Return true to indicate a successful touch
	return true
end

-----------------------------------------------------------------------------------------

-------------------------------
--  SCENE DRAWING FUNCTIONS  --
-------------------------------

--[[ Draws the opponent picture ]]--
local function drawOpponentPicture(event)
	-- If there is an error, print it
	if (event.isError) then
		print ("Error: download failed in drawOpponentPicture()")
		
	-- Otherwise, draw the opponent picture
	else
		-- Get the downloaded opponent picture
		local opponentPicture = event.target

		-- Update the opponent picture's x- and y-coordinates
		opponentPicture.x = opponentPicture.x - (opponentPicture.width / 2) + 30
		opponentPicture.y = opponentPicture.y - (opponentPicture.height / 2) + 30
		
		-- Update the opponent picture's width and height
		opponentPicture.width, opponentPicture.height = 50, 50		
		
		-- Add the opponent picture to the scroll view
		scrollView:insert(opponentPicture)
	end
end

--[[ Draws a header for a list of games ]]--
local function drawGameListSectionHeader(text, yCoord)
	-- Section header rectangle
	local gameListSectionHeaderRectangle = display.newRoundedRect(10, yCoord, 150, 30, 5)
	gameListSectionHeaderRectangle:setFillColor(255, 140, 0)
	gameListSectionHeaderRectangle.strokeWidth = 1
	gameListSectionHeaderRectangle:setStrokeColor(0, 0, 0)
	gameListSectionHeaderRectangle:setReferencePoint(display.CenterReferencePoint)
	
	-- Section header text
	local gameListSectionHeaderText = display.newText(text, 10, yCoord, "Helvetica", 20)
	gameListSectionHeaderText:setTextColor(0, 0, 0)
	gameListSectionHeaderText:setReferencePoint(display.CenterReferencePoint)
	gameListSectionHeaderText.x = gameListSectionHeaderRectangle.x
	gameListSectionHeaderText.y = gameListSectionHeaderRectangle.y
	
	-- Insert the section header rectangle and text into the scroll view
	scrollView:insert(gameListSectionHeaderRectangle)
	scrollView:insert(gameListSectionHeaderText)	
end

--[[ Draws the list item for a single game ]]--
local function drawGameListItem(game, yCoord)
	-- Draw the background rectangle for the current game's list item
	local gameListItemRectangle = display.newRect(10, yCoord, display.contentWidth - 20, 60)
	gameListItemRectangle:setFillColor(200, 200, 200)
	gameListItemRectangle.strokeWidth = 1
	gameListItemRectangle:setStrokeColor(0, 0, 0)
	gameListItemRectangle:setReferencePoint(display.TopLeftReferencePoint)
	
	-- Add the game ID to the game list item rectangle
	gameListItemRectangle.gameId = game.id
	
	-- Add a listener which will activate the game scoreboard when the game list item rectangle is tapped
	gameListItemRectangle:addEventListener("touch", activateGameScoreboard)
	
	-- Insert the game list item rectangle into the scroll view
	scrollView:insert(gameListItemRectangle)
	
	-- Draw the name of the current game's opponent
	local opponentNameText = display.newText(game.opponentName, 0, 0, "Helvetica", 18)
	opponentNameText:setTextColor(0, 0, 0)
	opponentNameText:setReferencePoint(display.TopLeftReferencePoint)
	opponentNameText.x = gameListItemRectangle.x + 65
	opponentNameText.y = gameListItemRectangle.y + 5
	
	-- Insert the opponent's name text into the scroll view
	scrollView:insert(opponentNameText)	
	
	-- Determine the total scores for each player
	local loggedInUserTotal, opponentTotal
	if (game.loggedInUserIndex == 1) then
		loggedInUserTotal, opponentTotal = game.user1Total, game.user2Total
	else
		loggedInUserTotal, opponentTotal = game.user2Total, game.user1Total
	end
	
	-- Determine what the score text should say
	local scoreText
	if (loggedInUserTotal > opponentTotal) then
		if (game.currentRound == -1) then
			scoreText = "You won " .. loggedInUserTotal .. " to " .. opponentTotal
		else
			scoreText = "You are winning " .. loggedInUserTotal .. " to " .. opponentTotal
		end
	elseif (loggedInUserTotal < opponentTotal) then
		if (game.currentRound == -1) then
			scoreText = "You lost " .. loggedInUserTotal .. " to " .. opponentTotal
		else
			scoreText = "You are losing " .. loggedInUserTotal .. " to " .. opponentTotal
		end
	else
		scoreText = "You are tied " .. loggedInUserTotal .. " to " .. opponentTotal
	end
	
	if (game.currentRound - 1 == 1) then
		scoreText = scoreText .. " after 1 round"
	elseif (game.currentRound ~= -1) then
		scoreText = scoreText .. " after " .. (game.currentRound - 1) .. " rounds"
	end
	
	-- Display the score text
	scoreText = display.newText(scoreText, 0, 0, "Helvetica", 12)
	scoreText:setTextColor(0, 0, 0)
	scoreText:setReferencePoint(display.TopLeftReferencePoint)
	scoreText.x = gameListItemRectangle.x + 65
	scoreText.y = gameListItemRectangle.y + 26
	
	-- Insert the score text into the scroll view
	scrollView:insert(scoreText)
	
	-- Display the timestamp
	local timestampText = display.newText(game.timestamp, 0, 0, "Helvetica", 10)
	timestampText:setTextColor(0, 0, 0)
	timestampText:setReferencePoint(display.TopLeftReferencePoint)
	timestampText.x = gameListItemRectangle.x + 65
	timestampText.y = gameListItemRectangle.y + 40
	
	-- Insert the timestamp text into the scroll view
	scrollView:insert(timestampText)
	
	-- Load the opponent picture
	display.loadRemoteImage("http://developer.anscamobile.com/demo/hello.png", "GET", drawOpponentPicture, "helloCopy.png", system.TemporaryDirectory, 10, yCoord)
end

--[[ Draws the list of the logged in user's games ]]--
local function drawGameList(event)
	-- If there is an error, print it
	if (event.isError) then
		print ("Error: network error in drawGameList()")
		
	-- Otherwise, draw the list of games
	else
	    -- Get the response JSON data
	    local response = json.decode(event.response)
	  
	    -- Set the initial y-coordinate
	    local yCoord = 60
	  
  	    -- Draw the "Your Turn" section header
	    drawGameListSectionHeader("Your Turn", yCoord)
	  
	    -- Update the y-coordinate
	    yCoord = yCoord + 30
	  
	    -- Draw a list item for each game in which it is the logged in user's turn
	    for i = 1, #response.games do
		    game = response.games[i]
		  
		    if (game.turn == 1) then
		  	    drawGameListItem(game, yCoord)
			    yCoord = yCoord + 60
		    end
	    end
	  
	    -- Update the y-coordinate
	    yCoord = yCoord + 20
	  
	    -- Draw the "Their Turn" section header
	    drawGameListSectionHeader("Their Turn", yCoord)
	  
	    -- Update the y-coordinate
	    yCoord = yCoord + 30
	  
	    -- Draw a list item for each game in which it is not the logged in user's turn
	    for i = 1, #response.games do
		    game = response.games[i]
		  
		    if (game.turn == 2) then
		  	    drawGameListItem(game, yCoord)
			    yCoord = yCoord + 60
		    end
	    end
	  
	    -- Update the y-coordinate
	    yCoord = yCoord + 20
	  
	    -- Draw the "Completed" section header
	    drawGameListSectionHeader("Completed", yCoord)
	  
	    -- Update the y-coordinate
	    yCoord = yCoord + 30
	
	    -- Draw a list item for each completed game
	    for i = 1, #response.games do
		    game = response.games[i]

		    if (game.turn == -1) then
			    drawGameListItem(game, yCoord)
			    yCoord = yCoord + 60
		    end
	    end        	
	end
end

--[[
function facebookListener(event)
    if ("session" == event.type) then
        if ("login" == event.phase) then
            facebook.request("me")
        end
    elseif ("request" == event.type) then
        local response = event.response
        print(response)
    end
end

local function onFacebookButtonClick(event)
	facebook.login(facebookAppId, facebookListener)
end
--]]

-----------------------------------------------------------------------------------------

-----------------------
--  SCENE LISTENERS  --
-----------------------

--[[ Called when the scene's view does not exist ]]--
function scene:createScene(event)
	-- Get the view's main group
	local group = self.view

	-- Create the scroll view
	scrollView = widget.newScrollView {
		width = display.contentWidth,
		height = display.contentHeight,
		hideBackground = true
	}

	-- Background image
	local background = display.newImageRect(group, "resources/images/landscapeBackground.jpg", display.contentWidth, display.contentHeight)
	background:setReferencePoint(display.TopLeftReferencePoint)
	background.x, background.y = 0, 0

	-- Main menu/back button
	local mainMenuButton = widget.newButton {
		label = "Main Menu",
		labelColor = {
			default = {255},
			over= {128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 154,
		height = 40,
		onRelease = activateMainMenuScene
	}
	mainMenuButton:setReferencePoint(display.TopLeftReferencePoint)
	mainMenuButton.x = 10
	mainMenuButton.y = 10
	
	-- Insert the main menu button into the scroll view
	scrollView:insert(mainMenuButton)
	
	-- Get the list of games for the current user and draw the game list
	network.request("http://127.0.0.1:8000/gameList/", "GET", drawGameList)
		
	-- Insert the scroll view into the view's main group
	group:insert(scrollView)
	
	--[[
	-- Facebook button
	local facebookLoginButton = widget.newButton {
		default = "resources/images/facebookConnectButton.png",
		--width = 280,
		--height = 47,
		onRelease = onFacebookButtonClick
	}
	facebookLoginButton:setReferencePoint(display.CenterReferencePoint)
	facebookLoginButton.x = display.contentWidth / 2
	facebookLoginButton.y = display.contentHeight / 2
	--]]
	
	-- Insert the facebook button into the view's main group
	--group:insert(facebookLoginButton)
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