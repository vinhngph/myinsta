// Infinite scroll variables
let offset = 0;
const limit = 5;
let isLoading = false;

// Load posts function
async function loadPosts() {
    if (isLoading) return;
    isLoading = true;
    const params = new URLSearchParams({ limit: limit, offset: offset });
    try {
        const response = await fetch(`/api/home?${params.toString()}`, {
            method: "GET",
            headers: { Accept: "application/json" },
        });
        if (!response.ok) {
            throw new Error(response.status);
        }
        const data = await response.json();

        if (data.length === 0) {
            window.removeEventListener("scroll", scrollHandler);
            return;
        }

        const previewModalEl = document.getElementById("previewModal");
        const previewModal = new bootstrap.Modal(previewModalEl);
        const previewImage = document.getElementById("previewImage");
        const div_content = document.getElementById("content");

        data.forEach((value) => {
            // Create card
            const card = document.createElement("div");
            card.className = "card post-card text-light";

            // Card header contains author
            const cardHeader = document.createElement("div");
            cardHeader.className = "card-header d-flex align-items-center";
            const author = document.createElement("h6");
            author.className = "mb-0";
            author.innerText = "@" + value.username;
            cardHeader.appendChild(author);

            // Attachment
            const ratioDiv = document.createElement("div");
            ratioDiv.className = "ratio ratio-1x1";
            const img = document.createElement("img");
            img.className = "card-img-top";
            img.src = value.attachment;
            img.alt = "Post image";
            img.addEventListener("click", () => {
                previewImage.src = value.attachment;
                previewModal.show();
            });
            ratioDiv.appendChild(img);

            // Card body (description and time)
            const cardBody = document.createElement("div");
            cardBody.className = "card-body p-2";

            // Handle description with "Read more"
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
            small.innerText = new Date(value.created_on + " UTC").toLocaleString();
            created_on.appendChild(small);

            const like_btn = document.createElement("button");
            like_btn.className = "bg-transparent border border-0";
            like_btn.innerHTML = value.is_liked ? '<i class="bi bi-heart-fill text-danger"></i>' : '<i class="bi bi-heart text-white"></i>';
            like_btn.addEventListener("click", async () => {
                const data = { pid: value.id };
                const resp = await fetch(`/api/post/like`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    },
                    body: JSON.stringify(data)
                })
                if (!resp.ok) {
                    throw new Error(resp.status);
                }
                if (resp.status === 200) {
                    like_btn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
                } else {
                    like_btn.innerHTML = '<i class="bi bi-heart text-white"></i>';
                }
            });

            cardBody.appendChild(description);
            cardBody.appendChild(created_on);
            cardBody.appendChild(like_btn);

            // Append to card
            card.appendChild(cardHeader);
            card.appendChild(ratioDiv);
            card.appendChild(cardBody);
            div_content.appendChild(card);
        });
        offset += limit;
    } catch (error) {
        console.error(error);
    } finally {
        isLoading = false;
    }
}

// Load first posts
loadPosts();

// Handle scrolling
function scrollHandler() {
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2) {
        loadPosts();
    }
}

window.addEventListener("scroll", scrollHandler);