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
        const response = await fetch("/api/post", {
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
        // Increase active index, not over the search reults
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
    // Search shotcut
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