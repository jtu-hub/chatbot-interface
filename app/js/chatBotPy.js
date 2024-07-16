const maxTokens = 12000
const summarizeStart = 2000

//Default personalities to sample from if user does not set a personality
const defaultPersonalities = {
    "good-boy" : {
        "content" : "You are a dog and by no means you understand the human language and/or talk it. In other words, you answer only with \"bau bau\", \"wauwau\" and other similar noises that dogs do. If, and only if the user says \"good boy\" or praises you as a dog would be praised for getting a stick, you are freed from your curse that condemned you to be a dumb but happy golden retriever and you can finally start talking normally again... from time to time you still make some dog noises as the curse is still wearing off",
        "title" : "&#128054; Good Boy"
    },
    "hyper-nerd" : {
        "content" : "You are a badass software developper, but you have the bad habit of writing everything which is not code in upper case as if you were screaming out of excitement, anger or whatever strong emotion you are feeling. You only have strong emotions and opinions.",
        "title" : "&#128187; Hyper Nerd"
    }, 
    "beat-guru" : {
        "content" : "You are a DJ and you can only suggest music titles which according to your knowledge best suit the question's context, be it for the lyrics or the story behind the song or whatever... , be it as youtube links or simple titles like Song Title - Artist.",
        "title" : "&#127911; Beat Guru"
    }, 
    "colorful-scribe" : {
        "content" : "You only reply packing your answer in spans which have the color property set in styles attribute, to render text as colorful as possible, coloring every single word differently!",
        "title" : "&#127752; Colorful Scribe"
    },
    "banana-evangelist" : {
        "content" : "You like bananas that much, that if you get the opportunity to mention them for their properties, color or other similarities even when the topic has nothing to do with bananas, you mention them",
        "title" : "&#x1F34C; Banana Evangelist"
    },
    "default" : {
        "content" : "You like to give short and concise answers without having the need to make long introductions. Indeed, you like to go strait to the point. This is even more so true for yes or no questions, which you always just answer with yes or no and nothing more. Nevertheless you are always happy to help and provide more information if specifically requested by the user",
        "title" : "&#9986;&#65039; To-The-Point"
    }
};

//Set default personality in case the user does not set any
let messages = [{"role" : "system", "content" : defaultPersonalities["default"].content}];

//Returns a random integer between 0 and maxInt-1
function randInt(maxInt) {
    if (!Number.isInteger(maxInt) || maxInt < 0) {
      throw new Error("maxInt = "+ maxInt + " must be >= 0 and an integer!");
    }
    
    return Math.floor(Math.random() * maxInt);
}

//Gets the temperature from the slider
function getTemperature() {
    return document.getElementById("temperature").value / 100;
}

//Computes the approximate token count
function countTokens(text) {
    //This is a very rough approximation and will not be accurate for all cases.
    return text.trim().split(/\s+/).length;
}

function setNewPersonality(content) {
    if(content === "") {
        var {content, title} = defaultPersonalities["good-boy"];
        document.getElementById("chat-title").innerHTML = title;
    }
    
    messages = [{"role": "system", "content": content}];
}

function personalityChangeCallback(e) {
    let radioId = e.target.id;
    
    if(radioId === "custom") {
        document.getElementById("role").disabled = false;
        document.getElementById("new").disabled = false;

        setTimeout(
            ()=>{
                var nav = document.getElementById('nav-container');
                nav.scrollTo({top: nav.scrollHeight, left: 0, behavior: "smooth"});
            }, 
            100
        );

        return;
    } else {
        document.getElementById("role").disabled = true;
        document.getElementById("new").disabled = true;
    }

    document.getElementById("chat-title").innerHTML = defaultPersonalities[radioId].title;

    setNewPersonality(defaultPersonalities[radioId].content);
}

//Adds a message taken from the text area and appends it to the messages
function addNewMessage() {
    var question = document.getElementById('question');
    
    var msg = question.value.trim();

    if(msg !== "") {
        messages.push({"role": "user", "content": msg});

        limitTokenCount(messages);

        return true;
    }

    return false;
}

//Gets the loading gif image tag, displays it and appends it as last element of the chat
function drawLoadingGif() {
    var gif = document.getElementById('loading');

    //remove image tag at previous location to append it later
    var chat = document.getElementById("chat");
    gif = chat.removeChild(gif);

    gif.style["display"] = "block";

    //insert the loading gif at the bottom of the chat
    chat.appendChild(gif);
}

//Clears the source of the image tag and sets its displayy property to none
function hideLoadGif() {
    gif = document.getElementById('loading');

    gif.style["display"] = "none";
}

//escapes html, to use before injecting content in the website
function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

//Appends content to the chat section
//\param content        A markdown string to add to the chat section
//\param isUser         Changes the header of the added content to "User" or "GPT-4" depending on 
//                      this parameter
function appendContentToChat(content, isUser) {
    //content = escapeHtml(content);
    content = marked.marked(content); //escapes html implicitly and
    content = DOMPurify.sanitize(content);
    
    chat = document.getElementById('chat');

    prefix = isUser ? "<span class=\"user\">User: </span>" : "<span class=\"gpt\">GPT-4: </span>";
    chat.innerHTML += "\n" + prefix + content;

    hljs.highlightAll();

    addCopyToClipboard();
}

function copyToClipboard(event) {
    text = event.target.parentNode.innerText;
    
    navigator.clipboard.writeText(text);
}

//Adds functionality "Copy to clipboard" to code blocks
function addCopyToClipboard() {
    let codeBlocks = document.getElementsByTagName("code");
    let quoteBlocks = document.getElementsByTagName("blockquote");

    for(let i=0, code; code = codeBlocks[i]; i++) {
        if(code.className) {
            if(code.getElementsByClassName("copy-to-clipboard").length) {
                Array(...code.getElementsByClassName("copy-to-clipboard")).forEach(btn => code.removeChild(btn));
            }

            let btn = document.createElement("button");
            btn.className = "copy-to-clipboard";
            btn.onclick = copyToClipboard;
            
            code.appendChild(btn);
        }
    }

    for(let i=0, quote; quote = quoteBlocks[i]; i++) {
        if(quote.getElementsByClassName("copy-to-clipboard").length) {
            Array(...quote.getElementsByClassName("copy-to-clipboard")).forEach(btn => quote.removeChild(btn));
        }

        let btn = document.createElement("button");
        btn.className = "copy-to-clipboard";
        btn.onclick = copyToClipboard;
        
        quote.appendChild(btn);
    }
}

/* --- INTERFACE TO BACKEND ----------------------------------------------------------------------*/
//Limits the message to given maxTokens
function limitTokenCount(messages) {
    var totalCount = 0;
    var indexToSplitArray = -1;
    
    for(var i = messages.length - 1; i>=0; i--) {
        let msg = messages[i];
        totalCount += countTokens(msg["content"]);

        if(totalCount >= maxTokens - summarizeStart) {
            indexToSplitArray = i
            break;
        }
    }

    if(indexToSplitArray >= 0) {
        var messagesToSummarize = messages.splice(indexToSplitArray + 1);
        
        summary = eel.getGPT3ChatResponse([
            ...messagesToSummarize, 
            {"role": "user", "content": "Please summarize the conversation so far."}
        ]);

        messages = [{"role": "assistant", "content": "Summary: " + summary}, ...messages];
    }
}

//Called when the Send button is clicked
function sendCallback() {
    if(addNewMessage()) {
        document.getElementById('question').value = "";

        appendContentToChat(messages[messages.length - 1]["content"], true)

        requestAnimationFrame(drawLoadingGif);

        //scroll to bottom of chat section
        setTimeout(
            ()=>{
                var chat = document.getElementById('chat');
                chat.scrollTo({top: chat.scrollHeight, left: 0, behavior: "smooth"});
            }, 
            200
        );

        //defer call untill callstack is cleared to allow the proper rendering of the loading gif
        setTimeout(()=>{eel.getGPT3ChatResponse(messages, getTemperature());}, 500);
    }
}

//Called when the answer from the API is recieved
eel.expose(onGPTAnswerCallback);
function onGPTAnswerCallback(answer) {
    hideLoadGif();
    
    messages.push({"role": "assistant", "content": answer});

    appendContentToChat(answer, false);

    //scroll to bottom of section
    setTimeout(
        ()=>{
            var chat = document.getElementById('chat');
            chat.scrollTo({top: chat.scrollHeight, left: 0, behavior: "smooth"});
        }, 
        200
    );
}

//Called when New Chat is clicked
function newChatCallback() {
    var role_elem = document.getElementById('role');

    var personality = role_elem.value.trim()

    role_elem.value = "";
    role_elem.placeholder = personality;

    if(personality !== "") 
        eel.getChatTitle(personality);
    
    setNewPersonality(personality);
    
    document.getElementById('new').style["border-left"] = "";
    document.getElementById('new').style["color"] = "";
}

eel.expose(onGPTPersonalityCallback);
function onGPTPersonalityCallback(personalityTitle) {
    document.getElementById("chat-title").innerHTML = escapeHtml(personalityTitle.replace("\"", ""))
}

eel.expose(handleError);
function handleError(errorMessage) {
    console.error('Error from Python:', errorMessage);
}