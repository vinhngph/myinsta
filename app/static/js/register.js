const borderValid = "rgb(40, 167, 69)"
const borderInvalid = "rgb(220, 53, 69)"

async function sendRequest(api, method, data) {
    const response = await fetch(api, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })

    return response
}

function debounce(func, delay = 500) {
    let timeoutId
    return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Elements Step 1 & 2
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const prevStepBtn = document.getElementById("prevStep");

    const emailInput = document.getElementById("regEmail");
    const passwordInput = document.getElementById("regPassword");
    const confirmInput = document.getElementById("regConfirm");
    const usernameInput = document.getElementById("regUsername");
    const nameInput = document.getElementById("regName");

    // Validation Email
    emailInput.addEventListener("input", debounce(async function (e) {
        const input = e.target
        if (input.value === "") return;

        input.value = input.value.trim();
        const email = input.value;

        const response = await sendRequest("/api/valid/email", "POST", {
            email: email
        })

        if (response.status === 200) {
            input.style.borderColor = borderValid
            errorAlert().remove()
        } else {
            input.style.borderColor = borderInvalid
            step1.appendChild(errorAlert("Invalid email").element)
        }
    }));

    // Validate password match for Password and Confirm
    async function validatePassword(e) {
        const input = e.target
        if (input.value === "") return


        if (input === passwordInput) {
            const response = await sendRequest("/api/valid/password", "POST", {
                password: input.value
            })
            const isStrong = response.status === 200

            if (isStrong) {
                if (confirmInput.value !== "") {
                    if (input.value === confirmInput.value) {
                        input.style.borderColor = borderValid
                        confirmInput.style.borderColor = borderValid
                        errorAlert().remove()
                    } else {
                        input.style.borderColor = borderInvalid
                        confirmInput.style.borderColor = borderInvalid
                        step1.appendChild(errorAlert("Passwords were not match").element)
                    }
                } else {
                    input.style.borderColor = borderValid
                    errorAlert().remove()
                }
            } else {
                input.style.borderColor = borderInvalid
                step1.appendChild(errorAlert("Weak password").element)
            }
        } else if (input === confirmInput) {
            const response = await sendRequest("/api/valid/password", "POST", {
                password: input.value
            })
            const isStrong = response.status === 200

            if (isStrong && input.value === passwordInput.value) {
                passwordInput.style.borderColor = borderValid
                confirmInput.style.borderColor = borderValid
                errorAlert().remove()
            } else {
                passwordInput.style.borderColor = borderInvalid
                confirmInput.style.borderColor = borderInvalid
                step1.appendChild(errorAlert("Passwords were not match").element)
            }
        }
    }
    passwordInput.addEventListener("input", debounce(validatePassword));
    confirmInput.addEventListener("input", debounce(validatePassword));

    step1.addEventListener("submit", (e) => {
        e.preventDefault()

        // Valid email
        if (emailInput.value === "" || emailInput.style.borderColor === borderInvalid) {
            return step1.appendChild(errorAlert("Email is invalid.").element)
        }

        // Valid password
        if (passwordInput === "" || passwordInput.style.borderColor === borderInvalid) {
            return step1.appendChild(errorAlert("Password is invalid.").element)
        }

        // Valid confirm password
        if (confirmInput === "" || confirmInput.style.borderColor === borderInvalid) {
            return step1.appendChild(errorAlert("Confirm password is invalid.").element)
        }

        // Valid match password
        if (passwordInput.value !== confirmInput.value) {
            return step1.appendChild(errorAlert("Passwords were not match.").element)
        }

        step1.classList.remove("active");
        step2.classList.add("active");
    })

    // Back button
    prevStepBtn.addEventListener("click", () => {
        step2.classList.remove("active");
        step1.classList.add("active");
    });

    // Validate Username
    usernameInput.addEventListener("input", debounce(async () => {
        usernameInput.value = usernameInput.value.trim()
        const username = usernameInput.value;
        if (username === "") return;

        const response = await sendRequest("/api/valid/username", "POST", { username })
        if (response.status === 200) {
            usernameInput.style.borderColor = borderValid
            errorAlert().remove()
        } else {
            usernameInput.style.borderColor = borderInvalid
            step2.appendChild(errorAlert("Invalid username").element)
        }
    }));

    // Validate Name
    nameInput.addEventListener("input", debounce(async () => {
        const name = nameInput.value.trim();
        if (name === "") return;

        const response = await sendRequest("/api/valid/name", "POST", { name })
        if (response.status === 200) {
            nameInput.style.borderColor = borderValid
            errorAlert().remove()
        } else {
            nameInput.style.borderColor = borderInvalid
            step2.appendChild(errorAlert("Invalid name").element)
        }
    }));

    step2.addEventListener("submit", async (e) => {
        e.preventDefault()
        if (
            emailInput.value !== "" && emailInput.style.borderColor === borderValid &&
            passwordInput.value !== "" && passwordInput.style.borderColor === borderValid &&
            confirmInput.value !== "" && confirmInput.style.borderColor === borderValid &&
            passwordInput.value === confirmInput.value &&
            usernameInput.value !== "" && usernameInput.style.borderColor === borderValid &&
            nameInput.value !== "" && nameInput.style.borderColor === borderValid
        ) {
            const data = new FormData()
            data.append("email", emailInput.value)
            data.append("password", passwordInput.value)
            data.append("confirm", confirmInput.value)
            data.append("username", usernameInput.value)
            data.append("name", nameInput.value)

            const response = await fetch("/auth/register", {
                method: "POST",
                body: data
            })

            if (response.status === 201) {
                window.location.href = "/"
            } else {
                step2.appendChild(errorAlert("Invalid data in fields.").element)
            }
        } else {
            step2.appendChild(errorAlert("Please fill all fields.").element)
        }
    })

    function errorAlert(message) {
        let errorDiv = document.querySelector(".alert.alert-danger.text-center")
        if (!errorDiv) {
            errorDiv = document.createElement("div")
            errorDiv.className = "alert alert-danger text-center"
            errorDiv.role = "alert"

            function triggerOutside(e) {
                if (!errorDiv.contains(e.target)) {
                    errorDiv.remove()
                    document.removeEventListener("click", triggerOutside)
                }
            }
            document.addEventListener("click", triggerOutside)
        }
        errorDiv.textContent = message

        return {
            element: errorDiv,
            remove: () => {
                errorDiv.remove()
            }
        }
    }


    document.querySelectorAll(".btn-display-password").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault()

            const inputGroup = e.currentTarget.closest(".input-group")
            const pwdInput = inputGroup.querySelector("input")

            const type = pwdInput.getAttribute("type") === "password" ? "text" : "password"
            pwdInput.setAttribute("type", type)

            const icon = btn.querySelector("i")
            icon.classList.toggle("bi-eye-fill")
            icon.classList.toggle("bi-eye-slash-fill")
        })
    })
});