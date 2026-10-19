console.log("LARCK page2.js is running");

/* =========================================
   LARCK HOME JAVASCRIPT
========================================= */

/* =========================================
   SUPABASE
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
   LOAD HOME BANNERS FROM SUPABASE
========================================= */

async function loadLarckHomeBanners() {
    const track = document.getElementById("larckCarouselTrack");
    const dots = document.getElementById("larckCarouselDots");

    if (!track || !dots) return;

    try {
        const { data: banners, error } = await larckSupabase
            .from("home_banners")
            .select("id, title, image_url, sort_order")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

            console.log("Supabase banners:", banners);
console.log("Supabase banner error:", error);

        if (error) throw error;

        if (!banners || banners.length === 0) {
            track.innerHTML = `
                <div class="larck-banner-loading">
                    No banners available.
                </div>
            `;
            dots.innerHTML = "";
            return;
        }

        track.innerHTML = banners.map((banner) => `
            <article class="larck-slide larck-image-slide">
                <img
                    class="larck-banner-image"
                    src="${escapeBannerAttribute(banner.image_url)}"
                    alt="${escapeBannerAttribute(banner.title || "LARCK banner")}"
                >
            </article>
        `).join("");

        dots.innerHTML = banners.map((banner, index) => `
            <span class="${index === 0 ? "active" : ""}"></span>
        `).join("");

        // Refresh the existing carousel using its existing initializer,
        // if it exposes one. Do not create a second carousel handler.
        if (typeof window.initLarckCarousel === "function") {
            window.initLarckCarousel();
        }

    } catch (error) {
        console.error("Could not load LARCK home banners:", error);

        track.innerHTML = `
            <div class="larck-banner-loading">
                Could not load banners.
            </div>
        `;
        dots.innerHTML = "";
    }
}

function escapeBannerAttribute(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

loadLarckHomeBanners();
console.log("Home banner loader started");

console.log(
    "Carousel track found:",
    !!document.getElementById("larckCarouselTrack")
);




/* =========================================
   TOP TABS
========================================= */

const topTabs = document.querySelectorAll(".top-tab");

topTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        topTabs.forEach(function (item) {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        const selectedTab =
            (tab.dataset.tab || "hot").toLowerCase();

       activeHomeTab = selectedTab;

console.log("Selected Home tab:", selectedTab);

loadPopularParties(activeHomeTab);
    });
});


/* =========================================
   SEARCH
========================================= */

const searchButton =
    document.getElementById("searchButton");

const homeSearch =
    document.getElementById("homeSearch");

const searchBackButton =
    document.getElementById("searchBackButton");

const homeSearchInput =
    document.getElementById("homeSearchInput");

const homeHeader =
    document.querySelector(".home-header");


/* OPEN SEARCH */

searchButton.addEventListener("click", function () {

    homeHeader.classList.add("search-active");
    homeHeader.classList.add("search-mode");

    homeSearch.classList.add("show");

    userSearchResults.innerHTML = "";
    userSearchResults.classList.remove("show");

    setTimeout(function () {
        homeSearchInput.focus();
    }, 100);
});

/* CLOSE SEARCH */

searchBackButton.addEventListener("click", function () {

    homeSearch.classList.remove("show");

    homeHeader.classList.remove("search-active");
    homeHeader.classList.remove("search-mode");

    homeSearchInput.value = "";

    userSearchResults.innerHTML = "";
    userSearchResults.classList.remove("show");
});


/* =========================================
   SEARCH LARCK USERS BY ID
========================================= */

const userSearchResults =
    document.getElementById("userSearchResults");


homeSearchInput.addEventListener("input", async function () {

    const searchValue =
        homeSearchInput.value.trim();


    /* CLEAR RESULTS */

    if (searchValue === "") {

        userSearchResults.innerHTML = "";

        userSearchResults.classList.remove("show");

        return;

    }


    /* SEARCH MESSAGE */

    userSearchResults.innerHTML = `
        <div class="user-search-message">
            Searching...
        </div>
    `;

    userSearchResults.classList.add("show");


    try {

        const { data, error } =
            await larckSupabase
                .from("profiles")
                .select("larck_id, username, profile_picture")
                .eq("larck_id", searchValue)
                .maybeSingle();


        if (error) {

            console.error(
                "LARCK ID search error:",
                error
            );

            userSearchResults.innerHTML = `
                <div class="user-search-message">
                    Something went wrong. Please try again.
                </div>
            `;

            return;

        }


        /* USER NOT FOUND */

        if (!data) {

            userSearchResults.innerHTML = `
                <div class="user-search-message">
                    No LARCK user found with this ID.
                </div>
            `;

            return;

        }


        /* USER FOUND */

        userSearchResults.innerHTML = `

            <div class="user-search-result" id="foundUserResult">

                <img
                    class="user-search-avatar"
                    src="${data.profile_picture || "default-avatar.png"}"
                    alt=""
                >

                <div class="user-search-info">

                    <div class="user-search-username">
                        ${data.username}
                    </div>

                    <div class="user-search-id">
                        ${data.larck_id}
                    </div>

                </div>

            </div>

        `;


        /* CLICK USER RESULT */

        const foundUserResult =
            document.getElementById("foundUserResult");


        foundUserResult.addEventListener(
            "click",
            function () {

                console.log(
                    "Opening profile:",
                    data.larck_id
                );

                // Open the person's profile using their LARCK ID
        window.location.href =
            "profile.html?id=" + encodeURIComponent(data.larck_id);

            }
        );


    } catch (error) {

        console.error(
            "Unexpected search error:",
            error
        );

        userSearchResults.innerHTML = `
            <div class="user-search-message">
                Something went wrong. Please try again.
            </div>
        `;

    }

});


/* =========================================
   NOTIFICATIONS
========================================= */

const notificationButton =
    document.getElementById("notificationButton");

notificationButton.addEventListener("click", function () {

    alert("Your LARCK notifications will appear here.");

});


/* =========================================
   COUNTRY SELECTOR
========================================= */

const countryMoreButton =
    document.getElementById("countryMoreButton");

const countryPopup =
    document.getElementById("countryPopup");

const closeCountryPopup =
    document.getElementById("closeCountryPopup");

const allCountryButton =
    document.getElementById("allCountryButton");


countryMoreButton.addEventListener("click", function () {

    countryPopup.classList.add("show");

});


closeCountryPopup.addEventListener("click", function () {

    countryPopup.classList.remove("show");

});


countryPopup.addEventListener("click", function (event) {

    if (event.target === countryPopup) {
        countryPopup.classList.remove("show");
    }

});


/* =========================================
   COUNTRY FILTER
========================================= */

let selectedPartyCountry = "all";
let activeHomeTab = "hot";

function normalizeCountry(country) {
    const value = String(country || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

    const aliases = {
        "all countries": "all",
        "united states": "usa",
        "us": "usa",
        "united states of america": "usa",
        "united kingdom": "uk",
        "great britain": "uk",
        "republic of the philippines": "philippines"
    };

    return aliases[value] || value;
}

const countryButtons = document.querySelectorAll(
    ".country-button, .all-countries button"
);

countryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedPartyCountry = normalizeCountry(
            button.textContent
        );

        console.log(
            "Country filter:",
            selectedPartyCountry
        );

        countryButtons.forEach(function (item) {
            item.classList.remove("active");
            item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");

        countryPopup.classList.remove("show");

        loadPopularParties(activeHomeTab);
    });
});

/* =========================================
   LOAD AND RANK LARCK PARTY ROOMS
========================================= */

const popularPartyGrid =
    document.getElementById("popularPartyGrid");

function getCountryFlag(country) {
    const flags = {
        "nigeria": "🇳🇬",
        "ghana": "🇬🇭",
        "kenya": "🇰🇪",
        "south africa": "🇿🇦",
        "united states": "🇺🇸",
        "usa": "🇺🇸",
        "united kingdom": "🇬🇧",
        "uk": "🇬🇧",
        "canada": "🇨🇦",
        "india": "🇮🇳",
        "philippines": "🇵🇭",
        "australia": "🇦🇺",
        "france": "🇫🇷",
        "germany": "🇩🇪",
        "brazil": "🇧🇷"
    };

    return flags[
        (country || "").trim().toLowerCase()
    ] || "🌍";
}

function escapePartyText(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

let partyLoadRequest = 0;

async function loadPopularParties(selectedTab = "hot") {
    if (!popularPartyGrid) return;

    const requestId = ++partyLoadRequest;

    selectedTab = String(selectedTab).toLowerCase();

    popularPartyGrid.innerHTML =
        '<div class="party-loading">Loading parties...</div>';

    try {
        let rooms = [];

        /* =====================================
           FOLLOW TAB
        ===================================== */

        if (selectedTab === "follow") {
            const {
                data: { user },
                error: authError
            } = await larckSupabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                if (requestId !== partyLoadRequest) return;

                popularPartyGrid.innerHTML =
                    '<div class="party-loading">Please sign in to see parties from users you follow.</div>';

                return;
            }

            const { data: follows, error: followsError } =
                await larckSupabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", user.id);

            if (followsError) throw followsError;

            const followingIds = [
                ...new Set(
                    (follows || [])
                        .map(item => item.following_id)
                        .filter(Boolean)
                )
            ];

            if (followingIds.length === 0) {
                if (requestId !== partyLoadRequest) return;

                popularPartyGrid.innerHTML =
                    '<div class="party-loading">You are not following anyone yet.</div>';

                return;
            }

            const { data, error } = await larckSupabase
                .from("rooms")
                .select(
                    "id, created_at, owner_id, name, room_id, label, is_locked"
                )
                .in("owner_id", followingIds)
                .order("created_at", { ascending: false });

            if (error) throw error;

            rooms = data || [];
        }

        /* =====================================
           NEW TAB — LAST 7 DAYS
        ===================================== */

        else if (selectedTab === "new") {
            const sevenDaysAgo = new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString();

            const { data, error } = await larckSupabase
                .from("rooms")
                .select(
                    "id, created_at, owner_id, name, room_id, label, is_locked"
                )
                .gte("created_at", sevenDaysAgo)
                .order("created_at", { ascending: false });

            if (error) throw error;

            rooms = data || [];
        }

        /* =====================================
           HOT TAB — ALL PARTIES
        ===================================== */

        else {
            const { data, error } = await larckSupabase
                .from("rooms")
                .select(
                    "id, created_at, owner_id, name, room_id, label, is_locked"
                )
                .order("created_at", { ascending: false });

            if (error) throw error;

            rooms = data || [];

            /*
             * Count active members using:
             * room_members.room_id = rooms.id
             */

            if (rooms.length > 0) {
                const roomRecordIds =
                    rooms.map(room => room.id).filter(Boolean);

                const activeCounts = new Map();

                rooms.forEach(function (room) {
                    activeCounts.set(room.id, 0);
                });

                /*
                 * Supabase may limit returned rows.
                 * Read member rows in batches of room IDs.
                 */

                const batchSize = 100;

                for (
                    let start = 0;
                    start < roomRecordIds.length;
                    start += batchSize
                ) {
                    const batch =
                        roomRecordIds.slice(start, start + batchSize);

                    const { data: members, error: membersError } =
                        await larckSupabase
                            .from("room_members")
                            .select("room_id, user_id")
                            .eq("is_active", true)
                            .in("room_id", batch);

                    if (membersError) throw membersError;

                    /*
                     * Count unique users in each party.
                     */

                    const usersByRoom = new Map();

                    (members || []).forEach(function (member) {
                        if (!member.room_id || !member.user_id) {
                            return;
                        }

                        if (!usersByRoom.has(member.room_id)) {
                            usersByRoom.set(
                                member.room_id,
                                new Set()
                            );
                        }

                        usersByRoom
                            .get(member.room_id)
                            .add(member.user_id);
                    });

                    usersByRoom.forEach(function (users, roomId) {
                        activeCounts.set(roomId, users.size);
                    });
                }

                /*
                 * Busiest party first.
                 * Newest party wins ties.
                 */

                rooms.sort(function (a, b) {
                    const countA = activeCounts.get(a.id) || 0;
                    const countB = activeCounts.get(b.id) || 0;

                    if (countB !== countA) {
                        return countB - countA;
                    }

                    return new Date(b.created_at || 0) -
                           new Date(a.created_at || 0);
                });
            }
        }

        if (requestId !== partyLoadRequest) return;

        /* =====================================
           EMPTY STATE
        ===================================== */

        if (rooms.length === 0) {
            const emptyMessages = {
                follow: "No parties from users you follow are available.",
                new: "No parties have been created in the last 7 days.",
                hot: "No parties available yet."
            };

            popularPartyGrid.innerHTML =
                '<div class="party-loading">' +
                escapePartyText(
                    emptyMessages[selectedTab] || emptyMessages.hot
                ) +
                '</div>';

            return;
        }

        /* =====================================
           LOAD PARTY OWNERS' PROFILES
        ===================================== */

        const ownerIds = [
            ...new Set(
                rooms.map(room => room.owner_id).filter(Boolean)
            )
        ];

        let profilesById = new Map();

        if (ownerIds.length > 0) {
            const { data: profiles, error: profilesError } =
                await larckSupabase
                    .from("profiles")
                    .select(
                        "id, username, profile_picture, country, larck_id"
                    )
                    .in("id", ownerIds);

            if (profilesError) throw profilesError;

            profilesById = new Map(
                (profiles || []).map(profile => [
                    profile.id,
                    profile
                ])
            );
        }

        if (requestId !== partyLoadRequest) return;

        
        /* =====================================
        FILTER PARTIES BY HOST COUNTRY
        ===================================== */

if (selectedPartyCountry !== "all") {
    rooms = rooms.filter(function (room) {
        const profile = profilesById.get(room.owner_id);

        return normalizeCountry(profile?.country) ===
            selectedPartyCountry;
    });
}

/* HANDLE NO PARTIES IN SELECTED COUNTRY */

if (rooms.length === 0) {
    popularPartyGrid.innerHTML =
        '<div class="party-loading">' +
        'No parties available in ' +
        escapePartyText(
            selectedPartyCountry === "all"
                ? "any country"
                : selectedPartyCountry.toUpperCase()
        ) +
        ' for this tab.</div>';

    return;
}



        /* =====================================
           RENDER PARTY CARDS
        ===================================== */

        popularPartyGrid.innerHTML = "";

        rooms.forEach(function (room) {
            const profile = profilesById.get(room.owner_id);

            const username =
                profile?.username || room.name || "LARCK User";

            const defaultAvatar = "default-avatar.png";

            const profilePicture =
                profile?.profile_picture?.trim() || defaultAvatar;

            const countryFlag =
                getCountryFlag(profile?.country);

            const displayId =
                profile?.larck_id || room.room_id || "—";

            const card = document.createElement("article");

            card.className = "home-party-card";
            card.tabIndex = 0;

            card.dataset.roomId = room.room_id ?? "";
            card.dataset.roomRecordId = room.id ?? "";
            card.dataset.roomName = room.name ?? "LARCK Party";
            card.dataset.isLocked = String(room.is_locked ?? false);

            card.innerHTML = `
                <div class="party-cover">
                    <div class="party-top-left">
                        <span class="party-mic">🎙</span>
                        <span>Party</span>
                    </div>

                    <div class="party-live-count">
                        ${room.is_locked
                            ? '<span aria-label="Locked">🔒</span>'
                            : ""}
                    </div>

                    <div class="party-cover-image"></div>

                    <div class="party-bottom-info">
                        <div class="party-host-details">
                            <div class="party-country-id">
                                <span class="party-country-flag">
                                    ${countryFlag}
                                </span>

                                <span>
                                    ID: ${escapePartyText(displayId)}
                                </span>
                            </div>

                            <h3 class="party-host-name">
                                ${escapePartyText(username)}
                            </h3>
                        </div>

                        <img
                            class="party-profile-picture"
                            src="${escapePartyText(profilePicture)}"
                            alt="Host profile picture"
                        >
                    </div>
                </div>
            `;

            const coverImage =
                card.querySelector(".party-cover-image");

            const avatar =
                card.querySelector(".party-profile-picture");

            function useLarckAvatar() {
                coverImage.style.backgroundImage =
                    `url("${defaultAvatar}")`;

                avatar.src = defaultAvatar;
            }

            coverImage.style.backgroundImage =
                `url("${profilePicture.replace(/["\\]/g, "\\$&")}")`;

            coverImage.style.backgroundSize = "cover";
            coverImage.style.backgroundPosition = "center";

            avatar.addEventListener(
                "error",
                useLarckAvatar,
                { once: true }
            );

            const coverTest = new Image();

            coverTest.onerror = useLarckAvatar;
            coverTest.src = profilePicture;

            popularPartyGrid.appendChild(card);
        });

    } catch (error) {
        console.error(
            "Could not load LARCK parties:",
            error
        );

        if (requestId !== partyLoadRequest) return;

        popularPartyGrid.innerHTML =
            '<div class="party-loading">Could not load parties. Please try again.</div>';
    }
}

/* =========================================
   LOAD DEFAULT TAB
========================================= */

loadPopularParties("hot");


/* =========================================
   OPEN PARTY WHEN CARD IS TAPPED
========================================= */

if (popularPartyGrid) {

    function openSelectedParty(card) {
        if (!card) return;

        const roomId = card.dataset.roomRecordId;
        const roomName = card.dataset.roomName || "LARCK Party";
        const isLocked = card.dataset.isLocked === "true";

        if (!roomId) {
            console.error("Cannot open party: Room record ID is missing.");
            alert("This party could not be opened. Please try again.");
            return;
        }

        // Keep locked parties protected.
        if (isLocked) {
            alert("This party is locked.");
            return;
        }

        const params = new URLSearchParams({
            roomId: roomId,
            room: roomName
        });

        window.location.href = "page6.html?" + params.toString();
    }

    // Open party when tapped or clicked.
    popularPartyGrid.addEventListener("click", function (event) {
        const card = event.target.closest(".home-party-card");

        if (!card || !popularPartyGrid.contains(card)) return;

        openSelectedParty(card);
    });

    // Also support Enter and Space on a focused party card.
    popularPartyGrid.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;

        const card = event.target.closest(".home-party-card");

        if (!card || !popularPartyGrid.contains(card)) return;

        event.preventDefault();
        openSelectedParty(card);
    });

}




/* =========================================
   SEE ALL
========================================= */

const popularSeeAll =
    document.getElementById("popularSeeAll");


popularSeeAll.addEventListener("click", function () {

    alert(
        "All popular parties will appear here."
    );

});


/* =========================================
   CREATE PARTY
========================================= */

const createPartyButton =
    document.getElementById("createPartyButton");


createPartyButton.addEventListener("click", function () {

    alert(
        "Create Party screen will open here."
    );

});



/* =========================================
   CLOSE POPUPS WITH ESCAPE
========================================= */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        countryPopup.classList.remove("show");

        homeSearch.classList.remove("show");

        homeHeader.classList.remove("search-active");
        homeHeader.classList.remove("search-mode");

        homeSearchInput.value = "";

        userSearchResults.innerHTML = "";
        userSearchResults.classList.remove("show");
    }
});


/* =========================================
   LARCK PAGE NAVIGATION
========================================= */

const bottomNavItems =
    document.querySelectorAll(".bottom-nav-item");


bottomNavItems.forEach(function (item) {

    item.addEventListener("click", function () {

        const page =
            item.dataset.page;


        if (page === "home") {

            window.location.href = "page2.html";

        }

        else if (page === "party") {

            window.location.href = "page3.html";

        }

        else if (page === "message") {

            window.location.href = "page4.html";

        }

        else if (page === "me") {

            window.location.href = "page5.html";

        }

    });

});



/* =========================================
   LARCK AUTOMATIC BANNER CAROUSEL
========================================= */

window.initLarckCarousel = function initLarckCarousel() {
    const carousel = document.getElementById("larckCarousel");
    const slides = Array.from(
        document.querySelectorAll("#larckCarouselTrack .larck-slide")
    );
    const dots = Array.from(
        document.querySelectorAll("#larckCarouselDots span")
    );

   if (!carousel || slides.length === 0) return;

    let currentIndex = 0;
    let slideTimer = null;
    let isAnimating = false;

    const slideDuration = 750;
    const pauseBetweenSlides = 3500;

    slides.forEach((slide, index) => {
        slide.classList.remove("is-active", "is-leaving");
        slide.setAttribute("aria-hidden", "true");

        if (index === 0) {
            slide.classList.add("is-active");
            slide.setAttribute("aria-hidden", "false");
        }
    });

    function updateDots(index) {
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === index);
        });
    }

    function showNextSlide() {
        if (isAnimating) return;

        isAnimating = true;

        const previousSlide = slides[currentIndex];
        const nextIndex = (currentIndex + 1) % slides.length;
        const nextSlide = slides[nextIndex];

        // Prepare the next slide just outside the left edge.
        nextSlide.classList.remove("is-leaving", "is-active");
        nextSlide.style.transition = "none";
        nextSlide.style.transform = "translateX(-100%)";
        nextSlide.style.opacity = "0";
        nextSlide.style.visibility = "visible";

        // Apply the starting position before animation.
        void nextSlide.offsetWidth;

        nextSlide.style.removeProperty("transition");
        nextSlide.style.removeProperty("transform");
        nextSlide.style.removeProperty("opacity");
        nextSlide.classList.add("is-active");

        // Move the current slide out to the right.
        previousSlide.classList.remove("is-active");
        previousSlide.classList.add("is-leaving");

        currentIndex = nextIndex;
        updateDots(currentIndex);

        window.setTimeout(() => {
            previousSlide.classList.remove("is-leaving");
            previousSlide.style.visibility = "hidden";
            previousSlide.style.transform = "translateX(-100%)";
            previousSlide.style.opacity = "0";

            nextSlide.style.removeProperty("visibility");
            nextSlide.style.removeProperty("transform");
            nextSlide.style.removeProperty("opacity");

            isAnimating = false;
        }, slideDuration);
    }

    function startCarousel() {
        stopCarousel();
        slideTimer = window.setInterval(
            showNextSlide,
            slideDuration + pauseBetweenSlides
        );
    }

    function stopCarousel() {
        if (slideTimer !== null) {
            window.clearInterval(slideTimer);
            slideTimer = null;
        }
    }

    carousel.addEventListener("mouseenter", stopCarousel);
    carousel.addEventListener("mouseleave", startCarousel);

    carousel.addEventListener("focusin", stopCarousel);
    carousel.addEventListener("focusout", startCarousel);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopCarousel();
        } else {
            startCarousel();
        }
    });

   updateDots(currentIndex);

// A single banner should still display, even without autoplay.
if (slides.length < 2) {
    return;
}

startCarousel();
};
