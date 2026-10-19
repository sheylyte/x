
/* =========================================
   LARCK MESSAGE JAVASCRIPT
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
   SEARCH
========================================= */

const searchButton =
    document.getElementById("searchButton");

const searchPopup =
    document.getElementById("searchPopup");

const closeSearch =
    document.getElementById("closeSearch");

const messageSearch =
    document.getElementById("messageSearch");

const searchMessage =
    document.getElementById("searchMessage");


if (searchButton) {
    searchButton.addEventListener("click", function () {
        if (searchPopup) {
            searchPopup.classList.add("show");
        }

        setTimeout(function () {
            if (messageSearch) {
                messageSearch.focus();
            }
        }, 100);
    });
}

if (closeSearch) {
    closeSearch.addEventListener("click", function () {
        if (searchPopup) {
            searchPopup.classList.remove("show");
        }
    });
}

if (searchPopup) {
    searchPopup.addEventListener("click", function (event) {
        if (event.target === searchPopup) {
            searchPopup.classList.remove("show");
        }
    });
}

if (messageSearch) {
    messageSearch.addEventListener("input", function () {
        const value = messageSearch.value.trim();

        if (value === "") {
            searchMessage.textContent =
                "Search for a friend or conversation.";
        } else {
            searchMessage.textContent =
                "Searching LARCK messages for: " + value;
        }
    });
}


/* =========================================
   SYSTEM NOTIFICATIONS
========================================= */

const systemShortcut =
    document.getElementById("systemShortcut");

const systemPopup =
    document.getElementById("systemPopup");

const closeSystem =
    document.getElementById("closeSystem");

const systemNotificationList =
    document.getElementById("systemNotificationList");


async function openSystemScreen() {
    if (systemPopup) {
        systemPopup.classList.add("show");
    }

    await loadSystemNotifications();
}


if (systemShortcut) {
    systemShortcut.addEventListener("click", function () {
        openSystemScreen();
    });
}

if (closeSystem) {
    closeSystem.addEventListener("click", function () {
        if (systemPopup) {
            systemPopup.classList.remove("show");
        }
    });
}


/* =========================================
   SYSTEM UNREAD BADGE
========================================= */

function updateSystemUnreadBadge(count) {
    if (!systemShortcut) return;

    let badge = systemShortcut.querySelector(
        ".system-unread-badge"
    );

    if (!badge) {
        badge = document.createElement("span");
        badge.className = "system-unread-badge";

        badge.setAttribute(
            "aria-label",
            "Unread system notifications"
        );

        systemShortcut.appendChild(badge);

        if (
            getComputedStyle(systemShortcut).position === "static"
        ) {
            systemShortcut.style.position = "relative";
        }
    }

    if (count > 0) {
        badge.textContent =
            count > 99 ? "99+" : String(count);

        badge.classList.add("show");
    } else {
        badge.textContent = "";
        badge.classList.remove("show");
    }
}


/* LOAD SYSTEM UNREAD COUNT */

async function refreshSystemUnreadBadge() {
    try {
        const {
            data: userData,
            error: userError
        } = await larckSupabase.auth.getUser();

        if (userError || !userData.user) {
            updateSystemUnreadBadge(0);
            return;
        }

        const userId = userData.user.id;

        const {
            data: notifications,
            error: notificationError
        } = await larckSupabase
            .from("system_notifications")
            .select("id");

        if (notificationError) {
            throw notificationError;
        }

        const ids = (notifications || []).map(
            item => item.id
        );

        if (ids.length === 0) {
            updateSystemUnreadBadge(0);
            return;
        }

        const {
            data: readRecords,
            error: readError
        } = await larckSupabase
            .from("system_notification_reads")
            .select("notification_id")
            .eq("user_id", userId)
            .in("notification_id", ids);

        if (readError) {
            throw readError;
        }

        const readIds = new Set(
            (readRecords || []).map(
                item => item.notification_id
            )
        );

        updateSystemUnreadBadge(
            ids.filter(id => !readIds.has(id)).length
        );

    } catch (error) {
        console.error(
            "Could not update System badge:",
            error
        );
    }
}


/* =========================================
   LOAD SYSTEM NOTIFICATIONS
========================================= */

async function loadSystemNotifications() {
    if (!systemNotificationList) return;

    systemNotificationList.innerHTML =
        '<div class="system-loading">Loading notifications...</div>';

    try {
        const {
            data: userData,
            error: userError
        } = await larckSupabase.auth.getUser();

        if (userError || !userData.user) {
            systemNotificationList.innerHTML =
                '<div class="system-empty">Please sign in to view your notifications.</div>';

            updateSystemUnreadBadge(0);
            refreshCombinedUnreadBadge();
            return;
        }

        const currentUser = userData.user;

        const {
            data: notifications,
            error: notificationsError
        } = await larckSupabase
            .from("system_notifications")
            .select("id, title, content, type, created_at")
            .order("created_at", { ascending: false });

        if (notificationsError) {
            console.error(
                "Could not load System notifications:",
                notificationsError
            );

            systemNotificationList.innerHTML =
                '<div class="system-empty">Could not load notifications. Please try again.</div>';

            return;
        }

        if (!notifications || notifications.length === 0) {
            updateSystemUnreadBadge(0);
            refreshCombinedUnreadBadge();

            systemNotificationList.innerHTML =
                '<div class="system-empty">You’re all caught up!<br><br>LARCK announcements and account notices will appear here.</div>';

            return;
        }

        const notificationIds = notifications.map(
            item => item.id
        );

        const {
            data: readRecords,
            error: readError
        } = await larckSupabase
            .from("system_notification_reads")
            .select("notification_id")
            .eq("user_id", currentUser.id)
            .in("notification_id", notificationIds);

        if (readError) {
            console.error(
                "Could not load notification read status:",
                readError
            );

            systemNotificationList.innerHTML =
                '<div class="system-empty">Could not load notification status. Please try again.</div>';

            return;
        }

        const readIds = new Set(
            (readRecords || []).map(
                item => item.notification_id
            )
        );

        const systemUnreadCount = notifications.filter(
            item => !readIds.has(item.id)
        ).length;

        updateSystemUnreadBadge(systemUnreadCount);
        refreshCombinedUnreadBadge();

        systemNotificationList.innerHTML = "";

        notifications.forEach(function (notification) {
            const isRead = readIds.has(notification.id);

            const card = document.createElement("article");

            card.className =
                "system-notification-card" +
                (isRead ? "" : " unread");

            const unreadLabel = document.createElement("span");

            unreadLabel.className = "system-unread-label";

            unreadLabel.textContent =
                notification.type === "account"
                    ? "ACCOUNT NOTICE"
                    : "LARCK ANNOUNCEMENT";

            if (!isRead) {
                card.appendChild(unreadLabel);
            }

            const title = document.createElement("h3");

            title.className = "system-notification-title";
            title.textContent = notification.title;

            const content = document.createElement("p");

            content.className = "system-notification-text";
            content.textContent = notification.content;

            const date = document.createElement("span");

            date.className = "system-notification-date";

            const createdAt = new Date(
                notification.created_at
            );

            date.textContent = isNaN(createdAt.getTime())
                ? ""
                : createdAt.toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short"
                });

            card.appendChild(title);
            card.appendChild(content);
            card.appendChild(date);

            card.addEventListener("click", async function () {
                if (card.dataset.markingRead === "true") {
                    return;
                }

                if (readIds.has(notification.id)) {
                    return;
                }

                card.dataset.markingRead = "true";

                const { error } = await larckSupabase
                    .from("system_notification_reads")
                    .insert({
                        notification_id: notification.id,
                        user_id: currentUser.id
                    });

                if (error) {
                    console.error(
                        "Could not mark notification as read:",
                        error
                    );

                    card.dataset.markingRead = "false";
                    return;
                }

                readIds.add(notification.id);

                card.classList.remove("unread");
                unreadLabel.remove();

                const remainingUnread =
                    notifications.filter(
                        item => !readIds.has(item.id)
                    ).length;

                updateSystemUnreadBadge(remainingUnread);

                await refreshCombinedUnreadBadge();
            });

            systemNotificationList.appendChild(card);
        });

    } catch (error) {
        console.error(
            "System notification error:",
            error
        );

        systemNotificationList.innerHTML =
            '<div class="system-empty">Something went wrong while loading notifications.</div>';
    }
}


/* =========================================
   LARCK TEAM
========================================= */

const teamShortcut =
    document.getElementById("teamShortcut");

const teamPopup =
    document.getElementById("teamPopup");

const closeTeam =
    document.getElementById("closeTeam");


// =========================================
// LOAD LARCK TEAM ANNOUNCEMENTS
// =========================================

const teamAnnouncementList =
    document.getElementById("teamAnnouncementList");

async function loadTeamAnnouncements() {
    if (!teamAnnouncementList) return;

    teamAnnouncementList.innerHTML = `
        <div class="team-loading">
            <div class="team-loading-spinner"></div>
            <p>Loading LARCK Team announcements...</p>
        </div>
    `;

    try {
        const {
            data: announcements,
            error
        } = await larckSupabase
            .from("team_announcements")
            .select("id, title, content, created_at")
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        teamAnnouncementList.innerHTML = "";

        if (!announcements || announcements.length === 0) {
            teamAnnouncementList.innerHTML = `
                <div class="team-empty">
                    <p>No announcements yet.</p>
                    <p>Official LARCK Team updates will appear here.</p>
                </div>
            `;
            return;
        }

        announcements.forEach(function (announcement) {
            const card = document.createElement("article");
            card.className = "team-announcement-card";

            const title = document.createElement("h3");
            title.textContent = announcement.title;

            const content = document.createElement("p");
            content.textContent = announcement.content;

            const date = document.createElement("span");
            date.className = "team-announcement-date";

            const createdAt = new Date(announcement.created_at);

            date.textContent = isNaN(createdAt.getTime())
                ? ""
                : createdAt.toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short"
                });

            card.appendChild(title);
            card.appendChild(content);
            card.appendChild(date);

            teamAnnouncementList.appendChild(card);
        });

    } catch (error) {
        console.error(
            "Could not load LARCK Team announcements:",
            error
        );

        teamAnnouncementList.innerHTML = `
            <div class="team-error">
                Could not load announcements.
                Please check your connection and try again.
            </div>
        `;
    }
}




if (teamShortcut) {
    teamShortcut.addEventListener("click", function () {
        if (teamPopup) {
            teamPopup.classList.add("show");
        }

        loadTeamAnnouncements();
    });
}


if (closeTeam) {
    closeTeam.addEventListener("click", function () {
        if (teamPopup) {
            teamPopup.classList.remove("show");
        }
    });
}

if (teamPopup) {
    teamPopup.addEventListener("click", function (event) {
        if (event.target === teamPopup) {
            teamPopup.classList.remove("show");
        }
    });
}


/* =========================================
   ACTIVITY
========================================= */

const activityShortcut =
    document.getElementById("activityShortcut");

const activityPopup =
    document.getElementById("activityPopup");

const closeActivity =
    document.getElementById("closeActivity");


if (activityShortcut) {
    activityShortcut.addEventListener("click", function () {
        if (activityPopup) {
            activityPopup.classList.add("show");
        }
    });
}

if (closeActivity) {
    closeActivity.addEventListener("click", function () {
        if (activityPopup) {
            activityPopup.classList.remove("show");
        }
    });
}

if (activityPopup) {
    activityPopup.addEventListener("click", function (event) {
        if (event.target === activityPopup) {
            activityPopup.classList.remove("show");
        }
    });
}


/* =========================================
   NOTIFICATION BUTTON
========================================= */

const notificationButton =
    document.getElementById("notificationButton");

if (notificationButton) {
    notificationButton.addEventListener("click", function () {
        openSystemScreen();
    });
}


/* =========================================
   LARCK PAGE NAVIGATION
========================================= */

const bottomNavItems =
    document.querySelectorAll(".bottom-nav-item");

bottomNavItems.forEach(function (item) {
    item.addEventListener("click", function () {
        const page = item.dataset.page;

        if (page === "home") {
            window.location.href = "page2.html";
        } else if (page === "party") {
            window.location.href = "page3.html";
        } else if (page === "message") {
            window.location.href = "page4.html";
        } else if (page === "me") {
            window.location.href = "page5.html";
        }
    });
});


/* =========================================
   CONVERSATIONS
========================================= */

const conversationList =
    document.getElementById("conversationList");

const emptyMessages =
    document.getElementById("emptyMessages");


/* =========================================
   BOTTOM MESSAGE UNREAD BADGE
========================================= */

function updateMessageUnreadBadge(count) {
    const messageButton =
        document.getElementById("messageNavButton");

    if (!messageButton) return;

    let badge = messageButton.querySelector(
        ".message-total-unread-badge"
    );

    if (!badge) {
        badge = document.createElement("span");

        badge.className =
            "message-total-unread-badge";

        badge.setAttribute(
            "aria-label",
            "Total unread messages and System notifications"
        );

        messageButton.appendChild(badge);
    }

    if (count > 0) {
        badge.textContent =
            count > 99 ? "99+" : String(count);

        badge.classList.add("show");
    } else {
        badge.textContent = "";
        badge.classList.remove("show");
    }
}


/* =========================================
   COMBINED MESSAGE + SYSTEM UNREAD COUNT
========================================= */

async function refreshCombinedUnreadBadge() {
    try {
        const {
            data: userData,
            error: userError
        } = await larckSupabase.auth.getUser();

        if (userError || !userData.user) {
            updateMessageUnreadBadge(0);
            return;
        }

        const userId = userData.user.id;

        // Count unread private messages.
        const {
            count: privateUnread,
            error: privateError
        } = await larckSupabase
            .from("private_messages")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("receiver_id", userId)
            .eq("is_read", false);

        if (privateError) {
            throw privateError;
        }

        // Load System notifications visible to this user.
        const {
            data: notifications,
            error: notificationsError
        } = await larckSupabase
            .from("system_notifications")
            .select("id");

        if (notificationsError) {
            throw notificationsError;
        }

        const notificationIds = (
            notifications || []
        ).map(item => item.id);

        let systemUnread = 0;

        if (notificationIds.length > 0) {
            const {
                data: readRecords,
                error: readError
            } = await larckSupabase
                .from("system_notification_reads")
                .select("notification_id")
                .eq("user_id", userId)
                .in("notification_id", notificationIds);

            if (readError) {
                throw readError;
            }

            const readIds = new Set(
                (readRecords || []).map(
                    item => item.notification_id
                )
            );

            systemUnread = notificationIds.filter(
                id => !readIds.has(id)
            ).length;
        }

        updateMessageUnreadBadge(
            (privateUnread || 0) + systemUnread
        );

    } catch (error) {
        console.error(
            "Could not refresh combined unread badge:",
            error
        );
    }
}


/* =========================================
   LOAD CONVERSATIONS
========================================= */

async function loadConversations() {
    if (!conversationList || !emptyMessages) {
        return;
    }

    try {
        /* GET CURRENT USER */

        const {
            data: userData,
            error: userError
        } = await larckSupabase.auth.getUser();

        if (userError || !userData.user) {
            console.error(
                "Could not get current user:",
                userError
            );

            return;
        }

        const currentUser = userData.user;

        /* GET PRIVATE MESSAGES */

        const {
            data: messages,
            error: messagesError
        } = await larckSupabase
            .from("private_messages")
            .select(
                "id, sender_id, receiver_id, content, is_read, created_at"
            )
            .or(
                `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
            )
            .order("created_at", {
                ascending: false
            });

        if (messagesError) {
            console.error(
                "Could not load conversations:",
                messagesError
            );

            return;
        }

        /* NO MESSAGES */

        if (!messages || messages.length === 0) {
            conversationList.innerHTML = "";
            conversationList.style.display = "none";
            emptyMessages.style.display = "flex";

            // Keep System notifications included in the bottom total.
            await refreshCombinedUnreadBadge();

            return;
        }

        /* COUNT UNREAD PRIVATE MESSAGES PER SENDER */

        const unreadCounts = new Map();

        messages.forEach(function (message) {
            if (
                message.receiver_id === currentUser.id &&
                message.is_read === false
            ) {
                const senderId = message.sender_id;

                unreadCounts.set(
                    senderId,
                    (unreadCounts.get(senderId) || 0) + 1
                );
            }
        });

        /* REFRESH COMBINED BOTTOM BADGE */

        await refreshCombinedUnreadBadge();

        /* FIND LATEST MESSAGE PER PERSON */

        const conversationMap = new Map();

        messages.forEach(function (message) {
            const otherUserId =
                message.sender_id === currentUser.id
                    ? message.receiver_id
                    : message.sender_id;

            // Messages are newest first, so keep the first per person.
            if (!conversationMap.has(otherUserId)) {
                conversationMap.set(otherUserId, message);
            }
        });

        const conversations = Array.from(
            conversationMap.entries()
        );

        /* GET PROFILE IDS */

        const profileIds = conversations.map(
            function ([userId]) {
                return userId;
            }
        );

        if (!profileIds.length) {
            conversationList.innerHTML = "";
            conversationList.style.display = "none";
            emptyMessages.style.display = "flex";

            await refreshCombinedUnreadBadge();

            return;
        }

        /* LOAD PROFILES */

        const {
            data: profiles,
            error: profilesError
        } = await larckSupabase
            .from("profiles")
            .select(
                "id, username, larck_id, profile_picture"
            )
            .in("id", profileIds);

        if (profilesError) {
            console.error(
                "Could not load conversation profiles:",
                profilesError
            );

            return;
        }

        /* PROFILE MAP */

        const profileMap = new Map();

        (profiles || []).forEach(function (profile) {
            profileMap.set(profile.id, profile);
        });

        /* SHOW CONVERSATION LIST */

        conversationList.innerHTML = "";
        conversationList.style.display = "flex";
        emptyMessages.style.display = "none";

        /* CREATE CARDS */

        conversations.forEach(function ([userId, message]) {
            const profile = profileMap.get(userId);

            if (!profile) {
                return;
            }

            createConversationCard(
                profile,
                message,
                currentUser.id,
                unreadCounts.get(userId) || 0
            );
        });

    } catch (error) {
        console.error(
            "Conversation loading error:",
            error
        );
    }
}


/* =========================================
   CREATE CONVERSATION CARD
========================================= */

function createConversationCard(
    profile,
    message,
    currentUserId,
    unreadCount
) {
    unreadCount = unreadCount || 0;

    if (!conversationList) {
        return;
    }

    const card = document.createElement("div");
    card.className = "conversation-card";

    /* PROFILE IMAGE */

    const avatar = document.createElement("div");
    avatar.className = "conversation-avatar";

    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.overflow = "hidden";
    avatar.style.background = "#eeeeee";
    avatar.style.color = "#999999";
    avatar.style.fontSize = "24px";
    avatar.style.fontWeight = "700";

    if (profile.profile_picture) {
        const avatarImage = document.createElement("img");

        avatarImage.src = profile.profile_picture;
        avatarImage.alt = profile.username || "User";
        avatarImage.style.width = "100%";
        avatarImage.style.height = "100%";
        avatarImage.style.objectFit = "cover";

        avatarImage.onerror = function () {
            avatarImage.remove();

            avatar.textContent =
                (profile.username || "U")
                    .charAt(0)
                    .toUpperCase();
        };

        avatar.appendChild(avatarImage);
    } else {
        avatar.textContent =
            (profile.username || "U")
                .charAt(0)
                .toUpperCase();
    }

    /* CONVERSATION INFORMATION */

    const information = document.createElement("div");
    information.className = "conversation-information";

    const name = document.createElement("div");
    name.className = "conversation-name";
    name.textContent = profile.username || "Username";

    const preview = document.createElement("div");
    preview.className = "conversation-preview";

    const isMine =
        message.sender_id === currentUserId;

    let previewText = message.content || "";

    if (isMine) {
        previewText = "You: " + previewText;
    }

    preview.textContent = previewText;

    information.appendChild(name);
    information.appendChild(preview);

    /* TIME */

    const time = document.createElement("div");
    time.className = "conversation-time";

    time.textContent = formatConversationTime(
        message.created_at
    );

    /* UNREAD MESSAGE BADGE */

    let unreadBadge = null;

    if (unreadCount > 0) {
        unreadBadge = document.createElement("span");

        unreadBadge.className = "message-unread-badge";

        unreadBadge.textContent =
            unreadCount > 99 ? "99+" : String(unreadCount);

        unreadBadge.setAttribute(
            "aria-label",
            `${unreadCount} unread messages`
        );
    }

    /* BUILD CARD */

    card.appendChild(avatar);
    card.appendChild(information);
    card.appendChild(time);

    if (unreadBadge) {
        card.appendChild(unreadBadge);
    }

    /* OPEN CHAT */

    card.addEventListener("click", function () {
        window.location.href =
            "chat.html?id=" +
            encodeURIComponent(profile.larck_id);
    });

    conversationList.appendChild(card);
}


/* =========================================
   FORMAT CONVERSATION TIME
========================================= */

function formatConversationTime(createdAt) {
    if (!createdAt) {
        return "";
    }

    const date = new Date(createdAt);
    const now = new Date();

    const sameDay =
        date.toDateString() === now.toDateString();

    if (sameDay) {
        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (
        date.toDateString() === yesterday.toDateString()
    ) {
        return "Yesterday";
    }

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric"
    });
}


/* =========================================
   REALTIME CONVERSATION UPDATES
========================================= */

let conversationRealtimeChannel = null;

async function setupConversationRealtime() {
    try {
        const {
            data: userData,
            error
        } = await larckSupabase.auth.getUser();

        if (error || !userData.user) {
            return;
        }

        const currentUser = userData.user;

        conversationRealtimeChannel =
            larckSupabase
                .channel("message-list-" + currentUser.id)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "private_messages"
                    },
                    function (payload) {
                        const message = payload.new;

                        if (
                            message.sender_id !== currentUser.id &&
                            message.receiver_id !== currentUser.id
                        ) {
                            return;
                        }

                        loadConversations();
                    }
                )
                .subscribe();

    } catch (error) {
        console.error(
            "Conversation realtime error:",
            error
        );
    }
}


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        if (searchPopup) {
            searchPopup.classList.remove("show");
        }

        if (systemPopup) {
            systemPopup.classList.remove("show");
        }

        if (teamPopup) {
            teamPopup.classList.remove("show");
        }

        if (activityPopup) {
            activityPopup.classList.remove("show");
        }
    }
});


/* =========================================
   START MESSAGE PAGE
========================================= */

// Refresh the individual System shortcut badge on page load.
refreshSystemUnreadBadge();

// Refresh the combined unread total on the bottom Message icon.
refreshCombinedUnreadBadge();

// Load conversations and listen for new private messages.
loadConversations();
setupConversationRealtime();