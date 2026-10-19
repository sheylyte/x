/* =========================================================
   LARCK PARTY ROOM
   PAGE 6 JAVASCRIPT
========================================================= */


/* =========================================================
   LARCK SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://hxtwdzvnqtxoutdetfoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hEot0ds6XIcLYo7Fj8xtUQ_0ICFxMBV";

const larckSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   LOAD REAL ROOM
========================================================= */

async function loadRealRoom() {

    try {

        /* GET ROOM ID FROM URL */

        const urlParams =
            new URLSearchParams(
                window.location.search
            );

        const roomId =
            urlParams.get("roomId");


        if (!roomId) {

            console.error(
                "No room ID found in URL."
            );

            return;
        }


        /* GET REAL ROOM FROM SUPABASE */

        const {
            data: room,
            error: roomError
        } = await larckSupabase
            .from("rooms")
            .select(`
                id,
                name,
                room_id,
                owner_id,
                profiles:owner_id (
                    username,
                    larck_id,
                    profile_picture,
                    country
                )
            `)
            .eq("id", roomId)
            .single();


        if (roomError || !room) {

            console.error(
                "Room loading error:",
                roomError
            );

            alert(
                "Unable to load this party room."
            );

            window.location.href =
                "page3.html";

            return;
        }


        /* =================================================
           ROOM HEADER
        ================================================= */

        const roomName =
            document.querySelector(
                ".room-profile-info h1"
            );

        const roomIdText =
            document.querySelector(
                ".room-profile-info span"
            );


        if (roomName) {

            roomName.textContent =
                room.name;

        }


        if (roomIdText) {

            roomIdText.textContent =
                "ID: " + room.room_id;

        }


        /* =================================================
           ROOM STAGE TITLE
        ================================================= */

        const stageTitle =
            document.querySelector(
                ".stage-title span"
            );


        if (stageTitle) {

            stageTitle.textContent =
                room.name;

        }


        /* =================================================
           REAL ROOM OWNER
        ================================================= */

        if (room.profiles) {

            const ownerName =
                document.querySelector(
                    ".host-name"
                );


            if (ownerName) {

                ownerName.textContent =
                    "🎤 " +
                    room.profiles.username;

            }


            /* OWNER PROFILE PICTURE */

            const ownerImages =
                document.querySelectorAll(
                    ".room-profile-picture img, .host-ring img"
                );


            if (
                room.profiles.profile_picture &&
                room.profiles.profile_picture.trim() !== ""
            ) {

                ownerImages.forEach(
                    function (image) {

                        image.src =
                            room.profiles.profile_picture;

                    }
                );

            }

        }


        /* =================================================
           SAVE ROOM INFORMATION
        ================================================= */

       window.larckCurrentRoom =
    room;


    /* =================================================
   REGISTER HOST AS HOST SEAT
================================================= */

const hostMember =
    await ensureRoomHostMember();

if (hostMember) {

    await showRealtimeHostMember(
        hostMember
    );

    await getLarckLocalAudioStream();

    updateMicButtonVisual(
        hostMember.mic_on
    );
}


/* =================================================
   HOST CHECK
================================================= */

const {
    data: {
        user: currentUser
    }
} = await larckSupabase.auth.getUser();

const moreButton =
    document.getElementById("moreButton");

if (
    moreButton &&
    currentUser
) {

    if (
        room.owner_id ===
        currentUser.id
    ) {

        /* CURRENT USER IS HOST */

        moreButton.style.display =
            "";

        console.log(
            "LARCK HOST: Current user is the room host."
        );

    } else {

        /* CURRENT USER IS NOT HOST */

        moreButton.style.display =
            "none";

        console.log(
            "LARCK MEMBER: More button hidden."
        );

    }

}


/* =================================================
   START VOICE SIGNALING FIRST
================================================= */

if (typeof startLarckVoiceSignaling === "function") {
    await startLarckVoiceSignaling();
}


/* =================================================
   START ROOM MEMBER REALTIME
================================================= */

if (typeof startRoomMembersRealtime === "function") {
    startRoomMembersRealtime();
}


/* =================================================
   LOAD MEMBERS ALREADY IN THE ROOM
================================================= */

if (typeof loadExistingRoomMembers === "function") {
    await loadExistingRoomMembers();
}
            


        console.log(
            "REAL LARCK ROOM:",
            room
        );

        console.log(
            "PUBLIC ROOM ID:",
            room.room_id
        );

    }

    catch (error) {

        console.error(
            "Load room error:",
            error
        );

    }

}


/* LOAD ROOM */

loadRealRoom();



/* =========================================================
   HEADER
========================================================= */

const roomBack = document.getElementById("roomBack");
const exitRoom = document.getElementById("exitRoom");

async function leaveRealRoom() {

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();

    if (!user || !window.larckCurrentRoom) {
        return;
    }

    const roomId =
        window.larckCurrentRoom.id;

    const {
        error
    } = await larckSupabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Error leaving room:",
            error
        );

        return;
    }

    if (
    window.larckCurrentRoom.owner_id ===
    user.id
) {
    clearHostSeat();
}

    console.log(
        "User left the room and released their seat."
    );
}


roomBack.addEventListener("click", async function () {

    await leaveRealRoom();

    window.location.href = "page3.html";
});


exitRoom.addEventListener("click", async function () {

    await leaveRealRoom();

    localStorage.removeItem(
        "larckActiveRoom"
    );
    
    localStorage.removeItem(
        "larckActiveRoom"
    );

    window.location.href =
        "page3.html";
});



/* =========================================================
   SEAT SYSTEM
========================================================= */

const seatArea = document.getElementById("seatArea");

const sampleUsers = [

    {
        name: "David",
        image: "images/user1.jpg",
        gifts: 0
    },

    {
        name: "Sarah",
        image: "images/user2.jpg",
        gifts: 0
    },

    {
        name: "Mike",
        image: "images/user3.jpg",
        gifts: 0
    },

    {
        name: "Linda",
        image: "images/user4.jpg",
        gifts: 0
    }

];


let nextUserIndex = 0;


/* =========================================================
   CURRENT SEAT COUNT
========================================================= */

let currentSeatCount = 15;

let pendingSeatCount = 15;


/* =========================================================
   CREATE SEAT
========================================================= */

function createSeat(number) {

    const seat = document.createElement("div");

    seat.className = "seat";

    seat.dataset.seat = number;

    seat.dataset.occupied = "false";


    seat.innerHTML = `
        <div class="seat-circle">
            <span class="seat-microphone">🎤</span>
        </div>
    `;


    seat.addEventListener("click", async function () {

        /* OCCUPIED SEAT */
        if (seat.dataset.occupied === "true") {

            return;
        }


        /* CURRENT USER MUST BE LOGGED IN */

        const {
            data: {
                user
            }
        } = await larckSupabase.auth.getUser();


        if (!user) {

            alert("Please sign in first.");

            return;
        }


        /* ROOM MUST BE LOADED */

        if (!window.larckCurrentRoom) {

            console.log(
                "Room is still loading."
            );

            return;
        }


        const roomId =
            window.larckCurrentRoom.id;


        /* CHECK IF THIS USER IS ALREADY SITTING */

        const {
            data: existingMember,
            error: existingError
        } = await larckSupabase
            .from("room_members")
            .select(`
                id,
                seat_number
            `)
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();


        if (existingError) {

            console.error(
                "Member check error:",
                existingError
            );

            return;
        }


        /* USER ALREADY HAS A SEAT */

        if (existingMember) {

            alert(
                "You are already sitting on seat " +
                existingMember.seat_number +
                "."
            );

            return;
        }


        /* CHECK WHETHER THIS SEAT IS ALREADY TAKEN
           IN SUPABASE */

        const {
            data: seatMember,
            error: seatError
        } = await larckSupabase
            .from("room_members")
            .select(`
                id,
                user_id
            `)
            .eq("room_id", roomId)
            .eq(
                "seat_number",
                number
            )
            .eq("is_active", true)
            .maybeSingle();


        if (seatError) {

            console.error(
                "Seat check error:",
                seatError
            );

            return;
        }


        /* SOMEONE ELSE JUST TOOK THIS SEAT */

        if (seatMember) {

            alert(
                "This seat is already occupied."
            );

            return;
        }


        /* GET CURRENT USER PROFILE */

        const {
            data: profile,
            error: profileError
        } = await larckSupabase
            .from("profiles")
            .select(`
                username,
                profile_picture
            `)
            .eq("id", user.id)
            .single();


        if (profileError || !profile) {

            console.error(
                "Profile loading error:",
                profileError
            );

            return;
        }


        /* SAVE THE SEAT */

        const {
            data: newMember,
            error: joinError
        } = await larckSupabase
            .from("room_members")
            .insert({

                room_id: roomId,

                user_id: user.id,

                seat_number: number,

                mic_on: true,

                is_active: true

            })
            .select()
            .single();


        if (joinError) {

            console.error(
                "Seat join error:",
                joinError
            );

            alert(
                "This seat was just taken. Please choose another seat."
            );

            return;
        }


        /* SHOW USER ON THE SEAT */

        const circle =
            seat.querySelector(
                ".seat-circle"
            );


        circle.classList.add(
            "occupied"
        );


        if (
            profile.profile_picture &&
            profile.profile_picture.trim() !== ""
        ) {

            circle.innerHTML = `
                <img
                    src="${profile.profile_picture}"
                    alt="${profile.username}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                        display:block;
                    "
                >
            `;

        } else {

            circle.innerHTML = `
                <span>
                    ${profile.username
                        ? profile.username
                            .charAt(0)
                            .toUpperCase()
                        : "L"}
                </span>
            `;
        }


        const name =
            document.createElement(
                "span"
            );

        name.className =
            "seat-name";

        name.textContent =
            profile.username || "LARCK User";


        const giftBox =
            document.createElement(
                "span"
            );

        giftBox.className =
            "seat-gifts";

        giftBox.textContent =
            "🎁 0";


        seat.appendChild(name);

        seat.appendChild(giftBox);

        const micIndicator =
    document.createElement("span");

micIndicator.className =
    "mic-indicator";

micIndicator.textContent =
    "🎤";

seat.appendChild(micIndicator);


        /* SAVE LOCAL SEAT STATE */

        seat.dataset.occupied =
            "true";

        seat.dataset.username =
            profile.username ||
            "LARCK User";

        seat.dataset.userId =
            user.id;

        seat.dataset.memberId =
            newMember.id;

        seat.dataset.gifts =
            "0";
        
        /* =========================
   START MICROPHONE AUTOMATICALLY
========================= */

const microphoneStarted =
    await startLocalMicrophone();

if (!microphoneStarted) {

    console.error(
        "LARCK microphone could not start automatically."
    );

    return;
}

updateMicButtonVisual(true);

console.log(
    "LARCK microphone automatically started after taking seat."
);

/* =========================
   UPGRADE EXISTING VOICE CONNECTIONS
========================= */

await upgradeLarckVoiceConnections();
        

        console.log(
            "User successfully sat on seat:",
            number
        );
    });
     return seat;
}

/* =========================================================
   CREATE ALL 30 SEATS
========================================================= */

for (let i = 1; i <= 30; i++) {

    const seat = createSeat(i);

    seatArea.appendChild(seat);

}


/* =========================================================
   GET ALL SEATS
========================================================= */

const seats = document.querySelectorAll(".seat");




/* =========================================================
   SIT ON SEAT
========================================================= */

function sitOnSeat(seat, user) {

    const circle = seat.querySelector(".seat-circle");


    circle.classList.add("occupied");


    circle.innerHTML = `
        <img src="${user.image}" alt="${user.name}">
    `;


    const oldName = seat.querySelector(".seat-name");

    const oldGift = seat.querySelector(".seat-gifts");


    if (oldName) {
        oldName.remove();
    }


    if (oldGift) {
        oldGift.remove();
    }


    const name = document.createElement("span");

    name.className = "seat-name";

    name.textContent = user.name;


    const giftBox = document.createElement("span");

    giftBox.className = "seat-gifts";

    giftBox.textContent = `🎁 ${user.gifts}`;


    seat.appendChild(name);

    seat.appendChild(giftBox);


    seat.dataset.occupied = "true";

    seat.dataset.username = user.name;

    seat.dataset.gifts = user.gifts;

}


/* =========================================================
   LEAVE SEAT
========================================================= */

function leaveSeat(seat) {

    const circle = seat.querySelector(".seat-circle");


    circle.classList.remove("occupied");


    circle.innerHTML = `
        <span class="seat-microphone">🎤</span>
    `;


    const name = seat.querySelector(".seat-name");

    const gift = seat.querySelector(".seat-gifts");


    if (name) {
        name.remove();
    }


    if (gift) {
        gift.remove();
    }


    seat.dataset.occupied = "false";

    delete seat.dataset.username;

    delete seat.dataset.gifts;

}


/* =========================================================
   QUICK SEAT LAYOUT
========================================================= */

function updateSeatLayout(count) {

    currentSeatCount = count;


    /* =====================================================
       SHOW ONLY THE SELECTED NUMBER OF SEATS
    ===================================================== */

    seats.forEach(function (seat, index) {

        if (index < count) {

            seat.style.display = "block";

        } else {

            seat.style.display = "none";

        }

    });


    /* =====================================================
       DEFAULT LAYOUT
    ===================================================== */

    let columns = 5;
    let rowGap = 6;
    let stageHeight = 275;


    /* =====================================================
       10 SEATS
    ===================================================== */

    if (count === 10) {

        columns = 5;
        rowGap = 8;
        stageHeight = 185;

    }


    /* =====================================================
       15 SEATS
    ===================================================== */

    if (count === 15) {

        columns = 5;
        rowGap = 6;
        stageHeight = 250;

    }


    /* =====================================================
       20 SEATS
    ===================================================== */

    if (count === 20) {

        columns = 5;
        rowGap = 4;
        stageHeight = 300;

    }


    /* =====================================================
       30 SEATS
    ===================================================== */

    if (count === 30) {

        columns = 5;
        rowGap = 2;
        stageHeight = 365;

    }


    /* =====================================================
       APPLY GRID
    ===================================================== */

    seatArea.style.gridTemplateColumns =
        `repeat(${columns}, 1fr)`;

    seatArea.style.rowGap =
        `${rowGap}px`;


    /* =====================================================
       RESET LAST ROW
    ===================================================== */

    seats.forEach(function (seat) {

        seat.style.gridColumn = "auto";

    });


    /* =====================================================
       CENTER LAST 3 SEATS FOR 15
    ===================================================== */

    if (count === 15) {

        seats[12].style.gridColumn = "2";

        seats[13].style.gridColumn = "3";

        seats[14].style.gridColumn = "4";

    }


    /* =====================================================
       UPDATE ROOM STAGE
    ===================================================== */

    const roomStage =
        document.querySelector(".room-stage");

    roomStage.style.height =
        `${stageHeight}px`;


    /* =====================================================
       UPDATE CHAT POSITION
    ===================================================== */

    const liveChat =
        document.querySelector(".live-chat");


    /*
       Put the chat immediately below the stage.
       This prevents the 30-seat layout from covering it.
    */

    const chatGap = 6;

    const chatTop =
        64 + stageHeight + chatGap;


    liveChat.style.top =
        `${chatTop}px`;


    /*
       Keep enough room for the chat.
    */

    liveChat.style.bottom = "94px";


    /* =====================================================
       UPDATE SETUP TEXT
    ===================================================== */

    const seatLayoutText =
        document.getElementById("seatLayoutText");

    seatLayoutText.textContent =
        `${count} seats⌄`;

}


/* =========================================================
   INITIAL 15-SEAT ROOM
========================================================= */

updateSeatLayout(15);


/* =========================================================
   MICROPHONE
========================================================= */

const micButton =
    document.getElementById("micButton");


let microphoneOn = true;


/* =========================================================
   GET CURRENT USER SEAT
========================================================= */

async function getCurrentUserSeat() {

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();


    if (!user || !window.larckCurrentRoom) {
        return null;
    }


    const {
        data: member,
        error
    } = await larckSupabase
        .from("room_members")
        .select(`
            id,
            seat_number,
            mic_on,
            is_active
        `)
        .eq(
            "room_id",
            window.larckCurrentRoom.id
        )
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "is_active",
            true
        )
        .maybeSingle();


    if (error) {

        console.error(
            "Current seat loading error:",
            error
        );

        return null;
    }


    return member;
}


/* =========================================================
   UPDATE MIC VISUAL
========================================================= */

function updateMicButtonVisual(isOn) {

    microphoneOn = isOn;


    const svg =
        micButton.querySelector("svg");


    if (isOn) {

        micButton.classList.add(
            "active-control"
        );

        if (svg) {
            svg.style.opacity = "1";
        }

    } else {

        micButton.classList.remove(
            "active-control"
        );

        if (svg) {
            svg.style.opacity = ".4";
        }

    }
}


/* =========================================================
   MIC BUTTON
========================================================= */

let localAudioStream = null;

async function startLocalMicrophone() {
    try {
        localAudioStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        console.log("LARCK microphone started.");

        return localAudioStream;

    } catch (error) {
        console.error(
            "Microphone permission error:",
            error
        );

        alert(
            "LARCK needs microphone permission to use your microphone."
        );

        return false;
    }
}

function stopLocalMicrophone() {
    if (!localAudioStream) {
        return;
    }

    localAudioStream
        .getTracks()
        .forEach(function (track) {
            track.stop();
        });

    localAudioStream = null;

    console.log(
        "LARCK microphone stopped."
    );
}



micButton.addEventListener(
    "click",
    async function () {

        const member =
            await getCurrentUserSeat();

        if (!member) {
            alert(
                "Please take a seat first."
            );
            return;
        }

        const newMicState =
            !member.mic_on;

        /* =========================
           TURN MICROPHONE ON
        ========================== */

        if (newMicState) {

            /*
             * Make sure we have a valid
             * microphone stream.
             */

            let microphoneStream =
                localAudioStream;

            if (
                !microphoneStream ||
                microphoneStream
                    .getAudioTracks()
                    .length === 0 ||
                microphoneStream
                    .getAudioTracks()
                    .some(function (track) {
                        return track.readyState === "ended";
                    })
            ) {

                microphoneStream =
                    await startLocalMicrophone();

                if (!microphoneStream) {
                    console.error(
                        "LARCK could not restart microphone."
                    );
                    return;
                }
            }

            const microphoneTrack =
                microphoneStream
                    .getAudioTracks()[0];

            if (!microphoneTrack) {
                console.error(
                    "LARCK microphone track not found."
                );
                return;
            }

            /*
             * Turn microphone back on.
             */

            microphoneTrack.enabled = true;

            /*
             * Make sure WebRTC is using
             * this microphone track.
             */

            for (
                const remoteUserId
                in larckPeerConnections
            ) {

                const peerConnection =
                    larckPeerConnections[
                        remoteUserId
                    ];

                if (!peerConnection) {
                    continue;
                }

                const senders =
                    peerConnection.getSenders();

                const audioSender =
                    senders.find(function (sender) {

                        return (
                            sender.track &&
                            sender.track.kind ===
                            "audio"
                        );

                    });

                if (audioSender) {

                    await audioSender.replaceTrack(
                        microphoneTrack
                    );

                    console.log(
                        "LARCK microphone track restored for:",
                        remoteUserId
                    );
                }
            }

            /*
             * Keep both variables synchronized.
             */

            localAudioStream =
                microphoneStream;

            larckLocalAudioStream =
                microphoneStream;
        }

        /* =========================
           TURN MICROPHONE OFF
        ========================== */

        if (!newMicState) {

            if (localAudioStream) {

                localAudioStream
                    .getAudioTracks()
                    .forEach(function (track) {

                        /*
                         * IMPORTANT:
                         * Do NOT stop the track.
                         * Just disable it.
                         */

                        track.enabled = false;

                    });

                console.log(
                    "LARCK microphone muted."
                );
            }
        }

        /* =========================
           SAVE MIC STATE
        ========================== */

        const { error } =
            await larckSupabase
            .from("room_members")
            .update({
                mic_on: newMicState
            })
            .eq("id", member.id);

        if (error) {

            console.error(
                "Microphone update error:",
                error
            );

            return;
        }

        /* =========================
           UPDATE BUTTON
        ========================== */

        updateMicButtonVisual(
            newMicState
        );

        console.log(
            "LARCK Microphone:",
            newMicState
                ? "ON"
                : "OFF"
        );
    }
);


/* =========================================================
   SPEAKER
========================================================= */

const speakerButton =
    document.getElementById("speakerButton");

let speakerOn = true;

speakerButton.classList.add("active-control");

const speakerSvg =
    speakerButton.querySelector("svg");

if (speakerSvg) {
    speakerSvg.style.opacity = "1";
}


speakerButton.addEventListener("click", function () {

    speakerOn = !speakerOn;


    const svg =
        speakerButton.querySelector("svg");


    /* FIND ALL LARCK REMOTE AUDIO */

    const remoteAudios =
        document.querySelectorAll(
            'audio[id^="larck-audio-"]'
        );


    /* SPEAKER ON */

    if (speakerOn) {

        speakerButton.classList.add(
            "active-control"
        );

        svg.style.opacity = "1";


        remoteAudios.forEach(
            function (audio) {

                audio.muted = false;

                audio.volume = 1;

                audio.play().catch(
                    function (error) {

                        console.log(
                            "LARCK speaker audio play:",
                            error
                        );

                    }
                );

            }
        );


        console.log(
            "LARCK Speaker: ON"
        );

    }


    /* SPEAKER OFF */

    else {

        speakerButton.classList.remove(
            "active-control"
        );

        svg.style.opacity = ".4";


        remoteAudios.forEach(
            function (audio) {

                audio.muted = true;

            }
        );


        console.log(
            "LARCK Speaker: OFF"
        );

    }

});

/* =========================================================
   LIVE CHAT
========================================================= */

const chatInput =
    document.getElementById("chatInput");

const sendChat =
    document.getElementById("sendChat");

const chatMessages =
    document.getElementById("chatMessages");


/* =========================================================
   ROOM JOIN MESSAGE
========================================================= */

function addJoinMessage(username) {

    const row =
        document.createElement("div");

    row.className =
        "room-welcome";


    const welcomeText =
        document.createElement("strong");

    welcomeText.textContent =
        `Welcome @${username}`;


    row.appendChild(welcomeText);

    chatMessages.appendChild(row);


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* =========================================================
   SIMULATE USER JOINING ROOM
========================================================= */

addJoinMessage("Seyi");


/* =========================================================
   SEND CHAT MESSAGE
========================================================= */

function sendMessage() {

    const message =
        chatInput.value.trim();


    if (message === "") {
        return;
    }


    const row =
        document.createElement("div");


    row.className =
        "message-row";


    const username =
        document.createElement("strong");


    username.textContent =
        "You";


    const messageText =
        document.createElement("span");


    messageText.textContent =
        message;


    row.appendChild(username);

    row.appendChild(messageText);


    chatMessages.appendChild(row);


    chatInput.value = "";


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


sendChat.addEventListener(
    "click",
    sendMessage
);


chatInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);

/* =========================================================
   GIFT
========================================================= */

const giftButton =
    document.getElementById("giftButton");


giftButton.addEventListener(
    "click",
    function () {

        alert(
            "Gift Center\n\n" +
            "Choose a gift to send to the host or a member."
        );

    }
);


/* =========================================================
   GAMES
========================================================= */

const gamesButton =
    document.getElementById("gamesButton");

const gamesPanel =
    document.getElementById("gamesPanel");

const gamesOverlay =
    document.getElementById("gamesOverlay");

const closeGames =
    document.getElementById("closeGames");


function openGames() {

    gamesPanel.classList.add("show");

    gamesOverlay.classList.add("show");

}


function closeGamesPanel() {

    gamesPanel.classList.remove("show");

    gamesOverlay.classList.remove("show");

}


gamesButton.addEventListener(
    "click",
    openGames
);


closeGames.addEventListener(
    "click",
    closeGamesPanel
);


gamesOverlay.addEventListener(
    "click",
    closeGamesPanel
);


/* =========================================================
   GAME CARDS
========================================================= */

const gameCards =
    document.querySelectorAll(".game-card");


gameCards.forEach(function (game) {

    game.addEventListener(
        "click",
        function () {

            const gameName =
                game.dataset.game;


            alert(
                gameName +
                "\n\nThe " +
                gameName +
                " game will open here."
            );

        }
    );

});


/* =========================================================
   MORE TOOLS
========================================================= */

const moreButton =
    document.getElementById("moreButton");

const toolsPanel =
    document.getElementById("toolsPanel");

const toolsOverlay =
    document.getElementById("toolsOverlay");

const closeTools =
    document.getElementById("closeTools");

const saveTools =
    document.getElementById("saveTools");


function openTools() {

    toolsPanel.classList.add("show");

    toolsOverlay.classList.add("show");

}


function closeToolsPanel() {

    toolsPanel.classList.remove("show");

    toolsOverlay.classList.remove("show");

}


moreButton.addEventListener(
    "click",
    openTools
);


closeTools.addEventListener(
    "click",
    closeToolsPanel
);


toolsOverlay.addEventListener(
    "click",
    closeToolsPanel
);

/* =========================================================
   LOCK ROOM
========================================================= */

const lockRoomButton =
    document.getElementById("lockRoomButton");

const roomLockedIndicator =
    document.getElementById("roomLockedIndicator");

let roomLocked = false;


lockRoomButton.addEventListener(
    "click",
    function () {

        roomLocked = !roomLocked;


        /* =================================================
           LOCK ROOM
        ================================================= */

        if (roomLocked) {

            roomLockedIndicator.classList.add("show");


            lockRoomButton.querySelector(".tool-icon")
                .textContent = "🔓";


            lockRoomButton.querySelector(
                "span:last-child"
            ).textContent = "Unlock Room";


            lockRoomButton.classList.add(
                "locked-tool"
            );


            alert(
                "Room Locked\n\n" +
                "New users can no longer join this room."
            );

        }


        /* =================================================
           UNLOCK ROOM
        ================================================= */

        else {

            roomLockedIndicator.classList.remove(
                "show"
            );


            lockRoomButton.querySelector(".tool-icon")
                .textContent = "🔒";


            lockRoomButton.querySelector(
                "span:last-child"
            ).textContent = "Lock Room";


            lockRoomButton.classList.remove(
                "locked-tool"
            );


            alert(
                "Room Unlocked\n\n" +
                "New users can now join this room."
            );

        }

    }
);

/* =========================================================
   CLEAR SCREEN
========================================================= */

const clearScreenButton =
    document.getElementById("clearScreenButton");


clearScreenButton.addEventListener(
    "click",
    function () {

        /* =========================================
           CLEAR CHAT MESSAGES
        ========================================= */

        chatMessages.innerHTML = "";


        /* =========================================
           SHOW CLEAR CONFIRMATION
        ========================================= */

        const clearMessage =
            document.createElement("div");

        clearMessage.className =
            "clear-screen-message";

        clearMessage.textContent =
            "✓ Screen Cleared";


        document.querySelector(".party-room")
            .appendChild(clearMessage);


        /* =========================================
           SHOW MESSAGE
        ========================================= */

        setTimeout(function () {

            clearMessage.classList.add("show");

        }, 20);


        /* =========================================
           HIDE MESSAGE
        ========================================= */

        setTimeout(function () {

            clearMessage.classList.remove("show");

        }, 1500);


        /* =========================================
           REMOVE MESSAGE
        ========================================= */

        setTimeout(function () {

            clearMessage.remove();

        }, 1800);


        /* =========================================
           CLOSE MORE TOOLS
        ========================================= */

        closeToolsPanel();

    }
);

/* =========================================================
   BACKGROUND SETTINGS
========================================================= */

const backgroundSettingsButton =
    document.getElementById(
        "backgroundSettingsButton"
    );

const backgroundPanel =
    document.getElementById(
        "backgroundPanel"
    );

const backgroundOverlay =
    document.getElementById(
        "backgroundOverlay"
    );

const closeBackground =
    document.getElementById(
        "closeBackground"
    );

const applyBackground =
    document.getElementById(
        "applyBackground"
    );

const backgroundOptions =
    document.querySelectorAll(
        ".background-option"
    );

const backgroundPreviewBox =
    document.getElementById(
        "backgroundPreviewBox"
    );


/* =========================================================
   BACKGROUND DATA
========================================================= */

const backgroundStyles = {

    purple: `
        radial-gradient(
            circle at 50% 28%,
            rgba(104, 48, 170, .30),
            transparent 35%
        ),
        linear-gradient(
            180deg,
            #17102c 0%,
            #0d0820 100%
        )
    `,

    space: `
        radial-gradient(
            circle at 20% 25%,
            rgba(255,255,255,.8) 0 1px,
            transparent 2px
        ),
        radial-gradient(
            circle at 70% 45%,
            rgba(255,255,255,.7) 0 1px,
            transparent 2px
        ),
        radial-gradient(
            circle at 40% 75%,
            rgba(255,255,255,.5) 0 1px,
            transparent 2px
        ),
        linear-gradient(
            180deg,
            #10152d,
            #03040a
        )
    `,

    glow: `
        radial-gradient(
            circle at 50% 30%,
            rgba(141, 77, 224, .55),
            transparent 38%
        ),
        linear-gradient(
            180deg,
            #32145c,
            #090313
        )
    `,

    ocean: `
        radial-gradient(
            circle at 50% 28%,
            rgba(8, 127, 155, .45),
            transparent 40%
        ),
        linear-gradient(
            180deg,
            #062d46,
            #031017
        )
    `,

    red: `
        radial-gradient(
            circle at 50% 28%,
            rgba(154, 41, 41, .45),
            transparent 40%
        ),
        linear-gradient(
            180deg,
            #431515,
            #100606
        )
    `,

    midnight: `
        radial-gradient(
            circle at 50% 30%,
            rgba(48, 48, 82, .45),
            transparent 40%
        ),
        linear-gradient(
            180deg,
            #11111d,
            #030307
        )
    `

};


let selectedBackground = "purple";


/* =========================================================
   OPEN BACKGROUND SETTINGS
========================================================= */

backgroundSettingsButton.addEventListener(
    "click",
    function () {

        backgroundPanel.classList.add("show");

        backgroundOverlay.classList.add("show");

    }
);


/* =========================================================
   CLOSE BACKGROUND SETTINGS
========================================================= */

function closeBackgroundPanel() {

    backgroundPanel.classList.remove("show");

    backgroundOverlay.classList.remove("show");

}


closeBackground.addEventListener(
    "click",
    closeBackgroundPanel
);


backgroundOverlay.addEventListener(
    "click",
    closeBackgroundPanel
);


/* =========================================================
   SELECT BACKGROUND
========================================================= */

backgroundOptions.forEach(
    function (option) {

        option.addEventListener(
            "click",
            function () {

                backgroundOptions.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                option.classList.add(
                    "active"
                );


                selectedBackground =
                    option.dataset.background;


                backgroundPreviewBox.style.background =
                    backgroundStyles[
                        selectedBackground
                    ];

            }
        );

    }
);


/* =========================================================
   APPLY BACKGROUND
========================================================= */

applyBackground.addEventListener(
    "click",
    function () {

        const partyRoom =
            document.querySelector(
                ".party-room"
            );


        partyRoom.style.background =
            backgroundStyles[
                selectedBackground
            ];


        closeBackgroundPanel();

    }
);

/* =========================================================
   QUICK SEAT SELECTION
========================================================= */

const seatOptions =
    document.querySelectorAll(".seat-option");


seatOptions.forEach(function (option) {

    option.addEventListener(
        "click",
        function () {

            seatOptions.forEach(
                function (item) {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            option.classList.add("active");


            pendingSeatCount =
                Number(option.dataset.seats);

        }
    );

});


/* =========================================================
   SAVE QUICK SEAT SELECTION
========================================================= */

saveTools.addEventListener(
    "click",
    function () {

        updateSeatLayout(
            pendingSeatCount
        );


        closeToolsPanel();

    }
);


/* =========================================================
   SETUP BUTTONS
========================================================= */

const micModeButton =
    document.getElementById("micModeButton");

const seatLayoutButton =
    document.getElementById("seatLayoutButton");


micModeButton.addEventListener(
    "click",
    function () {

        alert(
            "Mic Mode\n\n" +
            "Free Mic mode is currently selected."
        );

    }
);


seatLayoutButton.addEventListener(
    "click",
    function () {

        alert(
            "Seat Layout\n\n" +
            currentSeatCount +
            " seats are currently selected."
        );

    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeToolsPanel();

            closeGamesPanel();

        }

    }
);


/* =========================================================
   ROOM LOADED
========================================================= */

console.log(
    "LARCK Party Room loaded successfully."
);

/* =========================================================
   EFFECT & MESSAGE SETTINGS
========================================================= */

const effectMessageButton =
    document.getElementById("effectMessageButton");

const effectMessagePanel =
    document.getElementById("effectMessagePanel");

const effectMessageOverlay =
    document.getElementById("effectMessageOverlay");

const closeEffectMessage =
    document.getElementById("closeEffectMessage");

const applyEffectMessage =
    document.getElementById("applyEffectMessage");

const effectOptions =
    document.querySelectorAll(".effect-option");


let selectedEffect = "normal";


/* OPEN */

effectMessageButton.addEventListener(
    "click",
    function () {

        effectMessagePanel.classList.add("show");

        effectMessageOverlay.classList.add("show");

    }
);


/* CLOSE */

function closeEffectMessagePanel() {

    effectMessagePanel.classList.remove("show");

    effectMessageOverlay.classList.remove("show");

}

closeEffectMessage.addEventListener(
    "click",
    closeEffectMessagePanel
);

effectMessageOverlay.addEventListener(
    "click",
    closeEffectMessagePanel
);


/* EFFECT SELECTION */

effectOptions.forEach(function(option) {

    option.addEventListener(
        "click",
        function() {

            effectOptions.forEach(
                function(item) {
                    item.classList.remove("active");
                }
            );

            option.classList.add("active");

            selectedEffect =
                option.dataset.effect;

        }
    );

});


/* SAVE */

applyEffectMessage.addEventListener(
    "click",
    function() {

        const joinMessages =
            document.getElementById(
                "joinMessagesToggle"
            ).checked;

        const leaveMessages =
            document.getElementById(
                "leaveMessagesToggle"
            ).checked;

        const systemMessages =
            document.getElementById(
                "systemMessagesToggle"
            ).checked;

        const giftEffects =
            document.getElementById(
                "giftEffectsToggle"
            ).checked;


        console.log(
            "Effect:",
            selectedEffect
        );

        console.log(
            "Join Messages:",
            joinMessages
        );

        console.log(
            "Leave Messages:",
            leaveMessages
        );

        console.log(
            "System Messages:",
            systemMessages
        );

        console.log(
            "Gift Effects:",
            giftEffects
        );


        closeEffectMessagePanel();

        alert(
            "Settings Saved\n\n" +
            "Effect: " +
            selectedEffect
        );

    }
);

/* =========================================================
   REALTIME ROOM MEMBERS
========================================================= */

function startRoomMembersRealtime() {

    if (!window.larckCurrentRoom) {
        console.log(
            "Realtime waiting for room..."
        );
        return;
    }

    const roomId =
        window.larckCurrentRoom.id;


    larckSupabase
        .channel(
            "room-members-" + roomId
        )

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "room_members",
                filter:
                    "room_id=eq." + roomId
            },

            async function (payload) {

               console.log(
    "ROOM MEMBER CHANGE:",
    payload.eventType,
    "NEW:",
    payload.new,
    "OLD:",
    payload.old
);

if (payload.eventType === "DELETE") {
    console.log(
        "DELETE SEAT NUMBER:",
        payload.old?.seat_number
    );

    console.log(
        "DELETE USER ID:",
        payload.old?.user_id
    );
}


                /* NEW MEMBER */
if (payload.eventType === "INSERT") {

    if (payload.new.seat_number === 0) {

        await showRealtimeHostMember(
            payload.new
        );

    } else {

        await showRealtimeMember(
            payload.new
        );
    }

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();

    if (
        user &&
        payload.new.user_id !== user.id
    ) {

        if (
            !larckPeerConnections[
                payload.new.user_id
            ]
        ) {

            console.log(
                "LARCK VOICE TRIGGER CHECK:",
                payload.new.user_id,
                "current user:",
                user.id
            );

            /*
             * CHECK WHETHER CURRENT USER
             * IS SITTING.
             */

            const currentUserSeat =
                await getCurrentUserSeat();

            console.log(
                "LARCK VOICE ROLE:",
                currentUserSeat
                    ? "SPEAKER"
                    : "LISTENER"
            );

            /*
             * CURRENT USER IS SEATED
             * ======================
             * Send microphone audio.
             */

            if (currentUserSeat) {

                console.log(
                    "LARCK starting speaker connection with:",
                    payload.new.user_id
                );

                await connectToRoomMemberVoice(
    payload.new.user_id
);

            }

            /*
             * CURRENT USER IS NOT SEATED
             * ==========================
             * Receive audio only.
             */

            else {

                console.log(
                    "LARCK starting listener connection with:",
                    payload.new.user_id
                );

                await createLarckListenerOffer(
                    payload.new.user_id
                );

            }

            /*
 * If the current user is already a speaker,
 * check whether this new member needs a
 * speaker-to-speaker voice upgrade.
 */
const currentUserSeatAfterInsert =
    await getCurrentUserSeat();

if (
    currentUserSeatAfterInsert &&
    payload.new.user_id !== user.id
) {

    console.log(
        "LARCK checking voice upgrade for new member:",
        payload.new.user_id
    );

    await upgradeLarckVoiceConnections();
}
        }
    }
}


                

                /* MEMBER LEFT */
if (payload.eventType === "DELETE") {

    console.log(
        "LARCK MEMBER DELETE RECEIVED:",
        payload.old
    );

    await syncReleasedRoomSeats();
}


                /* MEMBER UPDATED */

                if (payload.eventType === "UPDATE") {

                    await refreshRealtimeMember(
                        payload.new
                    );
                }

            }
        )

       .subscribe(function (status) {

    console.log(
        "ROOM REALTIME:",
        status
    );

    if (status === "SUBSCRIBED") {

        console.log(
            "LARCK Realtime is connected."
        );

    }

});
}


/* =========================================================
   SHOW NEW MEMBER
========================================================= */

async function showRealtimeMember(member) {

    if (!member.is_active) {
        return;
    }


    const seat =
        document.querySelector(
            `.seat[data-seat="${member.seat_number}"]`
        );


    if (!seat) {
        return;
    }


    const {
        data: profile,
        error
    } = await larckSupabase
        .from("profiles")
        .select(`
            username,
            profile_picture
        `)
        .eq("id", member.user_id)
        .single();


    if (error || !profile) {

        console.error(
            "Realtime profile error:",
            error
        );

        return;
    }


    /* Do not overwrite another occupied seat */

    if (
        seat.dataset.occupied === "true" &&
        seat.dataset.userId !== member.user_id
    ) {

        return;
    }


    /* =====================================================
       SHOW PROFILE
    ===================================================== */

    const circle =
        seat.querySelector(
            ".seat-circle"
        );


    circle.classList.add(
        "occupied"
    );


    if (
        profile.profile_picture &&
        profile.profile_picture.trim() !== ""
    ) {

        circle.innerHTML = `
            <img
                src="${profile.profile_picture}"
                alt="${profile.username}"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                    display:block;
                "
            >
        `;

    } else {

        circle.innerHTML = `
            <span>
                ${profile.username
                    ? profile.username
                        .charAt(0)
                        .toUpperCase()
                    : "L"}
            </span>
        `;
    }


    /* =====================================================
       REMOVE OLD USER INFORMATION
    ===================================================== */

    const oldName =
        seat.querySelector(
            ".seat-name"
        );

    const oldGift =
        seat.querySelector(
            ".seat-gifts"
        );

    const oldMic =
        seat.querySelector(
            ".mic-indicator"
        );


    if (oldName) {
        oldName.remove();
    }


    if (oldGift) {
        oldGift.remove();
    }


    if (oldMic) {
        oldMic.remove();
    }


    /* =====================================================
       USER NAME
    ===================================================== */

    const name =
        document.createElement(
            "span"
        );

    name.className =
        "seat-name";

    name.textContent =
        profile.username ||
        "LARCK User";


    /* =====================================================
       GIFTS
    ===================================================== */

    const giftBox =
        document.createElement(
            "span"
        );

    giftBox.className =
        "seat-gifts";

    giftBox.textContent =
        "🎁 0";


    seat.appendChild(name);

    seat.appendChild(giftBox);


    /* =====================================================
       MICROPHONE INDICATOR
    ===================================================== */

    const micIndicator =
        document.createElement(
            "span"
        );

    micIndicator.className =
        "mic-indicator";


    if (member.mic_on) {

        micIndicator.textContent =
            "🎤";

        micIndicator.classList.add(
            "mic-on"
        );

    } else {

        micIndicator.textContent =
            "🔇";

        micIndicator.classList.add(
            "mic-off"
        );

    }


    seat.appendChild(
        micIndicator
    );


    /* =====================================================
       SAVE SEAT STATE
    ===================================================== */

    seat.dataset.occupied =
        "true";

    seat.dataset.userId =
        member.user_id;

    seat.dataset.memberId =
        member.id;

    seat.dataset.username =
        profile.username ||
        "LARCK User";

    seat.dataset.micOn =
        member.mic_on
            ? "true"
            : "false";

     
    const {
    data: { user: currentUser }
} = await larckSupabase.auth.getUser();

console.log(
    "VOICE EXISTING MEMBER CHECK:",
    "member.user_id =",
    member.user_id,
    "currentUser.id =",
    currentUser ? currentUser.id : null
);

if (
    currentUser &&
    member.user_id !== currentUser.id
) {
    if (
        !larckPeerConnections[
            member.user_id
        ]
    ) {
        console.log(
            "LARCK starting voice connection with:",
            member.user_id
        );

        await connectToRoomMemberVoice(
            member.user_id
        );
    }
}



    /* =====================================================
       UPDATE CURRENT USER MIC BUTTON
    ===================================================== */

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();


    if (
        user &&
        user.id === member.user_id
    ) {

        updateMicButtonVisual(
            member.mic_on
        );

    }
}
/* =========================================================
   REMOVE MEMBER
========================================================= */

function removeRealtimeMember(member) {

    /*
        CLOSE OLD WEBRTC CONNECTION

        When this user leaves, remove only their
        old voice connection so a fresh connection
        can be created if they return.
    */

    const remoteUserId =
        member.user_id;

    if (
        remoteUserId &&
        larckPeerConnections[remoteUserId]
    ) {

        const peerConnection =
            larckPeerConnections[
                remoteUserId
            ];

        peerConnection.close();

        delete larckPeerConnections[
            remoteUserId
        ];

        delete larckPendingIceCandidates[
            remoteUserId
        ];

        const remoteAudio =
            document.getElementById(
                "larck-audio-" +
                remoteUserId
            );

        if (remoteAudio) {

            remoteAudio.pause();

            remoteAudio.srcObject = null;

            remoteAudio.remove();
        }

        console.log(
            "LARCK old voice connection removed:",
            remoteUserId
        );
    }


    const seat =
        document.querySelector(
            `.seat[data-seat="${member.seat_number}"]`
        );

    if (!seat) {
        return;
    }


    /*
        Clear the seat.
    */

    const circle =
        seat.querySelector(
            ".seat-circle"
        );

    circle.classList.remove(
        "occupied"
    );

    circle.innerHTML = `
        <span class="seat-microphone">
            🎤
        </span>
    `;


    const name =
        seat.querySelector(
            ".seat-name"
        );

    const gift =
        seat.querySelector(
            ".seat-gifts"
        );


    if (name) {
        name.remove();
    }

    if (gift) {
        gift.remove();
    }


    const micIndicator =
        seat.querySelector(
            ".mic-indicator"
        );

    if (micIndicator) {
        micIndicator.remove();
    }


    seat.dataset.occupied =
        "false";

    delete seat.dataset.userId;
    delete seat.dataset.memberId;
    delete seat.dataset.username;
    delete seat.dataset.gifts;


    console.log(
        "Seat released:",
        member.seat_number
    );
}


/* =========================================================
   UPDATE MEMBER
========================================================= */

/* =========================================================
   UPDATE MEMBER
========================================================= */

async function refreshRealtimeMember(member) {

    if (!member.is_active) {

        removeRealtimeMember(member);

        return;
    }


    await showRealtimeMember(
        member
    );
}



async function connectToRoomMemberVoice(
    remoteUserId
) {

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();

    if (!user || !window.larckCurrentRoom) {
        return;
    }


    const currentUserSeat =
        await getCurrentUserSeat();


    const {
        data: remoteMember,
        error: remoteMemberError
    } = await larckSupabase
        .from("room_members")
        .select(`
            user_id,
            seat_number,
            mic_on,
            is_active
        `)
        .eq(
            "room_id",
            window.larckCurrentRoom.id
        )
        .eq(
            "user_id",
            remoteUserId
        )
        .eq(
            "is_active",
            true
        )
        .maybeSingle();


    if (remoteMemberError) {

        console.error(
            "LARCK remote member role check error:",
            remoteMemberError
        );

        return;
    }


    if (!remoteMember) {

        console.log(
            "LARCK remote user is no longer active:",
            remoteUserId
        );

        return;
    }


    const currentUserIsSpeaker =
        !!currentUserSeat;

    const remoteUserIsSpeaker =
        !!remoteMember;


    /*
     * ================================================
     * LISTENER → SPEAKER
     * ================================================
     *
     * A listener ALWAYS starts the connection
     * when connecting to a speaker.
     */

    if (
        !currentUserIsSpeaker &&
        remoteUserIsSpeaker
    ) {

        console.log(
            "LARCK LISTENER → SPEAKER:",
            remoteUserId
        );

        await createLarckListenerOffer(
            remoteUserId
        );

        return;
    }


    /*
     * ================================================
     * SPEAKER → LISTENER
     * ================================================
     *
     * Wait for the listener to create
     * the offer.
     */

    if (
        currentUserIsSpeaker &&
        !remoteUserIsSpeaker
    ) {

        console.log(
            "LARCK SPEAKER → LISTENER: waiting for listener.",
            remoteUserId
        );

        return;
    }


    /*
     * ================================================
     * BOTH SPEAKERS
     * ================================================
     *
     * Only ONE speaker creates the offer.
     *
     * The same user always wins, preventing
     * both devices from creating offers.
     */

    if (
        currentUserIsSpeaker &&
        remoteUserIsSpeaker
    ) {

        if (
            user.id < remoteUserId
        ) {

            console.log(
                "LARCK SPEAKER INITIATOR:",
                remoteUserId
            );

            await createLarckVoiceOffer(
                remoteUserId
            );

        } else {

            console.log(
                "LARCK SPEAKER WAITING:",
                remoteUserId
            );

        }

        return;
    }


    /*
     * ================================================
     * BOTH LISTENERS
     * ================================================
     */

    console.log(
        "LARCK BOTH LISTENERS:",
        remoteUserId
    );
}

/* =========================================================
   ENSURE ROOM HOST EXISTS
========================================================= */

async function ensureRoomHostMember() {

    if (!window.larckCurrentRoom) {
        return null;
    }

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();

    if (!user) {
        return null;
    }

    /*
     * ONLY THE ROOM OWNER CAN BE
     * THE HOST MEMBER.
     */

    if (
        window.larckCurrentRoom.owner_id !==
        user.id
    ) {
        return null;
    }

    const roomId =
        window.larckCurrentRoom.id;


    /*
     * CHECK WHETHER HOST ALREADY EXISTS.
     */

    const {
        data: existingMember,
        error: existingError
    } = await larckSupabase
        .from("room_members")
        .select(`
            id,
            room_id,
            user_id,
            seat_number,
            mic_on,
            is_active
        `)
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();


    if (existingError) {

        console.error(
            "LARCK host member check error:",
            existingError
        );

        return null;
    }


    /*
     * HOST ALREADY EXISTS.
     * MAKE SURE THE HOST IS ALWAYS
     * ON SEAT 0.
     */

    if (existingMember) {

        if (
            existingMember.seat_number !== 0
        ) {

            const {
                data: updatedHost,
                error: updateError
            } = await larckSupabase
                .from("room_members")
                .update({
                    seat_number: 0,
                    mic_on: true,
                    is_active: true
                })
                .eq("id", existingMember.id)
                .select()
                .single();

            if (updateError) {

                console.error(
                    "LARCK host seat update error:",
                    updateError
                );

                return existingMember;
            }

            return updatedHost;
        }

        return existingMember;
    }


    /*
     * HOST DOES NOT EXIST.
     * CREATE HOST MEMBER.
     */

    const {
        data: newHost,
        error: insertError
    } = await larckSupabase
        .from("room_members")
        .insert({
            room_id: roomId,
            user_id: user.id,
            seat_number: 0,
            mic_on: true,
            is_active: true
        })
        .select()
        .single();


    if (insertError) {

        console.error(
            "LARCK host member creation error:",
            insertError
        );

        return null;
    }


    console.log(
        "LARCK HOST AUTOMATICALLY REGISTERED:",
        newHost
    );


    return newHost;
}



/* =========================================================
   HOST SEAT
   HOST SEAT NUMBER = 0
========================================================= */

function clearHostSeat() {

    const hostSeat =
        document.querySelector(".host-seat");

    if (!hostSeat) {
        return;
    }

    const hostRing =
        hostSeat.querySelector(".host-ring");

    if (hostRing) {

      hostRing.innerHTML = `
    <span class="host-mic">
        🎤
    </span>
`;
    }

    const hostName =
        hostSeat.querySelector(".host-name");

    if (hostName) {
        hostName.textContent = "";
    }

    const hostGift =
        hostSeat.querySelector(".host-gift");

    if (hostGift) {
        hostGift.textContent = "";
    }

    hostSeat.dataset.occupied =
        "false";

    delete hostSeat.dataset.userId;
    delete hostSeat.dataset.memberId;
    delete hostSeat.dataset.username;
    delete hostSeat.dataset.micOn;
}


/* =========================================================
   SHOW HOST ON HOST SEAT
========================================================= */

async function showRealtimeHostMember(member) {

    if (!member || !member.is_active) {
        return;
    }

    const hostSeat =
        document.querySelector(".host-seat");

    if (!hostSeat) {
        return;
    }

    const {
        data: profile,
        error
    } = await larckSupabase
        .from("profiles")
        .select(`
            username,
            profile_picture
        `)
        .eq("id", member.user_id)
        .single();

    if (error || !profile) {

        console.error(
            "Host profile loading error:",
            error
        );

        return;
    }

    const hostRing =
        hostSeat.querySelector(".host-ring");

    if (hostRing) {

        if (
            profile.profile_picture &&
            profile.profile_picture.trim() !== ""
        ) {

            hostRing.innerHTML = `
                <img
                    src="${profile.profile_picture}"
                    alt="${profile.username}"
                >
                <span class="host-mic">
                    ${member.mic_on ? "🎤" : "🔇"}
                </span>
            `;

        } else {

            hostRing.innerHTML = `
                <span class="host-empty-chair">
                    ${
                        profile.username
                            ? profile.username
                                .charAt(0)
                                .toUpperCase()
                            : "L"
                    }
                </span>

                <span class="host-mic">
                    ${member.mic_on ? "🎤" : "🔇"}
                </span>
            `;
        }
    }

    const hostName =
        hostSeat.querySelector(".host-name");

    if (hostName) {

        hostName.textContent =
            "🎤 " +
            (
                profile.username ||
                "LARCK User"
            );
    }

    const hostGift =
        hostSeat.querySelector(".host-gift");

    if (hostGift) {
        hostGift.textContent =
            "🎁 0";
    }

    hostSeat.dataset.occupied =
        "true";

    hostSeat.dataset.userId =
        member.user_id;

    hostSeat.dataset.memberId =
        member.id;

    hostSeat.dataset.username =
        profile.username ||
        "LARCK User";

    hostSeat.dataset.micOn =
        member.mic_on
            ? "true"
            : "false";


    /* =========================================
       UPDATE CURRENT USER MIC BUTTON
    ========================================= */

    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();

    if (
        user &&
        user.id === member.user_id
    ) {

        updateMicButtonVisual(
            member.mic_on
        );
    }
}


/* =========================================================
   HOST SEAT CLICK
========================================================= */

function setupHostSeat() {

    const hostSeat =
        document.querySelector(".host-seat");

    if (!hostSeat) {
        return;
    }

    clearHostSeat();

    hostSeat.addEventListener(
        "click",
        async function () {

            /* ROOM MUST BE LOADED */

            if (!window.larckCurrentRoom) {
                return;
            }


            /* GET CURRENT USER */

            const {
                data: {
                    user
                }
            } = await larckSupabase.auth.getUser();


            if (!user) {

                alert(
                    "Please sign in first."
                );

                return;
            }


            /* ONLY THE ROOM OWNER CAN USE HOST SEAT */

            if (
                window.larckCurrentRoom.owner_id !==
                user.id
            ) {

                alert(
                    "Only the host can use this seat."
                );

                return;
            }


            /* HOST SEAT ALREADY OCCUPIED */

            if (
                hostSeat.dataset.occupied ===
                "true"
            ) {

                return;
            }


            const roomId =
                window.larckCurrentRoom.id;


            /* CHECK IF HOST ALREADY HAS A SEAT */

            const {
                data: existingMember,
                error: existingError
            } = await larckSupabase
                .from("room_members")
                .select(`
                    id,
                    seat_number
                `)
                .eq("room_id", roomId)
                .eq("user_id", user.id)
                .eq("is_active", true)
                .maybeSingle();


            if (existingError) {

                console.error(
                    "Host member check error:",
                    existingError
                );

                return;
            }


            if (existingMember) {

                if (
                    existingMember.seat_number ===
                    0
                ) {

                    return;
                }

                alert(
                    "You are already sitting on seat " +
                    existingMember.seat_number +
                    "."
                );

                return;
            }


            /* GET HOST PROFILE */

            const {
                data: profile,
                error: profileError
            } = await larckSupabase
                .from("profiles")
                .select(`
                    username,
                    profile_picture
                `)
                .eq("id", user.id)
                .single();


            if (profileError || !profile) {

                console.error(
                    "Host profile error:",
                    profileError
                );

                return;
            }


            /* CREATE HOST MEMBER */

            const {
                data: newMember,
                error: joinError
            } = await larckSupabase
                .from("room_members")
                .insert({

                    room_id: roomId,

                    user_id: user.id,

                    seat_number: 0,

                    mic_on: true,

                    is_active: true

                })
                .select()
                .single();


            if (joinError) {

                console.error(
                    "Host seat join error:",
                    joinError
                );

                alert(
                    "Unable to take the host seat."
                );

                return;
            }


            /* SHOW HOST */

            await showRealtimeHostMember(
                newMember
            );


            /* START HOST MICROPHONE */

            const microphoneStarted =
                await startLocalMicrophone();


            if (!microphoneStarted) {

                console.error(
                    "Host microphone could not start."
                );

                return;
            }


            updateMicButtonVisual(
                true
            );


            /* CONNECT HOST TO OTHER MEMBERS */

            await upgradeLarckVoiceConnections();


            console.log(
                "LARCK HOST IS NOW ON HOST SEAT."
            );
        }
    );
}


/* =========================================================
   START HOST SEAT
========================================================= */

setupHostSeat();




/* =========================================================
   LOAD MEMBERS ALREADY IN THE ROOM
========================================================= */

async function loadExistingRoomMembers() {

    if (!window.larckCurrentRoom) {
        return;
    }

    const roomId =
        window.larckCurrentRoom.id;

    const {
        data: members,
        error
    } = await larckSupabase
        .from("room_members")
        .select(`
            id,
            room_id,
            user_id,
            seat_number,
            mic_on,
            is_active
        `)
        .eq("room_id", roomId)
        .eq("is_active", true)
        .order("seat_number", {
            ascending: true
        });

    if (error) {
        console.error(
            "Existing members loading error:",
            error
        );
        return;
    }

    console.log(
        "EXISTING ROOM MEMBERS:",
        members
    );

   for (const member of members) {

    if (member.seat_number === 0) {

        await showRealtimeHostMember(member);

    } else {

        await showRealtimeMember(member);

    }
    const {
        data: { user: currentUser }
    } = await larckSupabase.auth.getUser();

    if (
        currentUser &&
        member.user_id !== currentUser.id
    ) {

        if (
            !larckPeerConnections[
                member.user_id
            ]
        ) {

            const currentUserSeat =
                await getCurrentUserSeat();

            console.log(
                "LARCK VOICE ROLE:",
                currentUserSeat
                    ? "SPEAKER"
                    : "LISTENER"
            );

            console.log(
                "LARCK connecting to existing room member:",
                member.user_id
            );

            /*
             * SEATED USER
             * Can send microphone.
             */

            await connectToRoomMemberVoice(
            member.user_id
          );
        }
    }
}
}

/* =========================================================
   SYNC RELEASED ROOM SEATS
========================================================= */

async function syncReleasedRoomSeats() {

    if (!window.larckCurrentRoom) {
        return;
    }

    const roomId =
        window.larckCurrentRoom.id;

    const {
        data: members,
        error
    } = await larckSupabase
        .from("room_members")
        .select(`
            id,
            seat_number
        `)
        .eq("room_id", roomId)
        .eq("is_active", true);

    if (error) {
        console.error(
            "Released seat sync error:",
            error
        );
        return;
    }

    const activeMemberIds =
        new Set(
            members.map(function (member) {
                return member.id;
            })
        );

    const occupiedSeats =
        document.querySelectorAll(
            '.seat[data-occupied="true"]'
        );

    occupiedSeats.forEach(function (seat) {

        const memberId =
            seat.dataset.memberId;

        if (
            memberId &&
            !activeMemberIds.has(memberId)
        ) {

            /*
                GET THE USER ID BEFORE
                CLEARING THE SEAT DATA.

                The DELETE realtime event only gives
                us the member row ID, so we use the
                user ID already stored on the seat.
            */

            const remoteUserId =
                seat.dataset.userId;


            /*
                CLOSE THE OLD WEBRTC CONNECTION.

                This is important because when this user
                enters the room again, LARCK must create
                a completely fresh voice connection.
            */

            if (
                remoteUserId &&
                larckPeerConnections[
                    remoteUserId
                ]
            ) {

                const peerConnection =
                    larckPeerConnections[
                        remoteUserId
                    ];

                peerConnection.close();

                delete larckPeerConnections[
                    remoteUserId
                ];

                delete larckPendingIceCandidates[
                    remoteUserId
                ];


                /*
                    Remove the old remote audio element.
                */

                const remoteAudio =
                    document.getElementById(
                        "larck-audio-" +
                        remoteUserId
                    );

                if (remoteAudio) {

                    remoteAudio.pause();

                    remoteAudio.srcObject =
                        null;

                    remoteAudio.remove();
                }


                console.log(
                    "LARCK old voice connection removed:",
                    remoteUserId
                );
            }


            /*
                CLEAR THE SEAT
            */

            const circle =
                seat.querySelector(
                    ".seat-circle"
                );

            if (circle) {

                circle.classList.remove(
                    "occupied"
                );

                circle.innerHTML = `
                    <span class="seat-microphone">
                        🎤
                    </span>
                `;
            }


            const name =
                seat.querySelector(
                    ".seat-name"
                );

            const gift =
                seat.querySelector(
                    ".seat-gifts"
                );

            if (name) {
                name.remove();
            }

            if (gift) {
                gift.remove();
            }


            const micIndicator =
                seat.querySelector(
                    ".mic-indicator"
                );

            if (micIndicator) {
                micIndicator.remove();
            }


            seat.dataset.occupied =
                "false";

            delete seat.dataset.userId;
            delete seat.dataset.memberId;
            delete seat.dataset.username;
            delete seat.dataset.gifts;


            console.log(
                "Released seat:",
                seat.dataset.seat
            );
        }
    });
}
/* =========================================================
   LARCK WEBRTC VOICE SYSTEM
========================================================= */

let larckLocalAudioStream = null;

const larckPeerConnections = {};

const larckPendingIceCandidates = {};

const LARCK_VOICE_ICE_SERVERS = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

function createLarckPeerConnection(remoteUserId) {

    const existingConnection =
        larckPeerConnections[remoteUserId];

    /*
     * If a previous connection exists,
     * check whether it is still usable.
     */

    if (existingConnection) {

        const state =
            existingConnection.connectionState;

        if (
            state === "new" ||
            state === "connecting" ||
            state === "connected"
        ) {

            console.log(
                "LARCK reusing active peer connection:",
                remoteUserId,
                "state:",
                state
            );

            return existingConnection;
        }

        /*
         * The old connection is no longer usable.
         * Completely remove it before creating
         * a fresh WebRTC connection.
         */

        console.log(
            "LARCK removing stale peer connection:",
            remoteUserId,
            "state:",
            state
        );

        try {
            existingConnection.close();
        } catch (error) {
            console.log(
                "LARCK old peer close:",
                error
            );
        }

        delete larckPeerConnections[
            remoteUserId
        ];

        delete larckPendingIceCandidates[
            remoteUserId
        ];

        const oldAudio =
            document.getElementById(
                "larck-audio-" + remoteUserId
            );

        if (oldAudio) {

            oldAudio.pause();

            oldAudio.srcObject = null;

            oldAudio.remove();
        }
    }

    /*
     * CREATE A COMPLETELY NEW
     * WEBRTC CONNECTION.
     */

    const peerConnection =
        new RTCPeerConnection(
            LARCK_VOICE_ICE_SERVERS
        );

    larckPeerConnections[
        remoteUserId
    ] = peerConnection;


    /*
     * ICE CANDIDATES
     */

    peerConnection.onicecandidate =
    async function (event) {

        if (!event.candidate) {
            return;
        }

        await sendLarckVoiceSignal(
            remoteUserId,
            "ice-candidate",
            event.candidate.toJSON()
        );

        console.log(
            "LARCK ICE candidate sent to:",
            remoteUserId
        );
    };


    /*
     * REMOTE AUDIO
     */

    peerConnection.ontrack =
    async function (event) {

        console.log(
            "LARCK remote audio received from:",
            remoteUserId
        );

        let audio =
            document.getElementById(
                "larck-audio-" + remoteUserId
            );

        if (!audio) {

            audio =
                document.createElement(
                    "audio"
                );

            audio.id =
                "larck-audio-" +
                remoteUserId;

            audio.autoplay = true;
            audio.playsInline = true;
            audio.controls = false;

            audio.style.display = "none";

            audio.muted = !speakerOn;

            audio.volume = 1;

            document.body.appendChild(
                audio
            );
        }

        if (
            event.streams &&
            event.streams[0]
        ) {

            audio.srcObject =
                event.streams[0];

            console.log(
                "LARCK remote audio stream attached:",
                remoteUserId
            );

            try {

                await audio.play();

                console.log(
                    "LARCK remote audio PLAYING:",
                    remoteUserId
                );

            } catch (error) {

                console.error(
                    "LARCK remote audio PLAY ERROR:",
                    error
                );
            }
        }
    };


    /*
     * CONNECTION STATE MONITOR
     *
     * This lets us detect when the connection
     * becomes unusable.
     */

    peerConnection.onconnectionstatechange =
    function () {

        const state =
            peerConnection.connectionState;

        console.log(
            "LARCK voice connection state:",
            remoteUserId,
            state
        );

        if (state === "failed") {

    console.log(
        "LARCK ICE FAILED. Attempting ICE restart:",
        remoteUserId
    );

    try {

        peerConnection.restartIce();

    } catch (error) {

        console.error(
            "LARCK ICE restart error:",
            remoteUserId,
            error
        );

    }

    return;
}


if (state === "closed") {

            if (
                larckPeerConnections[
                    remoteUserId
                ] === peerConnection
            ) {

                delete larckPeerConnections[
                    remoteUserId
                ];

                delete larckPendingIceCandidates[
                    remoteUserId
                ];

                const audio =
                    document.getElementById(
                        "larck-audio-" +
                        remoteUserId
                    );

                if (audio) {

                    audio.pause();

                    audio.srcObject = null;

                    audio.remove();
                }

                console.log(
                    "LARCK unusable voice connection removed:",
                    remoteUserId
                );
            }
        }
    };


    console.log(
        "LARCK NEW peer connection created:",
        remoteUserId
    );

    return peerConnection;
}


async function sendLarckVoiceSignal(
    receiverId,
    signalType,
    signalData
) {
    const {
        data: { user }
    } = await larckSupabase.auth.getUser();

    if (!user) {
        return;
    }

    const {
        error
    } = await larckSupabase
        .from("voice_signals")
        .insert({
            room_id:
                window.larckCurrentRoom.id,

            sender_id:
                user.id,

            receiver_id:
                receiverId,

            signal_type:
                signalType,

            signal_data:
                signalData
        });

    if (error) {
        console.error(
            "LARCK voice signal error:",
            error
        );
    }
}

async function startLarckVoiceSignaling() {

    if (!window.larckCurrentRoom) {
        return;
    }

    const {
        data: { user }
    } = await larckSupabase.auth.getUser();

    if (!user) {
        return;
    }

    const voiceChannel =
        larckSupabase
        .channel(
            "larck-voice-signals-" +
            window.larckCurrentRoom.id +
            "-" +
            user.id
        )
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "voice_signals"
            },

            async function (payload) {

                const signal =
                    payload.new;

                console.log(
                    "LARCK VOICE SIGNAL EVENT:",
                    signal
                );

                /*
                Only process signals
                that belong to this user.
                */
                
                console.log(
    "VOICE CHECK:",
    "receiver =", signal.receiver_id,
    "current user =", user.id,
    "type =", signal.signal_type
);

                 if (
                    signal.receiver_id !==
                    user.id
                ) {
                    return;
                }

                console.log(
                    "LARCK VOICE SIGNAL RECEIVED:",
                    signal
                );

                /*
                =================================================
                ICE CANDIDATE
                =================================================
                */
if (
    signal.signal_type ===
    "ice-candidate"
) {

    const remoteUserId =
        signal.sender_id;

    const peerConnection =
        larckPeerConnections[
            remoteUserId
        ];

    if (!peerConnection) {

        console.error(
            "LARCK peer connection not found for ICE candidate:",
            remoteUserId
        );

        return;
    }

    /*
     * Check whether the remote description
     * has already been set.
     */

    if (
        !peerConnection.remoteDescription
    ) {

        /*
         * Remote description is not ready yet.
         * Save this ICE candidate temporarily.
         */

        if (
            !larckPendingIceCandidates[
                remoteUserId
            ]
        ) {

            larckPendingIceCandidates[
                remoteUserId
            ] = [];
        }

        larckPendingIceCandidates[
            remoteUserId
        ].push(
            signal.signal_data
        );

        console.log(
            "LARCK ICE candidate queued. Waiting for remote description:",
            remoteUserId
        );

        return;
    }

    /*
     * Remote description is ready.
     * Add the ICE candidate immediately.
     */

    try {

        await peerConnection.addIceCandidate(
            new RTCIceCandidate(
                signal.signal_data
            )
        );

        console.log(
            "LARCK ICE candidate added from:",
            remoteUserId
        );

    } catch (error) {

        console.error(
            "LARCK ICE candidate error:",
            error
        );
    }

    return;
}
                /*
                =================================================
                ANSWER
                =================================================
                */

                if (
                    signal.signal_type ===
                    "answer"
                ) {

                    const remoteUserId =
                        signal.sender_id;

                    const peerConnection =
                        larckPeerConnections[
                            remoteUserId
                        ];

                    if (!peerConnection) {

                        console.error(
                            "LARCK peer connection not found for answer:",
                            remoteUserId
                        );

                        return;
                    }

                    try {

                        await peerConnection.setRemoteDescription(
                            new RTCSessionDescription(
                                signal.signal_data
                            )
                        );

                        console.log(
                            "LARCK voice answer received from:",
                            remoteUserId
                        );

                    } catch (error) {

                        console.error(
                            "LARCK voice answer error:",
                            error
                        );
                    }

                    return;
                }
/*
=================================================
OFFER
=================================================
*/

if (
    signal.signal_type !==
    "offer"
) {
    return;
}

const remoteUserId =
    signal.sender_id;

const peerConnection =
    createLarckPeerConnection(
        remoteUserId
    );

try {

    /*
     * IMPORTANT:
     * Set the remote offer FIRST.
     */

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(
            signal.signal_data
        )
    );

    console.log(
        "LARCK remote offer set:",
        remoteUserId
    );


    /*
     * ADD ANY ICE CANDIDATES
     * THAT ARRIVED TOO EARLY.
     */

    const pendingCandidates =
        larckPendingIceCandidates[
            remoteUserId
        ];

    if (
        pendingCandidates &&
        pendingCandidates.length > 0
    ) {

        console.log(
            "LARCK adding queued ICE candidates:",
            pendingCandidates.length,
            "from:",
            remoteUserId
        );

        for (
            const candidateData
            of pendingCandidates
        ) {

            try {

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(
                        candidateData
                    )
                );

                console.log(
                    "LARCK queued ICE candidate added from:",
                    remoteUserId
                );

            } catch (error) {

                console.error(
                    "LARCK queued ICE candidate error:",
                    error
                );
            }
        }

        delete larckPendingIceCandidates[
            remoteUserId
        ];
    }


    /*
     * CHECK WHETHER THE CURRENT USER
     * IS SITTING IN THE ROOM.
     */

    const currentUserSeat =
        await getCurrentUserSeat();


    /*
     =================================================
     * CURRENT USER IS A SPEAKER
     =================================================
     */

    if (currentUserSeat) {

        const localStream =
            await getLarckLocalAudioStream();

        if (!localStream) {

            console.error(
                "LARCK could not get local audio for answer."
            );

            return;
        }


        /*
         * Check whether an audio sender
         * already exists.
         */

        let existingAudioSender =
            peerConnection
                .getSenders()
                .find(function (sender) {

                    return (
                        sender.track &&
                        sender.track.kind ===
                        "audio"
                    );

                });


        /*
         * If there is already an audio
         * transceiver, make it SENDRECV.
         */

        const audioTransceiver =
            peerConnection
                .getTransceivers()
                .find(function (transceiver) {

                    return (
                        transceiver.receiver &&
                        transceiver.receiver.track &&
                        transceiver.receiver.track.kind ===
                        "audio"
                    );

                });


        if (audioTransceiver) {

            audioTransceiver.direction =
                "sendrecv";

            console.log(
                "LARCK audio transceiver set to SENDRECV:",
                remoteUserId
            );
        }


        /*
         * Add microphone if this connection
         * does not already have one.
         */

        if (!existingAudioSender) {

            localStream
                .getTracks()
                .forEach(function (track) {

                    peerConnection.addTrack(
                        track,
                        localStream
                    );

                });

            console.log(
                "LARCK speaker answering with microphone:",
                remoteUserId
            );

        } else {

            console.log(
                "LARCK microphone already exists on this connection:",
                remoteUserId
            );
        }

    }


    /*
     =================================================
     * CURRENT USER IS A LISTENER
     =================================================
     */

    else {

        const audioTransceiver =
            peerConnection
                .getTransceivers()
                .find(function (transceiver) {

                    return (
                        transceiver.receiver &&
                        transceiver.receiver.track &&
                        transceiver.receiver.track.kind ===
                        "audio"
                    );

                });


        if (audioTransceiver) {

            audioTransceiver.direction =
                "recvonly";

        } else {

            peerConnection.addTransceiver(
                "audio",
                {
                    direction:
                        "recvonly"
                }
            );
        }

        console.log(
            "LARCK listener answering without microphone:",
            remoteUserId
        );
    }


    /*
     * CREATE ANSWER
     */

    const answer =
        await peerConnection.createAnswer();


    /*
     * SET LOCAL DESCRIPTION
     */

    await peerConnection.setLocalDescription(
        answer
    );


    /*
     * SEND ANSWER BACK
     */

    await sendLarckVoiceSignal(
        remoteUserId,
        "answer",
        {
            type:
                answer.type,

            sdp:
                answer.sdp
        }
    );

    console.log(
        "LARCK voice answer sent to:",
        remoteUserId
    );

} catch (error) {

    console.error(
        "LARCK voice offer handling error:",
        remoteUserId,
        error
    );
}
}
 )
        
       .subscribe(function (status) {

            console.log(
                "LARCK VOICE SIGNALING:",
                status
            );

        });
}

async function createLarckVoiceOffer(
    remoteUserId
) {

    const peerConnection =
        createLarckPeerConnection(
            remoteUserId
        );

    /*
     * CHECK WHETHER CURRENT USER
     * IS ACTUALLY SITTING.
     */

    const currentUserSeat =
        await getCurrentUserSeat();

    /*
     * THIS FUNCTION IS ONLY FOR
     * A USER WHO IS SITTING.
     *
     * A listener uses
     * createLarckListenerOffer().
     */

    if (!currentUserSeat) {

        console.log(
            "LARCK user is not seated. Speaker offer not created."
        );

        return;
    }

    /*
     * GET LOCAL MICROPHONE
     */

    const localStream =
        await getLarckLocalAudioStream();

    if (!localStream) {

        console.error(
            "LARCK could not get local audio for speaker."
        );

        return;
    }

    /*
     * ADD MICROPHONE TRACK
     * ONLY IF IT IS NOT ALREADY
     * CONNECTED TO THIS PEER.
     */
const audioTransceiver =
    peerConnection
        .getTransceivers()
        .find(function (transceiver) {

            return (
                transceiver.receiver &&
                transceiver.receiver.track &&
                transceiver.receiver.track.kind ===
                "audio"
            );

        });

const existingSender =
    peerConnection
        .getSenders()
        .find(function (sender) {

            return (
                sender.track &&
                sender.track.kind ===
                "audio"
            );

        });

console.log(
    "LARCK VOICE UPGRADE CHECK:",
    "remote:",
    remoteUserId,
    "audioTransceiver:",
    !!audioTransceiver,
    "existingSender:",
    !!existingSender
);

if (audioTransceiver) {

    audioTransceiver.direction =
        "sendrecv";

    console.log(
        "LARCK audio connection upgraded to SENDRECV:",
        remoteUserId
    );
}

if (!existingSender) {

    localStream
        .getTracks()
        .forEach(function (track) {

            peerConnection.addTrack(
                track,
                localStream
            );

        });

    console.log(
        "LARCK microphone added to speaker connection:",
        remoteUserId
    );
}

    /*
     * CREATE OFFER
     */

    const offer =
        await peerConnection.createOffer();

    /*
     * SAVE LOCAL OFFER
     */

    await peerConnection.setLocalDescription(
        offer
    );

    /*
     * SEND OFFER TO REMOTE USER
     */

    await sendLarckVoiceSignal(
        remoteUserId,
        "offer",
        {
            type:
                offer.type,

            sdp:
                offer.sdp
        }
    );

    console.log(
        "LARCK speaker offer sent to:",
        remoteUserId
    );
}


/* =========================================================
   UPGRADE EXISTING LISTENER CONNECTION TO SPEAKER
========================================================= */

async function upgradeLarckVoiceConnections() {

    const currentUserSeat =
        await getCurrentUserSeat();

    if (!currentUserSeat) {

        console.log(
            "LARCK user is not seated. No voice upgrade needed."
        );

        return;
    }


    const {
        data: {
            user
        }
    } = await larckSupabase.auth.getUser();

    if (!user) {
        return;
    }


    for (
        const remoteUserId
        in larckPeerConnections
    ) {

        const peerConnection =
            larckPeerConnections[
                remoteUserId
            ];


        if (!peerConnection) {
            continue;
        }


        /*
         * CHECK REMOTE USER
         */

        const {
            data: remoteMember,
            error
        } = await larckSupabase
            .from("room_members")
            .select(`
                user_id,
                seat_number,
                is_active
            `)
            .eq(
                "room_id",
                window.larckCurrentRoom.id
            )
            .eq(
                "user_id",
                remoteUserId
            )
            .eq(
                "is_active",
                true
            )
            .maybeSingle();


        if (error || !remoteMember) {
            continue;
        }


        /*
         * BOTH USERS ARE NOW SPEAKERS.
         *
         * Only the user with the smaller ID
         * creates the new offer.
         */

        if (
            user.id < remoteUserId
        ) {

            console.log(
                "LARCK upgrading speaker connection:",
                remoteUserId
            );

            try {

                await createLarckVoiceOffer(
                    remoteUserId
                );

            } catch (error) {

                console.error(
                    "LARCK voice upgrade failed:",
                    remoteUserId,
                    error
                );

            }

        } else {

            console.log(
                "LARCK voice upgrade waiting for remote:",
                remoteUserId
            );

        }
    }
}


/* =========================================================
   LARCK LISTENER VOICE OFFER
   LISTEN WITHOUT MICROPHONE
========================================================= */

async function createLarckListenerOffer(
    remoteUserId
) {

    const peerConnection =
        createLarckPeerConnection(
            remoteUserId
        );

    /*
     * Listener only receives audio.
     * No microphone permission is requested.
     */

    const existingTransceiver =
        peerConnection
            .getTransceivers()
            .find(function (transceiver) {

                return (
                    transceiver.receiver &&
                    transceiver.receiver.track &&
                    transceiver.receiver.track.kind ===
                    "audio"
                );

            });

    if (!existingTransceiver) {

        peerConnection.addTransceiver(
            "audio",
            {
                direction: "recvonly"
            }
        );

    }

    const offer =
        await peerConnection.createOffer();

    await peerConnection.setLocalDescription(
        offer
    );

    await sendLarckVoiceSignal(
        remoteUserId,
        "offer",
        {
            type:
                offer.type,

            sdp:
                offer.sdp
        }
    );

    console.log(
        "LARCK listener offer sent to:",
        remoteUserId
    );
}




/* =========================================================
   GET LARCK LOCAL AUDIO STREAM
========================================================= */

async function getLarckLocalAudioStream() {

    if (localAudioStream) {
        return localAudioStream;
    }

    try {

        localAudioStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        larckLocalAudioStream =
            localAudioStream;

        console.log(
            "LARCK local audio stream ready."
        );

        return larckLocalAudioStream;

    } catch (error) {

        console.error(
            "LARCK microphone access error:",
            error
        );

        return null;
    }
}

const roomPower =
    document.getElementById("roomPower");

const roomPowerPopup =
    document.getElementById("roomPowerPopup");

const minimizeRoom =
    document.getElementById("minimizeRoom");


if (roomPower && roomPowerPopup) {

    roomPower.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            roomPowerPopup.classList.toggle("show");

        }
    );

}


document.addEventListener(
    "click",
    function () {

        if (roomPowerPopup) {

            roomPowerPopup.classList.remove("show");

        }

    }
);


if (roomPowerPopup) {

    roomPowerPopup.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );

}