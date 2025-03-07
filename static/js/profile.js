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

        // Preview post
        const previewModalEl = document.getElementById("previewModal");
        const previewModal = new bootstrap.Modal(previewModalEl);
        const previewImage = document.getElementById("previewImage");

        const postsRow = document.getElementById("user-posts");
        data.forEach(post => {
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 post";

            const ratioDiv = document.createElement("div");
            ratioDiv.className = "ratio";
            ratioDiv.style.aspectRatio = 4/5;

            const img = document.createElement("img");
            img.src = post.attachment;
            img.alt = "Post image";
            img.className = "img-fluid rounded";
            img.style.objectFit = "cover";
            img.addEventListener("click", () => {
                previewImage.src = post.attachment;
                previewModal.show();
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