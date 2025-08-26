document.addEventListener("DOMContentLoaded", function () {
    // Elements Step 1 & 2
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const nextStepBtn = document.getElementById("nextStep");
    const prevStepBtn = document.getElementById("prevStep");

    // Validation Email using API
    const emailInput = document.getElementById("regEmail");
    emailInput.addEventListener("blur", async function () {
        const email = emailInput.value.trim();
        if (email === "") return;
        try {
            const response = await fetch("/api/valid/email?v=" + encodeURIComponent(email));
            if (response.ok) {
                emailInput.style.borderColor = "#28a745"; // green
            } else {
                emailInput.style.borderColor = "#dc3545"; // red
            }
        } catch (error) {
            emailInput.style.borderColor = "#dc3545";
        }
    });

    // Validate password match for Password and Confirm
    const passwordInput = document.getElementById("regPassword");
    const confirmInput = document.getElementById("regConfirm");
    function validatePasswordMatch() {
        if (passwordInput.value && confirmInput.value) {
            if (passwordInput.value === confirmInput.value) {
                passwordInput.style.borderColor = "#28a745";
                confirmInput.style.borderColor = "#28a745";
            } else {
                passwordInput.style.borderColor = "#dc3545";
                confirmInput.style.borderColor = "#dc3545";
            }
        } else {
            passwordInput.style.borderColor = "";
            confirmInput.style.borderColor = "";
        }
    }
    passwordInput.addEventListener("input", validatePasswordMatch);
    confirmInput.addEventListener("input", validatePasswordMatch);

    step1.addEventListener("submit", (e) => {
        e.preventDefault()
        if (
            emailInput.value.trim() !== "" &&
            passwordInput.value !== "" &&
            confirmInput.value !== "" &&
            passwordInput.value === confirmInput.value &&
            emailInput.style.borderColor === "rgb(40, 167, 69)"
        ) {
            step1.classList.remove("active");
            step2.classList.add("active");
        } else {
            step1.appendChild(errorAlert("Please fill all fields."))
        }
    })

    // Back button
    prevStepBtn.addEventListener("click", function () {
        step2.classList.remove("active");
        step1.classList.add("active");
    });

    // Validate Username using API
    const usernameInput = document.getElementById("regUsername");
    usernameInput.addEventListener("blur", async function () {
        const username = usernameInput.value.trim();
        if (username === "") return;
        try {
            const response = await fetch("/api/valid/username?v=" + encodeURIComponent(username));
            if (response.ok) {
                usernameInput.style.borderColor = "#28a745"; // green
            } else {
                usernameInput.style.borderColor = "#dc3545"; // red
            }
        } catch (error) {
            usernameInput.style.borderColor = "#dc3545";
        }
    });

    step2.addEventListener("submit", async (e) => {
        e.preventDefault()
        if (
            emailInput.value.trim() !== "" &&
            passwordInput.value !== "" &&
            confirmInput.value !== "" &&
            passwordInput.value === confirmInput.value &&
            emailInput.style.borderColor === "rgb(40, 167, 69)" &&
            usernameInput.style.borderColor === "rgb(40, 167, 69)"
        ) {
            const data = new FormData()
            data.append("email", emailInput.value)
            data.append("password", passwordInput.value)
            data.append("confirm", confirmInput.value)
            data.append("username", usernameInput.value)
            data.append("name", document.querySelector("#regName").value)

            const response = await fetch("/auth/register", {
                method: "POST",
                body: data
            })

            if (response.status === 201) {
                window.location.href = "/"
            } else {
                step2.appendChild(errorAlert("Invalid data in fields."))
            }
        } else {
            step2.appendChild(errorAlert("Please fill all fields."))
        }
    })

    function errorAlert(message) {
        const errorDiv = document.createElement("div")
        errorDiv.className = "alert alert-danger text-center"
        errorDiv.role = "alert"
        errorDiv.textContent = message

        function triggerOutside(e) {
            if (!errorDiv.contains(e.target)) {
                errorDiv.remove()
                document.removeEventListener("click", triggerOutside)
            }
        }
        document.addEventListener("click", triggerOutside)

        return errorDiv
    }
});