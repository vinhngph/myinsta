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