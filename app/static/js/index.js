// -------------------------------
// Infinite Scroll and Post Rendering
// -------------------------------
let offset = 0;
const limit = 5;
let isLoading = false;

async function loadPosts() {
    if (isLoading) return;
    isLoading = true;
    const params = new URLSearchParams({ limit: limit, offset: offset });
    try {
        const response = await fetch(`/api/home?${params.toString()}`, {
            method: "GET",
            headers: { Accept: "application/json" },
        });
        if (response.status === 200) {
            const data = await response.json();
            const div_content = document.getElementById("content");
            data.forEach((value) => {
                // Create card
                const card = document.createElement("div");
                card.className = "card post-card text-light mb-3";

                // Card header: Author link
                const cardHeader = document.createElement("div");
                cardHeader.className = "card-header d-flex align-items-center";
                const authorLink = document.createElement("a");
                authorLink.className = "mb-0 text-decoration-none text-light";
                authorLink.href = "/" + value.username;
                authorLink.innerText = "@" + value.username;
                cardHeader.appendChild(authorLink);

                // Attachment: Post image (use ratio for square preview)
                const ratioDiv = document.createElement("div");
                ratioDiv.className = "ratio ratio-1x1";
                const img = document.createElement("img");
                img.className = "card-img-top";
                img.src = value.attachment;
                img.alt = "Post image";
                img.addEventListener("click", () => {
                    openPostModal(value);
                });
                ratioDiv.appendChild(img);

                // Card body: Description, created time, action icons, comment input
                const cardBody = document.createElement("div");
                cardBody.className = "card-body p-2";

                // Description with "Read more"
                const description = document.createElement("p");
                description.className = "card-text mb-1";
                const charLimit = 100;
                if (value.description.length > charLimit) {
                    const descriptionSpan = document.createElement("span");
                    descriptionSpan.innerText = value.description.substring(0, charLimit) + "... ";
                    description.appendChild(descriptionSpan);
                    const readMoreLink = document.createElement("a");
                    readMoreLink.href = "#";
                    readMoreLink.innerText = "Read more";
                    readMoreLink.className = "read-more-link";
                    readMoreLink.addEventListener("click", (e) => {
                        e.preventDefault();
                        description.innerText = value.description;
                    });
                    description.appendChild(readMoreLink);
                } else {
                    description.innerText = value.description;
                }

                // Created time
                const created_on = document.createElement("p");
                created_on.className = "card-text";
                const small = document.createElement("small");
                small.className = "post-time";
                small.innerText = new Date(value.created_on).toLocaleString();
                created_on.appendChild(small);

                // Action icons row: Like and Comment icon buttons
                const actionRow = document.createElement("div");
                actionRow.className = "d-flex align-items-center action-icons mb-2";

                // Like button
                const like_btn = document.createElement("button");
                like_btn.className = "btn btn-link p-0 me-2";
                like_btn.setAttribute("data-post-id", value.id);
                changeLikeStatus(like_btn, value.is_liked);

                like_btn.addEventListener("click", async () => {
                    const dataToSend = { pid: value.id };
                    const resp = await fetch(`/api/post/like`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json"
                        },
                        body: JSON.stringify(dataToSend)
                    });
                    if (!resp.ok) {
                        throw new Error(resp.status);
                    }

                    const data = await resp.json();
                    value.is_liked = data.status;
                    changeLikeStatus(like_btn, data.status);
                });

                // Comment icon button
                const comment_icon = document.createElement("button");
                comment_icon.className = "btn btn-link p-0";
                comment_icon.setAttribute("data-post-id", value.id);
                comment_icon.innerHTML = '<i class="bi bi-chat-dots text-white"></i>';
                comment_icon.addEventListener("click", () => {
                    openPostModal(value);
                });
                actionRow.appendChild(like_btn);
                actionRow.appendChild(comment_icon);


                const commentForm = document.createElement("form");
                commentForm.className = "form-floating";

                // Comment input group below the post
                const commentInputGroup = document.createElement("div");
                commentInputGroup.className = "input-group comment-input-group";

                const commentInput = document.createElement("input");
                commentInput.type = "text";
                commentInput.className = "form-control";
                commentInput.placeholder = "Add a comment...";

                const commentSubmitBtn = document.createElement("button");
                commentSubmitBtn.type = "submit";
                commentSubmitBtn.className = "btn btn-secondary";
                commentSubmitBtn.innerHTML = '<i class="bi bi-send-fill text-white"></i>';

                commentForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const content = commentInput.value.trim();
                    if (!content) return;

                    try {
                        const dataToSend = { pid: value.id, content: content };
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
                });

                commentInputGroup.appendChild(commentInput);
                commentInputGroup.appendChild(commentSubmitBtn);
                commentForm.appendChild(commentInputGroup);

                // Append all parts into card body
                cardBody.appendChild(description);
                cardBody.appendChild(created_on);
                cardBody.appendChild(actionRow);
                cardBody.appendChild(commentForm);

                // Append header, image, body to card
                card.appendChild(cardHeader);
                card.appendChild(ratioDiv);
                card.appendChild(cardBody);
                div_content.appendChild(card);
            });
            offset += limit;
        }
        else {
            window.removeEventListener("scroll", scrollHandler);
            return;
        }
    } catch (error) {
        console.error(error);
        window.removeEventListener("scroll", scrollHandler);
        return;
    } finally {
        isLoading = false;
    }
}

// Load first posts
loadPosts();

// Handle scrolling for infinite scroll
function scrollHandler() {
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2) {
        loadPosts();
    }
}
window.addEventListener("scroll", scrollHandler);
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