// ============================================
// AWS COGNITO CONFIGURATION
// ============================================
const COGNITO_CONFIG = {
    region: 'ap-southeast-1', // Change to your region
    userPoolId: 'ap-southeast-1_xxxxxxxxx', // Update with your User Pool ID
    clientId: 'YOUR_CLIENT_ID', // Update with your App Client ID
};

// Initialize AWS SDK
AWS.config.region = COGNITO_CONFIG.region;

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    region: COGNITO_CONFIG.region
});

let currentUser = null;
let idToken = null;
const API_ENDPOINT = "https://vwu7l4uocj.execute-api.ap-southeast-1.amazonaws.com/dev/students";

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function checkAuthStatus() {
    const token = localStorage.getItem('idToken');
    const email = localStorage.getItem('userEmail');
    
    if (token && email) {
        idToken = token;
        currentUser = email;
        showMainApp();
    } else {
        showAuthModal();
    }
}

function performLogin(email, password) {
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CONFIG.clientId,
        AuthParameters: {
            'USERNAME': email,
            'PASSWORD': password
        }
    };

    cognitoIdentityServiceProvider.initiateAuth(params, function(err, data) {
        if (err) {
            console.error('Login error:', err);
            $('#loginError').text(err.message || 'Login failed. Please check your credentials.').show();
        } else {
            idToken = data.AuthenticationResult.IdToken;
            currentUser = email;
            
            // Save to localStorage for persistence
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('userEmail', email);
            
            $('#loginError').text('').hide();
            showMainApp();
        }
    });
}

function performSignUp(email, password, name) {
    const params = {
        ClientId: COGNITO_CONFIG.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: 'email',
                Value: email
            },
            {
                Name: 'name',
                Value: name
            }
        ]
    };

    cognitoIdentityServiceProvider.signUp(params, function(err, data) {
        if (err) {
            console.error('Sign up error:', err);
            $('#signupError').text(err.message || 'Sign up failed.').show();
        } else {
            $('#signupError').text('').hide();
            alert('Verification code has been sent to your email. Please verify your email to complete registration.');
            // Optionally auto-login after signup confirmation
            // performLogin(email, password);
        }
    });
}

function performLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('idToken');
        localStorage.removeItem('userEmail');
        idToken = null;
        currentUser = null;
        
        // Clear forms
        $('#loginForm')[0].reset();
        $('#signupForm')[0].reset();
        $('#studentForm')[0].reset();
        $('#loginError').text('').hide();
        $('#signupError').text('').hide();
        
        showAuthModal();
    }
}

function showAuthModal() {
    $('#authModal').show();
    $('#appContainer').hide();
}

function showMainApp() {
    $('#authModal').hide();
    $('#appContainer').show();
    $('#userEmail').text(`Logged in as: ${currentUser}`);
    
    // Initialize student management handlers
    initializeStudentHandlers();
}

// ============================================
// STUDENT MANAGEMENT FUNCTIONS (Protected)
// ============================================

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
    };
}

function initializeStudentHandlers() {
    // Create Student
    $('#studentForm').on('submit', function(event) {
        event.preventDefault();
        
        if (!idToken) {
            alert('Please login first');
            return;
        }
        
        const inputData = {
            studentID: $('#studentID').val(),
            name: $('#name').val(),
            email: $('#email').val(),
            major: $('#major').val(),
            gpa: parseFloat($('#gpa').val())
        };

        if (!inputData.studentID || !inputData.name || !inputData.email || !inputData.major || !inputData.gpa) {
            $('#message').text('Please fill in all fields.').show();
            return;
        }
        if (isNaN(inputData.gpa) || inputData.gpa < 0 || inputData.gpa > 4) {
            $('#message').text('Please enter a valid GPA (0-4).').show();
            return;
        }

        $.ajax({
            url: API_ENDPOINT,
            type: 'POST',
            data: JSON.stringify(inputData),
            headers: getAuthHeaders(),
            success: function(response) {
                $('#message').text('Student created successfully!').show().fadeOut(3000);
                $('#studentForm')[0].reset();
            },
            error: function(jqXHR) {
                let errorMsg = 'Error creating student.';
                if (jqXHR.status === 401) {
                    errorMsg = 'Session expired. Please login again.';
                    performLogout();
                } else {
                    try {
                        const errorResponse = JSON.parse(jqXHR.responseText);
                        if (errorResponse.error) errorMsg = errorResponse.error;
                    } catch (e) {}
                }
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Get Student
    $('#getStudent').on('click', function() {
        if (!idToken) {
            alert('Please login first');
            return;
        }
        
        const studentId = $('#studentID').val();
        if (!studentId) {
            $('#message').text('Please enter a Student ID.').show();
            return;
        }

        $.ajax({
            url: `${API_ENDPOINT}/${studentId}`,
            type: 'GET',
            headers: getAuthHeaders(),
            success: function(response) {
                $('#studentTableBody').empty();
                $('#studentTable').show();
                $('#studentTableBody').append(`
                    <tr>
                        <td>${response.StudentID}</td>
                        <td>${response.Name}</td>
                        <td>${response.Email}</td>
                        <td>${response.Major}</td>
                        <td>${response.GPA}</td>
                    </tr>
                `);
                $('#message').text('Student retrieved successfully!').show().fadeOut(3000);
            },
            error: function(jqXHR) {
                let errorMsg = 'Error retrieving student.';
                if (jqXHR.status === 401) {
                    errorMsg = 'Session expired. Please login again.';
                    performLogout();
                } else {
                    try {
                        const errorResponse = JSON.parse(jqXHR.responseText);
                        if (errorResponse.error) errorMsg = errorResponse.error;
                    } catch (e) {}
                }
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Update Student
    $('#updateStudent').on('click', function() {
        if (!idToken) {
            alert('Please login first');
            return;
        }
        
        const studentId = $('#studentID').val();
        const inputData = {
            name: $('#name').val(),
            email: $('#email').val(),
            major: $('#major').val(),
            gpa: parseFloat($('#gpa').val())
        };

        if (!studentId) {
            $('#message').text('Please enter a Student ID.').show();
            return;
        }
        if (!inputData.name || !inputData.email || !inputData.major || !inputData.gpa) {
            $('#message').text('Please fill in all fields.').show();
            return;
        }
        if (isNaN(inputData.gpa) || inputData.gpa < 0 || inputData.gpa > 4) {
            $('#message').text('Please enter a valid GPA (0-4).').show();
            return;
        }

        $.ajax({
            url: `${API_ENDPOINT}/${studentId}`,
            type: 'PUT',
            data: JSON.stringify(inputData),
            headers: getAuthHeaders(),
            success: function(response) {
                $('#message').text('Student updated successfully!').show().fadeOut(3000);
                $('#studentForm')[0].reset();
            },
            error: function(jqXHR) {
                let errorMsg = 'Error updating student.';
                if (jqXHR.status === 401) {
                    errorMsg = 'Session expired. Please login again.';
                    performLogout();
                } else {
                    try {
                        const errorResponse = JSON.parse(jqXHR.responseText);
                        if (errorResponse.error) errorMsg = errorResponse.error;
                    } catch (e) {}
                }
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Delete Student
    $('#deleteStudent').on('click', function() {
        if (!idToken) {
            alert('Please login first');
            return;
        }
        
        const studentId = $('#studentID').val();
        if (!studentId) {
            $('#message').text('Please enter a Student ID.').show();
            return;
        }

        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }

        $.ajax({
            url: `${API_ENDPOINT}/${studentId}`,
            type: 'DELETE',
            headers: getAuthHeaders(),
            success: function(response) {
                $('#message').text('Student deleted successfully!').show().fadeOut(3000);
                $('#studentForm')[0].reset();
                $('#studentTable').hide();
            },
            error: function(jqXHR) {
                let errorMsg = 'Error deleting student.';
                if (jqXHR.status === 401) {
                    errorMsg = 'Session expired. Please login again.';
                    performLogout();
                } else {
                    try {
                        const errorResponse = JSON.parse(jqXHR.responseText);
                        if (errorResponse.error) errorMsg = errorResponse.error;
                    } catch (e) {}
                }
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Clear Form
    $('#clearForm').on('click', function() {
        $('#studentForm')[0].reset();
        $('#studentTable').hide();
        $('#message').text('Form cleared.').show().fadeOut(3000);
    });
}

// ============================================
// PAGE INITIALIZATION
// ============================================

$(document).ready(function() {
    // Check authentication status
    checkAuthStatus();
    
    // Tab switching for login/signup
    $('.tab-btn').on('click', function() {
        const tab = $(this).data('tab');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.auth-form').removeClass('active');
        $(`#${tab}Form`).addClass('active');
        // Clear error messages when switching tabs
        $('#loginError').text('').hide();
        $('#signupError').text('').hide();
    });
    
    // Login form submission
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        const email = $('#loginEmail').val();
        const password = $('#loginPassword').val();
        
        if (!email || !password) {
            $('#loginError').text('Please enter email and password').show();
            return;
        }
        
        performLogin(email, password);
    });
    
    // Sign Up form submission
    $('#signupForm').on('submit', function(e) {
        e.preventDefault();
        const name = $('#signupName').val();
        const email = $('#signupEmail').val();
        const password = $('#signupPassword').val();
        const confirmPassword = $('#signupConfirmPassword').val();
        
        if (!name || !email || !password || !confirmPassword) {
            $('#signupError').text('Please fill in all fields').show();
            return;
        }
        
        if (password !== confirmPassword) {
            $('#signupError').text('Passwords do not match').show();
            return;
        }
        
        if (password.length < 8) {
            $('#signupError').text('Password must be at least 8 characters').show();
            return;
        }
        
        performSignUp(email, password, name);
    });
    
    // Logout button
    $('#logoutBtn').on('click', function() {
        performLogout();
    });
});