// Modal Create Post
const createModal = new bootstrap.Modal(document.getElementById("createModal"));
const btnCreate = document.getElementById("btnCreate");
const btnCreateMobile = document.getElementById("btnCreateMobile");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const createForm = document.getElementById("create-form");
const createError = document.getElementById("createError");

let uploadProcesses = {}

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

btnCreateMobile.addEventListener("click", () => {
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

const createProgressBar = (id, title) => {
    const progressContainer = document.createElement("div")
    progressContainer.className = "mt-3"

    const progressTitle = document.createElement("p")
    progressTitle.textContent = title

    progressContainer.appendChild(progressTitle)

    const progressElement = document.createElement("div")
    progressElement.className = `progress ${id}`
    progressElement.role = "progressbar"
    progressElement.ariaValueMin = "0"
    progressElement.ariaValueMax = "100"

    const progressPercentElement = document.createElement("div")
    progressPercentElement.className = "progress-bar text-bg-info progress-bar-striped progress-bar-animated"
    progressPercentElement.style.width = "0%"
    progressPercentElement.textContent = "0%"

    progressElement.appendChild(progressPercentElement)
    progressContainer.appendChild(progressElement)

    return {
        id: id,
        element: progressContainer,
        setPercent: (percent) => {
            const clamped = Math.round(Math.max(0, Math.min(100, percent)))
            progressElement.ariaValueNow = clamped

            progressPercentElement.style.width = clamped + "%"
            progressPercentElement.textContent = clamped + "%"

            if (clamped === 100) {
                setTimeout(() => {
                    progressContainer.remove()
                }, 500);
            }
        }
    }
}

const newToast = (title, body) => {
    const toastClassname = "toast-container position-fixed top-0 end-0 p-3"
    let toastContainer = document.querySelector("." + toastClassname.split(" ").join("."))
    if (!toastContainer) {
        toastContainer = document.createElement("div")
        toastContainer.className = toastClassname
        document.body.appendChild(toastContainer)
    }

    const liveToast = document.createElement("div")
    liveToast.className = "toast"
    liveToast.role = "alert"
    liveToast.ariaLive = "assertLive"
    liveToast.ariaAtomic = "true"

    const toastHeader = document.createElement("div")
    toastHeader.className = "toast-header"

    const toastTitle = document.createElement("strong")
    toastTitle.className = "me-auto fs-4 fw-bold"
    toastTitle.textContent = title

    const toastClose = document.createElement("button")
    toastClose.type = "button"
    toastClose.className = "btn-close"
    toastClose.setAttribute("data-bs-dismiss", "toast")
    toastClose.ariaLabel = "Close"

    toastHeader.appendChild(toastTitle)
    toastHeader.appendChild(toastClose)

    const toastBody = document.createElement("div")
    toastBody.className = "toast-body"

    const bodyAlert = document.createElement("div")
    bodyAlert.className = "alert alert-danger mb-0 fs-5"
    bodyAlert.role = "alert"
    bodyAlert.textContent = body
    toastBody.appendChild(bodyAlert)

    liveToast.appendChild(toastHeader)
    liveToast.appendChild(toastBody)

    toastContainer.appendChild(liveToast)

    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(liveToast)
    toastBootstrap.show()
}

// Submit form "create post"
createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(createForm);
    const fileType = createForm.querySelector("#file").files[0].type

    createForm.reset();
    step1.classList.remove("d-none");
    step2.classList.add("d-none");
    createError.classList.add("d-none");

    const timestamp = new Date().toLocaleString()
    const uploadBar = createProgressBar("", timestamp + " | Uploading")

    createForm.appendChild(uploadBar.element)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/post")

    xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
            uploadBar.setPercent((e.loaded / e.total) * 100)
        }
    })

    xhr.onload = () => {
        if (xhr.status === 201) {
            const data = JSON.parse(xhr.responseText)

            if (fileType.startsWith("video/")) {
                const uploadBarProcess = createProgressBar(data.task_id, timestamp + " | Processing")
                createForm.appendChild(uploadBarProcess.element)
                uploadProcesses[data.task_id] = uploadBarProcess
            }
        }
    }

    xhr.onerror = (e) => {
        newToast("Error", e)
    }

    xhr.send(formData)
});

// -------------------------------
// Search Feature Implementation
// -------------------------------
const btnSearch = document.getElementById("btnSearch");
const searchContainer = document.getElementById("searchContainer");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const sidebar = document.querySelector(".sidebar");

// Using Bootstrap's Collapse 
const searchCollapse = new bootstrap.Collapse(searchContainer, {
    toggle: false
});

// After Click "Search"
btnSearch.addEventListener("click", () => {
    // Toggle collapse
    searchCollapse.toggle();
});

searchContainer.addEventListener("shown.bs.collapse", () => {
    searchInput.focus();
});

// Search API
async function performSearch(query) {
    if (!query) {
        searchResults.innerHTML = "";
        return;
    }
    try {
        const response = await fetch("/api/search?q=" + encodeURIComponent(query), {
            method: "GET",
            headers: { Accept: "application/json" }
        });
        if (!response.ok) {
            throw new Error(response.status);
        }
        const results = await response.json();
        renderSearchResults(results);
    } catch (error) {
        console.error(error);
    }
}

// Render searchResults
let activeResultIndex = -1;
function renderSearchResults(results) {
    searchResults.innerHTML = "";
    activeResultIndex = -1;
    if (results.length === 0) {
        searchResults.innerHTML = "<div class='text-center text-muted'>No results found</div>";
        return;
    }
    results.forEach(result => {
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.setAttribute("data-username", result.username);
        item.innerHTML = `<strong>@${result.username}</strong>`;
        item.addEventListener("click", () => {
            window.location.href = "/" + result.username;
        });
        searchResults.appendChild(item);
    });
}

searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    performSearch(query);
});

searchInput.addEventListener("keydown", (e) => {
    const items = Array.from(searchResults.getElementsByClassName("search-result-item"));
    if (e.key === "ArrowDown") {
        e.preventDefault();
        // Increase active index, not over the search results
        activeResultIndex = Math.min(activeResultIndex + 1, items.length - 1);
        updateActiveResult(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // Decrease active index, not lower than 0
        activeResultIndex = Math.max(activeResultIndex - 1, 0);
        updateActiveResult(items);
    } else if (e.key === "Enter") {
        e.preventDefault();
        // Choose first result if Enter
        if (items.length > 0) {
            const chosenIndex = activeResultIndex >= 0 ? activeResultIndex : 0;
            const chosenItem = items[chosenIndex];
            if (chosenItem) {
                window.location.href = "/" + chosenItem.getAttribute("data-username");
            }
        }
    }
});

// Adding "active" class to the chosen result
function updateActiveResult(items) {
    items.forEach((item, index) => {
        if (index === activeResultIndex) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

// -------------------------------
// Shortcuts
// -------------------------------
document.addEventListener("keydown", (e) => {
    // Exit search
    if (e.key === "Escape" && searchContainer.classList.contains("show")) {
        searchCollapse.hide();
        sidebar.classList.remove("expanded");
    }
    // Search shortcut
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!searchContainer.classList.contains("show")) {
            searchCollapse.show();
            searchContainer.addEventListener("shown.bs.collapse", () => {
                searchInput.focus();
            }, { once: true });
        } else {
            searchCollapse.hide();
        }
    }
});

// -------------------------------
// Additional functions
// -------------------------------
function changeLikeStatus(btn, status) {
    return status
        ? btn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>'
        : btn.innerHTML = '<i class="bi bi-heart text-white"></i>';
}
function updateOutsideLikeBtn(postId, status) {
    const likeBtnOutside = document.querySelector(`button[data-post-id="${postId}"]`);
    if (likeBtnOutside) {
        changeLikeStatus(likeBtnOutside, status);
    }
}

// -------------------------------
// Post Modal Implementation (Combined Preview and Comment)
// -------------------------------
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
            updateOutsideLikeBtn(post.id, data.status);
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

// -------------------------------------
// Modal Search for Mobile
// -------------------------------------
const searchModal = document.getElementById("searchModal");
const searchInputMobile = document.getElementById("searchInputMobile");
const searchResultsMobile = document.getElementById("searchResultsMobile");

searchModal.addEventListener("shown.bs.modal", () => {
    searchInputMobile.focus();
});

searchInputMobile.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    performSearchMobile(query);
});

searchInputMobile.addEventListener("keydown", (e) => {
    const items = Array.from(searchResultsMobile.getElementsByClassName("search-result-item"));
    if (e.key === "ArrowDown") {
        e.preventDefault();
        // Increase active index, not over the search results
        activeResultIndex = Math.min(activeResultIndex + 1, items.length - 1);
        updateActiveResultMobile(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // Decrease active index, not lower than 0
        activeResultIndex = Math.max(activeResultIndex - 1, 0);
        updateActiveResultMobile(items);
    } else if (e.key === "Enter") {
        e.preventDefault();
        // Choose first result if Enter
        if (items.length > 0) {
            const chosenIndex = activeResultIndex >= 0 ? activeResultIndex : 0;
            const chosenItem = items[chosenIndex];
            if (chosenItem) {
                window.location.href = "/" + chosenItem.getAttribute("data-username");
            }
        }
    }
});

async function performSearchMobile(query) {
    if (!query) {
        searchResultsMobile.innerHTML = "";
        return;
    }
    try {
        const response = await fetch("/api/search?q=" + encodeURIComponent(query), {
            method: "GET",
            headers: { Accept: "application/json" }
        });
        if (!response.ok) {
            throw new Error(response.status);
        }
        const results = await response.json();
        renderSearchResultsMobile(results);
    } catch (error) {
        console.error(error);
    }
}

function renderSearchResultsMobile(results) {
    searchResultsMobile.innerHTML = "";
    activeResultIndex = -1;
    if (results.length === 0) {
        searchResultsMobile.innerHTML = "<div class='text-center text-muted'>No results found</div>";
        return;
    }
    results.forEach(result => {
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.setAttribute("data-username", result.username);
        item.innerHTML = `<strong>@${result.username}</strong>`;
        item.addEventListener("click", () => {
            window.location.href = "/" + result.username;
        });
        searchResultsMobile.appendChild(item);
    });
}

function updateActiveResultMobile(items) {
    items.forEach((item, index) => {
        if (index === activeResultIndex) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

const socketBase = io()
socketBase.on("progress", (data) => {
    uploadProcesses[data.task_id]?.setPercent(data.progress)
})