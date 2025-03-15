const limit = 9;
let offset = 0;
let isLoading = false;

async function loadPosts() {
    if (isLoading) return;
    isLoading = true;
    const params = new URLSearchParams({ l: limit, o: offset, u: window.location.pathname.split("/")[1] });
    try {
        const response = await fetch(`/api/user/posts?${params.toString()}`, {
            method: "GET",
            headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(response.status);
        const data = await response.json();
        if (data.length === 0) {
            window.removeEventListener("scroll", scrollHandler);
            return;
        }

        const postsRow = document.getElementById("user-posts");
        data.forEach(post => {
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 post";

            const ratioDiv = document.createElement("div");
            ratioDiv.className = "ratio";
            ratioDiv.style.aspectRatio = 4 / 5;

            const img = document.createElement("img");
            img.src = post.attachment;
            img.alt = "Post image";
            img.className = "img-fluid rounded";
            img.style.objectFit = "cover";
            img.addEventListener("click", () => {
                openPostModal(post)
            })

            ratioDiv.appendChild(img);
            col.appendChild(ratioDiv);
            postsRow.appendChild(col);
        });
        offset += limit;
    } catch (error) {
        console.error(error);
    } finally {
        isLoading = false;
    }
}

function scrollHandler() {
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2) {
        loadPosts();
    }
}
window.addEventListener("scroll", scrollHandler);
loadPosts();

document.querySelector(".profile-action")?.addEventListener("click", async () => {
    const data = { following: document.querySelector(".profile-action").getAttribute("user_id") };
    const resp = await fetch("/api/user/follow", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(data)
    })
    if (!resp.ok) return;

    const result = await resp.json();
    document.querySelector(".count-followers").innerText = result.followers + " followers";
    document.querySelector(".count-following").innerText = result.following + " following";
    if (result.state === "Follow") {
        document.querySelector(".profile-action").classList.remove("btn-outline-info");
        document.querySelector(".profile-action").classList.add("btn-outline-light");
    } else {
        document.querySelector(".profile-action").classList.remove("btn-outline-light");
        document.querySelector(".profile-action").classList.add("btn-outline-info");
    }
    document.querySelector(".profile-action").innerText = result.state;
});

// -------------------------------
// Socket.io for Comment update
// -------------------------------
const socket = io();
socket.on("post_comments", (data) => {
    if (document.getElementById("no-comment")) document.getElementById("no-comment").remove();

    const modal = document.querySelector(`[comment-modal-id="${data.pid}"]`);
    if (!modal) return;

    const commentItem = document.createElement("div");
    commentItem.innerHTML = `<strong>@${data.username}</strong>: ${data.content}`;
    modal.appendChild(commentItem);
})