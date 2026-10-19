/* =========================================================
   VISITORS PAGE
========================================================= */


/* =========================================================
   SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL = "https://hxtwdzvnqtxoutdetfoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hEot0ds6XIcLYo7Fj8xtUQ_0ICFxMBV";

const larckSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);



/* =========================================================
   VARIABLES
========================================================= */

let allVisitors = [];

let currentFilter = "today";


/* =========================================================
   GET VISITORS
========================================================= */

async function loadVisitors() {

    const visitorsList = document.getElementById("visitorsList");

    try {

        /* -----------------------------------------------
           GET CURRENT USER
        ------------------------------------------------ */

        const {
            data: { user },
            error: userError
        } = await larckSupabase.auth.getUser();

        if (userError || !user) {
            console.error("Could not get logged-in user.");
            window.location.href = "index.html";
            return;
        }


        /* -----------------------------------------------
           GET VISITOR RECORDS
        ------------------------------------------------ */

        const {
            data: visitorRows,
            error: visitorError
        } = await larckSupabase
            .from("profile_visitors")
            .select("visitor_id, created_at")
            .eq("profile_owner_id", user.id)
            .order("created_at", {
                ascending: false
            });


        if (visitorError) {

            console.error(
                "Could not load visitors:",
                visitorError
            );

            visitorsList.innerHTML = `
                <div class="no-visitors">
                    Could not load visitors.
                </div>
            `;

            return;
        }


        /* -----------------------------------------------
           NO VISITORS
        ------------------------------------------------ */

        if (!visitorRows || visitorRows.length === 0) {

            allVisitors = [];

            updateCounts();

            showVisitors();

            return;
        }


        /* -----------------------------------------------
           GET VISITOR IDs
        ------------------------------------------------ */

        const visitorIds =
            visitorRows.map(visitor => visitor.visitor_id);


        // Get the country of the person who owns this Visitors page
const {
    data: ownerProfile,
    error: ownerProfileError
} = await larckSupabase
    .from("profiles")
    .select("country")
    .eq("id", user.id)
    .single();

if (ownerProfileError) {
    console.error(
        "Could not load profile owner's country:",
        ownerProfileError
    );
}


        /* -----------------------------------------------
           GET THEIR PROFILES
        ------------------------------------------------ */

        const {
            data: profiles,
            error: profilesError
        } = await larckSupabase
            .from("profiles")
            .select(
                "id, username, larck_id, profile_picture, country"
            )
            .in("id", visitorIds);


        if (profilesError) {

            console.error(
                "Could not load visitor profiles:",
                profilesError
            );

            visitorsList.innerHTML = `
                <div class="no-visitors">
                    Could not load visitor profiles.
                </div>
            `;

            return;
        }


        // Store the owner's timezone for the date filters
        window.larckOwnerTimezone =
        getTimezoneFromCountry(
        ownerProfile?.country
        );


        /* -----------------------------------------------
           CREATE PROFILE MAP
        ------------------------------------------------ */

        const profileMap = new Map();

        profiles.forEach(profile => {
            profileMap.set(profile.id, profile);
        });


        console.log("VISITOR TIMESTAMPS:", visitorRows);
        console.log("PHONE DATE:", new Date().toString());
        console.log("PHONE ISO:", new Date().toISOString());


        /* -----------------------------------------------
           COMBINE VISITS + PROFILES
        ------------------------------------------------ */

        allVisitors = visitorRows
            .map(visitor => {

                const profile =
                    profileMap.get(visitor.visitor_id);

                if (!profile) return null;

                return {
                    visitor_id: visitor.visitor_id,

                    created_at: visitor.created_at,

                    username:
                        profile.username || "Username",

                    larck_id:
                        profile.larck_id || "",

                    profile_picture:
                        profile.profile_picture ||
                        "images/default-avatar.png"
                };

            })
            .filter(visitor => visitor !== null);


          updateCounts();

          currentFilter = "today";

          showVisitors();


    } catch (error) {

        console.error(
            "Visitors page error:",
            error
        );

        visitorsList.innerHTML = `
            <div class="no-visitors">
                Something went wrong.
            </div>
        `;
    }
}


/* =========================================================
   COUNTRY → TIMEZONE
========================================================= */

function getTimezoneFromCountry(country) {

    const timezones = {

        "Nigeria": "Africa/Lagos",

        "United States": "America/New_York",
        "USA": "America/New_York",

        "United Kingdom": "Europe/London",
        "UK": "Europe/London",

        "Canada": "America/Toronto",

        "Ghana": "Africa/Accra",

        "South Africa": "Africa/Johannesburg",

        "Kenya": "Africa/Nairobi",

        "India": "Asia/Kolkata",

        "Brazil": "America/Sao_Paulo",

        "France": "Europe/Paris",

        "Germany": "Europe/Berlin",

        "Italy": "Europe/Rome",

        "Spain": "Europe/Madrid",

        "Japan": "Asia/Tokyo",

        "South Korea": "Asia/Seoul",

        "Australia": "Australia/Sydney",

        "China": "Asia/Shanghai",

        "Mexico": "America/Mexico_City",

        "Turkey": "Europe/Istanbul",

        "United Arab Emirates": "Asia/Dubai"

    };

    return timezones[country] || "Africa/Lagos";
}


/* =========================================================
   DATE FILTER
========================================================= */

function isWithinFilter(dateString, filter) {

    const visitDate = new Date(dateString);
    const now = new Date();

    // Make sure both dates are valid
    if (isNaN(visitDate.getTime())) {
        return false;
    }

    /* =====================================================
       TODAY
    ===================================================== */

    if (filter === "today") {

    const nowLocal = new Date();

    const todayYear = nowLocal.getFullYear();
    const todayMonth = nowLocal.getMonth();
    const todayDate = nowLocal.getDate();

    const visitLocal = new Date(visitDate);

    return (
        visitLocal.getFullYear() === todayYear &&
        visitLocal.getMonth() === todayMonth &&
        visitLocal.getDate() === todayDate
    );
}

    /* =====================================================
       THIS WEEK
    ===================================================== */

    if (filter === "week") {

        const startOfWeek = new Date(now);

        // Sunday = beginning of week
        startOfWeek.setDate(
            now.getDate() - now.getDay()
        );

        startOfWeek.setHours(
            0,
            0,
            0,
            0
        );

        return visitDate >= startOfWeek;
    }


    /* =====================================================
       THIS MONTH
    ===================================================== */

    if (filter === "month") {

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0,
            0
        );

        const startOfNextMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1,
            0,
            0,
            0,
            0
        );

        return (
            visitDate >= startOfMonth &&
            visitDate < startOfNextMonth
        );
    }


    return false;
}


/* =========================================================
   UPDATE COUNTS
========================================================= */

function updateCounts() {

    const todayCount =
        allVisitors.filter(visitor =>
            isWithinFilter(
                visitor.created_at,
                "today"
            )
        ).length;


    const weekCount =
        allVisitors.filter(visitor =>
            isWithinFilter(
                visitor.created_at,
                "week"
            )
        ).length;


    const monthCount =
        allVisitors.filter(visitor =>
            isWithinFilter(
                visitor.created_at,
                "month"
            )
        ).length;


    document.getElementById("todayCount").textContent =
        todayCount;

    document.getElementById("weekCount").textContent =
        weekCount;

    document.getElementById("monthCount").textContent =
        monthCount;
}


/* =========================================================
   SHOW VISITORS
========================================================= */

function showVisitors() {

    const visitorsList =
        document.getElementById("visitorsList");


    const filteredVisitors =
        allVisitors.filter(visitor =>
            isWithinFilter(
                visitor.created_at,
                currentFilter
            )
        );


    visitorsList.innerHTML = "";


    /* -----------------------------------------------
       EMPTY
    ------------------------------------------------ */

    if (filteredVisitors.length === 0) {

        visitorsList.innerHTML = `
            <div class="no-visitors">
                No visitors in this period.
            </div>
        `;

        return;
    }


    /* -----------------------------------------------
       CREATE CARDS
    ------------------------------------------------ */

    filteredVisitors.forEach(visitor => {

        const card =
            document.createElement("div");

        card.className = "visitor-card";


        /* -------------------------------------------
           TIME
        -------------------------------------------- */

        const visitTime =
            formatVisitTime(
                visitor.created_at
            );


        /* -------------------------------------------
           CARD
        -------------------------------------------- */

        card.innerHTML = `

            <img
                class="visitor-avatar"
                src="${visitor.profile_picture}"
                alt=""
            >

            <div class="visitor-information">

                <div class="visitor-name">
                    ${escapeHTML(visitor.username)}
                </div>

                <div class="visitor-id">
                    ID ${escapeHTML(visitor.larck_id)}
                </div>

            </div>


            <div class="visitor-time">
                ${visitTime}
            </div>


            <div class="visit-count">
                1 visit
            </div>

        `;


        /* -------------------------------------------
           CLICK VISITOR
        -------------------------------------------- */

        card.addEventListener(
            "click",
            () => {

                window.location.href =
                    "profile.html?id=" +
                    encodeURIComponent(
                        visitor.larck_id
                    );

            }
        );


        visitorsList.appendChild(card);

    });
}


/* =========================================================
   FORMAT VISIT TIME
========================================================= */

function formatVisitTime(dateString) {

    const date = new Date(dateString);

    const timezone =
        window.larckOwnerTimezone || "Africa/Lagos";


    const now = new Date();

    const difference =
        now.getTime() -
        date.getTime();


    const minutes =
        Math.floor(
            difference / 60000
        );


    if (minutes < 1) {
        return "Just now";
    }


    if (minutes < 60) {

        return (
            minutes +
            (minutes === 1
                ? " minute ago"
                : " minutes ago")
        );
    }


    const hours =
        Math.floor(minutes / 60);


    if (hours < 24) {

        return (
            hours +
            (hours === 1
                ? " hour ago"
                : " hours ago")
        );
    }


    const days =
        Math.floor(hours / 24);


    if (days === 1) {
        return "Yesterday";
    }


    if (days < 7) {

        return (
            days +
            " days ago"
        );
    }


    return date.toLocaleDateString(
        "en-US",
        {
            timeZone: timezone,
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


/* =========================================================
   FILTER BUTTONS
========================================================= */

document.querySelectorAll(
    ".visitor-filter"
).forEach(button => {

    button.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".visitor-filter"
                )
                .forEach(item => {
                    item.classList.remove(
                        "active"
                    );
                });


            button.classList.add(
                "active"
            );


            currentFilter =
                button.dataset.filter;


            showVisitors();

        }
    );

});


/* =========================================================
   BACK BUTTON
========================================================= */

document
    .getElementById("backButton")
    ?.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );


/* =========================================================
   START
========================================================= */

loadVisitors();