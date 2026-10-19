
/* =========================================
   LARCK PARTY PAGE - SUPABASE CONNECTED
   Preserves the existing Party page layout
========================================= */

document.addEventListener("DOMContentLoaded", async function () {
    const closeParty = document.getElementById("closeParty");

    const roomImageInput = document.getElementById("roomImageInput");
    const imageUploadButton = document.getElementById("imageUploadButton");
    const uploadPreview = document.getElementById("uploadPreview");
    const uploadTitle = document.getElementById("uploadTitle");
    const uploadSubtitle = document.getElementById("uploadSubtitle");

    const roomName = document.getElementById("roomName");
    const roomDescription = document.getElementById("roomDescription");
    const descriptionCount = document.getElementById("descriptionCount");

    const savedRoom = document.getElementById("savedRoom");
    const savedRoomName = document.getElementById("savedRoomName");
    const savedRoomImage = document.getElementById("savedRoomImage");

    const startPartyButton = document.getElementById("startPartyButton");
    const formMessage = document.getElementById("formMessage");

    let selectedImageUrl = null;
    let selectedImageFile = null;
    let existingRoom = null;
    let busy = false;

    // Your existing Supabase client must be loaded before this script.
    const db =
        window.larckSupabase ||
        window.supabaseClient;

        console.log(
    "LARCK Supabase URL:",
    db?.storage?.url
);


    if (!db || !db.auth || !db.from || !db.storage) {
        showMessage(
            "Supabase is not connected on this page. Check the Supabase scripts in page3.html."
        );
        return;
    }

    /* =====================================
       CLOSE - RETURN TO HOME
    ===================================== */

    closeParty.addEventListener("click", function () {
        window.location.href = "page2.html";
    });

    /* =====================================
       MESSAGES
    ===================================== */

    function showMessage(message) {
        formMessage.textContent = message;
        formMessage.classList.add("visible");
    }

    function hideMessage() {
        formMessage.textContent = "";
        formMessage.classList.remove("visible");
    }

    /* =====================================
       CURRENT USER
    ===================================== */

    async function getCurrentUser() {
        const { data, error } = await db.auth.getUser();

        if (error) throw error;

        if (!data.user) {
            throw new Error("Please sign in before creating or opening your room.");
        }

        return data.user;
    }

    /* =====================================
       IMAGE PREVIEW
    ===================================== */

    imageUploadButton.addEventListener("click", function () {
        roomImageInput.click();
    });

    roomImageInput.addEventListener("change", function () {
        const file = roomImageInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showMessage("Please select a valid image.");
            roomImageInput.value = "";
            return;
        }

        // Keep uploads reasonably sized.
        if (file.size > 5 * 1024 * 1024) {
            showMessage("Please choose an image smaller than 5 MB.");
            roomImageInput.value = "";
            return;
        }

        if (selectedImageUrl) {
            URL.revokeObjectURL(selectedImageUrl);
        }

        selectedImageFile = file;
        selectedImageUrl = URL.createObjectURL(file);

        uploadPreview.replaceChildren();

        const image = document.createElement("img");
        image.src = selectedImageUrl;
        image.alt = "Selected room image";

        uploadPreview.appendChild(image);

        uploadTitle.textContent = file.name;
        uploadSubtitle.textContent = "Image selected successfully";

        hideMessage();
    });

    /* =====================================
       DESCRIPTION COUNTER
    ===================================== */

    function updateDescriptionCount() {
        descriptionCount.textContent =
            roomDescription.value.length + "/100";
    }

    roomDescription.addEventListener("input", updateDescriptionCount);
    updateDescriptionCount();

    /* =====================================
       LOAD THE USER'S EXISTING ROOM
    ===================================== */

    async function loadExistingRoom() {
        const user = await getCurrentUser();

        const { data, error } = await db
            .from("rooms")
            .select(
                "id, created_at, owner_id, name, room_id, label, background, is_locked, description"
            )
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) throw error;

        existingRoom = data && data.length ? data[0] : null;

        if (!existingRoom) {
            savedRoomName.textContent = "No room created yet";

            if (savedRoomImage) {
                savedRoomImage.src = "partyimage.jpeg";
            }

            return;
        }

        savedRoomName.textContent = existingRoom.name || "My Party Room";

        if (savedRoomImage) {
            savedRoomImage.src =
                existingRoom.background || "partyimage.jpeg";
        }

        // Fill in the saved details so the owner can edit them.
        roomName.value = existingRoom.name || "";
        roomDescription.value = existingRoom.description || "";
        updateDescriptionCount();

        // Keep the image upload area showing the saved room picture.
        if (existingRoom.background && uploadPreview) {
            uploadPreview.replaceChildren();

            const image = document.createElement("img");
            image.src = existingRoom.background;
            image.alt = "Saved room image";

            uploadPreview.appendChild(image);

            uploadTitle.textContent = "Your saved room image";
            uploadSubtitle.textContent = "Choose another image to replace it";
        }
    }

    /* =====================================
       UPLOAD ROOM IMAGE
    ===================================== */

    async function uploadRoomImage(user) {
        if (!selectedImageFile) {
            return existingRoom?.background || "";
        }

        const extension =
            selectedImageFile.name.split(".").pop().toLowerCase();

        const safeExtension = /^[a-z0-9]+$/.test(extension)
            ? extension
            : "jpg";

        // Reuse one image path for this user's room.
        const filePath = `${user.id}/room-cover.${safeExtension}`;

        const { error: uploadError } = await db.storage
            .from("room-images")
            .upload(filePath, selectedImageFile, {
                upsert: true,
                contentType: selectedImageFile.type,
                cacheControl: "3600"
            });

        if (uploadError) throw uploadError;

       const { data } = db.storage
    .from("room-images")
    .getPublicUrl(filePath);

console.log("BUCKET:", "room-images");
console.log("FILE PATH:", filePath);
console.log("FULL IMAGE URL:", data.publicUrl);

return data.publicUrl;
    }

    /* =====================================
       SAVE OR UPDATE THE EXISTING ROOM
    ===================================== */

    async function saveRoom() {
        const user = await getCurrentUser();
        const name = roomName.value.trim();
        const description = roomDescription.value.trim();

        if (!name) {
            throw new Error("Please enter your room name.");
        }

        if (name.length > 60) {
            throw new Error("Your room name must be 60 characters or fewer.");
        }

        if (description.length > 100) {
            throw new Error("Your room description must be 100 characters or fewer.");
        }

        showMessage("Saving your room details...");

        // Find the user's profile to preserve the LARCK room ID.
        const { data: profile, error: profileError } = await db
            .from("profiles")
            .select("username, larck_id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
            throw new Error("Your LARCK profile was not found. Please sign in again.");
        }

        let imageUrl = existingRoom?.background || "";

        if (selectedImageFile) {
            imageUrl = await uploadRoomImage(user);
        }

        const roomDetails = {
            owner_id: user.id,
            name: name,
            room_id: existingRoom?.room_id || String(profile.larck_id || ""),
            label: existingRoom?.label || "Chatting",
            background: imageUrl,
            is_locked: existingRoom?.is_locked ?? false,
            description: description
        };

        if (!roomDetails.room_id) {
            throw new Error("Your LARCK ID is missing from your profile.");
        }

        let saved;

        if (existingRoom) {
            // Update the room already belonging to this user.
            const { data, error } = await db
                .from("rooms")
                .update(roomDetails)
                .eq("id", existingRoom.id)
                .eq("owner_id", user.id)
                .select(
                    "id, created_at, owner_id, name, room_id, label, background, is_locked, description"
                )
                .single();

            if (error) throw error;
            saved = data;
        } else {
            // Create a room only when the user has none.
            const { data, error } = await db
                .from("rooms")
                .insert(roomDetails)
                .select(
                    "id, created_at, owner_id, name, room_id, label, background, is_locked, description"
                )
                .single();

            if (error) throw error;
            saved = data;
        }

        existingRoom = saved;
        selectedImageFile = null;

        savedRoomName.textContent = saved.name || "My Party Room";

        if (savedRoomImage) {
            savedRoomImage.src = saved.background || "partyimage.jpeg";
        }

        return saved;
    }

    /* =====================================
       COUNTDOWN THEN OPEN THE SAME ROOM
    ===================================== */

    async function countdownAndOpen(room) {
        if (!room || !room.id) {
            throw new Error("Your room could not be found.");
        }

        busy = true;
        startPartyButton.disabled = true;
        savedRoom.setAttribute("aria-disabled", "true");

        try {
            for (const number of ["3", "2", "1"]) {
                showMessage(number);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            window.location.href =
                "page6.html?roomId=" +
                encodeURIComponent(room.id) +
                "&room=" +
                encodeURIComponent(room.name || "My Party Room");
        } finally {
            // If navigation is blocked or fails, restore the controls.
            setTimeout(() => {
                busy = false;
                startPartyButton.disabled = false;
                savedRoom.removeAttribute("aria-disabled");
            }, 1500);
        }
    }

    /* =====================================
       MY ROOMS - REUSE EXISTING ROOM
    ===================================== */

    savedRoom.addEventListener("click", async function () {
        if (busy) return;

        hideMessage();

        try {
            // Refresh first in case the room changed elsewhere.
            await loadExistingRoom();

            if (!existingRoom) {
                showMessage("You have not created a room yet. Enter your room details below.");
                return;
            }

            if (existingRoom.is_locked) {
                showMessage("Your room is locked. Unlock it before entering.");
                return;
            }

            await countdownAndOpen(existingRoom);
        } catch (error) {
            console.error("Could not load your room:", error);
            showMessage(error.message || "Could not load your room. Please try again.");
        }
    });

    /* =====================================
       START PARTY - SAVE THEN OPEN
    ===================================== */

    startPartyButton.addEventListener("click", async function () {
        if (busy) return;

        hideMessage();

        try {
            const room = await saveRoom();

            await countdownAndOpen(room);
        } catch (error) {
            console.error("Could not save your room:", error);
            showMessage(error.message || "Could not save your room. Please try again.");
        }
    });

    /* =====================================
       INITIAL LOAD
    ===================================== */

    try {
        await loadExistingRoom();
    } catch (error) {
        console.error("Could not load your existing room:", error);
        showMessage(
            error.message ||
            "Could not load your room. Please check your connection and sign-in."
        );
    }

    /* =====================================
       CLEAN UP PREVIEW URL
    ===================================== */

    window.addEventListener("pagehide", function () {
        if (selectedImageUrl) {
            URL.revokeObjectURL(selectedImageUrl);
            selectedImageUrl = null;
        }
    });
});
