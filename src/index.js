import './sass/index.scss';

const typingForm = document.querySelector('.typing-area__typing-form');
const chatList = document.querySelector('.chat-list');
const suggestions = document.querySelectorAll('.header__suggestion');
const toggleThemeButton = document.querySelector('#toggle-theme-button');
const deleteChatButton = document.querySelector('#delete-chat-button');

let userMessage = null;
let isResponseGenerating = false;

const API_KEY = 'your API_KEY';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
  const savedChats = localStorage.getItem('savedChats');
  const isLightMode = localStorage.getItem('themeColor') === 'light_mode';

  //Stored theme
  document.body.classList.toggle('light_mode', isLightMode);
  toggleThemeButton.innerText = isLightMode ? 'dark_mode' : 'light_mode';

  //Saved chats
  chatList.innerHTML = savedChats || '';
  document.body.classList.toggle('hide-header', savedChats);
  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom
};

loadLocalStorageData();

//Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement('div');
  div.classList.add('chat-list__message', ...classes);
  div.innerHTML = content;
  return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector('.chat-list__icon').classList.add('hide');

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv
        .querySelector('.chat-list__icon')
        .classList.remove('hide');
      localStorage.setItem('savedChats', chatList.innerHTML);
    }
    chatList.scrollTo(0, chatList.scrollHeight);
  }, 75);
};

//Fetch response from API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector('.chat-list__text');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Get the API response text and remove asterisks from it
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      '$1'
    );
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    console.log(error.message);
    if (error.message === 'API key not valid. Please pass a valid API key.') {
      textElement.innerText =
        'I swear, it works! You need to download your api key from https://aistudio.google.com and paste it into index.js file in the API_KEY variable. Error message: API key not valid. Please pass a valid API key.';
      textElement.classList.add('error');
    } else {
      textElement.innerText = error.message;
      textElement.classList.add('error');
    }
  } finally {
    incomingMessageDiv.classList.remove('chat-list__loading');
  }
};

const copyMessage = (copyIcon) => {
  const messageText =
    copyIcon.target.parentElement.querySelector('.chat-list__text').innerText;
  navigator.clipboard.writeText(messageText);
  copyIcon.target.innerText = 'check';

  setTimeout(() => (copyIcon.target.innerText = 'content_copy'), 1000);
};

//Show animation while waiting for the API response
const showLoadingAnimation = () => {
  const html = `<div class="chat-list__message-content">
            <img
              src="./images/gemini.svg"
              alt="Gemini Image"
              class="chat-list__avatar"
            />
            <p class="chat-list__text"></p>
            <div class="chat-list__loading-indicator">
              <div class="chat-list__loading-bar"></div>
              <div class="chat-list__loading-bar"></div>
              <div class="chat-list__loading-bar"></div>
            </div>
          </div>
          <span class="chat-list__icon material-symbols-rounded">
            content_copy
          </span>`;

  const incomingMessageDiv = createMessageElement(
    html,
    'chat-list__incoming',
    'chat-list__loading'
  );
  chatList.appendChild(incomingMessageDiv);

  generateAPIResponse(incomingMessageDiv);

  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom

  chatList.querySelectorAll('.chat-list__icon').forEach((icon) => {
    icon.addEventListener('click', copyMessage);
  });
};

const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector('.typing-area__typing-input').value.trim() ||
    userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const html = `<div class="chat-list__message-content">
          <img
            src="./images/user.png"
            alt="User Image"
            class="chat-list__avatar"
          />
          <p class="chat-list__text"></p>
        </div>`;

  const outgoingMessageDiv = createMessageElement(html, 'chat-list__outgoing');
  outgoingMessageDiv.querySelector('.chat-list__text').innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //Clear input field
  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom
  document.body.classList.add('hide-header'); //Hide the header once chat start
  setTimeout(showLoadingAnimation, 400); //Show loading animation after delay
};

//Handle message when suggestion is clicked
suggestions.forEach((suggestion) => {
  suggestion.addEventListener('click', () => {
    userMessage = suggestion.querySelector(
      '.header__suggestion-text'
    ).innerText;
    handleOutgoingChat();
  });
});

//Toggle between light and dark themes
toggleThemeButton.addEventListener('click', () => {
  const islightMode = document.body.classList.toggle('light_mode');
  localStorage.setItem('themeColor', islightMode ? 'light_mode' : 'dark_mode');
  toggleThemeButton.innerText = islightMode ? 'dark_mode' : 'light_mode';
});

//Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener('click', () => {
  if (!document.body.classList.contains('hide-header')) return;

  if (confirm('Are you sure you want to delete all messages?')) {
    localStorage.removeItem('savedChats');
    loadLocalStorageData();
    document.body.classList.remove('hide-header');
  }
});

//Handle send button from textarea
document
  .querySelector('.typing-area__typing-input')
  .addEventListener('keydown', (e) => {
    if (e.keyCode === 13) {
      document.querySelector('#send-button').click();
    }
  });

//Prevent default form submission and handle outgoing chat
typingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
