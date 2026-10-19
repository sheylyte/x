/* =========================================
   LARCK PRIVATE CHAT
========================================= */


/* =========================================
   SUPABASE CONNECTION
========================================= */

const SUPABASE_URL =
    "https://hxtwdzvnqtxoutdetfoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hEot0ds6XIcLYo7Fj8xtUQ_0ICFxMBV";

const larckSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================
   ELEMENTS
========================================= */

const chatBackButton =
    document.getElementById("chatBackButton");

const chatProfilePicture =
    document.getElementById("chatProfilePicture");

const chatUsername =
    document.getElementById("chatUsername");

const chatStatus =
    document.getElementById("chatStatus");

const chatOnlineDot =
    document.getElementById("chatOnlineDot");

const chatMessages =
    document.getElementById("chatMessages");

const chatLoading =
    document.getElementById("chatLoading");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const cameraButton =
    document.getElementById("cameraButton");

const microphoneButton =
    document.getElementById("microphoneButton");

const giftButton =
    document.getElementById("giftButton");

const videoButton =
    document.getElementById("videoButton");

const moreButton =
    document.getElementById("moreButton");


/* =========================================
   CHAT VARIABLES
========================================= */

let currentUser = null;
let targetProfile = null;

let realtimeChannel = null;


/* =========================================
   DEFAULT PROFILE IMAGE
========================================= */

const DEFAULT_PROFILE_IMAGE =
    "images/default-avatar.png";


/* =========================================
   GET TARGET LARCK ID
========================================= */

function getTargetLarckId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


/* =========================================
   START CHAT
========================================= */

async function startChat() {

    try {

        /* -------------------------------------
           GET CURRENT USER
        ------------------------------------- */

        const {
            data: userData,
            error: userError
        } =
            await larckSupabase.auth.getUser();


        if (userError || !userData.user) {

            console.error(
                "Could not get current user:",
                userError
            );

            showChatError(
                "Please log in to use messages."
            );

            return;
        }


        currentUser =
            userData.user;


        /* -------------------------------------
           GET TARGET LARCK ID
        ------------------------------------- */

        const targetLarckId =
            getTargetLarckId();


        if (!targetLarckId) {

            showChatError(
                "No chat user was selected."
            );

            return;
        }


        /* -------------------------------------
           LOAD TARGET PROFILE
        ------------------------------------- */

        const {
            data: profile,
            error: profileError
        } =
            await larckSupabase
                .from("profiles")
                .select(
                    "id, username, larck_id, profile_picture"
                )
                .eq(
                    "larck_id",
                    targetLarckId
                )
                .single();


        if (profileError || !profile) {

            console.error(
                "Could not load chat profile:",
                profileError
            );

            showChatError(
                "Could not find this user."
            );

            return;
        }


        targetProfile =
            profile;


        /* -------------------------------------
           PREVENT SELF CHAT
        ------------------------------------- */

        if (
            targetProfile.id ===
            currentUser.id
        ) {

            showChatError(
                "You cannot message yourself."
            );

            return;
        }


        /* -------------------------------------
           DISPLAY HEADER
        ------------------------------------- */

        displayChatProfile();


        const isBlocked = await checkBlockedUser();
if (isBlocked) {
    await loadMessages();
    return;
}


        /* -------------------------------------
           LOAD MESSAGES
        ------------------------------------- */

        await loadMessages();


        /* -------------------------------------
           MARK RECEIVED MESSAGES AS READ
        ------------------------------------- */

        await markMessagesAsRead();


        /* -------------------------------------
           START REALTIME
        ------------------------------------- */

        subscribeToMessages();


    } catch (error) {

        console.error(
            "Chat startup error:",
            error
        );

        showChatError(
            "Something went wrong."
        );
    }
}


/* =========================================
   DISPLAY CHAT PROFILE
========================================= */

function displayChatProfile() {

    if (!targetProfile) {
        return;
    }


    if (chatUsername) {

        chatUsername.textContent =
            targetProfile.username ||
            "Username";
    }


    if (chatProfilePicture) {

        chatProfilePicture.src =
            targetProfile.profile_picture ||
            DEFAULT_PROFILE_IMAGE;
    }


    /*
       We are not building the complete
       online-presence system yet.

       So for now the chat shows Offline.
    */

    if (chatStatus) {

        chatStatus.textContent =
            "Offline";
    }

    if (chatOnlineDot) {

        chatOnlineDot.classList.remove(
            "show"
        );
    }
}


/* =========================================
   LOAD MESSAGES
========================================= */

async function loadMessages() {

    if (!currentUser || !targetProfile) {
        return;
    }


    if (chatLoading) {

        chatLoading.style.display =
            "block";
    }


    const {
        data: messages,
        error
    } =
        await larckSupabase
            .from("private_messages")
            .select(
                "id, sender_id, receiver_id, content, is_read, created_at"
            )
            .or(
                `and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetProfile.id}),and(sender_id.eq.${targetProfile.id},receiver_id.eq.${currentUser.id})`
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Could not load messages:",
            error
        );

        showChatError(
            "Could not load messages."
        );

        return;
    }


    if (chatLoading) {

        chatLoading.style.display =
            "none";
    }


    chatMessages.innerHTML = "";


    if (!messages || messages.length === 0) {

        showEmptyChat();

        return;
    }


    messages.forEach(message => {

        renderMessage(message);

    });


    scrollToBottom();
}


/* =========================================
   RENDER MESSAGE
========================================= */

function renderMessage(message) {

    if (!chatMessages) {
        return;
    }


    const row =
        document.createElement("div");


    const isSent =
        message.sender_id ===
        currentUser.id;


    row.className =
        "message-row " +
        (isSent ? "sent" : "received");

        row.dataset.messageId = message.id;


    const bubble =
        document.createElement("div");


    bubble.className =
        "message-bubble";


    const messageText =
        document.createElement("div");


    messageText.textContent =
        message.content;


    const messageTime =
        document.createElement("span");


    messageTime.className =
        "message-time";


    messageTime.textContent =
        formatMessageTime(
            message.created_at
        );


    bubble.appendChild(
        messageText
    );

    bubble.appendChild(
        messageTime
    );

    row.appendChild(
        bubble
    );


    chatMessages.appendChild(
        row
    );
}


/* =========================================
   FORMAT MESSAGE TIME
========================================= */

function formatMessageTime(
    createdAt
) {

    if (!createdAt) {
        return "";
    }


    const date =
        new Date(createdAt);


    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================
   EMPTY CHAT
========================================= */

function showEmptyChat() {

    if (!chatMessages) {
        return;
    }


    chatMessages.innerHTML = `

        <div class="chat-empty">

            <div class="chat-empty-icon">
                💬
            </div>

            <h2>
                Start a conversation
            </h2>

            <p>
                Say something nice.
            </p>

        </div>

    `;
}


/* =========================================
   CHAT ERROR
========================================= */

function showChatError(message) {

    if (!chatMessages) {
        return;
    }


    chatMessages.innerHTML = `

        <div class="chat-empty">

            <div class="chat-empty-icon">
                !
            </div>

            <h2>
                ${escapeHTML(message)}
            </h2>

            <p>
                Please go back and try again.
            </p>

        </div>

    `;
}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    if (
        !currentUser ||
        !targetProfile
    ) {
        return;
    }


    const content =
        messageInput.value.trim();


    if (!content) {
        return;
    }


    sendButton.disabled =
        true;


    const {
        data: newMessage,
        error
    } =
        await larckSupabase
            .from("private_messages")
            .insert({
                sender_id:
                    currentUser.id,

                receiver_id:
                    targetProfile.id,

                content:
                    content
            })
            .select(
                "id, sender_id, receiver_id, content, is_read, created_at"
            )
            .single();


    if (error) {

        console.error(
            "Could not send message:",
            error
        );

        sendButton.disabled =
            false;

        return;
    }


    messageInput.value =
        "";


    /*
       The Realtime listener normally
       receives the new message.

       We only render immediately if
       Realtime does not send it back.
    */

    if (
        newMessage &&
        !document.querySelector(
            `[data-message-id="${newMessage.id}"]`
        )
    ) {

        renderMessage(
            newMessage
        );

        scrollToBottom();
    }


    sendButton.disabled =
        false;


    messageInput.focus();
}


/* =========================================
   REALTIME MESSAGES
========================================= */

function subscribeToMessages() {

    if (
        !currentUser ||
        !targetProfile
    ) {
        return;
    }


    if (realtimeChannel) {

        larckSupabase.removeChannel(
            realtimeChannel
        );
    }


    realtimeChannel =
        larckSupabase
            .channel(
                "private-chat-" +
                currentUser.id +
                "-" +
                targetProfile.id
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "private_messages"
                },
                payload => {

                    const message =
                        payload.new;


                    const belongsToChat =
                        (
                            message.sender_id ===
                            currentUser.id &&
                            message.receiver_id ===
                            targetProfile.id
                        )
                        ||
                        (
                            message.sender_id ===
                            targetProfile.id &&
                            message.receiver_id ===
                            currentUser.id
                        );


                    if (!belongsToChat) {
                        return;
                    }


                    /*
                       Avoid displaying a message twice.
                    */

                    const existing =
                        document.querySelector(
                            `[data-message-id="${message.id}"]`
                        );


                    if (existing) {
                        return;
                    }


                    removeEmptyChat();


                    renderMessage(
                        message
                    );


                    scrollToBottom();


                    /*
                       If the other person sends
                       a message while this chat is
                       open, mark it as read.
                    */

                    if (
                        message.sender_id ===
                        targetProfile.id
                    ) {

                        markMessagesAsRead();
                    }
                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Chat realtime status:",
                        status
                    );
                }
            );
}


/* =========================================
   MARK MESSAGES AS READ
========================================= */

async function markMessagesAsRead() {

    if (
        !currentUser ||
        !targetProfile
    ) {
        return;
    }


    const {
        error
    } =
        await larckSupabase
            .from("private_messages")
            .update({
                is_read: true
            })
            .eq(
                "sender_id",
                targetProfile.id
            )
            .eq(
                "receiver_id",
                currentUser.id
            )
            .eq(
                "is_read",
                false
            );


    if (error) {

        console.error(
            "Could not mark messages as read:",
            error
        );
    }
}


/* =========================================
   REMOVE EMPTY STATE
========================================= */

function removeEmptyChat() {

    const empty =
        document.querySelector(
            ".chat-empty"
        );


    if (empty) {
        empty.remove();
    }
}


/* =========================================
   SCROLL TO BOTTOM
========================================= */

function scrollToBottom() {

    if (!chatMessages) {
        return;
    }


    requestAnimationFrame(() => {

        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    });
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


/* =========================================
   ENTER TO SEND
========================================= */

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


/* =========================================
   SEND BUTTON
========================================= */

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


/* =========================================
   BACK BUTTON
========================================= */

if (chatBackButton) {

    chatBackButton.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );
}


/* =========================================
   CAMERA BUTTON
========================================= */

if (cameraButton) {

    cameraButton.addEventListener(
        "click",
        () => {

            alert(
                "Camera messaging will be added later."
            );

        }
    );
}


/* =========================================
   MICROPHONE BUTTON
========================================= */

if (microphoneButton) {

    microphoneButton.addEventListener(
        "click",
        () => {

            alert(
                "Voice messaging will be added later."
            );

        }
    );
}


/* =========================================
   GIFT BUTTON
========================================= */

if (giftButton) {

    giftButton.addEventListener(
        "click",
        () => {

            alert(
                "Gifts will be added later."
            );

        }
    );
}


/* =========================================
   VIDEO BUTTON
========================================= */

if (videoButton) {

    videoButton.addEventListener(
        "click",
        () => {

            alert(
                "Video calling will be added later."
            );

        }
    );
}



/* =========================================
   CLEANUP REALTIME
========================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (realtimeChannel) {

            larckSupabase.removeChannel(
                realtimeChannel
            );
        }
    }
);



/* =========================================
   REPORT AND BLOCK USER
========================================= */

const chatOptionsMenu =
    document.getElementById("chatOptionsMenu");

const reportDialog =
    document.getElementById("reportDialog");

const reportForm =
    document.getElementById("reportForm");

const reportCategory =
    document.getElementById("reportCategory");

const reportDescription =
    document.getElementById("reportDescription");

const submitReportButton =
    document.getElementById("submitReportButton");

function toggleChatOptions() {
    if (!chatOptionsMenu) return;

    chatOptionsMenu.hidden = !chatOptionsMenu.hidden;
}

if (moreButton) {
    moreButton.addEventListener("click", toggleChatOptions);
}

document.addEventListener("click", event => {
    if (
        chatOptionsMenu &&
        !chatOptionsMenu.hidden &&
        !chatOptionsMenu.contains(event.target) &&
        event.target !== moreButton
    ) {
        chatOptionsMenu.hidden = true;
    }
});

function closeReportDialog() {
    if (reportDialog) reportDialog.hidden = true;
}

document.getElementById("cancelReportButton")
    ?.addEventListener("click", closeReportDialog);

if (chatOptionsMenu) {
    chatOptionsMenu.addEventListener("click", async event => {
        const button = event.target.closest("[data-chat-action]");
        if (!button) return;

        chatOptionsMenu.hidden = true;

        if (!currentUser || !targetProfile) {
            alert("Chat user information is not ready yet.");
            return;
        }

        if (button.dataset.chatAction === "report") {
            reportForm?.reset();
            reportDialog.hidden = false;
        }

        if (button.dataset.chatAction === "block") {
            const confirmed = confirm(
                `Block ${targetProfile.username || "this user"}? You won't be able to send them messages from this chat.`
            );

            if (!confirmed) return;

            const { error } = await larckSupabase
                .from("blocked_users")
                .insert({
                    blocker_id: currentUser.id,
                    blocked_user_id: targetProfile.id
                });

            if (error) {
                if (error.code === "23505") {
                    alert("You have already blocked this user.");
                } else {
                    console.error("Block failed:", error);
                    alert("Could not block this user. Please try again.");
                }
                return;
            }

            alert("User blocked.");
            disableChatComposer();
        }
    });
}

if (reportForm) {
    reportForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentUser || !targetProfile) {
            alert("Chat user information is not ready yet.");
            return;
        }

        const category = reportCategory.value;
        const description = reportDescription.value.trim();

        if (!category || !description) {
            alert("Please select a reason and describe the problem.");
            return;
        }

        submitReportButton.disabled = true;

        const { error } = await larckSupabase
            .from("user_reports")
            .insert({
                reporter_id: currentUser.id,
                reported_user_id: targetProfile.id,
                category,
                description
            });

        submitReportButton.disabled = false;

        if (error) {
            console.error("Report submission failed:", error);
            alert("Could not submit your report. Please try again.");
            return;
        }

        closeReportDialog();
        reportForm.reset();
        alert("Thank you. Your report has been submitted.");
    });
}

function disableChatComposer() {
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = "You blocked this user";
    }

    if (sendButton) sendButton.disabled = true;
    if (cameraButton) cameraButton.disabled = true;
    if (microphoneButton) microphoneButton.disabled = true;
    if (giftButton) giftButton.disabled = true;
}

/* Check whether you previously blocked this person. */
async function checkBlockedUser() {
    if (!currentUser || !targetProfile) return false;

    const { data, error } = await larckSupabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", currentUser.id)
        .eq("blocked_user_id", targetProfile.id)
        .maybeSingle();

    if (error) {
        console.error("Could not check block status:", error);
        return false;
    }

    if (data) {
        disableChatComposer();
        return true;
    }

    return false;
}


/* =========================================
   START
========================================= */

startChat();