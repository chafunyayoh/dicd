// Register Page HTML
const registerPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - DICD Inclusive College</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
            <div class="text-center">
                <i class="fas fa-graduation-cap text-5xl text-purple-600 mb-4"></i>
                <h2 class="text-3xl font-bold text-gray-900">Join DICD</h2>
                <p class="mt-2 text-gray-600">Create your student account</p>
            </div>
            <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"></div>
            <div id="success-message" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"></div>
            <form id="register-form" class="mt-8 space-y-6">
                <div class="space-y-4">
                    <div>
                        <label for="full_name" class="block text-sm font-medium text-gray-700">Full Name</label>
                        <input id="full_name" name="full_name" type="text" required 
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                        <input id="email" name="email" type="email" required 
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label for="phone" class="block text-sm font-medium text-gray-700">Phone (optional)</label>
                        <input id="phone" name="phone" type="tel" 
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                        <input id="password" name="password" type="password" required minlength="6"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    <div>
                        <label for="confirm_password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input id="confirm_password" name="confirm_password" type="password" required minlength="6"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    </div>
                </div>
                <button type="submit" 
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none">
                    <span id="btn-text">Create Account</span>
                    <span id="btn-loading" class="hidden">
                        <i class="fas fa-spinner fa-spin"></i> Creating...
                    </span>
                </button>
            </form>
            <div class="text-center">
                <p class="text-sm text-gray-600">
                    Already have an account? 
                    <a href="/login" class="font-medium text-purple-600 hover:text-purple-500">Sign in</a>
                </p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const password = document.getElementById('password').value
            const confirmPassword = document.getElementById('confirm_password').value
            const btnText = document.getElementById('btn-text')
            const btnLoading = document.getElementById('btn-loading')
            const errorMsg = document.getElementById('error-message')
            const successMsg = document.getElementById('success-message')
            
            errorMsg.classList.add('hidden')
            successMsg.classList.add('hidden')

            if (password !== confirmPassword) {
                errorMsg.textContent = 'Passwords do not match'
                errorMsg.classList.remove('hidden')
                return
            }

            btnText.classList.add('hidden')
            btnLoading.classList.remove('hidden')

            try {
                const response = await axios.post('/api/auth/register', {
                    full_name: document.getElementById('full_name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: password
                })

                if (response.data.success) {
                    successMsg.textContent = 'Registration successful! Redirecting...'
                    successMsg.classList.remove('hidden')
                    setTimeout(() => {
                        window.location.href = '/student/dashboard'
                    }, 1500)
                }
            } catch (error) {
                errorMsg.textContent = error.response?.data?.error || 'Registration failed'
                errorMsg.classList.remove('hidden')
                btnText.classList.remove('hidden')
                btnLoading.classList.add('hidden')
            }
        })
    </script>
</body>
</html>
`

// This file will be imported by the backend
export { registerPage }
