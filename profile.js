/* =========================================================
   LARCK PROFILE
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




/* PROFILE REPORT AND BLOCK STATE */
let currentViewedProfile = null;
let currentViewer = null;
let profileOptionsInitialized = false;
let profileBlockPending = false;


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {
    try {
        // Get the currently logged-in user
        const { data: { user }, error: userError } =
            await larckSupabase.auth.getUser();

        if (userError) {
            console.error("Could not get user:", userError);
            return;
        }

        if (!user) {
            console.log("No logged-in user.");
            return;
        }

        // Get the LARCK ID from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const requestedLarckId = urlParams.get("id");

        // If no LARCK ID was provided, show the logged-in user's profile
        if (!requestedLarckId) {

            const { data: profile, error: profileError } =
                await larckSupabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

            if (profileError) {
                console.error("Could not load own profile:", profileError);
                return;
            }

            displayProfile(profile, user);
            return;
        }

        // Search for the profile using the LARCK ID
        const { data: profile, error: profileError } =
            await larckSupabase
                .from("profiles")
                .select("*")
                .eq("larck_id", requestedLarckId)
                .single();

        if (profileError) {
            console.error("Could not find profile:", profileError);
            return;
        }

        if (!profile) {
            console.log("No profile found with that LARCK ID.");
            return;
        }

        displayProfile(profile, user);

    } catch (error) {
        console.error("Profile loading error:", error);
    }
}

/* =========================================================
   DISPLAY PROFILE
========================================================= */

function displayProfile(profile, user) {

        currentViewedProfile = profile;
    currentViewer = user;


    /* =========================
       USERNAME
    ========================== */

    const username =
        document.getElementById("username");

    if (username) {

        username.textContent =
            profile.username || "Username";

    }


    /* =========================
       LARCK ID
    ========================== */

    const larckId =
        document.getElementById("larckId");

    if (larckId) {

        larckId.textContent =
            profile.larck_id || "LARCK ID";

    }


    /* =========================
       PROFILE PICTURE
    ========================== */

    const profilePicture =
        profile.profile_picture || "";


    const profileImage =
        document.getElementById("profilePicture");

    const coverImage =
        document.getElementById("coverImage");


    /*
       IMPORTANT:

       The SAME profile picture is used
       for both the circular picture
       and the cover.
    */

    if (profileImage && profilePicture) {

        profileImage.src =
            profilePicture;

    }


    if (coverImage && profilePicture) {

        coverImage.src =
            profilePicture;

    }


    /* =========================
       COUNTRY
    ========================== */

    const countryName =
    document.getElementById("countryName");

const countryFlag =
    document.getElementById("countryFlag");


if (countryName) {

    countryName.textContent =
        profile.country || "Country";

}


/* COUNTRY FLAGS */

const countryFlags = {

    "Nigeria": "🇳🇬",
    "Ghana": "🇬🇭",
    "Philippines": "🇵🇭",
    "United States": "🇺🇸",
    "USA": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "UK": "🇬🇧",
    "Canada": "🇨🇦",
    "Kenya": "🇰🇪",
    "South Africa": "🇿🇦",
    "India": "🇮🇳",
    "China": "🇨🇳",
    "Japan": "🇯🇵",
    "South Korea": "🇰🇷",
    "United Arab Emirates": "🇦🇪",
    "Saudi Arabia": "🇸🇦",
    "Turkey": "🇹🇷",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Brazil": "🇧🇷",
    "Mexico": "🇲🇽",
    "Australia": "🇦🇺"
};


if (countryFlag) {

    countryFlag.textContent =
        countryFlags[profile.country] || "🌍";

}


 /* =====================================================
   OWN PROFILE VS OTHER USER PROFILE
===================================================== */

const editProfileButton =
    document.getElementById("editProfileButton");

const followButton =
    document.getElementById("followButton");

const messageButton =
    document.getElementById("messageButton");

const visitorStat = document.getElementById("visitorStat");


/* =========================
   OWN PROFILE
========================= */

if (profile.id === user.id) {

    if (editProfileButton) {
        editProfileButton.style.display = "flex";
    }

    if (followButton) {
        followButton.style.display = "none";
    }

    if (messageButton) {
        messageButton.style.display = "none";
    }

    if (visitorStat) {
    visitorStat.style.cursor = "pointer";

    visitorStat.onclick = () => {
        window.location.href = "visitors.html";
    };
}


/* =========================
   OTHER USER PROFILE
========================= */   

} else {
    if (editProfileButton) editProfileButton.style.display = "none";
    if (followButton) followButton.style.display = "inline-flex";
    if (messageButton) messageButton.style.display = "inline-flex";

    if (messageButton) {
        messageButton.onclick = () => {
            window.location.href =
                "chat.html?id=" +
                encodeURIComponent(profile.larck_id);
        };
    }
}
    // Set up profile picture editing.
    setupProfilePictureEditing();

    // Start Follow system
    setupFollowSystem(profile, user);
    // Record profile visit
    recordProfileVisit(profile, user);


    loadProfileStatistics(profile);
}


/* =========================================================
   FOLLOW SYSTEM
========================================================= */

async function setupFollowSystem(profile, user) {

    const followButton =
        document.getElementById("followButton");

    if (!followButton) {
        return;
    }

    // Do not allow users to follow themselves
    if (profile.id === user.id) {
        return;
    }


    /* =========================
       CHECK IF ALREADY FOLLOWING
    ========================= */

    const { data: existingFollow, error: checkError } =
        await larckSupabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", profile.id)
            .maybeSingle();


    if (checkError) {

        console.error(
            "Could not check follow status:",
            checkError
        );

        return;
    }


    // Set the correct button text
    if (existingFollow) {

        followButton.textContent = "Following";

    } else {

        followButton.textContent = "Follow";

    }


    /* =========================
       FOLLOW / UNFOLLOW
    ========================= */

    followButton.onclick = async function () {

        // Prevent double clicks
        followButton.disabled = true;


        /* =========================
           IF ALREADY FOLLOWING
        ========================= */

        if (followButton.textContent === "Following") {

            const { error } =
                await larckSupabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("following_id", profile.id);


            if (error) {

                console.error(
                    "Could not unfollow:",
                    error
                );

                followButton.disabled = false;
                return;
            }


            followButton.textContent = "Follow";


        /* =========================
           NOT FOLLOWING YET
        ========================= */

        } else {

            const { error } =
                await larckSupabase
                    .from("follows")
                    .insert({

                        follower_id: user.id,

                        following_id: profile.id

                    });


            if (error) {

                console.error(
                    "Could not follow:",
                    error
                );

                followButton.disabled = false;
                return;
            }


            followButton.textContent = "Following";

        }


        followButton.disabled = false;

    };

}


/* =========================================================
   RECORD PROFILE VISITOR
========================================================= */

async function recordProfileVisit(profile, user) {

    // Do not count visiting your own profile
    if (profile.id === user.id) {
        return;
    }

    const { error } =
        await larckSupabase
            .from("profile_visitors")
            .upsert(
                {
                    visitor_id: user.id,
                    profile_owner_id: profile.id
                },
                {
                    onConflict: "visitor_id,profile_owner_id"
                }
            );

    if (error) {

        console.error(
            "Could not record profile visit:",
            error
        );

        return;
    }

    console.log("Profile visit recorded.");
}



/* =========================================================
   PROFILE STATISTICS
========================================================= */

async function loadProfileStatistics(profile) {

    const followingCount =
        document.getElementById("followingCount");

    const fansCount =
        document.getElementById("fansCount");

    const visitorsCount =
        document.getElementById("visitorsCount");


    /* =========================
       FOLLOWING COUNT
       How many people this user follows
    ========================= */

    const { count: followingTotal, error: followingError } =
        await larckSupabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("follower_id", profile.id);


    if (followingError) {

        console.error(
            "Could not load following count:",
            followingError
        );

    } else if (followingCount) {

        followingCount.textContent =
            followingTotal || 0;

    }


    /* =========================
       FANS COUNT
       How many people follow this user
    ========================= */

    const { count: fansTotal, error: fansError } =
        await larckSupabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", profile.id);


    if (fansError) {

        console.error(
            "Could not load fans count:",
            fansError
        );

    } else if (fansCount) {

        fansCount.textContent =
            fansTotal || 0;

    }


    /* =========================
   VISITORS COUNT
========================= */

const { count: visitorsTotal, error: visitorsError } =
    await larckSupabase
        .from("profile_visitors")
        .select("id", { count: "exact", head: true })
        .eq("profile_owner_id", profile.id);


if (visitorsError) {

    console.error(
        "Could not load visitors count:",
        visitorsError
    );

} else if (visitorsCount) {

    visitorsCount.textContent =
        visitorsTotal || 0;

}
}



/* =========================================================
   FOLLOWING / FANS LIST
========================================================= */

const followingStat =
    document.getElementById("followingStat");

const fansStat =
    document.getElementById("fansStat");

const connectionsPanel =
    document.getElementById("connectionsPanel");

const connectionsTitle =
    document.getElementById("connectionsTitle");

const connectionsList =
    document.getElementById("connectionsList");

const connectionsBackButton =
    document.getElementById("connectionsBackButton");


/* =========================================================
   OPEN FOLLOWING
========================================================= */

if (followingStat) {

    followingStat.addEventListener("click", () => {

        openConnections("following");

    });

}


/* =========================================================
   OPEN FANS
========================================================= */

if (fansStat) {

    fansStat.addEventListener("click", () => {

        openConnections("fans");

    });

}


/* =========================================================
   OPEN CONNECTIONS
========================================================= */

async function openConnections(type) {

    if (!connectionsPanel || !connectionsList) {
        return;
    }


    /* Show panel */

    connectionsPanel.classList.add("show");


    /* Set title */

    if (connectionsTitle) {

        connectionsTitle.textContent =
            type === "following"
                ? "Following"
                : "Fans";

    }


    /* Loading */

    connectionsList.innerHTML = `
        <div class="connections-loading">
            Loading...
        </div>
    `;


    /* Get profile currently being viewed */

    const urlParams =
        new URLSearchParams(window.location.search);

    const requestedLarckId =
        urlParams.get("id");


    let viewedProfile;


    try {

        /* =================================================
           GET VIEWED PROFILE
        ================================================= */

        if (requestedLarckId) {

            const { data, error } =
                await larckSupabase
                    .from("profiles")
                    .select("id")
                    .eq("larck_id", requestedLarckId)
                    .single();


            if (error || !data) {

                console.error(
                    "Could not find viewed profile:",
                    error
                );

                showConnectionsEmpty(
                    "Could not load profile."
                );

                return;
            }


            viewedProfile = data;

        } else {

            const {
                data: { user },
                error
            } =
                await larckSupabase.auth.getUser();


            if (error || !user) {

                showConnectionsEmpty(
                    "Could not load profile."
                );

                return;
            }


            viewedProfile = {
                id: user.id
            };

        }


        /* =================================================
           GET FOLLOW RELATIONSHIPS
        ================================================= */

        let followRows = [];


        if (type === "following") {

            /*
             * People this profile follows
             */

            const { data, error } =
                await larckSupabase
                    .from("follows")
                    .select("following_id")
                    .eq(
                        "follower_id",
                        viewedProfile.id
                    );


            if (error) {

                console.error(
                    "Could not load following:",
                    error
                );

                showConnectionsEmpty(
                    "Could not load following."
                );

                return;
            }


            followRows = data || [];


        } else {

            /*
             * People who follow this profile
             */

            const { data, error } =
                await larckSupabase
                    .from("follows")
                    .select("follower_id")
                    .eq(
                        "following_id",
                        viewedProfile.id
                    );


            if (error) {

                console.error(
                    "Could not load fans:",
                    error
                );

                showConnectionsEmpty(
                    "Could not load fans."
                );

                return;
            }


            followRows = data || [];

        }


        /* =================================================
           NO PEOPLE
        ================================================= */

        if (!followRows.length) {

            showConnectionsEmpty(
                type === "following"
                    ? "Not following anyone yet."
                    : "No fans yet."
            );

            return;
        }


        /* =================================================
           GET PROFILE IDs
        ================================================= */

        const profileIds =
            followRows.map(row =>
                type === "following"
                    ? row.following_id
                    : row.follower_id
            );


        /* =================================================
           GET PROFILES
        ================================================= */

        const {
            data: profiles,
            error: profilesError
        } =
            await larckSupabase
                .from("profiles")
                .select(
                    "id, username, larck_id, profile_picture"
                )
                .in("id", profileIds);


        if (profilesError) {

            console.error(
                "Could not load connection profiles:",
                profilesError
            );

            showConnectionsEmpty(
                "Could not load profiles."
            );

            return;
        }


        /* =================================================
           CREATE PROFILE MAP
        ================================================= */

        const profileMap =
            new Map();

        (profiles || []).forEach(profile => {

            profileMap.set(
                profile.id,
                profile
            );

        });


        /* =================================================
           SHOW PEOPLE
        ================================================= */

        connectionsList.innerHTML = "";


        profileIds.forEach(profileId => {

            const person =
                profileMap.get(profileId);


            if (!person) {
                return;
            }


            const card =
                document.createElement("div");


            card.className =
                "connection-card";


            const picture =
                person.profile_picture ||
                "images/default-avatar.png";


            card.innerHTML = `

                <img
                    class="connection-avatar"
                    src="${picture}"
                    alt=""
                >

                <div class="connection-information">

                    <div class="connection-name">
                        ${escapeConnectionHTML(
                            person.username ||
                            "Username"
                        )}
                    </div>

                    <div class="connection-id">
                        ID ${escapeConnectionHTML(
                            person.larck_id || ""
                        )}
                    </div>

                </div>

            `;


            /* =================================================
               OPEN PERSON'S PROFILE
            ================================================= */

            card.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "profile.html?id=" +
                        encodeURIComponent(
                            person.larck_id
                        );

                }
            );


            connectionsList.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Connections error:",
            error
        );

        showConnectionsEmpty(
            "Something went wrong."
        );

    }

}


/* =========================================================
   EMPTY CONNECTIONS
========================================================= */

function showConnectionsEmpty(message) {

    if (!connectionsList) {
        return;
    }


    connectionsList.innerHTML = `

        <div class="connections-empty">
            ${escapeConnectionHTML(message)}
        </div>

    `;

}


/* =========================================================
   ESCAPE CONNECTION HTML
========================================================= */

function escapeConnectionHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================================================
   CLOSE CONNECTIONS PANEL
========================================================= */

if (connectionsBackButton) {

    connectionsBackButton.addEventListener(
        "click",
        () => {

            connectionsPanel.classList.remove(
                "show"
            );

        }
    );

}




/* =========================================================
   COPY LARCK ID
========================================================= */

document
    .getElementById("copyIdButton")
    ?.addEventListener("click", async () => {

        const id =
            document
                .getElementById("larckId")
                ?.textContent;


        if (!id || id === "LARCK ID") {

            return;

        }


        try {

            await navigator.clipboard.writeText(id);


            const button =
                document.getElementById(
                    "copyIdButton"
                );


            const original =
                button.textContent;


            button.textContent = "✓";


            setTimeout(() => {

                button.textContent =
                    original;

            }, 1200);

        }

        catch (error) {

            console.error(
                "Could not copy LARCK ID:",
                error
            );

        }

    });


/* =========================================================
   BACK BUTTON
========================================================= */

document
    .getElementById("backButton")
    ?.addEventListener("click", () => {

        window.history.back();

    });


    
/* =========================================================
   PROFILE REPORT AND BLOCK MENU
========================================================= */

const profileMoreButton =
    document.getElementById("moreButton");

const profileOptionsMenu =
    document.getElementById("profileOptionsMenu");

const profileReportOverlay =
    document.getElementById("profileReportOverlay");

const profileReportForm =
    document.getElementById("profileReportForm");

const profileReportCategory =
    document.getElementById("profileReportCategory");

const profileReportDescription =
    document.getElementById("profileReportDescription");

const submitProfileReport =
    document.getElementById("submitProfileReport");

function setupProfileOptions() {
    if (profileOptionsInitialized) return;
    profileOptionsInitialized = true;

    // Open the menu only on another person's profile.
    if (profileMoreButton) {
        profileMoreButton.addEventListener("click", event => {
            event.stopPropagation();

            if (
                !currentViewer ||
                !currentViewedProfile ||
                currentViewer.id === currentViewedProfile.id
            ) {
                if (profileOptionsMenu) {
                    profileOptionsMenu.hidden = true;
                }
                return;
            }

            if (profileOptionsMenu) {
                profileOptionsMenu.hidden =
                    !profileOptionsMenu.hidden;
            }
        });
    }

    document.addEventListener("click", event => {
        if (
            profileOptionsMenu &&
            !profileOptionsMenu.hidden &&
            !profileOptionsMenu.contains(event.target) &&
            event.target !== profileMoreButton
        ) {
            profileOptionsMenu.hidden = true;
        }
    });

    profileOptionsMenu?.addEventListener("click", async event => {
        const button = event.target.closest("[data-profile-action]");
        if (!button) return;

        profileOptionsMenu.hidden = true;

        if (!currentViewer || !currentViewedProfile) {
            alert("Profile information is not ready yet.");
            return;
        }

        if (currentViewer.id === currentViewedProfile.id) {
            return;
        }

        if (button.dataset.profileAction === "report") {
            profileReportForm?.reset();

            if (profileReportOverlay) {
                profileReportOverlay.hidden = false;
            }
        }

        if (button.dataset.profileAction === "block") {
            await blockProfileUser();
        }
    });

    document.getElementById("cancelProfileReport")
        ?.addEventListener("click", () => {
            if (profileReportOverlay) {
                profileReportOverlay.hidden = true;
            }
        });

    profileReportOverlay?.addEventListener("click", event => {
        if (event.target === profileReportOverlay) {
            profileReportOverlay.hidden = true;
        }
    });

    profileReportForm?.addEventListener("submit", submitProfileUserReport);
}

async function blockProfileUser() {
    if (
        !currentViewer ||
        !currentViewedProfile ||
        currentViewer.id === currentViewedProfile.id ||
        profileBlockPending
    ) {
        return;
    }

    const confirmed = confirm(
        `Block ${currentViewedProfile.username || "this user"}?`
    );

    if (!confirmed) return;

    profileBlockPending = true;

    try {
        const { error } = await larckSupabase
            .from("blocked_users")
            .insert({
                blocker_id: currentViewer.id,
                blocked_user_id: currentViewedProfile.id
            });

        if (error) {
            if (error.code === "23505") {
                alert("You have already blocked this user.");
            } else {
                console.error("Could not block user:", error);
                alert("Could not block this user. Please try again.");
            }
            return;
        }

        alert("User blocked.");
    } catch (error) {
        console.error("Block request failed:", error);
        alert("Something went wrong while blocking this user.");
    } finally {
        profileBlockPending = false;
    }
}

async function submitProfileUserReport(event) {
    event.preventDefault();

    if (
        !currentViewer ||
        !currentViewedProfile ||
        currentViewer.id === currentViewedProfile.id
    ) {
        alert("This profile cannot be reported.");
        return;
    }

    const category = profileReportCategory.value;
    const description = profileReportDescription.value.trim();

    if (!category || !description) {
        alert("Please select a reason and describe the problem.");
        return;
    }

    submitProfileReport.disabled = true;

    try {
        const { error } = await larckSupabase
            .from("user_reports")
            .insert({
                reporter_id: currentViewer.id,
                reported_user_id: currentViewedProfile.id,
                category: category,
                description: description
            });

        if (error) {
            console.error("Could not submit report:", error);
            alert("Could not submit your report. Please try again.");
            return;
        }

        if (profileReportOverlay) {
            profileReportOverlay.hidden = true;
        }

        profileReportForm.reset();
        alert("Thank you. Your report has been submitted.");
    } catch (error) {
        console.error("Report submission failed:", error);
        alert("Something went wrong while submitting your report.");
    } finally {
        submitProfileReport.disabled = false;
    }
}

// Initialize the menu once. The handlers use the current profile.
setupProfileOptions();



/* =========================================
   CHANGE PROFILE PICTURE AND COVER
========================================= */

const pictureInput = document.getElementById("profilePictureInput");
const profilePictureElement = document.getElementById("profilePicture");
const coverImageElement = document.getElementById("coverImage");

function canEditCurrentProfile() {
    return Boolean(
        currentViewer &&
        currentViewedProfile &&
        currentViewer.id === currentViewedProfile.id
    );
}

// Allow editing only on the logged-in user's own profile.
function setupProfilePictureEditing() {
    [profilePictureElement, coverImageElement]
        .filter(Boolean)
        .forEach(element => {
            element.style.cursor = canEditCurrentProfile()
                ? "pointer"
                : "default";

            element.onclick = () => {
                if (!canEditCurrentProfile()) return;
                pictureInput?.click();
            };
        });
}

async function changeProfilePicture() {
    const file = pictureInput?.files?.[0];

    if (!file) return;

    try {
        if (!canEditCurrentProfile()) {
            alert("You can only change your own profile picture.");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select an image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Please choose an image smaller than 5MB.");
            return;
        }

        const {
            data: { user },
            error: userError
        } = await larckSupabase.auth.getUser();

        if (userError || !user || user.id !== currentViewedProfile.id) {
            alert("Please log in again and try again.");
            return;
        }

        const extension = file.name.split(".").pop().toLowerCase();
        const filePath = `${user.id}/${user.id}_${Date.now()}.${extension}`;

        const { error: uploadError } = await larckSupabase.storage
            .from("profile-picture")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: publicData } = larckSupabase.storage
            .from("profile-picture")
            .getPublicUrl(filePath);

        const pictureUrl = publicData.publicUrl;

        const { error: updateError } = await larckSupabase
            .from("profiles")
            .update({ profile_picture: pictureUrl })
            .eq("id", user.id);

        if (updateError) throw updateError;

        if (profilePictureElement) {
            profilePictureElement.src = pictureUrl;
        }

        if (coverImageElement) {
            coverImageElement.src = pictureUrl;
        }

        currentViewedProfile.profile_picture = pictureUrl;

        alert("Profile picture updated successfully!");

    } catch (error) {
        console.error("Profile picture update error:", error);
        alert("Unable to update your picture. Check the browser console for the error.");
    } finally {
        if (pictureInput) pictureInput.value = "";
    }
}

pictureInput?.addEventListener("change", changeProfilePicture);

// Keep this section's click permissions synchronized with the loaded profile.


/* =========================================================
   START
========================================================= */

loadProfile();

