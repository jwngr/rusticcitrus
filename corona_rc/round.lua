-----------------------------------------------------------------------------------------
--
-- round.lua
--
-- Draws the board and controls the gameplay for the current round of "Rustic Citrus"
--
-----------------------------------------------------------------------------------------

-- Include the necessary modules
local storyboard = require("storyboard")
local widget = require("widget")

-- Create a new storyboard scene
local scene = storyboard.newScene()

-- Start the random seeder
math.randomseed(os.time())

--------------------------------------------
--[[ GLOBAL VARIABLES ]]--
-- Round score
_G["score"] = 0

_G["gameTime"] = "0:10"
_G["gameId"] = nil
_G["roundId"] = nil

-- Height, width, spacing variables
_G["viewPadding"] = 10
_G["wordListColumnPadding"] = 10
_G["guessWidth"] = display.contentWidth - (2 * _G["viewPadding"])
_G["guessHeight"] = 50
_G["availableLetterRadius"] = 20
_G["availableLetterWidth"] = 2 * _G["availableLetterRadius"]
_G["availableLetterPadding"] = 12
_G["letterWidth"] = 18
_G["letterHeight"] = 18
_G["letterTextSize"] = 16

-- Number of letters in the longest word
_G["numLetters"] = nil

-- Game mode (1 = classic, 2 = multiplayer)
_G["gameMode"] = nil

-- Number of words per column in the word list
_G["wordsPerColumn"] = 11

-- Available and guessed letters
_G["availableLetters"] = {}
_G["guessedLetters"] = {}

-- List of all the words for the current round
_G["wordGroupList"] = {}
_G["wordList"] = {}

local clock, score = nil, nil

-------------------------------------------------
-- PRIVATE FUNCTIONS
-------------------------------------------------

-- Goes to the game board when the "Classic" button is released
local function showRoundScoreboard()
	local options =
	{
    	effect = "fade",
    	time = 500,
    	params =
    	{
    		score = _G["score"],
    		gameId = _G["gameId"],
    		roundId = _G["roundId"]
    	}
	}
	
	-- Go to game.lua scene
	storyboard.gotoScene("roundScoreboard", options)
	
	-- Return "true" to indicate a successful touch
	return true
end

-- Returns a table containing the full word list
local function getFullWordList()
	local path = system.pathForFile("resources/files/wordList.txt")
	local file = io.open(path, "r")
	local contents = file:read("*a")
	
	local fullWordList = {}
	for word in string.gmatch(contents, "[^%s]+") do
		table.insert(fullWordList, word)
	end
	
	return fullWordList
end


-- Returns true if testWord is made up of the letters in currentRoundWord
local function isWordSubset(currentRoundWord, testWord)
	local availableLetters = {}
	for i = 1, #currentRoundWord do
		table.insert(availableLetters, string.sub(currentRoundWord, i, i))
	end
		
	for i = 1, #testWord do
		local index = table.indexOf(availableLetters, string.sub(testWord, i, i))
		if index == nil then
			return false
		else
			table.remove(availableLetters, index)
		end
	end
	
	return true
end


-- Moves the inputted letter group from the available to guessed position
local function guessLetterGroup(letterGroup, availableIndex, guessedIndex)
	-- Determine the necessary changes in the x- and y-coordinates
	local xDelta = (guessedIndex - availableIndex) * (_G["availableLetterWidth"] + _G["availableLetterPadding"])
	local yDelta = -57
	
	-- Move the available letter group to the correct location
	transition.to(letterGroup, { time = 250, delta = true, x = xDelta, y = yDelta })
end


-- Moves the inputted letter group from the guessed to available position
local function clearLetterGroup(letterGroup, availableIndex, guessedIndex)
	-- Determine the necessary changes in the x- and y-coordinates
	local xDelta = (availableIndex - guessedIndex) * (_G["availableLetterWidth"] + _G["availableLetterPadding"])
	local yDelta = 57
	
	-- Move the available letter group to the correct location
	transition.to(letterGroup, { time = 250, delta = true, x = xDelta, y = yDelta })
end


-- Moves the inputted letter group one position to the left
local function shiftLetterGroupLeft(letterGroup, availableIndex, guessedIndex)
	-- Determine the necessary changes in the x- and y-coordinates
	local xDelta = -(_G["availableLetterWidth"] + _G["availableLetterPadding"])
	local yDelta = 0
	
	-- Move the available letter group to the correct location
	transition.to(letterGroup, { time = 250, delta = true, x = xDelta, y = yDelta })
end


-- Moves the inputted letter group from its old to new available position
local function shuffleLetterGroup(letterGroup, oldAvailableIndex, newAvailableIndex)
	-- Determine the necessary changes in the x- and y-coordinates
	local xDelta = (newAvailableIndex - oldAvailableIndex) * (_G["availableLetterWidth"] + _G["availableLetterPadding"])
	local yDelta = 0
	
	-- Move the available letter group to the correct location
	transition.to(letterGroup, { time = 250, delta = true, x = xDelta, y = yDelta })
end


-- Declare the available and guess letter listeners
local availableLetterListener, guessedLetterListener = nil, nil


-- Adds the available letter listener to the inputted target
local function addAvailableLetterListener(target)
	target:addEventListener("touch", availableLetterListener)
end


-- Adds the guessed letter listener to the inputted target
local function addGuessedLetterListener(target)
	target:addEventListener("touch", guessedLetterListener)
end


-- Listener for when an available letter is clicked
function availableLetterListener(event)
	if (event.phase == "began") then
		-- Get the clicked available letter group
		local availableLetterGroup = event.target
		
		-- Get the available letter group's available and guessed indices
		local availableIndex = tonumber(availableLetterGroup[3].text)
		local guessedIndex = #_G["guessedLetters"] + 1
		
		-- Move the available letter group to the correct location
		guessLetterGroup(availableLetterGroup, availableIndex, guessedIndex)
		
		-- Insert the available letter group into the guessed letters list
		table.insert(_G["guessedLetters"], availableLetterGroup)
		
		-- Remove the available letter group from the available letters list
		local index = table.indexOf(_G["availableLetters"], availableLetterGroup)
		table.remove(_G["availableLetters"], index)
		
		-- Update the appropriate event listeners
		availableLetterGroup:removeEventListener("touch", availableLetterListener)
		timer.performWithDelay(1, function() return addGuessedLetterListener(availableLetterGroup) end)
	end
	return true 
end


-- Listener for when a guessed letter is clicked
function guessedLetterListener(event)
	if (event.phase == "began") then
		-- Get the clicked letter group
		local letterGroup = event.target
		
		-- Get the letter group's available and guessed indices
		local availableIndex = tonumber(letterGroup[3].text)
		local guessedIndex = table.indexOf(_G["guessedLetters"], letterGroup)
	
		-- Move the letter group to the correct location
		clearLetterGroup(letterGroup, availableIndex, guessedIndex)
			
		if (guessedIndex ~= #_G["guessedLetters"]) then
			for i = guessedIndex + 1, #_G["guessedLetters"] do
				shiftLetterGroupLeft(_G["guessedLetters"][i])
			end
		end
			
		-- Insert the letter group into the available letters list
		table.insert(_G["availableLetters"], letterGroup)
		
		-- Remove the letter group from the guessed letters list
		table.remove(_G["guessedLetters"], guessedIndex)
			
		-- Update the appropriate event listeners
		letterGroup:removeEventListener("touch", guessedLetterListener)
		timer.performWithDelay(1, function() return addAvailableLetterListener(letterGroup) end)
	end
	return true 
end

local function networkListener( event )
        if ( event.isError ) then
                print( "Network error!")
        else
                print ( "RESPONSE: " .. event.response )
        end
	end
-- Submits the users score
local function submitScore(score)
	if (_G["gameMode"] == "classic") then
		local x = 1
	
	-- If the current round is part of a multiplayer game, submit the user's score
	elseif (_G["gameMode"] == "multiplayer") then
		local params = {}
		
		local first = true
		local foundWords = ""
		for i = 1, #_G["wordList"] do
			if (_G["wordList"][i][2] == true) then
				if (first == true) then
					first = false
				else
					foundWords = foundWords .. ","
				end
				foundWords = foundWords .. tostring(i)
			end
		end
		params.body = "foundWords="..foundWords
		network.request("http://127.0.0.1:8000/submitScore/"..tostring(_G["gameId"]).."/"..tostring(_G["score"]).."/", "POST", networkListener, params)
	end
end


-- Updates the timer and controls end of game situations
local function updateTimer(event)
	-- Get the current number of minutes and seconds
	local minutes, seconds = nil, nil
	for text in string.gmatch(clock.text, "[^:]+") do
		if (minutes == nil) then
			minutes = tonumber(text)
		else
			seconds = tonumber(text)
		end
	end
	
	-- Get the new number of minutes and seconds
	if ((minutes == 0) and (seconds == 0)) then
		timer.cancel(event.source)
	elseif ((minutes == 0) and (seconds == 1)) then
		submitScore(_G["score"])
		seconds = seconds - 1
		
		local options =
		{
			effect = "fade",
			isModal = true,
			time = 500
		}
		
		storyboard.showOverlay("roundOverPopup", options)
		
		timer.performWithDelay(3000, showRoundScoreboard)
		
	elseif (seconds == 0) then
		minutes = minutes - 1
		seconds = 59
	else
		seconds = seconds - 1
	end
	
	-- Update the clock's text
	if (seconds < 10) then
		clock.text = tostring(minutes) .. ":0" .. tostring(seconds)
	else
		clock.text = tostring(minutes) .. ":" .. tostring(seconds)
	end
end

local function updateScore(word)
	-- Grant ten points for each letter in the word
	_G["score"] = _G["score"] + (10 * #word)
	
	-- Update the score text
	score.text = _G["score"]
end

-- Helper functions
function convHex(hex)
	local r = hex:sub(1, 2)
	local g = hex:sub(3, 4)
	local b = hex:sub(5, 6)
	return tonumber(r, 16), tonumber(g, 16), tonumber(b, 16)
end

-------------------------------------------------

-- Returns the current round's word
function getCurrentRoundWord(fullWordList, numLetters)
	word = ""
	while (#word ~= numLetters) do
		local index = math.random(1, #fullWordList)
		word = fullWordList[index]
	end
	return word
end

-------------------------------------------------

-- Returns a table of all the words that can be made from letters in the current round's word
function getCurrentRoundWordSubset(currentRoundWord, fullWordList)
	local currentRoundWordSubset = {}
	
	for i = 1, #fullWordList do
		local word = fullWordList[i]
    	if isWordSubset(currentRoundWord, word) then
    		table.insert(currentRoundWordSubset, word)
    	end
	end

	return currentRoundWordSubset
end

-------------------------------------------------

-- Shuffles the order of the letters
function shuffleLetters()
	-- Get a new sequence for the letters
	local sequence = {}

	for i = 1, _G["numLetters"] do
		local index = math.random(1, 6)
		while (table.indexOf(sequence, index) ~= nil) do
			index = math.random(1, 6)
		end
		table.insert(sequence, index)
	end
	
	-- Update the index of and move the available letter groups
	for i = 1, #_G["availableLetters"] do
		-- Get the current letter group
		local letterGroup = _G["availableLetters"][i]
		
		-- Get the letter group's old and new available indices
		local oldAvailableIndex = tonumber(letterGroup[3].text)
		local newAvailableIndex = sequence[i]
		
		-- Move the letter group to the correct location
		shuffleLetterGroup(letterGroup, oldAvailableIndex, newAvailableIndex)
		
		-- Update the text specifying the letter group's available index
		letterGroup[3].text = tostring(newAvailableIndex)
	end
	
	-- Update the index of the guessed letter groups
	for i = 1, #_G["guessedLetters"] do
		-- Get the current letter group
		local letterGroup = _G["guessedLetters"][i]
		
		-- Get the letter group's new available index
		local newAvailableIndex = sequence[#_G["availableLetters"] + i]
		
		-- Update the text specifying the letter group's available index
		letterGroup[3].text = tostring(newAvailableIndex)
	end
end

-------------------------------------------------

-- Clears the currently guessed letters
function clearGuess()
	-- Clear each available letter group which is currently guessed
	while (#_G["guessedLetters"] ~= 0) do
		-- Get the current letter group
		local letterGroup = table.remove(_G["guessedLetters"])
		
		-- Get the letter group's available and guessed indices
		local availableIndex = tonumber(letterGroup[3].text)
		local guessedIndex = #_G["guessedLetters"] + 1
		
		-- Move the letter group to the correct location
		clearLetterGroup(letterGroup, availableIndex, guessedIndex)
		
		-- Add the current letter group to the available letters list
		table.insert(_G["availableLetters"], letterGroup)

		-- Update the appropriate event listeners		
		letterGroup:removeEventListener("touch", guessedLetterListener)
		timer.performWithDelay(1, function() return addAvailableLetterListener(letterGroup) end)
	end
end

-------------------------------------------------

-- Submits the currently guessed letters
function submitGuess()
	-- Get the current guess
	local guess = ""
	for i = 1, #_G["guessedLetters"] do
		local availableLetterGroup = _G["guessedLetters"][i]
		guess = guess..availableLetterGroup[2].text
	end
	
	-- Loop through the word list and unhide the word which matches the guessed word
	for i = 1, #_G["wordList"] do
		--local wordGroup = _G["wordList"][i]
		--local letterGroups = wordGroup[1]
		--local word = wordGroup[2]
		local letterGroups = _G["wordGroupList"][i]
		local word = _G["wordList"][i][1]
		local found = _G["wordList"][i][2]
		if ((guess == word) and (found == false)) then
			for j = 1, letterGroups.numChildren do
				letterGroups[j][2].isVisible = true
			end
			
			_G["wordList"][i][2] = true
			
			updateScore(word)
		end
	end
	
	-- Clear the currently guessed letters
	clearGuess()
end

-- Draws the board for the current round
local function drawBoard(group, currentRoundWord, currentRoundWordSubset)
	-- Create the background image
	local background = display.newImageRect(group, "resources/images/landscapeBackground.jpg", display.contentWidth, display.contentHeight)
	background:setReferencePoint( display.TopLeftReferencePoint )
	background.x, background.y = 0, 0

	--[[ TIMER ]]--
	clock = display.newText(group, _G["gameTime"], 10, 10, "Helvetica", _G["letterTextSize"])
	clock:setTextColor(0, 0, 0)
	clock:setReferencePoint(display.CenterReferencePoint)
	
	--[[ SCORE ]]--
	score = display.newText(group, "0", 100, 10, "Helvetica", _G["letterTextSize"])
	score:setTextColor(0, 0, 0)
	score:setReferencePoint(display.CenterReferencePoint)
	
	--[[ WORD LIST ]]--
	-- Set the initial x and y coordinates
	local xCoord, yCoord, maxWordListYCoord = _G["viewPadding"], _G["viewPadding"] +20, 269
	
	-- Create a word container for each word in the current word subset
	for i = 1, #currentRoundWordSubset do
		-- Create a group for the current word
		local wordGroup = display.newGroup()
		wordGroup:setReferencePoint(display.TopLeftReferencePoint)
	
		-- Get the current word
		local word = currentRoundWordSubset[i]
		
		-- Get the current x coordinate before it is update for the current word so that it can be restored
		local currentXCoord = xCoord

		-- Loop through each letter in the current word and create a rectangle for it		
		for j = 1, #word do
			local letterGroup = display.newGroup()
			-- Get the current letter
			local letter = string.sub(word, j, j)
		
			-- Create the triangle to hold the current letter
			local letterRectangle = display.newRect(letterGroup, xCoord, yCoord, _G["letterWidth"], _G["letterHeight"])
			letterRectangle:setFillColor(convHex("EDA261"))
			letterRectangle.strokeWidth = 1
			letterRectangle:setStrokeColor(convHex("000000"))
			letterRectangle:setReferencePoint(display.CenterReferencePoint)
			
			-- Create the current letter's text
			local letterText = display.newText(letterGroup, letter, xCoord, yCoord, "Helvetica", _G["letterTextSize"])
			letterText:setTextColor(0, 0, 0)
			letterText:setReferencePoint(display.CenterReferencePoint)
			letterText.x = letterRectangle.x
			letterText.y = letterRectangle.y
			letterText.isVisible = false
			
			-- Insert the current letter group into the current word group
			wordGroup:insert(letterGroup)
			
			-- Update the xCoordinate
			xCoord = xCoord + _G["letterWidth"]
		end
		
		-- Insert the word group into the view's main group
		group:insert(wordGroup)
		
		-- Insert the current word group into the word list
		--table.insert(_G["wordList"], { wordGroup, word })
		table.insert(_G["wordGroupList"], wordGroup)
		table.insert(_G["wordList"], { word, false })
		
		-- Update the x and y coordinate for the next word (depending on if there should be a new column or not)
		if (i % _G["wordsPerColumn"] == 0) then
			xCoord = xCoord + _G["wordListColumnPadding"]
			maxWordListYCoord = yCoord + (_G["letterHeight"] / 2)
			yCoord = _G["viewPadding"] + 20
		else
			xCoord = currentXCoord
			yCoord = yCoord + _G["letterHeight"] + 7
		end
	end

	--[[ GUESS ]]--
	-- Update the x and y coordinates
	xCoord = _G["viewPadding"]
	yCoord = _G["viewPadding"] + maxWordListYCoord + _G["viewPadding"]
	
	-- Create the guess rectangle
	local guess = display.newRect(group, xCoord, yCoord, _G["guessWidth"], _G["guessHeight"])
	guess:setReferencePoint(display.TopLeftReferencePoint)
	guess:setFillColor(convHex("55A2FF"))
	guess.strokeWidth = 1
	guess:setStrokeColor(convHex("000000"))


	--[[ AVAILABLE LETTERS ]]--
	-- Set the initial x and y coordinates
	xCoord = _G["viewPadding"] + _G["availableLetterRadius"]
	yCoord = guess.y + guess.height + _G["availableLetterRadius"] + _G["viewPadding"]
	
	-- For each letter in the current round's word, create an available letter group
	for i = 1, #currentRoundWord do
		-- Create a group to hold the available letter's elements
		local availableLetterGroup = display.newGroup()

		-- Get the current letter
		letter = string.sub(currentRoundWord, i, i)

		-- Create the available letter circle
		local availableLetterCircle = display.newCircle(availableLetterGroup, xCoord, yCoord, _G["availableLetterRadius"])
		availableLetterCircle:setFillColor(convHex("FFA233"))
		availableLetterCircle.strokeWidth = 1
		availableLetterCircle:setStrokeColor(convHex("000000"))
		availableLetterCircle:setReferencePoint(display.CenterReferencePoint)

		-- Create the available letter text
		local availableLetterText = display.newText(availableLetterGroup, letter, xCoord - 5, yCoord - 10, "Helvetica", 16 )
		availableLetterText:setTextColor(0, 0, 0)
		availableLetterText:setReferencePoint(display.CenterReferencePoint)
		availableLetterText.x = availableLetterCircle.x
		availableLetterText.y = availableLetterCircle.y

		-- Add a touch listener to the available letter
		availableLetterGroup:addEventListener("touch", availableLetterListener)

		local position = display.newText(availableLetterGroup, i, 0, 0, "Helvetica", 16)
		position.isVisible = false
		availableLetterGroup:insert(position)

		-- Insert the word group into the view's main group
		group:insert(availableLetterGroup)

		-- Insert the available letter group into the available letters list
		table.insert(_G["availableLetters"], availableLetterGroup)

		-- Update the x coordinate
		xCoord = xCoord + (2 * _G["availableLetterRadius"]) + _G["availableLetterPadding"]
	end

	-- Shuffle the available letters
	shuffleLetters()

	--[[ BUTTONS ]]--
	-- Update the y coordinate
	yCoord = yCoord + _G["availableLetterRadius"] + _G["viewPadding"]
	
	local shuffleButton = widget.newButton {
		id = "shuffleButton",
		label = "Shuffle",
		labelColor = {
			default = {255},
			over={128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 90,
		height = 40,
		onRelease = shuffleLetters
	}
	shuffleButton:setReferencePoint(display.TopLeftReferencePoint)
	shuffleButton.x = 10
	shuffleButton.y = yCoord
	
	local submitButton = widget.newButton {
		id = "submitButton",
		label = "Submit",
		labelColor = {
			default = {255},
			over={128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 90,
		height = 40,
		onRelease = submitGuess
	}
	submitButton:setReferencePoint(display.TopCenterReferencePoint)
	submitButton.x = display.contentWidth / 2
	submitButton.y = yCoord
	
	local clearButton = widget.newButton {
		id = "clearButton",
		label = "Clear",
		labelColor = {
			default = {255},
			over={128}
		},
		default = "resources/images/button.png",
		over = "resources/images/button-over.png",
		width = 90,
		height = 40,
		onRelease = clearGuess
	}
	clearButton:setReferencePoint(display.TopRightReferencePoint)
	clearButton.x = display.contentWidth - 10
	clearButton.y = yCoord

	-- Insert the buttons into the main view's group
	group:insert(shuffleButton)
	group:insert(submitButton)
	group:insert(clearButton)
end


-----------------------------------------------------------------------------------------
-- BEGINNING OF YOUR IMPLEMENTATION
-- 
-- NOTE: Code outside of listener functions (below) will only be executed once,
--		 unless storyboard.removeScene() is called.
-- 
-----------------------------------------------------------------------------------------

-- Called when the scene's view does not exist:
function scene:createScene(event)
	-- Get the view's main group
	local group = self.view

	-- Set any necessary global variables
	_G["numLetters"] = event.params.numLetters
	_G["gameMode"] = event.params.gameMode
	if (_G["gameMode"] == "multiplayer") then
		_G["gameId"] = event.params.gameId
		_G["roundId"] = event.params.roundId
	end

	-- Create a new round and draw its board
	local fullWordList = getFullWordList()
	local currentRoundWord = getCurrentRoundWord(fullWordList, event.params.numLetters)
	local currentRoundWordSubset = getCurrentRoundWordSubset(currentRoundWord, fullWordList)

	drawBoard(group, currentRoundWord, currentRoundWordSubset)
end

-- Called immediately after scene has moved onscreen:
function scene:enterScene(event)
	local group = self.view	
	
	timer.performWithDelay(1000, updateTimer, 0)
end

-- Called when scene is about to move offscreen:
function scene:exitScene(event)
	local group = self.view
end

-- If scene's view is removed, scene:destroyScene() will be called just prior to:
function scene:destroyScene(event)
	local group = self.view
end

-----------------------------------------------------------------------------------------
-- END OF YOUR IMPLEMENTATION
-----------------------------------------------------------------------------------------

-- "createScene" event is dispatched if scene's view does not exist
scene:addEventListener( "createScene", scene )

-- "enterScene" event is dispatched whenever scene transition has finished
scene:addEventListener( "enterScene", scene )

-- "exitScene" event is dispatched whenever before next scene's transition begins
scene:addEventListener( "exitScene", scene )

-- "destroyScene" event is dispatched before view is unloaded, which can be
-- automatically unloaded in low memory situations, or explicitly via a call to
-- storyboard.purgeScene() or storyboard.removeScene().
scene:addEventListener( "destroyScene", scene )

-----------------------------------------------------------------------------------------

return scene