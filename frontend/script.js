// ============================================
// CONFIGURATION
// ============================================
const API_ENDPOINT = "https://b6llftkna3.execute-api.ap-southeast-1.amazonaws.com/dev/students";

// ============================================
// UI HELPERS & THEME
// ============================================

// Initialize theme from local storage or system preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        $('.icon-moon').hide();
        $('.icon-sun').show();
    } else {
        document.body.classList.remove('light-mode');
        $('.icon-sun').hide();
        $('.icon-moon').show();
    }
}

// Toggle theme
$('#themeToggleBtn').on('click', function() {
    const isLight = document.body.classList.toggle('light-mode');
    
    if (isLight) {
        localStorage.setItem('theme', 'light');
        $('.icon-moon').hide();
        $('.icon-sun').show();
    } else {
        localStorage.setItem('theme', 'dark');
        $('.icon-sun').hide();
        $('.icon-moon').show();
    }
});

// Call it on script load
initTheme();

function showToast(text, type = 'info') {
    const $msg = $('#message');
    $msg.removeClass('visible error success').text('');

    requestAnimationFrame(() => {
        $msg.text(text)
            .addClass('visible')
            .toggleClass('success', type === 'success')
            .toggleClass('error', type === 'error');

        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => {
            $msg.removeClass('visible');
        }, 3500);
    });
}

function setButtonLoading($btn, loading) {
    if (loading) {
        $btn.addClass('loading').prop('disabled', true);
    } else {
        $btn.removeClass('loading').prop('disabled', false);
    }
}

// ============================================
// STUDENT MANAGEMENT FUNCTIONS
// ============================================

function getHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}

// Create Student
$('#studentForm').on('submit', function (event) {
    event.preventDefault();

    const inputData = {
        studentID: $('#studentID').val(),
        name: $('#name').val(),
        email: $('#email').val(),
        major: $('#major').val(),
        gpa: parseFloat($('#gpa').val())
    };

    if (!inputData.studentID || !inputData.name || !inputData.email || !inputData.major || !inputData.gpa) {
        showToast('Please fill in all fields.', 'error');
        return;
    }
    if (isNaN(inputData.gpa) || inputData.gpa < 0 || inputData.gpa > 4) {
        showToast('Please enter a valid GPA (0-4).', 'error');
        return;
    }

    const $btn = $('#createStudent');
    setButtonLoading($btn, true);

    $.ajax({
        url: API_ENDPOINT,
        type: 'POST',
        data: JSON.stringify(inputData),
        headers: getHeaders(),
        success: function (response) {
            setButtonLoading($btn, false);
            showToast('Student created successfully!', 'success');
            $('#studentForm')[0].reset();
        },
        error: function (jqXHR) {
            setButtonLoading($btn, false);
            let errorMsg = 'Error creating student.';
            try {
                const errorResponse = JSON.parse(jqXHR.responseText);
                if (errorResponse.error) errorMsg = errorResponse.error;
            } catch (e) { }
            showToast(errorMsg, 'error');
        }
    });
});

// Get Student
$('#getStudent').on('click', function () {
    const studentId = $('#studentID').val();
    if (!studentId) {
        showToast('Please enter a Student ID to search.', 'error');
        return;
    }

    const $btn = $(this);
    setButtonLoading($btn, true);

    $.ajax({
        url: `${API_ENDPOINT}/${studentId}`,
        type: 'GET',
        headers: getHeaders(),
        success: function (response) {
            setButtonLoading($btn, false);
            $('#studentTableBody').empty();
            $('#studentTable').slideDown(300);

            $('#studentTableBody').append(`
                <tr>
                    <td><strong>${response.StudentID}</strong></td>
                    <td>${response.Name}</td>
                    <td>${response.Email}</td>
                    <td>${response.Major}</td>
                    <td>${response.GPA}</td>
                </tr>
            `);

            // Populate form fields for easy editing
            $('#name').val(response.Name);
            $('#email').val(response.Email);
            $('#major').val(response.Major);
            $('#gpa').val(response.GPA);

            showToast('Student found!', 'success');
        },
        error: function (jqXHR) {
            setButtonLoading($btn, false);
            let errorMsg = 'Error retrieving student.';
            try {
                const errorResponse = JSON.parse(jqXHR.responseText);
                if (errorResponse.error) errorMsg = errorResponse.error;
            } catch (e) { }
            showToast(errorMsg, 'error');
        }
    });
});

// Update Student
$('#updateStudent').on('click', function () {
    const studentId = $('#studentID').val();
    const inputData = {
        name: $('#name').val(),
        email: $('#email').val(),
        major: $('#major').val(),
        gpa: parseFloat($('#gpa').val())
    };

    if (!studentId) {
        showToast('Please enter a Student ID.', 'error');
        return;
    }
    if (!inputData.name || !inputData.email || !inputData.major || !inputData.gpa) {
        showToast('Please fill in all fields.', 'error');
        return;
    }
    if (isNaN(inputData.gpa) || inputData.gpa < 0 || inputData.gpa > 4) {
        showToast('Please enter a valid GPA (0-4).', 'error');
        return;
    }

    const $btn = $(this);
    setButtonLoading($btn, true);

    $.ajax({
        url: `${API_ENDPOINT}/${studentId}`,
        type: 'PUT',
        data: JSON.stringify(inputData),
        headers: getHeaders(),
        success: function (response) {
            setButtonLoading($btn, false);
            showToast('Student updated successfully!', 'success');
            $('#studentForm')[0].reset();
        },
        error: function (jqXHR) {
            setButtonLoading($btn, false);
            let errorMsg = 'Error updating student.';
            try {
                const errorResponse = JSON.parse(jqXHR.responseText);
                if (errorResponse.error) errorMsg = errorResponse.error;
            } catch (e) { }
            showToast(errorMsg, 'error');
        }
    });
});

// Delete Student
$('#deleteStudent').on('click', function () {
    const studentId = $('#studentID').val();
    if (!studentId) {
        showToast('Please enter a Student ID.', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }

    const $btn = $(this);
    setButtonLoading($btn, true);

    $.ajax({
        url: `${API_ENDPOINT}/${studentId}`,
        type: 'DELETE',
        headers: getHeaders(),
        success: function (response) {
            setButtonLoading($btn, false);
            showToast('Student deleted successfully!', 'success');
            $('#studentForm')[0].reset();
            $('#studentTable').slideUp(300);
        },
        error: function (jqXHR) {
            setButtonLoading($btn, false);
            let errorMsg = 'Error deleting student.';
            try {
                const errorResponse = JSON.parse(jqXHR.responseText);
                if (errorResponse.error) errorMsg = errorResponse.error;
            } catch (e) { }
            showToast(errorMsg, 'error');
        }
    });
});

// Clear Form
$('#clearForm').on('click', function () {
    $('#studentForm')[0].reset();
    $('#studentTable').slideUp(300);
    showToast('Form cleared.', 'info');
});