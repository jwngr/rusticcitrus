-----------------------------------------------------------------------------------------
--
-- generateRound.lua
--
-- Provides functions to generate a random word and its word subset for a round
--
-----------------------------------------------------------------------------------------

module(..., package.seeall)

--[[ Returns a table containing the full word list ]]--
function getFullWordList()
	local path = system.pathForFile("resources/files/wordList.txt")
	local file = io.open(path, "r")
	local contents = file:read("*a")
	
	local fullWordList = {}
	for word in string.gmatch(contents, "[^%s]+") do
		table.insert(fullWordList, word)
	end
	
	return fullWordList
end

-- Table of every word in the word list
_G["fullWordList"] = getFullWordList()

--[[ Returns a random word containing the inputted number of letters from the full word list ]]--
function getWord(numLetters)
	word = ""
	while (#word ~= numLetters) do
		local index = math.random(1, #_G["fullWordList"])
		word = _G["fullWordList"][index]
	end
	return word
end

--[[ Returns a table of all the words that can be made from the letters in the inputted word ]]--
function getWordSubset(word)
	local wordSubset = {}
	
	for i = 1, #_G["fullWordList"] do
		local currentWord = _G["fullWordList"][i]
    	if isWordSubset(word, currentWord) then
    		table.insert(wordSubset, currentWord)
    	end
	end

	return wordSubset
end

--[[ Returns true if testWord is made up of the letters in word ]]--
function isWordSubset(word, testWord)
	-- Get the available letters in the inputted word
	local availableLetters = {}
	for i = 1, #word do
		table.insert(availableLetters, string.sub(word, i, i))
	end

	-- Loop through each letter in testWord and see if it is in the available letters
	for i = 1, #testWord do
		local index = table.indexOf(availableLetters, string.sub(testWord, i, i))
		
		-- If the current letter is not in available letters, return false
		if index == nil then
			return false
		
		-- Otherwise, update the available letters table and move on to the next letter in testWord
		else
			table.remove(availableLetters, index)
		end
	end
	
	return true
end