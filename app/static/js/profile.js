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

function changeLikeStatus(btn, stauts) {
    return stauts
        ? btn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>'
        : btn.innerHTML = '<i class="bi bi-heart text-white"></i>';
}

function openPostModal(post) {
    // Get modal elements
    const postModalEl = document.getElementById("postModal");
    const postModal = new bootstrap.Modal(postModalEl);
    const postModalImage = document.getElementById("postModalImage");
    const postModalAuthor = document.getElementById("postModalAuthor");
    const postModalDescription = document.getElementById("postModalDescription");
    const postModalLikeBtn = document.getElementById("postModalLikeBtn");
    const postModalComments = document.getElementById("postModalComments");
    const commentInput = document.getElementById("postModalCommentInput");

    // Post's image
    postModalImage.src = post.attachment;

    // Post's data
    postModalAuthor.innerHTML = `<a href="/${post.username}" class="text-decoration-none text-light">@${post.username}</a>`;

    // Post's description
    const charLimit = 150; // Length limit
    if (post.description.length > charLimit) {
        const truncatedText = post.description.substring(0, charLimit) + "... ";
        postModalDescription.innerHTML = truncatedText;
        const readMoreLink = document.createElement("a");
        readMoreLink.href = "#";
        readMoreLink.innerText = "Read more";
        readMoreLink.className = "read-more-link";
        readMoreLink.addEventListener("click", (e) => {
            e.preventDefault();
            postModalDescription.innerText = post.description;
        });
        postModalDescription.appendChild(readMoreLink);
    } else {
        // If don't reach limit, show full description
        postModalDescription.innerText = post.description;
    }

    // Initial like buuton
    changeLikeStatus(postModalLikeBtn, post.is_liked);
    postModalLikeBtn.onclick = async () => {
        const dataToSend = { pid: post.id };
        try {
            const resp = await fetch("/api/post/like", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(dataToSend)
            });
            if (!resp.ok) throw new Error(resp.status);
            const data = await resp.json();
            post.is_liked = data.status;
            changeLikeStatus(postModalLikeBtn, data.status);
        } catch (error) {
            console.error(error);
        }
    };

    // Load post's comments
    (async function () {
        postModalComments.setAttribute("comment-modal-id", post.id);
        postModalComments.innerHTML = "<p class='text-center text-muted'>Loading comments...</p>";
        try {
            const response = await fetch("/api/post/comments?pid=" + post.id, {
                method: "GET",
                headers: { Accept: "application/json" }
            });
            if (!response.ok) throw new Error(response.status);
            const comments = await response.json();
            if (comments.length === 0) {
                postModalComments.innerHTML = "<p class='text-center text-white' id='no-comment'>No comments yet.</p>";
            } else {
                postModalComments.innerHTML = "";
                comments.forEach(comment => {
                    const commentItem = document.createElement("div");
                    commentItem.innerHTML = `<strong>@${comment.username}</strong>: ${comment.content}`;
                    postModalComments.appendChild(commentItem);
                });
            }
        } catch (error) {
            console.error(error);
            postModalComments.innerHTML = "<p class='text-center text-danger'>Error loading comments.</p>";
        }
    })();

    document.getElementById("postModalForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = commentInput.value.trim();
        if (!content) return;

        try {
            const dataToSend = { pid: post.id, content: content };
            const resp = await fetch("/api/post/comments", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(dataToSend)
            });
            if (resp.ok) {
                commentInput.value = "";
            } else {
                throw new Error(resp.status);
            }
        } catch (error) {
            console.error(error)
        }
    })

    // Modal show
    postModal.show();
}

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