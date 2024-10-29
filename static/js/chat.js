$(document).ready(function() {
    const $messageForm = $('#message-form');
    const $messageInput = $('#message-input');
    const $chatMessages = $('#chat-messages');
    const $conversationList = $('#conversation-list');
    const $conversationTitle = $('#conversation-title');
    const $newConversationBtn = $('#new-conversation-btn');
    const $contextMenu = $('#context-menu');
    let currentConversationId = null;
    let contextMenuTarget = null;

    // Configure marked for safe HTML
    marked.setOptions({
        highlight: function(code, lang) {
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        sanitize: false
    });

    // Initialize IndexedDB
    let db;
    const request = indexedDB.open('chatDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('title', 'title', { unique: false });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadConversations();
    };

    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.errorCode);
    };

    $newConversationBtn.on('click', () => {
        const title = prompt("Enter a title for the new conversation:");
        if (title) {
            saveConversation([], title);
        }
    });

    function saveConversation(messages, title = `Conversation ${Date.now()}`) {
        const transaction = db.transaction(['conversations'], 'readwrite');
        const objectStore = transaction.objectStore('conversations');
        const request = objectStore.add({ messages, title, timestamp: new Date() });

        request.onsuccess = function() {
            loadConversations();
        };
    }

    function loadConversations() {
        const transaction = db.transaction(['conversations'], 'readonly');
        const objectStore = transaction.objectStore('conversations');
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            const conversations = event.target.result;
            $conversationList.empty();
            conversations.forEach(conversation => {
                const $div = createConversationElement(conversation);
                $conversationList.append($div);
            });
        };
    }

    function loadConversation(id) {
        const transaction = db.transaction(['conversations'], 'readonly');
        const objectStore = transaction.objectStore('conversations');
        const request = objectStore.get(id);

        request.onsuccess = function(event) {
            const conversation = event.target.result;
            currentConversationId = id;
            $conversationTitle.text(conversation.title);
            $chatMessages.empty();
            conversation.messages.forEach(msg => addMessage(msg.text, msg.sender));
        };
    }

    function renameConversation(id, newTitle) {
        const transaction = db.transaction(['conversations'], 'readwrite');
        const objectStore = transaction.objectStore('conversations');
        const request = objectStore.get(id);

        request.onsuccess = function(event) {
            const conversation = event.target.result;
            conversation.title = newTitle;
            const updateRequest = objectStore.put(conversation);

            updateRequest.onsuccess = function() {
                loadConversations();
                if (currentConversationId === id) {
                    $conversationTitle.text(newTitle);
                }
            };
        };
    }

    $messageForm.on('submit', async (e) => {
        e.preventDefault();

        const message = $messageInput.val().trim();
        if (!message) return;

        // Create new conversation if none is selected
        if (currentConversationId === null) {
            const title = `Conversation ${new Date().toLocaleString()}`;
            const transaction = db.transaction(['conversations'], 'readwrite');
            const objectStore = transaction.objectStore('conversations');
            const request = objectStore.add({ 
                messages: [], 
                title, 
                timestamp: new Date() 
            });

            request.onsuccess = function(event) {
                currentConversationId = event.target.result;
                $conversationTitle.text(title);
                loadConversations();
            };
        }

        addMessage(message, 'user');
        $messageInput.val('');

        const formData = new FormData();
        formData.append('message', message);

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.response) {
                addMessage(data.response, 'ai');
                updateConversation(currentConversationId, 
                    { text: message, sender: 'user' }, 
                    { text: data.response, sender: 'ai' }
                );
            } else {
                addMessage('Unable to process the request.', 'ai');
            }
        } catch (error) {
            addMessage('Connection error. Please try again.', 'ai');
        }
    });

    function updateConversation(id, ...newMessages) {
        const transaction = db.transaction(['conversations'], 'readwrite');
        const objectStore = transaction.objectStore('conversations');
        const request = objectStore.get(id);

        request.onsuccess = function(event) {
            const conversation = event.target.result;
            conversation.messages.push(...newMessages);
            objectStore.put(conversation);
        };
    }

    function addMessage(message, sender) {
        const $messageDiv = $('<div>').addClass('message').addClass(`${sender}-message`);
        
        if (sender === 'ai') {
            $messageDiv.html(marked(message));
            $messageDiv.find('pre code').each((i, block) => {
                hljs.highlightBlock(block);
            });
        } else {
            $messageDiv.text(message);
        }
        
        $chatMessages.append($messageDiv);
        $chatMessages.scrollTop($chatMessages.prop('scrollHeight'));
    }

    // Hide context menu when clicking outside
    $(document).on('click', () => {
        $contextMenu.hide();
    });

    function createConversationElement(conversation) {
        const $div = $('<div>').addClass('conversation').html(`<i class="fas fa-comments"></i>${conversation.title}`);
        $div.on('click', () => loadConversation(conversation.id));
        
        // Add context menu event
        $div.on('contextmenu', (e) => {
            e.preventDefault();
            contextMenuTarget = conversation.id;
            $contextMenu.css({
                display: 'block',
                left: e.pageX + 'px',
                top: e.pageY + 'px'
            });
        });
        
        return $div;
    }

    // Add context menu actions
    $('#rename-conversation').on('click', (e) => {
        e.stopPropagation();
        if (contextMenuTarget) {
            const newTitle = prompt("Enter a new title for the conversation:");
            if (newTitle) {
                renameConversation(contextMenuTarget, newTitle);
            }
        }
        $contextMenu.hide();
    });

    $('#delete-conversation').on('click', (e) => {
        e.stopPropagation();
        if (contextMenuTarget) {
            if (confirm("Are you sure you want to delete this conversation?")) {
                deleteConversation(contextMenuTarget);
            }
        }
        $contextMenu.hide();
    });

    function deleteConversation(id) {
        const transaction = db.transaction(['conversations'], 'readwrite');
        const objectStore = transaction.objectStore('conversations');
        const request = objectStore.delete(id);

        request.onsuccess = function() {
            loadConversations();
            if (currentConversationId === id) {
                currentConversationId = null;
                $conversationTitle.text('');
                $chatMessages.empty();
            }
        };
    }
});
