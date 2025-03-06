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
        const response = await fetch(`/post?${params.toString()}`, {
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
            small.innerText = new Date(value.created_on).toLocaleString();
            created_on.appendChild(small);

            cardBody.appendChild(description);
            cardBody.appendChild(created_on);

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

// Modal Create Post
const createModal = new bootstrap.Modal(document.getElementById("createModal"));
const btnCreate = document.getElementById("btnCreate");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const createForm = document.getElementById("create-form");
const createError = document.getElementById("createError");

// Click drop zone => Open file chooser
document.getElementById("dropZone").addEventListener("click", () => {
    document.getElementById("file").click();
});

// Show modal Create Post
btnCreate.addEventListener("click", () => {
    createForm.reset();
    step1.classList.remove("d-none");
    step2.classList.add("d-none");
    createError.classList.add("d-none");
    createModal.show();
});

// File chose => Step 2
document.getElementById("file").addEventListener("change", () => {
    step1.classList.add("d-none");
    step2.classList.remove("d-none");
});

// Auto-resize textarea
const textarea = document.getElementById("description");
textarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
});

// Submit form "create post"
createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(createForm);
    try {
        const response = await fetch("/post", {
            method: "POST",
            body: formData,
        });
        if (response.status === 201) {
            createModal.hide();
        } else {
            createError.classList.remove("d-none");
        }
    } catch (error) {
        createError.classList.remove("d-none");
    }
});