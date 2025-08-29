const optAutofill = document.getElementById("otp-autofill")
const inputs = document.querySelectorAll(".otp-inputs .otp")

async function submitLogin() {
    let otp = ""
    inputs.forEach(input => otp += input.value)

    const otpError = document.getElementById("otp-error")
    if (otpError) {
        otpError.remove()
    }

    // Verify totp
    const spinnerRow = document.createElement("div")
    spinnerRow.className = "row justify-content-center"
    spinnerRow.id = "otp-spinner"

    const spinner = document.createElement("div")
    spinner.className = "spinner-border"
    spinner.role = "status"

    const spinnerSpan = document.createElement("span")
    spinnerSpan.className = "visually-hidden"
    spinnerSpan.textContent = "Loading..."

    spinner.appendChild(spinnerSpan)
    spinnerRow.appendChild(spinner)

    document.getElementById("otp-container").appendChild(spinnerRow)

    const data = new FormData()
    data.append("identifier", document.getElementById("identifier").value)
    data.append("password", document.getElementById("password").value)
    data.append("token", otp)

    const response = await fetch("/auth/login", {
        method: "POST",
        body: data
    })

    if (response.status === 202) {
        window.location.href = "/"
    } else if (response.status === 401) {
        if (document.getElementById("otp-spinner")) {
            spinnerRow.remove()
        }

        if (!document.getElementById("otp-error")) {
            const errorRow = document.createElement("div")
            errorRow.id = "otp-error"
            errorRow.className = "row"

            const errorP = document.createElement("div")
            errorP.className = "alert alert-danger text-center"
            errorP.role = "alert"
            errorP.textContent = "Wrong OTP. Please try again."
            errorRow.appendChild(errorP)

            document.getElementById("otp-container").appendChild(errorRow)
        }
    }
}

inputs.forEach((input, index) => {
    input.addEventListener("input", async (e) => {
        if (/^\d{6}$/.test(e.target.value)) {
            const value = e.target.value
            inputs.forEach((box, i) => {
                box.value = value[i] || ""
            })

            inputs[inputs.length - 1].focus()
            submitLogin()
        } else {
            input.value = input.value.replace(/[^0-9]/g, "")

            if (input.value.length > 1) {
                input.value = input.value.split("")[0]
            }

            if (input.value.length === 1 && index < inputs.length - 1) {
                const otpSpinner = document.querySelector("#otp-spinner")
                if (otpSpinner) {
                    otpSpinner.remove()
                }
                const otpError = document.querySelector("#otp-error")
                if (otpError) {
                    otpError.remove()
                }

                inputs[index + 1].focus()
            } else if (index === (inputs.length - 1) && input.value !== "") {
                submitLogin()
            }
        }
    })

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
            const otpSpinner = document.querySelector("#otp-spinner")
            if (otpSpinner) {
                otpSpinner.remove()
            }
            const otpError = document.querySelector("#otp-error")
            if (otpError) {
                otpError.remove()
            }

            inputs[index - 1].focus()
        }
    })

    input.addEventListener("paste", (e) => {
        e.preventDefault()

        const paste = (e.clipboardData).getData("text")
        if (/^\d{6}$/.test(paste)) {
            inputs.forEach((box, i) => {
                box.value = paste[i] || ""
            })

            inputs[inputs.length - 1].focus()
            submitLogin()
        }
    })
})

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    const response = await fetch("/auth/login", {
        method: "POST",
        body: new FormData(e.target)
    })
    if (response.status === 423) {
        document.getElementById("login-form").classList.remove("active")
        document.getElementById("otp-form").classList.add("active")
        inputs[0].focus()
    } else if (response.status === 202) {
        window.location.href = "/"
    } else {
        document.getElementById("login-form").insertBefore(errorAlert("Invalid identifier or password."), document.getElementById("login-form").children[3])
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